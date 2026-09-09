'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  SlidersHorizontal,
  Download,
  Upload,
  Box,
  Orbit,
  Film,
  Check,
  LoaderCircle,
  Camera,
  ChevronDown,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import {
  freshConfig,
  readConfig,
  FILM_DURATION,
  type ValleyConfig,
  type BuildingConfig,
} from '@/lib/scene-config';
import type { createEditableValley } from '@/lib/editable-valley';
import './valley.css';
type Engine = Awaited<ReturnType<typeof createEditableValley>>;
const storageKey = 'fintoc-valley-3d-project-v1';
const fmt = (time: number) =>
  `${Math.floor(time).toString().padStart(2, '0')}:${Math.floor((time % 1) * 24)
    .toString()
    .padStart(2, '0')}`;
function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob),
    a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 15000);
}
function Range({
  label,
  value,
  min,
  max,
  step = 0.1,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="field-range">
      <span>
        {label}
        <output>{Number(value.toFixed(1))}</output>
      </span>
      <Slider
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={(v) => onChange(typeof v === 'number' ? v : v[0])}
      />
    </label>
  );
}
export default function Home() {
  const stage = useRef<HTMLDivElement>(null),
    screen = useRef<HTMLElement>(null),
    audio = useRef<HTMLAudioElement>(null),
    projectInput = useRef<HTMLInputElement>(null),
    soundInput = useRef<HTMLInputElement>(null),
    engine = useRef<Engine | null>(null);
  const [config, setConfig] = useState<ValleyConfig>(freshConfig),
    configRef = useRef(config),
    [ready, setReady] = useState(false),
    [playing, setPlaying] = useState(false),
    [time, setTime] = useState(FILM_DURATION),
    [muted, setMuted] = useState(false),
    [editor, setEditor] = useState(true),
    [free, setFree] = useState(false),
    [selected, setSelected] = useState('fintoc'),
    [section, setSection] = useState('objects'),
    [notice, setNotice] = useState(''),
    [busy, setBusy] = useState(false),
    [audioName, setAudioName] = useState('Música original');
  const current = useRef(FILM_DURATION),
    playRef = useRef(false),
    freeRef = useRef(false),
    last = useRef(0),
    lastRendered = useRef(-1),
    lastFreeDraw = useRef(0),
    audioUrl = useRef<string | null>(null);
  useEffect(() => {
    let canceled = false,
      raf = 0;
    let initial = freshConfig();
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) initial = readConfig(JSON.parse(saved));
    } catch {}
    configRef.current = initial;
    setConfig(initial);
    import('@/lib/editable-valley')
      .then(async (m) => {
        const e = await m.createEditableValley(stage.current!, initial);
        if (canceled) {
          e.dispose();
          return;
        }
        engine.current = e;
        e.onSelect((id) => {
          setSelected(id);
          setSection('objects');
          setEditor(true);
          e.select(id, true);
        });
        setReady(true);
        e.render(FILM_DURATION);
      })
      .catch(() =>
        setNotice(
          'No se pudo iniciar el render 3D. Recarga la página para volver a intentarlo.',
        ),
      );
    const frame = (now: number) => {
      const dt = Math.min(0.08, (now - last.current) / 1000);
      last.current = now;
      if (playRef.current) {
        current.current = Math.min(FILM_DURATION, current.current + dt);
        if (
          audio.current &&
          !audio.current.paused &&
          Number.isFinite(audio.current.currentTime)
        )
          current.current = Math.min(FILM_DURATION, audio.current.currentTime);
        if (current.current >= FILM_DURATION - 0.01) {
          current.current = FILM_DURATION;
          playRef.current = false;
          setPlaying(false);
          audio.current?.pause();
        }
        if (
          Math.floor(current.current * 24) !== lastRendered.current ||
          current.current === FILM_DURATION
        ) {
          lastRendered.current = Math.floor(current.current * 24);
          setTime(current.current);
          engine.current?.render(current.current);
        }
      } else if (freeRef.current && now - lastFreeDraw.current > 30) {
        lastFreeDraw.current = now;
        engine.current?.render(current.current);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      canceled = true;
      cancelAnimationFrame(raf);
      audio.current?.pause();
      engine.current?.dispose();
      engine.current = null;
      if (audioUrl.current) URL.revokeObjectURL(audioUrl.current);
    };
  }, []);
  useEffect(() => {
    configRef.current = config;
    if (ready) {
      engine.current?.updateConfig(config);
      try {
        localStorage.setItem(storageKey, JSON.stringify(config));
      } catch {}
    }
  }, [config, ready]);
  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(''), 6500);
    return () => clearTimeout(id);
  }, [notice]);
  const seek = (value: number | readonly number[]) => {
    const t = typeof value === 'number' ? value : value[0];
    current.current = t;
    setTime(t);
    if (audio.current) audio.current.currentTime = t;
    engine.current?.render(t);
  };
  const toggleFree = () => {
    const next = !free;
    freeRef.current = next;
    setFree(next);
    engine.current?.setFreeCamera(next);
    if (next) {
      playRef.current = false;
      setPlaying(false);
      audio.current?.pause();
      current.current = FILM_DURATION;
      setTime(FILM_DURATION);
      engine.current?.render(FILM_DURATION);
    }
  };
  const play = useCallback(
    async (restart = false) => {
      if (!ready) return;
      if (playRef.current && !restart) {
        playRef.current = false;
        setPlaying(false);
        audio.current?.pause();
        return;
      }
      if (freeRef.current) {
        freeRef.current = false;
        setFree(false);
        engine.current?.setFreeCamera(false);
      }
      if (restart || current.current >= FILM_DURATION - 0.02) {
        current.current = 0;
        setTime(0);
      }
      engine.current?.select(selected, false);
      if (audio.current) {
        audio.current.currentTime = current.current;
        try {
          await audio.current.play();
        } catch {
          setNotice(
            'El render se reproducirá sin audio. Puedes cargar una pista desde el editor.',
          );
        }
      }
      last.current = performance.now();
      playRef.current = true;
      setPlaying(true);
    },
    [ready, selected],
  );
  const toggleMute = useCallback(() => setMuted((v) => !v), []);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        (e.target as HTMLElement).closest('input,button,select,[role="slider"]')
      )
        return;
      if (e.code === 'Space') {
        e.preventDefault();
        void play();
      }
      if (e.key.toLowerCase() === 'r') void play(true);
      if (e.key.toLowerCase() === 'm') toggleMute();
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [play, toggleMute]);
  const updateBuilding = (patch: Partial<BuildingConfig>) =>
    setConfig((c) => ({
      ...c,
      buildings: c.buildings.map((b) =>
        b.id === selected ? { ...b, ...patch } : b,
      ),
    }));
  const selectBuilding = (id: string) => {
    setSelected(id);
    engine.current?.select(id, true);
  };
  const saveProject = () => {
    download(
      new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' }),
      'fintoc-valley-project.json',
    );
    setNotice(
      'Proyecto guardado. Puedes abrir este archivo para seguir editándolo.',
    );
  };
  const importProject = async (file?: File) => {
    if (!file) return;
    try {
      if (file.size > 1000000)
        throw new Error('El archivo es demasiado grande.');
      const c = readConfig(JSON.parse(await file.text()));
      setConfig(c);
      setNotice('Proyecto cargado.');
    } catch (e) {
      setNotice(
        e instanceof Error ? e.message : 'No se pudo abrir el proyecto.',
      );
    }
    if (projectInput.current) projectInput.current.value = '';
  };
  const exportModel = async () => {
    if (!engine.current || busy) return;
    setBusy(true);
    playRef.current = false;
    setPlaying(false);
    audio.current?.pause();
    try {
      const blob = await engine.current.exportGLB();
      download(blob, 'fintoc-valley.glb');
      setNotice(
        'Modelo 3D exportado. Puedes abrirlo en Blender y otros editores compatibles con GLB.',
      );
    } catch {
      setNotice('No se pudo exportar el modelo. Intenta nuevamente.');
    } finally {
      setBusy(false);
    }
  };
  const exportFrame = () => {
    const data = engine.current?.snapshot();
    if (!data) return;
    const a = document.createElement('a');
    a.href = data;
    a.download = 'fintoc-valley-frame.png';
    a.click();
    setNotice('Fotograma exportado.');
  };
  const loadAudio = (file?: File) => {
    if (!file || !audio.current) return;
    audio.current.pause();
    playRef.current = false;
    setPlaying(false);
    if (audioUrl.current) URL.revokeObjectURL(audioUrl.current);
    audioUrl.current = URL.createObjectURL(file);
    audio.current.src = audioUrl.current;
    setAudioName(file.name);
  };
  const b = config.buildings.find((b) => b.id === selected)!;
  return (
    <main className={`studio ${editor ? 'with-editor' : ''}`} ref={screen}>
      <header className="studio-header">
        <div className="brand">
          <span>SILICON VALLEY</span>
          <span className="brand-cross">×</span>
          <img
            src="/assets/fintoc-logo-white.svg"
            alt="Fintoc"
            width="91"
            height="20"
          />
        </div>
        <div className="header-tools">
          <span className="live-badge">
            <span />
            3D en tiempo real
          </span>
          <button
            className={`header-button ${editor ? 'active' : ''}`}
            onClick={() => setEditor(!editor)}
          >
            <SlidersHorizontal size={15} />
            <span>Editor</span>
          </button>
          <button
            className="header-button"
            onClick={() => projectInput.current?.click()}
          >
            <Upload size={15} />
            <span>Abrir proyecto</span>
          </button>
          <button className="save-button" onClick={saveProject}>
            <Download size={15} />
            <span>Guardar proyecto</span>
          </button>
        </div>
      </header>
      <div className="workspace">
        <div className="preview-column">
          <div className="viewport-area">
            <div className="viewport-frame">
              <div className="render-stage" ref={stage} />
              {!ready && (
                <div className="render-loading">
                  <LoaderCircle className="spin" size={23} />
                  <span>Construyendo la ciudad…</span>
                </div>
              )}
              <div className="viewport-top">
                <span className="view-label">
                  <Box size={12} />
                  {free ? 'PERSPECTIVA LIBRE' : 'CÁMARA DE LA INTRO'}
                </span>
                <button
                  className={`orbit-button ${free ? 'active' : ''}`}
                  disabled={!ready}
                  onClick={toggleFree}
                >
                  {free ? <Film size={15} /> : <Orbit size={15} />}
                  <span>{free ? 'Volver a la intro' : 'Explorar en 3D'}</span>
                </button>
              </div>
              {free && (
                <span className="orbit-hint">
                  Arrastra para girar · Scroll para acercar · Clic en una sede
                  para editar
                </span>
              )}
            </div>
          </div>
          <div className="transport-panel">
            <div className="timeline-ruler">
              <span>00</span>
              <span>02</span>
              <span>04</span>
              <span>06</span>
              <span>08</span>
              <span>10</span>
            </div>
            <Slider
              aria-label="Posición de la intro"
              min={0}
              max={FILM_DURATION}
              step={1 / 24}
              value={[time]}
              onValueChange={seek}
              disabled={!ready}
            />
            <div className="transport-row">
              <div className="transport">
                <button
                  className="play-button"
                  onClick={() => void play()}
                  disabled={!ready}
                  aria-label={playing ? 'Pausar intro' : 'Reproducir intro'}
                >
                  {playing ? (
                    <Pause size={15} fill="currentColor" />
                  ) : (
                    <Play size={15} fill="currentColor" />
                  )}
                  {playing ? 'Pausar' : 'Reproducir'}
                </button>
                <button
                  className="icon-button"
                  onClick={() => void play(true)}
                  aria-label="Repetir intro"
                >
                  <RotateCcw size={18} />
                </button>
                <span className="timecode">
                  {fmt(time)}
                  <span> / 10:21</span>
                </span>
              </div>
              <div className="transport">
                <button
                  className="icon-button"
                  onClick={toggleMute}
                  aria-label={muted ? 'Activar música' : 'Silenciar música'}
                >
                  {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
                <button
                  className="icon-button"
                  onClick={exportFrame}
                  aria-label="Exportar fotograma"
                  title="Exportar fotograma"
                >
                  <Camera size={18} />
                </button>
                <button
                  className="icon-button"
                  onClick={() => {
                    if (document.fullscreenElement)
                      void document.exitFullscreen();
                    else void screen.current?.requestFullscreen();
                  }}
                  aria-label="Pantalla completa"
                >
                  <Maximize2 size={18} />
                </button>
              </div>
            </div>
          </div>
          <div className="studio-status">
            <span>
              <span className="status-dot" />
              Escena editable · 24 fps
            </span>
            <span>
              {ready
                ? 'Cambios guardados en este navegador'
                : 'Cargando geometría'}
            </span>
          </div>
        </div>
        {editor && (
          <aside className="inspector">
            <div className="inspector-heading">
              <span>PROYECTO</span>
              <span>01</span>
            </div>
            <div className="inspector-tabs">
              {[
                ['objects', 'Objetos'],
                ['camera', 'Cámara'],
                ['look', 'Colores'],
                ['light', 'Luz'],
              ].map(([key, label]) => (
                <button
                  key={key}
                  className={section === key ? 'active' : ''}
                  onClick={() => setSection(key)}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="inspector-body">
              {section === 'objects' && (
                <>
                  <label className="select-label">
                    Edificio
                    <div className="select-wrap">
                      <select
                        value={selected}
                        onChange={(e) => selectBuilding(e.target.value)}
                      >
                        {config.buildings.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={14} />
                    </div>
                  </label>
                  <div className="object-card">
                    <Box size={23} />
                    <div>
                      <strong>{b.name}</strong>
                      <span>Edificio y letrero 3D</span>
                    </div>
                    <button
                      className="icon-button"
                      onClick={() => updateBuilding({ visible: !b.visible })}
                      aria-label={
                        b.visible ? 'Ocultar edificio' : 'Mostrar edificio'
                      }
                    >
                      {b.visible ? <Eye size={15} /> : <EyeOff size={15} />}
                    </button>
                  </div>
                  <p className="section-caption">TRANSFORMACIÓN</p>
                  <Range
                    label="Posición X"
                    value={b.x}
                    min={-100}
                    max={100}
                    step={1}
                    onChange={(x) => updateBuilding({ x })}
                  />
                  <Range
                    label="Posición Z"
                    value={b.z}
                    min={-100}
                    max={100}
                    step={1}
                    onChange={(z) => updateBuilding({ z })}
                  />
                  <Range
                    label="Altura"
                    value={b.height}
                    min={3}
                    max={40}
                    onChange={(height) => updateBuilding({ height })}
                  />
                  <Range
                    label="Ancho"
                    value={b.width}
                    min={5}
                    max={40}
                    onChange={(width) => updateBuilding({ width })}
                  />
                  <Range
                    label="Profundidad"
                    value={b.depth}
                    min={5}
                    max={35}
                    onChange={(depth) => updateBuilding({ depth })}
                  />
                  <label className="color-field">
                    <span>Fachada</span>
                    <span className="color-value">{b.color.toUpperCase()}</span>
                    <input
                      type="color"
                      aria-label="Color de la fachada seleccionada"
                      value={b.color}
                      onChange={(e) =>
                        updateBuilding({ color: e.target.value })
                      }
                    />
                  </label>
                  <p className="section-caption">TÍTULO DE LA CIUDAD</p>
                  {config.title.map((title, i) => (
                    <label className="text-field" key={i}>
                      <span>Línea {i + 1}</span>
                      <input
                        aria-label={`Título línea ${i + 1}`}
                        maxLength={12}
                        value={title}
                        onChange={(e) =>
                          setConfig((c) => ({
                            ...c,
                            title: c.title.map((v, j) =>
                              j === i ? e.target.value.toUpperCase() : v,
                            ) as [string, string],
                          }))
                        }
                      />
                    </label>
                  ))}
                </>
              )}
              {section === 'camera' && (
                <>
                  <div className="panel-intro">
                    <Camera size={22} />
                    <h2>Cámara de la intro</h2>
                    <p>
                      Ajusta el encuadre del recorrido. Usa “Explorar en 3D”
                      para moverte libremente.
                    </p>
                  </div>
                  <Range
                    label="Giro"
                    min={0}
                    max={360}
                    step={1}
                    value={config.camera.azimuth}
                    onChange={(azimuth) =>
                      setConfig((c) => ({
                        ...c,
                        camera: { ...c.camera, azimuth },
                      }))
                    }
                  />
                  <Range
                    label="Elevación"
                    min={15}
                    max={75}
                    step={1}
                    value={config.camera.elevation}
                    onChange={(elevation) =>
                      setConfig((c) => ({
                        ...c,
                        camera: { ...c.camera, elevation },
                      }))
                    }
                  />
                  <Range
                    label="Zoom"
                    min={0.5}
                    max={2}
                    step={0.05}
                    value={config.camera.zoom}
                    onChange={(zoom) =>
                      setConfig((c) => ({
                        ...c,
                        camera: { ...c.camera, zoom },
                      }))
                    }
                  />
                  <button className="wide-secondary" onClick={toggleFree}>
                    <Orbit size={16} />
                    {free ? 'Volver a la cámara animada' : 'Explorar el modelo'}
                  </button>
                </>
              )}
              {section === 'light' && (
                <>
                  <div className="panel-intro">
                    <h2>Iluminación</h2>
                    <p>
                      La luz alterna entre techos y fachadas durante el
                      timelapse. Ajusta su intensidad, las sombras, la neblina y
                      el movimiento.
                    </p>
                  </div>
                  <Range
                    label="Ciclos de luz"
                    min={0}
                    max={1}
                    step={0.05}
                    value={config.lighting.timeLapse}
                    onChange={(timeLapse) =>
                      setConfig((c) => ({
                        ...c,
                        lighting: { ...c.lighting, timeLapse },
                      }))
                    }
                  />
                  <Range
                    label="Desenfoque de movimiento"
                    min={0}
                    max={1}
                    step={0.05}
                    value={config.lighting.shutter}
                    onChange={(shutter) =>
                      setConfig((c) => ({
                        ...c,
                        lighting: { ...c.lighting, shutter },
                      }))
                    }
                  />
                  <Range
                    label="Luz del sol"
                    min={0}
                    max={6}
                    value={config.lighting.sun}
                    onChange={(sun) =>
                      setConfig((c) => ({
                        ...c,
                        lighting: { ...c.lighting, sun },
                      }))
                    }
                  />
                  <Range
                    label="Luz ambiental"
                    min={0}
                    max={3}
                    value={config.lighting.ambient}
                    onChange={(ambient) =>
                      setConfig((c) => ({
                        ...c,
                        lighting: { ...c.lighting, ambient },
                      }))
                    }
                  />
                  <Range
                    label="Exposición"
                    min={0.4}
                    max={1.8}
                    step={0.05}
                    value={config.lighting.exposure}
                    onChange={(exposure) =>
                      setConfig((c) => ({
                        ...c,
                        lighting: { ...c.lighting, exposure },
                      }))
                    }
                  />
                  <Range
                    label="Profundidad de sombras"
                    min={0}
                    max={3}
                    step={0.05}
                    value={config.lighting.occlusion}
                    onChange={(occlusion) =>
                      setConfig((c) => ({
                        ...c,
                        lighting: { ...c.lighting, occlusion },
                      }))
                    }
                  />
                  <Range
                    label="Neblina"
                    min={0}
                    max={1}
                    step={0.01}
                    value={config.lighting.haze}
                    onChange={(haze) =>
                      setConfig((c) => ({
                        ...c,
                        lighting: { ...c.lighting, haze },
                      }))
                    }
                  />
                  <Range
                    label="Altura del sol"
                    min={15}
                    max={75}
                    step={1}
                    value={config.lighting.elevation}
                    onChange={(elevation) =>
                      setConfig((c) => ({
                        ...c,
                        lighting: { ...c.lighting, elevation },
                      }))
                    }
                  />
                  <button
                    className="wide-secondary"
                    onClick={() =>
                      setConfig((c) => ({
                        ...c,
                        lighting: freshConfig().lighting,
                      }))
                    }
                  >
                    Luz de referencia
                  </button>
                </>
              )}
              {section === 'look' && (
                <>
                  <p className="section-caption">MATERIALES DE LA CIUDAD</p>
                  {(
                    [
                      ['grass', 'Vegetación'],
                      ['asphalt', 'Calles'],
                      ['facade', 'Edificios del entorno'],
                      ['title', 'Letras del título'],
                      ['fintoc', 'Logo Fintoc'],
                    ] as const
                  ).map(([key, label]) => (
                    <label className="color-field" key={key}>
                      <span>{label}</span>
                      <input
                        aria-label={label}
                        type="color"
                        value={config.palette[key]}
                        onChange={(e) =>
                          setConfig((c) => ({
                            ...c,
                            palette: { ...c.palette, [key]: e.target.value },
                          }))
                        }
                      />
                    </label>
                  ))}
                  <div className="audio-card">
                    <Volume2 size={18} />
                    <div>
                      <strong>Audio</strong>
                      <span>{audioName}</span>
                    </div>
                    <button onClick={() => soundInput.current?.click()}>
                      Cambiar
                    </button>
                  </div>
                  <p className="source-note">
                    Referencia visual:{' '}
                    <a
                      href="https://www.yuco.com/works/silicon-valley"
                      target="_blank"
                      rel="noreferrer"
                    >
                      HBO / yU+co
                    </a>
                    . Música original: TOBACCO.
                  </p>
                </>
              )}
            </div>
            <div className="inspector-footer">
              <button
                className="export-button"
                disabled={!ready || busy}
                onClick={() => void exportModel()}
              >
                {busy ? (
                  <LoaderCircle size={17} className="spin" />
                ) : (
                  <Box size={17} />
                )}
                <span>{busy ? 'Exportando…' : 'Exportar modelo 3D'}</span>
                <span className="file-type">GLB</span>
              </button>
              <button
                className="reset-button"
                onClick={() => {
                  setConfig(freshConfig());
                  setNotice('Diseño original restaurado.');
                }}
              >
                Restablecer diseño
              </button>
            </div>
          </aside>
        )}
      </div>
      <audio
        ref={audio}
        src="/media/opening-soundtrack.m4a"
        preload="auto"
        muted={muted}
      />
      <input
        className="hidden"
        type="file"
        accept="application/json,.json"
        ref={projectInput}
        onChange={(e) => void importProject(e.target.files?.[0])}
      />
      <input
        className="hidden"
        type="file"
        accept="audio/*"
        ref={soundInput}
        onChange={(e) => loadAudio(e.target.files?.[0])}
      />
      {notice && (
        <div className="notice" role="status">
          <Check size={16} />
          <span>{notice}</span>
          <button aria-label="Cerrar aviso" onClick={() => setNotice('')}>
            ×
          </button>
        </div>
      )}
    </main>
  );
}
