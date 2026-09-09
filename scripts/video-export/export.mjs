import { spawn } from 'node:child_process';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { once } from 'node:events';
import path from 'node:path';
import { createServer } from 'vite';

const root = process.cwd();
const work = path.join(root, 'work/video-export');
const output = path.join(root, 'outputs/fintoc-valley-v5-4k.mp4');
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
    for(const i of [0,24,60,84,96,108,120,144,168,240]) {
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
        const blob = await engine.exportGLB();
        const bytes = new Uint8Array(await blob.arrayBuffer());
        window.__glbBytes = bytes;
        const view = new DataView(bytes.buffer);
        const json = JSON.parse(new TextDecoder().decode(bytes.slice(20,20+view.getUint32(12,true))));
        const names = json.nodes.map(n => n.name || '');
        const animated = new Set(json.animations.flatMap(a => a.channels.map(c => c.target.node)));
        const storyActors = names.map((name,i) => ({name,i})).filter(n => /Twitter roundel|SpaceX wordmark|SpaceX rocket|Rocket exhaust|Launch smoke puff|Sora rooftop sign|Sora · closing roller shutter|OpenClaw lobster/.test(n.name));
        const craneChildren = names.map((name,i) => ({name,i})).filter(n => /Traveling trolley|Variable hoist cable|Facade panel carried|Roof finishing piece/.test(n.name));
        engine.render(4.7,3);
        window.__afterExport = engine.canvas.toDataURL();
        return {seekStable,titleRestored,exportRestored:expected===engine.canvas.toDataURL(),
          glbBytes:bytes.length,channels:json.animations[0].channels.length,
          images:json.images?.length || 0,
          storyActors:storyActors.map(n=>({name:n.name,animated:animated.has(n.i)})),
          texturedRoles:[...new Set(json.materials.filter(m=>m.pbrMetallicRoughness?.baseColorTexture && m.normalTexture && m.pbrMetallicRoughness?.metallicRoughnessTexture).map(m=>m.extras?.surfaceRole).filter(Boolean))],
          craneChildren:craneChildren.map(n=>({name:n.name,animated:animated.has(n.i)}))};
      })()`);
      console.log('Verification:',JSON.stringify(check));
      for(const phase of ['before','after']) await writeFile(path.join(work,phase+'-export.png'),Buffer.from(await evaluate(`window.__${phase}Export.split(',')[1]`),'base64'));
      if(!check.seekStable || !check.titleRestored || !check.exportRestored || check.storyActors.length !== 31 || check.storyActors.some(n=>!n.animated) || check.texturedRoles.length !== 10 || check.craneChildren.some(n=>!n.animated && n.name!=='Roof finishing piece')) throw new Error('Animation verification failed');
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
