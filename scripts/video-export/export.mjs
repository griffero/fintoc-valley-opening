import { spawn } from 'node:child_process';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { once } from 'node:events';
import path from 'node:path';
import { createServer } from 'vite';

const root = process.cwd();
const work = path.join(root, 'work/video-export');
const output = path.join(root, 'outputs/fintoc-valley-v13-4k.mp4');
const probe = process.argv.includes('--probe');
const width = probe ? 1920 : 3840, height = probe ? 1080 : 2160;
const fps = 24, total = 262;
await mkdir(path.join(root, 'outputs'), {recursive:true});
await mkdir(path.join(work, 'samples'), {recursive:true});
const server = await createServer({configFile:false,root,publicDir:path.join(root,'public'),server:{host:'127.0.0.1',port:3040,strictPort:true,watch:null}});
await server.listen();
let chrome, ws, encoder;
const pending = new Map();
let requestId = 0;
const delay = ms => new Promise(resolve => setTimeout(resolve,ms));
try {
  const profile = path.join(work, 'chrome-profile');
  chrome = spawn(process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new','--remote-debugging-port=0',`--user-data-dir=${profile}`,
    '--no-first-run','--no-default-browser-check','--disable-background-networking',
    '--disable-background-timer-throttling','--disable-renderer-backgrounding',
    '--disable-backgrounding-occluded-windows','--force-device-scale-factor=1',
    '--window-size=3840,2160','--hide-scrollbars',...(process.platform === 'darwin' ? ['--use-angle=metal'] : []),
    '--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader','about:blank'
  ], {stdio:['ignore','ignore','pipe']});
  let chromeLog = '';
  chrome.stderr.on('data', chunk => {chromeLog += chunk;});
  let port;
  for(let i=0;i<120;i++) {
    try {
      port = Number((await readFile(path.join(profile,'DevToolsActivePort'),'utf8')).split('\n')[0]);
      if((await fetch(`http://127.0.0.1:${port}/json/version`)).ok) break;
    } catch {}
    if(chrome.exitCode !== null) throw new Error(`Chrome exited: ${chromeLog}`);
    await delay(250);
  }
  if(!port) throw new Error(`Chrome startup timed out: ${chromeLog}`);
  const pages = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  ws = new WebSocket(pages.find(page => page.type === 'page').webSocketDebuggerUrl);
  await once(ws,'open');
  ws.addEventListener('message', event => {
    const msg = JSON.parse(event.data);
    if(msg.id && pending.has(msg.id)) {
      const {resolve,reject,timer} = pending.get(msg.id);
      clearTimeout(timer); pending.delete(msg.id);
      if(msg.error) reject(new Error(JSON.stringify(msg.error))); else resolve(msg.result);
    }
    if(msg.method === 'Runtime.exceptionThrown') console.error('Browser exception:',JSON.stringify(msg.params));
  });
  function cdp(method, params={}) {
    return new Promise((resolve,reject) => {
      const id = ++requestId;
      const timer = setTimeout(() => {pending.delete(id);reject(new Error(`${method} timed out`));},180000);
      pending.set(id,{resolve,reject,timer});
      ws.send(JSON.stringify({id,method,params}));
    });
  }
  async function evaluate(expression) {
    const result = await cdp('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});
    if(result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  }
  await cdp('Runtime.enable');
  await cdp('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
  await cdp('Page.navigate',{url:'http://127.0.0.1:3040/scripts/video-export/render.html'});
  let ready = false;
  for(let i=0;i<180;i++) {
    const status = await evaluate('({ready:window.__renderReady,error:window.__renderError})');
    if(status.error) throw new Error(status.error);
    if(status.ready) {ready=true;break;}
    await delay(500);
  }
  if(!ready) throw new Error('Scene failed to initialize');
  const info = await evaluate('window.__renderInfo');
  console.log('Render:',JSON.stringify(info));
  if(info.width!==width || info.height!==height) throw new Error('Unexpected render dimensions');
  await writeFile(path.join(work,'render-info.json'),JSON.stringify(info,null,2));
  async function frame(t) {
    return Buffer.from(await evaluate(`window.__renderFrame(${t},${probe ? 3 : 8})`),'base64');
  }
  if(probe) {
    for(const i of [0,36,60,120,144,171,183,240]) {
      const start = Date.now();
      await writeFile(path.join(work,'samples',`frame-${String(i).padStart(4,'0')}.png`),await frame(i/fps));
      console.log(`Probe frame ${i}: ${((Date.now()-start)/1000).toFixed(2)}s`);
    }
    if(process.argv.includes('--verify')) {
      const check = await evaluate(`(async () => {
        const engine = window.__engine;
        const original = structuredClone(window.__renderInfo.config);
        engine.render(4.7,3);
        const expected = engine.canvas.toDataURL();
        window.__beforeExport = expected;
        engine.render(10.9,3); engine.render(4.7,3);
        const seekStable = expected === engine.canvas.toDataURL();
        const changed = structuredClone(original); changed.title = ['FINTOC','VALLEY'];
        engine.updateConfig(changed); engine.render(6.2,3);
        engine.updateConfig(original); engine.render(4.7,3);
        const titleRestored = expected === engine.canvas.toDataURL();
        const clearAir = structuredClone(original); clearAir.lighting.haze = 0;
        engine.updateConfig(clearAir); engine.render(4.7,3);
        const hazeChangesImage = expected !== engine.canvas.toDataURL();
        engine.updateConfig(original); engine.render(4.7,3);
        const hazeRestored = expected === engine.canvas.toDataURL();
        const blob = await engine.exportGLB();
        const bytes = new Uint8Array(await blob.arrayBuffer());
        window.__glbBytes = bytes;
        const view = new DataView(bytes.buffer);
        const json = JSON.parse(new TextDecoder().decode(bytes.slice(20,20+view.getUint32(12,true))));
        const names = json.nodes.map(n => n.name || '');
        const animated = new Set(json.animations.flatMap(a => a.channels.map(c => c.target.node)));
        const storyActors = names.map((name,i) => ({name,i})).filter(n => /Twitter roundel|SpaceX wordmark|SpaceX rocket|Rocket exhaust|Launch smoke puff|OpenClaw lobster/.test(n.name));
        const techActors = names.map((name,i) => ({name,i})).filter(n => /NVIDIA · architectural identity|NFT . Web3 · speculative domino crash|NFT · falling collectible|Web3 · collapsing marquee|Web3 · spilled token|NFT · clearance sign|Waymo · robotaxi/.test(n.name));
        const epochActors = names.map((name,i) => ({name,i})).filter(n => /openai · architectural identity|anthropic · architectural identity|OpenClaw · small terrace plaque/.test(n.name));
        const craneChildren = names.map((name,i) => ({name,i})).filter(n => /Traveling trolley|Variable hoist cable|Facade panel carried|Roof finishing piece/.test(n.name));
        const integratedBrands = json.nodes.map((n,i)=>({name:n.name,i,mount:n.extras?.brandMount})).filter(n=>n.mount);
        const identity = names.indexOf('Fintoc · single identity');
        const oldIdentity = names.indexOf('Fintoc · 2021 identity');
        const newIdentity = names.indexOf('Fintoc · current identity');
        const identityParts = names.map((name,i) => ({name,i})).filter(n => /^(2021|2024) Fintoc · component/.test(n.name));
        const oneFintocLocation = names.filter(n=>n==='Fintoc · single identity').length===1 &&
          json.nodes[identity]?.children?.includes(oldIdentity) && json.nodes[identity]?.children?.includes(newIdentity) &&
          !names.some(n=>/Fintoc billboards|Fintoc · primera sede|Fintoc · new identity assembled larger|old-fintoc-symbol/.test(n));
        const blackFintocLetters = json.materials.filter(m=>m.name==='Fintoc · black lettering').some(m=>(m.pbrMetallicRoughness.baseColorFactor || [1,1,1,1]).slice(0,3).every(c=>c<0.01));
        const panel = json.nodes[names.indexOf('Fintoc · white sign panel')];
        const panelMaterial = json.materials[json.meshes[panel.mesh].primitives[0].material];
        const whiteFintocPanel = (panelMaterial.pbrMetallicRoughness.baseColorFactor || [1,1,1,1]).slice(0,3).every(c=>c===1);
        const binaryStart = 28 + view.getUint32(12,true);
        const values = index => {
          const a = json.accessors[index], b = json.bufferViews[a.bufferView];
          return new Float32Array(bytes.buffer,binaryStart+(b.byteOffset||0)+(a.byteOffset||0),a.count*(a.type==='VEC3'?3:1));
        };
        const foliagePrimitives = json.meshes.flatMap(m=>m.primitives).filter(p=>json.materials[p.material]?.extras?.surfaceRole==='foliage');
        const facetedFoliage = foliagePrimitives.length>0 && foliagePrimitives.every(p=>{
          if(p.indices!==undefined || p.attributes.NORMAL===undefined) return false;
          const normals=values(p.attributes.NORMAL);
          for(let i=0;i<normals.length;i+=9) {
            for(let axis=0;axis<3;axis++) {
              if(Math.abs(normals[i+axis]-normals[i+3+axis])>1e-6 || Math.abs(normals[i+axis]-normals[i+6+axis])>1e-6) return false;
            }
          }
          return true;
        });
        const partScales = (year,t) => identityParts.filter(n=>n.name.startsWith(year)).map(n=>{
          const channel=json.animations[0].channels.find(c=>c.target.node===n.i && c.target.path==='scale');
          const sampler=json.animations[0].samplers[channel.sampler];
          const times=values(sampler.input), scales=values(sampler.output);
          let closest=0;
          for(let i=1;i<times.length;i++) if(Math.abs(times[i]-t)<Math.abs(times[closest]-t)) closest=i;
          return scales[closest*3];
        });
        const oldShown=partScales('2021',6).every(v=>v>0.99);
        const oldGone=partScales('2021',6.86).every(v=>v<0.002);
        const newWaiting=partScales('2024',6.86).every(v=>v<0.002);
        const newComplete=partScales('2024',7.65).every(v=>v>0.99);
        const fintocTransition = identityParts.length>0 && identityParts.every(n=>animated.has(n.i)) && oldShown && oldGone && newWaiting && newComplete;
        engine.render(4.7,3);
        window.__afterExport = engine.canvas.toDataURL();
        return {integratedBrands: integratedBrands.map(n=>({name:n.name,mount:n.mount,animated:animated.has(n.i)})),soraAbsent: !names.some(name=>/sora|Studio clapperboard|Movie camera on tripod/i.test(name)),oneFintocLocation,blackFintocLetters,whiteFintocPanel,fintocTransition,seekStable,titleRestored,hazeChangesImage,hazeRestored,exportRestored:expected===engine.canvas.toDataURL(),
          facetedFoliage,foliagePrimitives:foliagePrimitives.length,glbBytes:bytes.length,channels:json.animations[0].channels.length,
          images:json.images?.length || 0,
          storyActors:storyActors.map(n=>({name:n.name,animated:animated.has(n.i)})),
          techActors:techActors.map(n=>({name:n.name,animated:animated.has(n.i)})),
          epochActors:epochActors.map(n=>({name:n.name,animated:animated.has(n.i)})),
          fusionAbsent: !names.some(name=>/Fusion power|Fusion ·|NVIDIA · compute tier|giant processor/.test(name)),
          texturedRoles:[...new Set(json.materials.filter(m=>m.pbrMetallicRoughness?.baseColorTexture && m.normalTexture && m.pbrMetallicRoughness?.metallicRoughnessTexture).map(m=>m.extras?.surfaceRole).filter(Boolean))],
          craneChildren:craneChildren.map(n=>({name:n.name,animated:animated.has(n.i)}))};
      })()`);
      console.log('Verification:',JSON.stringify(check));
      if(!check.facetedFoliage) throw new Error('GLB foliage lost its face normals');
      for(const phase of ['before','after']) await writeFile(path.join(work,phase+'-export.png'),Buffer.from(await evaluate(`window.__${phase}Export.split(',')[1]`),'base64'));
      if(check.integratedBrands.length !== 5 || check.integratedBrands.some(n=>!n.animated) || !check.soraAbsent || !check.oneFintocLocation || !check.blackFintocLetters || !check.whiteFintocPanel || !check.fintocTransition || !check.seekStable || !check.titleRestored || !check.hazeChangesImage || !check.hazeRestored || !check.exportRestored || !check.fusionAbsent || check.storyActors.length !== 23 || check.storyActors.some(n=>!n.animated) || check.techActors.length !== 24 || check.techActors.some(n=>!n.animated) || check.epochActors.length !== 3 || check.epochActors.some(n=>!n.animated) || check.texturedRoles.length !== 10 || check.craneChildren.some(n=>!n.animated && n.name!=='Roof finishing piece')) throw new Error('Animation verification failed');
      await writeFile(path.join(work,'verification.json'),JSON.stringify(check,null,2));
      const pieces = [];
      for(let start=0;start<check.glbBytes;start+=49152) {
        pieces.push(Buffer.from(await evaluate(`btoa(String.fromCharCode(...window.__glbBytes.slice(${start},${start+49152})))`),'base64'));
      }
      await writeFile(path.join(work,'verified-scene.glb'),Buffer.concat(pieces));
    }
  } else {
    const args = [
      '-y','-hide_banner','-loglevel','warning','-f','image2pipe','-framerate',String(fps),'-i','pipe:0',
      '-i',path.join(root,'public/media/opening-soundtrack.m4a'),'-map','0:v:0','-map','1:a:0',
      '-frames:v',String(total),
      '-vf','scale=3840:2160:flags=lanczos:out_color_matrix=bt709:out_range=tv,setsar=1',
      '-c:v','libx264','-preset','slow','-crf','16','-profile:v','high','-level:v','5.1','-pix_fmt','yuv420p',
      '-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709','-color_range','tv',
      '-c:a','copy','-movflags','+faststart','-video_track_timescale','24000',output
    ];
    encoder = spawn(process.env.FFMPEG_PATH || 'ffmpeg',args,{stdio:['pipe','ignore','pipe']});
    let encoderLog='';
    encoder.stderr.on('data',chunk=>{encoderLog+=chunk;});
    encoder.stdin.on('error',()=>{});
    const encoderDone = new Promise((resolve,reject)=>{
      encoder.on('error',reject);
      encoder.on('close',code=>code===0?resolve():reject(new Error(`ffmpeg exited ${code}: ${encoderLog}`)));
    });
    encoderDone.catch(()=>{});
    const start=Date.now();
    for(let i=0;i<total;i++) {
      const png = await frame(i/fps);
      if([0,60,132,210,261].includes(i)) await writeFile(path.join(work,'samples',`frame-${String(i).padStart(4,'0')}.png`),png);
      if(encoder.exitCode!==null) await encoderDone;
      if(!encoder.stdin.write(png)) await Promise.race([once(encoder.stdin,'drain'),encoderDone]);
      if(i===0 || (i+1)%12===0 || i===total-1) {
        const seconds=(Date.now()-start)/1000;
        console.log(`${i+1}/${total} frames · ${seconds.toFixed(1)}s elapsed · ETA ${(seconds/(i+1)*(total-i-1)).toFixed(0)}s`);
      }
    }
    encoder.stdin.end();
    await encoderDone;
    console.log(`Export complete: ${output}`);
    if(encoderLog) console.log(encoderLog);
  }
} finally {
  ws?.close();
  for(const {timer} of pending.values()) clearTimeout(timer);
  if(encoder && encoder.exitCode===null) encoder.kill('SIGTERM');
  chrome?.kill('SIGTERM');
  await server.close();
}
