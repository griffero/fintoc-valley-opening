import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const DURATION = 12;
const BLUE = '#057aff';
const clamp = (v:number) => Math.max(0, Math.min(1,v));
const smooth = (a:number,b:number,t:number) => { const p=clamp((t-a)/(b-a));return p*p*(3-2*p); };
const spring = (p:number) => p>=1 ? 1 : p<=0 ? 0.001 : 1-Math.pow(1-p,3)*Math.cos(p*7);

export function createValley(host:HTMLElement) {
  const scene=new THREE.Scene();
  scene.background=new THREE.Color('#e3ebe8');
  scene.fog=new THREE.Fog('#e3ebe8',180,310);
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.6));
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.setClearColor('#e3ebe8');
  renderer.domElement.setAttribute('aria-label','Ciudad isométrica animada con la torre Fintoc en el centro');
  host.appendChild(renderer.domElement);
  const camera=new THREE.OrthographicCamera(-75,75,45,-45,0.1,500);
  const hemi=new THREE.HemisphereLight('#ffffff','#7f927a',2.5);scene.add(hemi);
  const sun=new THREE.DirectionalLight('#fff5e1',3.1);sun.position.set(-55,100,55);sun.castShadow=true;
  sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-100;sun.shadow.camera.right=100;sun.shadow.camera.top=100;sun.shadow.camera.bottom=-100;sun.shadow.camera.far=250;sun.shadow.normalBias=0.14;sun.shadow.bias=-0.0001;scene.add(sun);
  const materials=new Map<string,THREE.MeshStandardMaterial>();
  function mat(color:string){ if(!materials.has(color))materials.set(color,new THREE.MeshStandardMaterial({color,roughness:0.84}));return materials.get(color)!; }
  const cube=new THREE.BoxGeometry(1,1,1);
  function box(parent:THREE.Object3D,x:number,y:number,z:number,w:number,h:number,d:number,color:string){const m=new THREE.Mesh(cube,mat(color));m.position.set(x,y+h/2,z);m.scale.set(w,h,d);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  function cylinder(parent:THREE.Object3D,x:number,y:number,z:number,r:number,h:number,color:string,segments=12){const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,segments),mat(color));m.position.set(x,y+h/2,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  function line(parent:THREE.Object3D,points:THREE.Vector3[],color:string,r=.08){const curve=new THREE.CatmullRomCurve3(points);const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,32,r,5,false),mat(color));parent.add(mesh);return mesh;}
  const world=new THREE.Group();scene.add(world);
  box(world,0,-1.8,0,134,1.8,108,'#a3b68a');
  box(world,0,-2.7,0,134,.9,108,'#8b9d79');
  box(world,0,-3.1,0,134,.4,108,'#f1ede1');
  box(scene,0,-3.5,0,1000,.3,1000,'#e3ebe8');
  // A miniature city grid, intersections, sidewalks and pedestrian crossings.
  const lanes=[-48,-24,0,24,48];
  for(const x of lanes){box(world,x,.02,0,4,.05,106,'#737d7b');box(world,x-2.3,0,0,.45,.08,106,'#d9dace');box(world,x+2.3,0,0,.45,.08,106,'#d9dace');}
  for(const z of [-40,-16,8,32]){box(world,0,.021,z,132,.055,4,'#737d7b');box(world,0,0,z-2.3,132,.08,.45,'#d9dace');box(world,0,0,z+2.3,132,.08,.45,'#d9dace');}
  for(const x of lanes)for(let z=-51;z<53;z+=4){if([-40,-16,8,32].some(v=>Math.abs(v-z)<3))continue;box(world,x,.06,z,.11,.03,1.5,'#e2dfbf');}
  for(const z of [-40,-16,8,32])for(let x=-65;x<65;x+=4){if(lanes.some(v=>Math.abs(v-x)<3))continue;box(world,x,.065,z,1.5,.03,.11,'#e2dfbf');}
  for(const x of lanes)for(const z of [-40,-16,8,32])for(let k=-2;k<=2;k++){box(world,x+k*.55,.071,z+3,.27,.02,1.4,'#eceee0');box(world,x+3,.071,z+k*.55,1.4,.02,.27,'#eceee0');}
  // Elevated freeway, viaduct supports and lane dividers.
  const freeway=new THREE.Group();freeway.position.set(0,0,46);world.add(freeway);
  box(freeway,0,2.4,0,132,.8,6.6,'#bfc7bf');box(freeway,0,3.2,0,132,.12,6,'#747f7d');
  for(const z of [-3.2,3.2])box(freeway,0,3.1,z,132,.65,.2,'#e2e2d8');
  for(let x=-62;x<64;x+=12)box(freeway,x,0,0,1.3,2.4,4.6,'#9da99e');
  for(let x=-64;x<65;x+=3)box(freeway,x,3.34,0,1.4,.03,.12,'#f1e6be');
  // Trees use instanced geometry to keep the city light on laptops.
  let seed=281;function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
  const treePositions:[number,number,number][]=[];
  for(let i=0;i<230;i++){let x=rand()*128-64,z=rand()*98-51;if(lanes.some(v=>Math.abs(x-v)<3.4)||[-40,-16,8,32,46].some(v=>Math.abs(z-v)<3.5))continue;if(Math.abs(x-12)<12&&Math.abs(z+4)<9)continue;treePositions.push([x,z,0.6+rand()*.75]);}
  for(const x of [-45,-27,3,21,51])for(let z=-48;z<42;z+=7){if([-40,-16,8,32].some(v=>Math.abs(z-v)<4))continue;treePositions.push([x,z,0.9]);}
  const crowns=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,0),mat('#5d854f'),treePositions.length);
  const trunks=new THREE.InstancedMesh(new THREE.CylinderGeometry(.13,.18,1.7,5),mat('#8d8263'),treePositions.length);
  const dummy=new THREE.Object3D();treePositions.forEach(([x,z,s],i)=>{dummy.position.set(x,2*s,z);dummy.scale.set(s,1.15*s,s);dummy.rotation.y=i;dummy.updateMatrix();crowns.setMatrixAt(i,dummy.matrix);crowns.setColorAt(i,new THREE.Color(['#4e7848','#729758','#92ac66','#456e47'][i%4]));dummy.position.set(x,.85*s,z);dummy.scale.set(s,s,s);dummy.updateMatrix();trunks.setMatrixAt(i,dummy.matrix);});crowns.castShadow=true;crowns.receiveShadow=true;world.add(crowns,trunks);
  const grow:{group:THREE.Group,start:number,duration:number}[]=[];
  function building(x:number,z:number,w:number,d:number,h:number,color:string,start:number){const g=new THREE.Group();g.position.set(x,0,z);world.add(g);grow.push({group:g,start,duration:1.05});box(g,0,0,0,w+.7,.35,d+.7,'#d9dcd0');box(g,0,.35,0,w,h,d,color);box(g,0,h+.35,0,w+.3,.3,d+.3,'#f7f6e9');box(g,0,h+.65,0,w-1,.15,d-1,'#bcc3b8');
    for(let y=1.3;y<h-.6;y+=1.8){box(g,0,y,d/2+.015,w-.7,.6,.025,'#9bbed0');box(g,w/2+.02,y,0,.025,.6,d-.6,'#7099ad');for(let k=-w/2+.9;k<w/2;k+=1.6)box(g,k,y,d/2+.04,.1,.66,.05,color);}
    box(g,0,.35,d/2+.12,.9,1.5,.15,'#496775');
    if(h>4){box(g,-w*.2,h+.8,-d*.15,w*.26,.55,d*.3,'#929e9d');box(g,w*.2,h+.8,d*.1,.65,.7,.8,'#adb5aa');}return g;
  }
  const districtColors=['#efeddf','#d3d9cd','#dadaca','#bfcfc4','#d9e3df','#ecdfca'];
  for(const x of [-59,-36,-12,12,36,59])for(const z of [-48,-28,-4,20,39]){
    if((x===12&&z===-4)||(x===-36&&z===-28)||(x===36&&z===-28)||(x===-36&&z===20)||(x===-12&&z===20)||(x===36&&z===20)||(x===-36&&z===-4))continue;
    const count=(Math.abs(x)>50?2:3);for(let i=0;i<count;i++){const px=x+(i===0?-4:i===1?3:4),pz=z+(i===2?4:-2);const w=3+rand()*3,d=3+rand()*3,h=2+rand()*7;building(px,pz,w,d,h,districtColors[Math.floor(rand()*districtColors.length)],.3+rand()*3.5);}
  }
  const textures:THREE.Texture[]=[];
  function wordTexture(word:string,color='#202b32',bg='#ffffff',size=80){const c=document.createElement('canvas');c.width=1024;c.height=256;const ctx=c.getContext('2d')!;ctx.fillStyle=bg;ctx.fillRect(0,0,1024,256);ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`700 ${size}px Arial`;ctx.fillText(word,512,133);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;textures.push(t);return t;}
  const imagePromises:Promise<unknown>[]=[];
  function logoTexture(path:string,bg:string,word:string){const t=wordTexture(word,'#111111',bg,120);const c=t.image as HTMLCanvasElement;const ctx=c.getContext('2d')!;imagePromises.push(new Promise<void>((resolve)=>{const img=new Image();img.onload=()=>{ctx.fillStyle=bg;ctx.fillRect(0,0,c.width,c.height);const s=Math.min(860/img.width,180/img.height);ctx.drawImage(img,(1024-img.width*s)/2,(256-img.height*s)/2,img.width*s,img.height*s);t.needsUpdate=true;resolve();};img.onerror=()=>resolve();img.src=path;}));return t;}
  function sign(g:THREE.Object3D,w:number,h:number,y:number,z:number,texture:THREE.Texture){box(g,0,y-h/2,z-.1,w+.22,h+.2,.3,'#f4f5ef');const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:texture}));m.position.set(0,y,z+.065);g.add(m);return m;}
  function roofSign(g:THREE.Object3D,w:number,y:number,z:number,texture:THREE.Texture){box(g,-w*.36,y-2,z,.14,2,.14,'#75837f');box(g,w*.36,y-2,z,.14,2,.14,'#75837f');return sign(g,w,w/4,y+.4,z,texture);}
  // Recognizable tech campuses around Fintoc.
  const google=building(-36,-28,15,10,5,'#f4f1dc',1.1);roofSign(google,15,9,3,logoTexture('/assets/google.svg','#ffffff','Google'));
  for(let i=0;i<4;i++)box(google,-5+i*3.3,5.7,-2,2.3,.35,5,['#4285f4','#ea4335','#fbbc05','#34a853'][i]);
  const meta=building(-36,-4,13,8,11,'#e6e6d9',2.1);roofSign(meta,12,15,3,logoTexture('/assets/meta.svg','#ffffff','Meta'));
  const stripe=building(-12,20,12,9,7,'#d9d3f4',2.7);roofSign(stripe,12,10,3,logoTexture('/assets/stripe.svg','#ffffff','stripe'));
  const amazon=building(-36,20,16,12,3,'#ddddce',2.5);sign(amazon,12,3,2.3,6.1,logoTexture('/assets/aws.svg','#ffffff','AWS'));
  for(let i=0;i<4;i++){box(amazon,-5+i*3.2,0,7,1.8,1.2,2.7,'#dadbcd');box(amazon,-5+i*3.2,.2,8.5,1.65,.7,.5,'#4d6674');}
  const microsoft=building(36,20,13,10,6,'#ededde',1.8);roofSign(microsoft,13,9,4,wordTexture('Microsoft','#374943','#ffffff',100));
  // Circular Apple campus with an open, tree-filled courtyard.
  const apple=new THREE.Group();apple.position.set(36,0,-28);world.add(apple);grow.push({group:apple,start:.4,duration:1.1});
  const ringShape=new THREE.Shape();ringShape.absarc(0,0,10,0,Math.PI*2,false);const hole=new THREE.Path();hole.absarc(0,0,7.2,0,Math.PI*2,true);ringShape.holes.push(hole);
  const ring=new THREE.Mesh(new THREE.ExtrudeGeometry(ringShape,{depth:3.5,bevelEnabled:false,curveSegments:64}),mat('#f3f2e7'));ring.rotation.x=-Math.PI/2;ring.castShadow=true;ring.receiveShadow=true;apple.add(ring);
  const darkRing=new THREE.Mesh(new THREE.TorusGeometry(10,.1,4,96),mat('#6f9397'));darkRing.rotation.x=Math.PI/2;darkRing.position.y=1.9;apple.add(darkRing);
  cylinder(apple,0,0,0,6.8,.08,'#90a967',48);roofSign(apple,5,6,7.4,logoTexture('/assets/apple.svg','#ffffff','Apple'));
  // The Fintoc headquarters: stacked blue glass, structural ribs, terraces, rooftop mark.
  const hq=new THREE.Group();hq.position.set(12,0,-4);world.add(hq);grow.push({group:hq,start:4.1,duration:2.0});
  box(hq,0,0,0,19,.4,17,'#d4dfd9');box(hq,0,.4,0,15,2.4,13,'#e7ece4');box(hq,0,2.8,0,12,23,10,BLUE);
  for(let f=0;f<11;f++){const y=3.7+f*1.96;box(hq,0,y,5.04,11.9,1.25,.07,f%2?'#69b6f4':'#98d4f8');box(hq,6.04,y,0,.07,1.25,9.9,f%2?'#1686df':'#358fd4');box(hq,-6.04,y,0,.07,1.25,9.9,'#8dd0f7');}
  for(let x=-6;x<=6;x+=2)box(hq,x,2.8,5.12,.21,23,.2,BLUE);
  for(let z=-5;z<=5;z+=2)box(hq,6.12,2.8,z,.2,23,.2,BLUE);
  box(hq,0,25.8,0,12.8,.75,10.8,'#f7faf2');box(hq,0,26.55,0,9,.2,7,'#a5c17c');
  box(hq,-3.5,26.75,-1,2,1.2,3,'#dce6db');cylinder(hq,3,26.8,-1,1.1,1.2,'#6c944c');
  const fintocTexture=logoTexture('/assets/fintoc-logo.svg','#ffffff','fintoc');roofSign(hq,16,32,4,fintocTexture);
  sign(hq,10.3,2.58,20.7,5.22,fintocTexture);
  // Monument with the four brand bars, extruded into the square.
  const monument=new THREE.Group();monument.position.set(-4,0,7.1);hq.add(monument);
  [.35,.65,1,1.8].forEach((w,i)=>box(monument,i*1.45,0,0,w,4.3,.75,BLUE));
  for(const side of [-1,1]){box(hq,side*7,0,3,1,1,5,'#84a361');box(hq,side*7,1,3,1.1,.6,5.1,'#588846');}
  // Cranes build the skyline in the first half of the sequence.
  const cranes:THREE.Group[]=[];
  function crane(x:number,z:number,h:number){const g=new THREE.Group();g.position.set(x,0,z);world.add(g);box(g,0,0,0,.4,h,.4,'#edaf3c');for(let y=1;y<h;y+=2)box(g,0,y,0,1.1,.15,.6,'#db9530');box(g,4,h,0,14,.4,.4,'#f3bd51');box(g,-2,h-.9,0,1.6,.9,1,'#e8bb53');box(g,9,h-8,0,.035,8,.035,'#686a5c');box(g,9,h-8,0,.4,.35,.4,'#80795d');cranes.push(g);return g;}crane(20,-11,30);crane(-18,-33,15);
  // Fintoc routes light up the entire road network.
  const network=new THREE.Group();world.add(network);
  const networkMaterial=new THREE.MeshBasicMaterial({color:BLUE,transparent:true,opacity:0});
  for(const x of lanes){const m=new THREE.Mesh(new THREE.BoxGeometry(.32,.04,96),networkMaterial);m.position.set(x,.14,-1);network.add(m);}
  for(const z of [-40,-16,8,32]){const m=new THREE.Mesh(new THREE.BoxGeometry(122,.04,.32),networkMaterial);m.position.set(0,.14,z);network.add(m);}
  const flowDots:{m:THREE.Mesh,axis:number,lane:number,offset:number}[]=[];
  for(let i=0;i<40;i++){const m=new THREE.Mesh(new THREE.SphereGeometry(.23,6,4),new THREE.MeshBasicMaterial({color:i%3===0?'#ffffff':BLUE}));network.add(m);flowDots.push({m,axis:i%2,lane:i%2?lanes[i%5]:[-40,-16,8,32][i%4],offset:rand()});}
  const pulse=new THREE.Mesh(new THREE.RingGeometry(1,1.04,96),new THREE.MeshBasicMaterial({color:BLUE,transparent:true,opacity:.5,side:THREE.DoubleSide}));pulse.rotation.x=-Math.PI/2;pulse.position.set(12,.18,-4);world.add(pulse);
  const cars:{g:THREE.Group,axis:number,lane:number,phase:number,speed:number,freeway:boolean}[]=[];
  for(let i=0;i<44;i++){const g=new THREE.Group();const color=['#f0e8d8','#e3b44a','#057aff','#e98c61','#657c7e'][i%5];box(g,0,.18,0,.9,.35,1.7,color);box(g,0,.53,-.05,.75,.35,.9,'#dce4df');box(g,0,.61,.43,.68,.22,.025,'#456475');for(const x of [-.45,.45])for(const z of [-.5,.5]){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.18,.18,.12,7),mat('#3e4a49'));wheel.rotation.z=Math.PI/2;wheel.position.set(x,.22,z);g.add(wheel);}world.add(g);const freeway=i>33;cars.push({g,axis:i%2,lane:freeway?46+(i%2?.9:-.9):(i%2?lanes[i%5]+.95:[-40,-16,8,32][i%4]+.95),phase:rand(),speed:5+rand()*7,freeway});}
  // A small delivery drone crosses the city and a satellite dish turns.
  const drone=new THREE.Group();world.add(drone);box(drone,0,0,0,.6,.3,.6,'#e5e8df');box(drone,0,-.8,0,.9,.6,.7,'#c9a67b');box(drone,0,.1,0,2.6,.1,.15,'#566768');box(drone,0,.1,0,.15,.1,2.6,'#566768');
  const rotors:THREE.Mesh[]=[];for(const [x,z]of [[-1.2,0],[1.2,0],[0,-1.2],[0,1.2]]){const m=box(drone,x,.3,z,1.1,.05,.1,'#485857');rotors.push(m);}
  // A thin bridge from headquarters onto the central avenue.
  line(world,[new THREE.Vector3(12,.2,5),new THREE.Vector3(12,.2,8),new THREE.Vector3(0,.2,8)],'#b8c6b4',.28);
  // Batch static meshes by material, preserving the separate animated buildings.
  function batch(group:THREE.Object3D){
    const sets=new Map<THREE.Material,THREE.Mesh[]>();
    for(const child of group.children){
      if(child instanceof THREE.Mesh && !(child instanceof THREE.InstancedMesh) && child.material instanceof THREE.MeshStandardMaterial){const a=sets.get(child.material)||[];a.push(child);sets.set(child.material,a);}}
    for(const [material,meshes] of sets){if(meshes.length<2)continue;const geometries=meshes.map(m=>{m.updateMatrix();return m.geometry.clone().applyMatrix4(m.matrix);});const merged=mergeGeometries(geometries);if(merged){const m=new THREE.Mesh(merged,material);m.castShadow=true;m.receiveShadow=true;group.add(m);meshes.forEach(m=>group.remove(m));}geometries.forEach(g=>g.dispose());}
  }
  grow.forEach(g=>batch(g.group));batch(freeway);batch(world);
  const observer=new ResizeObserver(resize);observer.observe(host);
  let width=1,height=1;
  function resize(){width=host.clientWidth;height=host.clientHeight;renderer.setSize(width,height,false);const aspect=width/Math.max(height,1);camera.left=-49*aspect;camera.right=49*aspect;camera.top=49;camera.bottom=-49;camera.updateProjectionMatrix();}
  resize();
  function render(t:number,idle=false){
    for(const item of grow){const v=spring(clamp((t-item.start)/item.duration));item.group.scale.y=Math.max(.001,v);item.group.visible=t>item.start;}
    const blue=smooth(6.2,8.4,t);networkMaterial.opacity=blue*.8;network.visible=t>6.2;
    for(const {m,axis,lane,offset} of flowDots){const pos=((t*13+offset*120)%120)-60;m.position.set(axis?lane:pos,.34,axis?pos*.78:lane);m.scale.setScalar(blue);}
    const p=((t-6)%2.1)/2.1;pulse.visible=t>6&&t<10.5;pulse.scale.setScalar(3+Math.max(0,p)*70);(pulse.material as THREE.MeshBasicMaterial).opacity=(1-Math.max(0,p))*.42;
    for(const c of cars){const p=((c.phase*130+t*c.speed)%130)-65;c.g.rotation.y=c.freeway?Math.PI/2:c.axis?0:Math.PI/2;c.g.position.set(c.freeway?p:c.axis?c.lane:p,c.freeway?3.35:.08,c.freeway?c.lane:c.axis?p*.78:c.lane);}
    for(let i=0;i<cranes.length;i++){cranes[i].scale.y=1-smooth(6.3+i*.1,7.5+i*.1,t);cranes[i].visible=t<7.7;}
    drone.position.set(-50+t*9,20+Math.sin(t*1.5),22-t*3);drone.rotation.y=.3;drone.visible=t>1&&t<11;rotors.forEach(r=>r.rotation.y=t*50);
    const pull=smooth(0,9.5,t);const angle=.66+pull*.12;const radius=145;
    camera.position.set(Math.sin(angle)*radius,112-pull*13,Math.cos(angle)*radius);camera.lookAt(0,4+pull*3,0);
    camera.zoom=(width<620?.61:1.02)+(1-pull)*.3;camera.updateProjectionMatrix();
    if(idle)camera.zoom=width<620?.65:1.0;camera.updateProjectionMatrix();renderer.render(scene,camera);
  }
  render(9.2,true);
  return {render,ready:Promise.all(imagePromises),dispose(){observer.disconnect();renderer.dispose();scene.traverse(obj=>{if(obj instanceof THREE.Mesh){obj.geometry.dispose();const ms=Array.isArray(obj.material)?obj.material:[obj.material];ms.forEach(m=>m.dispose());}});textures.forEach(t=>t.dispose());renderer.domElement.remove();}};
}
