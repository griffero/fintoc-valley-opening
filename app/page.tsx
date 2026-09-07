'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Maximize2, Minimize2, X, ArrowUpRight, Music2, LoaderCircle } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import type { createValley } from '@/lib/valley-scene';
import './valley.css';

type YTPlayer = { playVideo:()=>void; pauseVideo:()=>void; seekTo:(n:number,allow:boolean)=>void; getCurrentTime:()=>number; destroy:()=>void; mute:()=>void; unMute:()=>void };
type YTWindow = Window & { YT?: { Player: new (id:string,config:object)=>YTPlayer }; onYouTubeIframeAPIReady?:()=>void };
const DURATION=12;
const fmt=(t:number)=>`00:${Math.floor(t).toString().padStart(2,'0')}`;

export default function Home(){
  const host=useRef<HTMLDivElement>(null);
  const stage=useRef<HTMLElement>(null);
  const valley=useRef<ReturnType<typeof createValley>|null>(null);
  const player=useRef<YTPlayer|null>(null);
  const clock=useRef({time:0,playing:false,started:false,sound:true,ytReady:false,waiting:false});
  const [ready,setReady]=useState(false);
  const [error,setError]=useState('');
  const [playing,setPlaying]=useState(false);
  const [started,setStarted]=useState(false);
  const [time,setTime]=useState(0);
  const [sound,setSound]=useState(true);
  const [waiting,setWaiting]=useState(false);
  const [showPlayer,setShowPlayer]=useState(false);
  const [audioError,setAudioError]=useState('');
  const [full,setFull]=useState(false);
  const waitTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const localAudio=useRef<HTMLAudioElement|null>(null);
  const localAudioUrl=useRef<string|null>(null);
  const [localTrack,setLocalTrack]=useState('');
  const fileInput=useRef<HTMLInputElement>(null);
  const pause=useCallback(()=>{clock.current.playing=false;clock.current.waiting=false;setPlaying(false);setWaiting(false);player.current?.pauseVideo();localAudio.current?.pause();if(waitTimer.current)clearTimeout(waitTimer.current);},[]);
  const begin=useCallback(()=>{clock.current.playing=true;clock.current.started=true;clock.current.waiting=false;setPlaying(true);setStarted(true);setWaiting(false);setAudioError('');if(waitTimer.current)clearTimeout(waitTimer.current);},[]);
  useEffect(()=>{
    let cancelled=false,frame=0,previous=0,lastUpdate=0;
    import('@/lib/valley-scene').then(({createValley})=>{
      if(cancelled||!host.current)return;
      try{valley.current=createValley(host.current);valley.current.ready.then(()=>{if(!cancelled)setReady(true);});}
      catch(e){setError('No se pudo iniciar la animación 3D. Activa la aceleración gráfica del navegador y recarga la página.');console.error(e);return;}
      function animate(now:number){if(cancelled)return;const delta=previous?Math.min((now-previous)/1000,.08):0;previous=now;const c=clock.current;
        if(c.playing){
          if(c.sound&&localAudio.current)c.time=localAudio.current.currentTime;
          else if(c.sound&&player.current&&c.ytReady)c.time=player.current.getCurrentTime();
          else c.time+=delta;
          if(c.time>=DURATION){c.time=DURATION;c.playing=false;setPlaying(false);player.current?.pauseVideo();localAudio.current?.pause();}
        }
        valley.current?.render(c.started?c.time:9.2,!c.started);
        if(now-lastUpdate>50){setTime(c.time);lastUpdate=now;}
        frame=requestAnimationFrame(animate);
      }
      frame=requestAnimationFrame(animate);
    }).catch(()=>setError('La animación no terminó de cargar. Recarga la página para volver a intentarlo.'));
    const onFull=()=>setFull(Boolean(document.fullscreenElement));document.addEventListener('fullscreenchange',onFull);
    return()=>{cancelled=true;cancelAnimationFrame(frame);valley.current?.dispose();valley.current=null;player.current?.destroy();localAudio.current?.pause();if(localAudioUrl.current)URL.revokeObjectURL(localAudioUrl.current);if(waitTimer.current)clearTimeout(waitTimer.current);document.removeEventListener('fullscreenchange',onFull);};
  },[]);
  const startYouTube=useCallback(()=>{
    setShowPlayer(true);clock.current.waiting=true;setWaiting(true);setAudioError('');
    const boot=()=>{
      const win=window as YTWindow;
      if(player.current&&clock.current.ytReady){player.current.seekTo(clock.current.time,true);player.current.unMute();player.current.playVideo();return;}
      if(!win.YT?.Player)return;
      player.current=new win.YT.Player('hbo-player',{
        width:320,height:200,videoId:'DNp1ullIXP4',
        playerVars:{playsinline:1,controls:1,rel:0,origin:window.location.origin},
        events:{
          onReady:()=>{clock.current.ytReady=true;if(clock.current.waiting){player.current?.seekTo(clock.current.time,true);player.current?.playVideo();}},
          onStateChange:(event:{data:number})=>{
            if(!clock.current.sound||localAudio.current)return;
            if(event.data===1)begin();
            if(event.data===2){clock.current.playing=false;setPlaying(false);}
            if(event.data===0){clock.current.playing=false;setPlaying(false);}
          },
          onError:()=>{pause();setAudioError('YouTube no permite reproducir este video aquí. Puedes cargar tu audio o ver la intro sin sonido.');}
        }
      });
    };
    // Keep HBO's official player visible while it supplies the soundtrack.
    window.setTimeout(()=>{const win=window as YTWindow;if(win.YT?.Player)boot();else{win.onYouTubeIframeAPIReady=boot;if(!document.querySelector('script[data-youtube-api]')){const script=document.createElement('script');script.src='https://www.youtube.com/iframe_api';script.dataset.youtubeApi='true';script.onerror=()=>{pause();setAudioError('No se pudo conectar con YouTube. Puedes cargar tu audio o reproducir sin sonido.');};document.head.appendChild(script);}}},80);
    waitTimer.current=setTimeout(()=>{if(clock.current.waiting)setAudioError('Si la música no comienza, pulsa reproducir en el video de HBO o continúa sin sonido.');},8000);
  },[begin,pause]);
  const play=useCallback(()=>{
    if(!ready)return;
    if(clock.current.playing||clock.current.waiting){pause();return;}
    if(clock.current.time>=DURATION-.05)clock.current.time=0;
    if(!clock.current.sound){begin();return;}
    if(localAudio.current){localAudio.current.currentTime=clock.current.time;void localAudio.current.play().then(begin).catch(()=>setAudioError('No se pudo reproducir el archivo de audio. Prueba otro archivo.'));return;}
    startYouTube();
  },[ready,pause,begin,startYouTube]);
  const silent=useCallback(()=>{player.current?.pauseVideo();localAudio.current?.pause();clock.current.sound=false;setSound(false);setShowPlayer(false);begin();},[begin]);
  const replay=useCallback(()=>{pause();clock.current.time=0;setTime(0);if(clock.current.sound){if(localAudio.current){localAudio.current.currentTime=0;void localAudio.current.play().then(begin);}else startYouTube();}else begin();},[pause,begin,startYouTube]);
  const seek=useCallback((value:number|readonly number[])=>{const t=typeof value==='number'?value:value[0];clock.current.time=t;clock.current.started=true;setStarted(true);setTime(t);if(localAudio.current)localAudio.current.currentTime=t;else if(clock.current.ytReady)player.current?.seekTo(t,true);},[]);
  const toggleSound=()=>{const next=!clock.current.sound;clock.current.sound=next;setSound(next);if(!next){player.current?.pauseVideo();localAudio.current?.pause();setShowPlayer(false);if(clock.current.waiting)begin();}else if(clock.current.playing){pause();if(localAudio.current){localAudio.current.currentTime=clock.current.time;void localAudio.current.play().then(begin);}else startYouTube();}};
  const fullscreen=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await stage.current?.requestFullscreen();}catch{setFull(false);}};
  useEffect(()=>{const key=(e:KeyboardEvent)=>{if((e.target as HTMLElement).closest('button,input,[role="slider"],a'))return;if(e.code==='Space'){e.preventDefault();play();}if(e.key.toLowerCase()==='r')replay();if(e.key.toLowerCase()==='m')document.getElementById('sound-toggle')?.click();};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[play,replay]);
  const uploadAudio=(file?:File)=>{if(!file)return;pause();if(localAudioUrl.current)URL.revokeObjectURL(localAudioUrl.current);localAudioUrl.current=URL.createObjectURL(file);const audio=new Audio(localAudioUrl.current);audio.onerror=()=>setAudioError('Este archivo no se puede leer. Usa MP3, WAV, M4A u OGG.');audio.onended=()=>{clock.current.playing=false;setPlaying(false);};localAudio.current=audio;setLocalTrack(file.name);setSound(true);clock.current.sound=true;setShowPlayer(false);setAudioError('');clock.current.time=0;setTime(0);};
  const chapter=time<4.1?'01 / EL VALLE':time<6.3?'02 / FINT0C CRECE':time<9.5?'03 / TODO SE CONECTA':'04 / FINT0C VALLEY';
  const finalOpacity=started?Math.max(0,Math.min(1,(time-9.7)/1.0)):0;
  return <main className="screen" ref={stage}>
    <header className="topbar">
      <div className="brand-lockup"><img src="/assets/fintoc-logo-white.svg" width="97" height="28" alt="Fintoc"/><span className="slash">/</span><span className="edition">SILICON VALLEY EDITION</span></div>
      <div className="header-right"><span className="status-dot"/><span>OPENING SEQUENCE</span><span className="take">TAKE 01</span></div>
    </header>
    <section className="film" aria-label="Intro de Silicon Valley con Fintoc">
      <div className="canvas-host" ref={host}/>
      <div className="film-grain"/>
      <div className="film-top"><span>SILICON VALLEY <span className="multiply">×</span> FINT0C</span><span className="coordinates">37°23′ N &nbsp; 122°05′ W</span></div>
      {!ready&&!error&&<div className="loading"><LoaderCircle className="spin" size={24}/><span>Construyendo el valle…</span></div>}
      {error&&<div className="scene-error" role="alert">{error}<button onClick={()=>window.location.reload()}>Volver a intentar</button></div>}
      {ready&&!started&&!waiting&&<div className="opening-cue"><span className="cue-rule"/><span>EL VALLE TIENE UN NUEVO PROTAGONISTA</span></div>}
      <div className="final-title" style={{opacity:finalOpacity,transform:`translateY(${(1-finalOpacity)*25}px)`}} aria-hidden={finalOpacity<.5}><span className="title-small">WELCOME TO</span><h1>SILICON<br/>VALLEY<span className="title-period">.</span></h1><div className="title-brand"><span>POWERED BY</span><img src="/assets/fintoc-logo-black.svg" alt="Fintoc"/></div></div>
      <div className="film-bottom"><span>{started?chapter:'UNA INTRO. UN NUEVO PROTAGONISTA.'}</span><span className="frame-number">{Math.floor(time*24).toString().padStart(4,'0')} <i>/ 0288</i></span></div>
      {showPlayer&&<aside className="soundtrack-panel" aria-label="Reproductor de la música original"><div className="soundtrack-heading"><Music2 size={14}/><span>INTRO ORIGINAL · HBO</span><button title="Cerrar y silenciar música" aria-label="Cerrar y silenciar música" onClick={()=>{pause();clock.current.sound=false;setSound(false);setShowPlayer(false);}}><X size={15}/></button></div><div id="hbo-player"/><p>“Stretch Your Face” · TOBACCO</p></aside>}
    </section>
    <footer className="player-controls">
      <div className="transport">
        <button className="play-button" onClick={play} disabled={!ready||Boolean(error)} aria-label={playing?'Pausar intro':waiting?'Cancelar carga de música':'Reproducir intro'}>{waiting?<LoaderCircle size={18} className="spin"/>:playing?<Pause size={18} fill="currentColor"/>:<Play size={18} fill="currentColor"/>}<span>{waiting?'Conectando audio':playing?'Pausar':'Reproducir intro'}</span></button>
        <button className="icon-button" onClick={replay} disabled={!ready} title="Repetir (R)" aria-label="Repetir intro"><RotateCcw size={19}/></button>
        <span className="timer">{fmt(time)} <i>/ 00:12</i></span>
      </div>
      <div className="timeline"><Slider min={0} max={12} step={.01} value={[time]} onValueChange={seek} aria-label="Posición de la intro"/><div className="timeline-labels"><span>EL VALLE</span><span>FINT0C</span><span>EL FUTURO</span></div></div>
      <div className="right-controls"><button id="sound-toggle" className="icon-button" onClick={toggleSound} title={sound?'Silenciar (M)':'Activar música original (M)'} aria-label={sound?'Silenciar música':'Activar música original'}>{sound?<Volume2 size={20}/>:<VolumeX size={20}/>}</button><button className="icon-button" onClick={fullscreen} aria-label={full?'Salir de pantalla completa':'Pantalla completa'} title="Pantalla completa">{full?<Minimize2 size={19}/>:<Maximize2 size={19}/>}</button></div>
    </footer>
    <div className="caption-row"><p><span className="blue-dot"/> Una pequeña ciudad. Un gran movimiento.</p><div><button onClick={()=>fileInput.current?.click()} className="audio-upload">{localTrack?`Audio: ${localTrack}`:'Cargar audio'}</button><span className="caption-divider">/</span><a href="https://www.youtube.com/watch?v=DNp1ullIXP4" target="_blank" rel="noreferrer">Referencia original <ArrowUpRight size={13}/></a></div></div>
    <input ref={fileInput} type="file" accept="audio/*,.mp3,.wav,.m4a,.ogg" className="hidden" onChange={e=>uploadAudio(e.target.files?.[0])} aria-label="Cargar archivo de audio"/>
    {audioError&&<div className="audio-notice" role="status"><p>{audioError}</p><button onClick={silent}>Reproducir sin sonido <Play size={13}/></button><button className="icon-button" onClick={()=>setAudioError('')} aria-label="Cerrar aviso"><X size={16}/></button></div>}
  </main>;
}
