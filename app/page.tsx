'use client';
import {useEffect,useRef,useState,useCallback} from 'react';
import {Play,Pause,RotateCcw,Volume2,VolumeX,Maximize2,Minimize2,Columns2,Upload,LoaderCircle} from 'lucide-react';
import {Slider} from '@/components/ui/slider';
import {createComposite,SOURCE_DURATION,SOURCE_FPS} from '@/lib/fintoc-composite';
import './valley.css';
const fmt=(time:number)=>`00:${Math.floor(time).toString().padStart(2,'0')}`;
export default function Home(){
  const screen=useRef<HTMLElement>(null),video=useRef<HTMLVideoElement>(null),canvas=useRef<HTMLCanvasElement>(null),fileInput=useRef<HTMLInputElement>(null);
  const compositor=useRef<Awaited<ReturnType<typeof createComposite>>|null>(null);
  const enabledRef=useRef(true);
  const [ready,setReady]=useState(false),[playing,setPlaying]=useState(false),[started,setStarted]=useState(false),[time,setTime]=useState(8.8),[muted,setMuted]=useState(false),[original,setOriginal]=useState(false),[full,setFull]=useState(false),[error,setError]=useState('');
  const customAudio=useRef<HTMLAudioElement|null>(null),customUrl=useRef<string|null>(null);
  const [trackName,setTrackName]=useState('');
  useEffect(()=>{
    let stopped=false,raf=0,callback=0;
    const v=video.current!,c=canvas.current!;
    const init=async()=>{try{const comp=await createComposite(c,v);if(stopped)return;compositor.current=comp;if(Math.abs(v.currentTime-8.8)>.01){const sought=new Promise<void>(resolve=>v.addEventListener('seeked',()=>resolve(),{once:true}));v.currentTime=8.8;await sought;}if(stopped)return;setTime(8.8);comp.draw(8.8);setReady(true);}catch{setError('No se pudo cargar la composición. Recarga para volver a intentarlo.');}};
    const draw=(_:number,info?:VideoFrameCallbackMetadata)=>{if(stopped)return;const t=info?.mediaTime??v.currentTime;compositor.current?.draw(t,enabledRef.current);setTime(t);if(v.requestVideoFrameCallback)callback=v.requestVideoFrameCallback(draw);else raf=requestAnimationFrame(draw);};
    if(v.readyState>=2)void init();else v.addEventListener('loadeddata',init,{once:true});
    if(v.requestVideoFrameCallback)callback=v.requestVideoFrameCallback(draw);else raf=requestAnimationFrame(draw);
    const seek=()=>{compositor.current?.draw(v.currentTime,enabledRef.current);setTime(v.currentTime);if(customAudio.current)customAudio.current.currentTime=v.currentTime;};
    const onPlay=()=>{setPlaying(true);setStarted(true);},onPause=()=>{setPlaying(false);customAudio.current?.pause();};
    const onEnd=()=>{setPlaying(false);customAudio.current?.pause();};
    const onFull=()=>setFull(Boolean(document.fullscreenElement));
    v.addEventListener('seeked',seek);v.addEventListener('play',onPlay);v.addEventListener('pause',onPause);v.addEventListener('ended',onEnd);document.addEventListener('fullscreenchange',onFull);
    return()=>{stopped=true;v.pause();v.removeEventListener('loadeddata',init);v.removeEventListener('seeked',seek);v.removeEventListener('play',onPlay);v.removeEventListener('pause',onPause);v.removeEventListener('ended',onEnd);document.removeEventListener('fullscreenchange',onFull);cancelAnimationFrame(raf);if(v.cancelVideoFrameCallback)v.cancelVideoFrameCallback(callback);customAudio.current?.pause();if(customUrl.current)URL.revokeObjectURL(customUrl.current);};
  },[]);
  const play=useCallback(async(restart=false)=>{const v=video.current;if(!v||!ready)return;if(!v.paused&&!restart){v.pause();return;}if(restart||!started||v.currentTime>=SOURCE_DURATION-.05)v.currentTime=0;try{if(customAudio.current){customAudio.current.currentTime=v.currentTime;customAudio.current.muted=muted;await customAudio.current.play();v.muted=true;}else v.muted=muted;await v.play();setError('');}catch{setError('Pulsa reproducir para iniciar el video y su audio.');}},[ready,started,muted]);
  const seek=(value:number|readonly number[])=>{const t=typeof value==='number'?value:value[0];if(video.current){video.current.currentTime=Math.min(t,SOURCE_DURATION-.01);setStarted(true);setTime(t);}};
  const toggleSound=useCallback(()=>{const next=!muted;setMuted(next);if(customAudio.current)customAudio.current.muted=next;else if(video.current)video.current.muted=next;},[muted]);
  const compare=()=>{const next=!original;setOriginal(next);enabledRef.current=!next;if(video.current)compositor.current?.draw(video.current.currentTime,!next);};
  const fullscreen=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await screen.current?.requestFullscreen();}catch{setError('La pantalla completa no está disponible en este navegador.');}};
  useEffect(()=>{const key=(e:KeyboardEvent)=>{if((e.target as HTMLElement).closest('button,input,[role="slider"],a'))return;if(e.code==='Space'){e.preventDefault();void play();}if(e.key.toLowerCase()==='r')void play(true);if(e.key.toLowerCase()==='m')toggleSound();};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[play,toggleSound]);
  const upload=(file?:File)=>{if(!file)return;video.current?.pause();customAudio.current?.pause();if(customUrl.current)URL.revokeObjectURL(customUrl.current);customUrl.current=URL.createObjectURL(file);const audio=new Audio(customUrl.current);audio.onerror=()=>setError('No se pudo leer este archivo de audio. Prueba MP3, WAV o M4A.');customAudio.current=audio;setTrackName(file.name);setStarted(false);};
  return <main className="cinema" ref={screen}>
    <header className="cinema-header"><div className="lockup"><span>SILICON VALLEY</span><span className="times">×</span><img src="/assets/fintoc-logo-white.svg" alt="Fintoc" width="102" height="24"/></div><span className="edition">EDICIÓN FINTOC</span></header>
    <div className="film-space"><section className="film" aria-label="Intro original de Silicon Valley con Fintoc integrado">
      <video className="source-video" ref={video} src="/media/silicon-valley-original.mp4" playsInline preload="auto" aria-hidden="true" onError={()=>setError('No se pudo cargar el video. Recarga la página para volver a intentarlo.')}/>
      <canvas ref={canvas} aria-label="Intro de Silicon Valley con Fintoc integrado en la ciudad"/>
      {!ready&&!error&&<div className="loading"><LoaderCircle className="spin" size={22}/><span>Cargando intro…</span></div>}
      {original&&<span className="original-badge">ORIGINAL</span>}
    </section></div>
    <footer className="controls">
      <div className="timeline"><Slider min={0} max={SOURCE_DURATION} step={1/SOURCE_FPS} value={[time]} onValueChange={seek} aria-label="Posición de la intro" disabled={!ready}/></div>
      <div className="controls-row"><div className="transport"><button className="play-button" disabled={!ready} onClick={()=>void play()} aria-label={playing?'Pausar intro':'Reproducir intro'}>{!ready?<LoaderCircle className="spin" size={16}/>:playing?<Pause size={17} fill="currentColor"/>:<Play size={17} fill="currentColor"/>}<span>{playing?'Pausar':'Reproducir'}</span></button><button className="icon-button" onClick={()=>void play(true)} disabled={!ready} aria-label="Repetir intro" title="Repetir (R)"><RotateCcw size={19}/></button><span className="time">{fmt(time)} <i>/ 00:11</i></span></div>
      <div className="extras"><button className={`compare ${original?'active':''}`} onClick={compare} aria-pressed={original}><Columns2 size={16}/><span>{original?'Volver a Fintoc':'Ver original'}</span></button><span className="separator"/><button className="icon-button" onClick={toggleSound} aria-label={muted?'Activar música original':'Silenciar música'} title={muted?'Activar sonido (M)':'Silenciar (M)'}>{muted?<VolumeX size={20}/>:<Volume2 size={20}/>}</button><button className="icon-button" onClick={fullscreen} aria-label={full?'Salir de pantalla completa':'Pantalla completa'} title="Pantalla completa">{full?<Minimize2 size={19}/>:<Maximize2 size={19}/>}</button></div></div>
      <div className="credits"><a href="https://www.yuco.com/works/silicon-valley" target="_blank" rel="noreferrer">Secuencia original: HBO / yU+co <span>·</span> Música: TOBACCO</a><button onClick={()=>fileInput.current?.click()} title={trackName||'Cargar otro archivo de audio'}><Upload size={12}/>{trackName||'Cargar audio'}</button></div>
    </footer>
    <input className="hidden" ref={fileInput} type="file" accept="audio/*,.mp3,.m4a,.wav,.ogg" onChange={e=>upload(e.target.files?.[0])} aria-label="Cargar archivo de audio"/>
    {error&&<div className="notice" role="alert"><span>{error}</span><button onClick={()=>setError('')}>Cerrar</button></div>}
  </main>;
}
