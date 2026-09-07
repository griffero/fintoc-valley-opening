/** Fintoc signs composited onto yU+co's original plate in its native 1920×1080 space.
 * Camera transforms were measured from static landmarks at the source frame rate.
 * The original buildings, red title, animation, grading, and soundtrack are preserved.
 */
export const SOURCE_FPS=24000/1001;
export const SOURCE_DURATION=10.885;
type Matrix=[number,number,number,number,number,number];
type Point=[number,number];
type Track={fps:number;frames:number;tracks:Record<string,{m:Matrix;error:number;inliers:number}[]>};
const smooth=(a:number,b:number,x:number)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};

export async function createComposite(canvas:HTMLCanvasElement,video:HTMLVideoElement){
  canvas.width=1920;canvas.height=1080;
  const ctx=canvas.getContext('2d',{alpha:false})!;
  const loadImage=(src:string)=>new Promise<HTMLImageElement>((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=src;});
  const [track,logo,lastFrame]=await Promise.all([
    fetch('/media/camera-track.json').then(r=>{if(!r.ok)throw new Error('Tracking data unavailable');return r.json() as Promise<Track>;}),
    loadImage('/assets/fintoc-logo-white.svg'),
    loadImage('/media/final-frame.png')
  ]);
  function tint(color:string){const c=document.createElement('canvas');c.width=1128;c.height=240;const g=c.getContext('2d')!;g.drawImage(logo,0,0,1128,240);g.globalCompositeOperation='source-in';g.fillStyle=color;g.fillRect(0,0,1128,240);return c;}
  const ivory=tint('#e7ded0'),ivoryShade=tint('#8f887d'),ink=tint('#151b20'),inkSide=tint('#4a5355'),inkEdge=tint('#7e8583'),shadow=tint('#18201a');
  function billboard(color:string,light:boolean){const c=document.createElement('canvas');c.width=1200;c.height=420;const g=c.getContext('2d')!;
    const bg=g.createLinearGradient(0,0,1200,420);bg.addColorStop(0,color);bg.addColorStop(1,light?'#e0d8c9':'#18202d');g.fillStyle=bg;g.fillRect(0,0,1200,420);
    const w=990,h=w*20/94,x=(1200-w)/2,y=(420-h)/2;
    g.drawImage(light?inkSide:ivoryShade,x+9,y+10,w,h);g.drawImage(light?ink:ivory,x,y,w,h);
    return c;
  }
  const navy=billboard('#243044',false),cream=billboard('#f8eddb',true);
  function transform(ref:string,frame:number){const frames=track.tracks[ref];let i=Math.min(frames.length-1,Math.max(1,frame));while(i<frames.length-1&&!frames[i].inliers)i++;const m=frames[i].m;ctx.transform(m[0],m[3],m[1],m[4],m[2],m[5]);}
  function affineImage(img:CanvasImageSource,p:Point,u:Point,v:Point,w:number,h:number){ctx.save();ctx.transform(u[0]/w,u[1]/w,v[0]/h,v[1]/h,p[0],p[1]);ctx.drawImage(img,0,0,w,h);ctx.restore();}
  function polygon(points:Point[],color:string){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fillStyle=color;ctx.fill();}
  function hero(time:number){
    const growth=smooth(5.0,6.0,time);if(!growth)return;
    // Freestanding letter sculpture, with thickness and a plinth on the rooftop.
    const origin:Point=[1106,177],u:Point=[253,108],v:Point=[0,-68*growth];
    ctx.save();
    ctx.globalAlpha=.2*growth;ctx.filter='blur(3px)';
    affineImage(shadow,[1116,178],[253,108],[45,-20],1128,240);
    ctx.restore();
    polygon([[1098,174],[1366,288],[1380,282],[1112,168]],'#dad3c6');
    polygon([[1098,174],[1366,288],[1366,294],[1098,180]],'#999b94');
    // The extrusion recedes in the same direction as the original buildings.
    for(let z=12;z>0;z-=1){const x=origin[0]+z,y=origin[1]-z*.44;affineImage(z===12?inkEdge:inkSide,[x,y+v[1]],[u[0],u[1]],[0,-v[1]],1128,240);}
    affineImage(ink,[origin[0],origin[1]+v[1]],u,[0,-v[1]],1128,240);
  }
  function draw(time:number,enabled=true){
    ctx.clearRect(0,0,1920,1080);
    // The source's final frame holds through the audio tail after video decoding ends.
    if(time>=257/SOURCE_FPS||video.ended)ctx.drawImage(lastFrame,0,0,1920,1080);
    else if(video.readyState>=2)ctx.drawImage(video,0,0,1920,1080);
    if(!enabled||time<5/SOURCE_FPS)return;
    const frame=Math.min(256,Math.round(time*SOURCE_FPS));
    // The opening rooftop sign, before the original billboard is dismantled.
    if(time<2.96){ctx.save();transform('20',frame);ctx.globalAlpha=1-smooth(2.76,2.96,time);affineImage(navy,[1145,452],[205,99],[0,66],1200,420);ctx.restore();}
    // Fintoc's second campus occupies the billboard beside the title reveal.
    if(time>6.02){ctx.save();transform('210',frame);ctx.globalAlpha=smooth(6.02,6.2,time);affineImage(navy,[275,331],[212,-89],[0,91],1200,420);ctx.restore();}
    ctx.save();transform('210',frame);
    // Keep the ivory board and the tower's own lighting around the new wordmark.
    affineImage(cream,[1130,231],[132,57],[0,43],1200,420);
    hero(time);
    ctx.restore();
  }
  draw(8.8);
  return {draw};
}
