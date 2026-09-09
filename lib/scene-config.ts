export type BuildingConfig = {
  id: string;
  name: string;
  x: number;
  z: number;
  width: number;
  depth: number;
  height: number;
  color: string;
  visible: boolean;
};
export type ValleyConfig = {
  version: 3;
  palette: {
    grass: string;
    asphalt: string;
    facade: string;
    title: string;
    fintoc: string;
  };
  camera: { azimuth: number; elevation: number; zoom: number };
  lighting: {
    sun: number;
    ambient: number;
    exposure: number;
    occlusion: number;
    elevation: number;
    timeLapse: number;
    shutter: number;
    haze: number;
  };
  title: [string, string];
  buildings: BuildingConfig[];
};
export const FILM_DURATION = 10.9;
export const DEFAULT_CONFIG: ValleyConfig = {
  version: 3,
  palette: {
    grass: '#456d16',
    asphalt: '#292a27',
    facade: '#e4d9c8',
    title: '#ee172b',
    fintoc: '#ffffff',
  },
  camera: { azimuth: 46, elevation: 27, zoom: 1 },
  lighting: {
    sun: 4.1,
    ambient: 0.28,
    exposure: 1.12,
    occlusion: 1.6,
    elevation: 40,
    timeLapse: 1,
    shutter: 0.8,
    haze: 0.18,
  },
  title: ['SILICON', 'VALLEY'],
  buildings: [
    {
      id: 'fintoc',
      name: 'Sede Fintoc',
      x: 14,
      z: -13,
      width: 19,
      depth: 14,
      height: 20,
      color: '#e6ddce',
      visible: true,
    },
    {
      id: 'startup',
      name: 'Oficina en expansión',
      x: -14,
      z: 116,
      width: 22,
      depth: 16,
      height: 11,
      color: '#e5dccb',
      visible: true,
    },
    {
      id: 'yahoo',
      name: 'NVIDIA',
      x: -12,
      z: -40,
      width: 23,
      depth: 17,
      height: 16,
      color: '#ded8ca',
      visible: true,
    },
    {
      id: 'hooli',
      name: 'Anthropic',
      x: 30,
      z: -40,
      width: 21,
      depth: 16,
      height: 12,
      color: '#d7c9b8',
      visible: true,
    },
    {
      id: 'hp',
      name: 'HP · helipuerto',
      x: 64,
      z: 12,
      width: 23,
      depth: 18,
      height: 14,
      color: '#e5d9c5',
      visible: true,
    },
    {
      id: 'google',
      name: 'Google · Blogger',
      x: -28,
      z: 50,
      width: 23,
      depth: 17,
      height: 7,
      color: '#e7dccb',
      visible: true,
    },
    {
      id: 'youtube',
      name: 'YouTube',
      x: -62,
      z: 49,
      width: 20,
      depth: 16,
      height: 9,
      color: '#e8e0d0',
      visible: true,
    },
    {
      id: 'twitter',
      name: 'Twitter → SpaceX',
      x: 4,
      z: 55,
      width: 20,
      depth: 15,
      height: 9,
      color: '#e6dac9',
      visible: true,
    },
    {
      id: 'campus',
      name: 'OpenAI · campus oeste',
      x: -65,
      z: 10,
      width: 19,
      depth: 17,
      height: 7,
      color: '#e1d4bf',
      visible: true,
    },
    {
      id: 'office',
      name: 'Yahoo',
      x: 65,
      z: -16,
      width: 20,
      depth: 16,
      height: 11,
      color: '#ded7c7',
      visible: true,
    },
  ],
};
export const freshConfig = (): ValleyConfig => structuredClone(DEFAULT_CONFIG);
export function readConfig(value: unknown): ValleyConfig {
  const v = value as Omit<Partial<ValleyConfig>, 'version'> & {
    version?: number;
  };
  if (
    !v ||
    (v.version !== 1 && v.version !== 2 && v.version !== 3) ||
    !v.palette ||
    !v.camera ||
    !Array.isArray(v.buildings) ||
    !Array.isArray(v.title) ||
    v.title.length !== 2
  )
    throw new Error('Este archivo no es un proyecto de Fintoc Valley.');
  const c = freshConfig(),
    number = (x: unknown, min: number, max: number) =>
      typeof x === 'number' && Number.isFinite(x)
        ? Math.max(min, Math.min(max, x))
        : undefined;
  for (const key of Object.keys(
    c.palette,
  ) as (keyof ValleyConfig['palette'])[]) {
    const col = v.palette[key];
    if (typeof col === 'string' && /^#[0-9a-f]{6}$/i.test(col))
      c.palette[key] = col;
  }
  // Upgrade previous default identities once; retain custom panel colors.
  if (
    v.version < 3 &&
    ['#10191e', '#080808'].includes(c.palette.fintoc.toLowerCase())
  )
    c.palette.fintoc = '#ffffff';
  for (const key of ['azimuth', 'elevation', 'zoom'] as const)
    c.camera[key] =
      number(
        v.camera[key],
        key === 'zoom' ? 0.5 : key === 'elevation' ? 15 : 0,
        key === 'zoom' ? 2 : key === 'elevation' ? 75 : 360,
      ) ?? c.camera[key];
  if (v.lighting)
    for (const key of [
      'sun',
      'ambient',
      'exposure',
      'occlusion',
      'elevation',
      'timeLapse',
      'shutter',
      'haze',
    ] as const)
      c.lighting[key] =
        number(
          v.lighting[key],
          key === 'elevation' ? 15 : 0,
          key === 'elevation'
            ? 80
            : key === 'exposure'
              ? 2
              : key === 'timeLapse' || key === 'shutter' || key === 'haze'
                ? 1
                : 6,
        ) ?? c.lighting[key];
  // Migrate the previous shot calibration without discarding the user's edits.
  if (v.version === 1) {
    c.camera.azimuth = (c.camera.azimuth + 10) % 360;
    c.camera.elevation = Math.max(15, Math.min(75, c.camera.elevation - 9));
    c.lighting.sun = Math.min(6, c.lighting.sun * (4.1 / 3.6));
    c.lighting.ambient *= 0.28 / 0.45;
    c.lighting.exposure = Math.min(2, c.lighting.exposure * (1.12 / 1.08));
  }
  c.title = v.title.map((s) => String(s).slice(0, 12).toUpperCase()) as [
    string,
    string,
  ];
  for (const b of c.buildings) {
    const input = v.buildings.find((x: BuildingConfig) => x.id === b.id);
    if (!input) continue;
    for (const key of ['x', 'z', 'width', 'depth', 'height'] as const)
      b[key] =
        number(
          input[key],
          key === 'x' || key === 'z' ? -120 : 3,
          key === 'x' || key === 'z' ? 120 : 45,
        ) ?? b[key];
    if (typeof input.color === 'string' && /^#[0-9a-f]{6}$/i.test(input.color))
      b.color = input.color;
    if (typeof input.visible === 'boolean') b.visible = input.visible;
    // Restore office defaults from the previous oversized NVIDIA treatment.
    if (b.id === 'yahoo' && input.name === 'NVIDIA · megacampus') {
      if (input.width === 32) b.width = 23;
      if (input.height === 20) b.height = 16;
      if (input.color === '#25332f') b.color = '#ded8ca';
    }
  }
  return c;
}
