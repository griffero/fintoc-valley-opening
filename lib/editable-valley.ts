import * as THREE from 'three';
import { FontLoader, type Font } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { DEFAULT_CONFIG, type ValleyConfig } from './scene-config';

const smooth = (a: number, b: number, t: number) => {
  const p = THREE.MathUtils.clamp((t - a) / (b - a), 0, 1);
  return p * p * (3 - 2 * p);
};
const colors = {
  roof: '#ece2d3',
  glass: '#779294',
  darkGlass: '#596f72',
  curb: '#d5cbbb',
  trunk: '#746141',
};
type AnimatedBuilding = {
  group: THREE.Group;
  id: string;
  facade: THREE.MeshStandardMaterial;
  base: { width: number; depth: number; height: number };
};

/** Everything in the viewport is geometry. No video/image background is used. */
export async function createEditableValley(
  host: HTMLElement,
  initial: ValleyConfig,
) {
  const font = new FontLoader().parse(
    await fetch('/fonts/helvetiker_bold.typeface.json').then((r) => r.json()),
  );
  const titleFont = new FontLoader().parse(
    await fetch('/fonts/anton.typeface.json').then((r) => r.json()),
  );
  const assetNames = [
    'fintoc-logo',
    'google',
    'twitter-bird',
    'facebook-lettering',
    'youtube-2013',
    'yahoo-lettering',
    'hp',
  ];
  const svgs = new Map<string, ReturnType<SVGLoader['parse']>>();
  await Promise.all(
    assetNames.map(async (name) => {
      const r = await fetch(`/assets/${name}.svg`);
      if (!r.ok) throw new Error(`No se pudo cargar ${name}`);
      svgs.set(name, new SVGLoader().parse(await r.text()));
    }),
  );
  let config = structuredClone(initial),
    time = 10.9,
    freeCamera = false;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#afbba0');
  scene.fog = new THREE.Fog('#aeb6a4', 350, 640);
  const world = new THREE.Group();
  world.name = 'Silicon Valley · editable scene';
  scene.add(world);
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    preserveDrawingBuffer: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.13;
  renderer.domElement.setAttribute(
    'aria-label',
    'Escena 3D editable de Silicon Valley con Fintoc',
  );
  host.appendChild(renderer.domElement);
  const camera = new THREE.OrthographicCamera(-60, 60, 34, -34, 0.1, 900);
  camera.name = 'Opening camera';
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enabled = false;
  controls.enableDamping = true;
  controls.dampingFactor = 0.12;
  controls.minZoom = 0.3;
  controls.maxZoom = 6;
  controls.maxPolarAngle = Math.PI * 0.47;
  const ambient = new THREE.HemisphereLight(
    '#c4d6ef',
    '#9e996f',
    config.lighting.ambient,
  );
  scene.add(ambient);
  const sun = new THREE.DirectionalLight('#ffe3ba', config.lighting.sun);
  sun.position.set(-60, 120, 65);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  Object.assign(sun.shadow.camera, {
    left: -150,
    right: 150,
    top: 150,
    bottom: -150,
    far: 350,
  });
  sun.shadow.normalBias = 0.09;
  sun.shadow.bias = -0.00008;
  sun.shadow.radius = 2;
  sun.name = 'Afternoon sun';
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight('#a8c4e8', 0.28);
  fill.position.set(90, 40, -80);
  fill.name = 'Cool sky fill';
  scene.add(fill);
  const pmrem = new THREE.PMREMGenerator(renderer),
    environment = new RoomEnvironment(),
    environmentTarget = pmrem.fromScene(environment, 0.06);
  scene.environment = environmentTarget.texture;
  scene.environmentIntensity = 0.13;
  environment.dispose();
  pmrem.dispose();
  const composer = new EffectComposer(renderer);
  composer.renderTarget1.samples = 4;
  composer.renderTarget2.samples = 4;
  composer.addPass(new RenderPass(scene, camera));
  const ao = new GTAOPass(scene, camera, 1, 1);
  ao.updateGtaoMaterial({
    radius: 3.2,
    thickness: 1.6,
    distanceExponent: 1.4,
    distanceFallOff: 1,
    samples: 12,
    screenSpaceRadius: false,
  });
  ao.updatePdMaterial({
    radius: 5,
    lumaPhi: 8,
    depthPhi: 3,
    normalPhi: 4,
    samples: 12,
  });
  ao.blendIntensity = config.lighting.occlusion;
  composer.addPass(ao);
  composer.addPass(new OutputPass());
  const mats = new Map<string, THREE.MeshStandardMaterial>();
  function mat(color: string) {
    let m = mats.get(color);
    if (!m) {
      m = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.88,
        metalness: 0,
        flatShading: true,
      });
      if (color === colors.glass || color === colors.darkGlass) {
        m.roughness = 0.36;
        m.metalness = 0.2;
        m.envMapIntensity = 0.7;
      }
      mats.set(color, m);
    }
    return m;
  }
  const grassMat = new THREE.MeshStandardMaterial({
    color: config.palette.grass,
    roughness: 1,
  });
  const roadMat = new THREE.MeshStandardMaterial({
    color: config.palette.asphalt,
    roughness: 1,
  });
  const titleMat = new THREE.MeshBasicMaterial({ color: config.palette.title });
  const fintocMat = new THREE.MeshStandardMaterial({
    color: config.palette.fintoc,
    roughness: 0.7,
  });
  const genericFacade = new THREE.MeshStandardMaterial({
    color: config.palette.facade,
    roughness: 0.93,
  });
  const cube = new THREE.BoxGeometry(1, 1, 1);
  function box(
    parent: THREE.Object3D,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    color: string | THREE.Material,
  ) {
    const m = new THREE.Mesh(
      cube,
      typeof color === 'string' ? mat(color) : color,
    );
    m.position.set(x, y + h / 2, z);
    m.scale.set(w, h, d);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }
  function mesh(
    parent: THREE.Object3D,
    geometry: THREE.BufferGeometry,
    material: THREE.Material | THREE.Material[],
    x = 0,
    y = 0,
    z = 0,
  ) {
    const m = new THREE.Mesh(geometry, material);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }
  function cylinder(
    parent: THREE.Object3D,
    x: number,
    y: number,
    z: number,
    r: number,
    h: number,
    color: string,
    segments = 20,
  ) {
    return mesh(
      parent,
      new THREE.CylinderGeometry(r, r, h, segments),
      mat(color),
      x,
      y + h / 2,
      z,
    );
  }
  function batch(parent: THREE.Object3D) {
    const sets = new Map<THREE.Material, THREE.Mesh[]>();
    for (const o of [...parent.children])
      if (
        o instanceof THREE.Mesh &&
        !(o instanceof THREE.InstancedMesh) &&
        !Array.isArray(o.material)
      ) {
        const list = sets.get(o.material) || [];
        list.push(o);
        sets.set(o.material, list);
      }
    for (const [material, list] of sets) {
      if (list.length < 2) continue;
      const gs = list.map((m) => {
        m.updateMatrix();
        return m.geometry.clone().applyMatrix4(m.matrix);
      });
      const g = mergeGeometries(gs);
      if (g) {
        const combined = mesh(parent, g, material);
        combined.name = 'Architectural detail';
        list.forEach((m) => parent.remove(m));
      }
      gs.forEach((g) => g.dispose());
    }
  }
  function text(
    word: string,
    size: number,
    depth: number,
    color: string | THREE.Material,
    parent: THREE.Object3D,
    x: number,
    y: number,
    z: number,
  ) {
    const g = new TextGeometry(word, {
      font,
      size,
      depth,
      curveSegments: 6,
      bevelEnabled: false,
    });
    g.computeBoundingBox();
    g.translate(-(g.boundingBox!.max.x - g.boundingBox!.min.x) / 2, 0, 0);
    const m = mesh(
      parent,
      g,
      typeof color === 'string' ? mat(color) : color,
      x,
      y,
      z,
    );
    m.name = word;
    return m;
  }
  function sculpture(
    asset: string,
    width: number,
    depth: number,
    color?: string | THREE.Material,
  ) {
    const data = svgs.get(asset)!;
    const group = new THREE.Group();
    group.name = asset;
    const shapes = data.paths.flatMap((path) =>
      SVGLoader.createShapes(path).map((shape) => ({
        shape,
        color: path.color,
      })),
    );
    const geos = shapes.map((s) => ({
      geometry: new THREE.ExtrudeGeometry(s.shape, {
        depth: 1,
        bevelEnabled: false,
        curveSegments: 8,
      }),
      color: s.color,
    }));
    const bounds = new THREE.Box3();
    for (const o of geos) {
      o.geometry.computeBoundingBox();
      bounds.union(o.geometry.boundingBox!);
    }
    const s = width / (bounds.max.x - bounds.min.x);
    for (const o of geos) {
      o.geometry.translate(
        -(bounds.min.x + bounds.max.x) / 2,
        -bounds.max.y,
        0,
      );
      o.geometry.scale(s, -s, depth);
      const indices = [];
      for (let i = 0; i < o.geometry.attributes.position.count; i += 3)
        indices.push(i, i + 2, i + 1);
      o.geometry.setIndex(indices);
      const material =
        typeof color === 'string'
          ? mat(color)
          : (color ?? mat('#' + o.color.getHexString()));
      mesh(group, o.geometry, material);
    }
    batch(group);
    return group;
  }
  const occupied: { x: number; z: number; w: number; d: number }[] = [];
  const xRoads = [-198, -168, -138, -108, -78, -48, 45, 77, 109, 141, 173, 205],
    zRoads = [-114, -84, -55, -27, 35, 68, 100, 132, 164, 196, 228, 260];
  box(world, 0, -0.5, 0, 620, 0.5, 660, grassMat).name = 'Ground';
  for (const x of xRoads) {
    box(world, x, 0, 0, 7, 0.06, 590, roadMat);
    for (const side of [-1, 1])
      box(world, x + side * 3.9, 0, 0, 0.8, 0.18, 590, colors.curb);
    for (let z = -280; z < 285; z += 4.5) {
      if (zRoads.some((r) => Math.abs(r - z) < 5)) continue;
      box(world, x, 0.065, z, 0.12, 0.015, 1.7, '#e2ddc9');
    }
  }
  for (const z of zRoads) {
    box(world, 0, 0.001, z, 590, 0.065, 7, roadMat);
    for (const side of [-1, 1])
      box(world, 0, 0, z + side * 3.9, 590, 0.18, 0.8, colors.curb);
    for (let x = -285; x < 285; x += 4.5) {
      if (xRoads.some((r) => Math.abs(r - x) < 5)) continue;
      box(world, x, 0.07, z, 1.7, 0.015, 0.12, '#e2ddc9');
    }
  }
  for (const x of xRoads)
    for (const z of zRoads) {
      for (let i = -3; i <= 3; i++) {
        box(world, x + i * 0.73, 0.08, z + 4.65, 0.38, 0.02, 1.5, '#eee6d7');
        box(world, x + 4.65, 0.08, z + i * 0.73, 1.5, 0.02, 0.38, '#eee6d7');
      }
      for (const [dx, dz] of [
        [-4.5, -4.5],
        [4.5, 4.5],
      ]) {
        box(world, x + dx, 0.15, z + dz, 0.14, 3.4, 0.14, '#5a5a46');
        box(world, x + dx, 3, z + dz, 0.34, 0.9, 0.3, '#303632');
        box(world, x + dx, 3.08, z + dz + 0.16, 0.16, 0.14, 0.04, '#e86439');
      }
    }
  // Central pedestrian block is continuous, like the title buildings in the reference.
  box(world, 0, 0.06, 12, 84, 0.18, 40, '#c8c4b3');
  box(world, 0, 0.24, 12, 81, 0.06, 37, grassMat);
  let seed = 41411;
  const rand = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  function person(
    parent: THREE.Object3D,
    x: number,
    y: number,
    z: number,
    i: number,
  ) {
    const c = ['#59b36c', '#e17053', '#dfcb43', '#8e6db9', '#edede4'][i % 5];
    box(parent, x - 0.09, y, z, 0.13, 0.53, 0.16, '#4a5660');
    box(parent, x + 0.09, y, z, 0.13, 0.53, 0.16, '#4a5660');
    box(parent, x, y + 0.48, z, 0.42, 0.58, 0.28, c);
    mesh(
      parent,
      new THREE.SphereGeometry(0.18, 6, 5),
      mat('#d9b799'),
      x,
      y + 1.23,
      z,
    );
  }
  function office(
    parent: THREE.Object3D,
    w: number,
    d: number,
    h: number,
    facade: THREE.Material,
    detail = true,
  ) {
    box(parent, 0, 0, 0, w + 1.5, 0.25, d + 1.5, colors.curb);
    box(parent, 0, 0.25, 0, w, h, d, facade);
    // Glass ribbons wrap all four faces; individual mullions retain the miniature scale.
    const step = 2.35;
    for (let y = 1.5; y < h - 0.5; y += step) {
      for (const s of [-1, 1]) {
        box(
          parent,
          0,
          y,
          s * (d / 2 + 0.018),
          w - 0.35,
          1.4,
          0.045,
          colors.glass,
        );
        box(
          parent,
          s * (w / 2 + 0.018),
          y,
          0,
          0.045,
          1.4,
          d - 0.35,
          colors.darkGlass,
        );
      }
      for (let x = -w / 2 + 0.8; x < w / 2; x += 1.2)
        for (const s of [-1, 1])
          box(parent, x, y, s * (d / 2 + 0.045), 0.12, 1.46, 0.08, facade);
      for (let z = -d / 2 + 0.8; z < d / 2; z += 1.2)
        for (const s of [-1, 1])
          box(parent, s * (w / 2 + 0.045), y, z, 0.08, 1.46, 0.12, facade);
    }
    box(parent, 0, h + 0.25, 0, w + 0.3, 0.3, d + 0.3, colors.roof);
    box(parent, 0, h + 0.55, 0, w - 0.8, 0.13, d - 0.8, '#c5bcae');
    for (const s of [-1, 1]) {
      box(
        parent,
        0,
        h + 0.55,
        s * (d / 2 - 0.12),
        w + 0.25,
        0.65,
        0.3,
        colors.roof,
      );
      box(
        parent,
        s * (w / 2 - 0.12),
        h + 0.55,
        0,
        0.3,
        0.65,
        d + 0.25,
        colors.roof,
      );
    }
    box(parent, 0, 0.25, d / 2 + 0.04, 2.8, 2.2, 0.12, '#435d61');
    box(parent, 0, 2.5, d / 2 + 0.6, 4, 0.18, 1.5, colors.roof);
    if (detail) {
      box(
        parent,
        -w * 0.24,
        h + 0.7,
        -d * 0.2,
        w * 0.3,
        0.8,
        d * 0.25,
        '#a29e90',
      );
      for (let i = 0; i < 3; i++)
        cylinder(
          parent,
          -w * 0.3 + i * 0.8,
          h + 1.5,
          -d * 0.2,
          0.3,
          0.12,
          '#666f67',
          12,
        );
      box(parent, w * 0.27, h + 0.7, -d * 0.2, 1.3, 1.8, 1.4, '#d5cbbb');
      for (let i = 0; i < 3; i++)
        box(
          parent,
          -w * 0.3 + i * 2,
          h + 0.76,
          d * 0.22,
          1.55,
          0.13,
          2.7,
          '#375466',
        );
    }
  }
  const buildings: AnimatedBuilding[] = [];
  for (const b of DEFAULT_CONFIG.buildings) {
    const g = new THREE.Group();
    g.name = b.name;
    world.add(g);
    g.position.set(b.x, 0, b.z);
    const facade = new THREE.MeshStandardMaterial({
      color: b.color,
      roughness: 0.9,
    });
    office(
      g,
      b.width,
      b.depth,
      b.height,
      facade,
      b.id !== 'fintoc' && b.id !== 'hp',
    );
    buildings.push({
      group: g,
      id: b.id,
      facade,
      base: { width: b.width, depth: b.depth, height: b.height },
    });
    occupied.push({ x: b.x, z: b.z, w: b.width + 2, d: b.depth + 2 });
    if (b.id === 'fintoc') {
      const logo = sculpture('fintoc-logo', 20, 0.9, fintocMat);
      logo.position.set(0, b.height + 1.1, b.depth / 2 - 0.8);
      g.add(logo);
      box(g, 0, b.height + 0.72, b.depth / 2 - 1, 21, 0.35, 2.2, colors.roof);
      const small = sculpture('fintoc-logo', 11, 0.15, fintocMat);
      small.position.set(0, b.height - 3.4, b.depth / 2 + 0.13);
      box(g, 0, b.height - 3.9, b.depth / 2 + 0.02, 13, 3.4, 0.1, colors.roof);
      g.add(small);
      for (let p = 0; p < 6; p++)
        person(g, -6 + p * 2.1, b.height + 0.8, -1 - (p % 2) * 2, p);
      box(g, 2, b.height + 0.75, -2, 4.3, 0.17, 2.2, '#a06336');
    }
    if (b.id === 'startup') {
      const logo = sculpture('fintoc-logo', 17, 0.65, fintocMat);
      logo.position.set(0, b.height + 1, b.depth / 2 - 0.5);
      g.add(logo);
      for (let p = 0; p < 5; p++) person(g, -7 + p * 2.5, b.height + 0.8, 0, p);
    }
    if (b.id === 'yahoo') {
      const plate = cylinder(
        g,
        0,
        b.height + 0.72,
        0,
        6.7,
        0.18,
        '#762668',
        48,
      );
      plate.name = 'Yahoo roof roundel';
      const logo = sculpture('yahoo-lettering', 9, 0.12, '#f5eadc');
      logo.rotation.x = -Math.PI / 2;
      logo.position.set(0, b.height + 0.93, 3);
      g.add(logo);
      cylinder(g, 8, b.height + 0.8, -3, 3, 1.5, colors.roof, 40);
    }
    if (b.id === 'hooli')
      text('hooli', 4.9, 0.9, '#c4d528', g, 0, b.height + 1, b.depth / 2 - 0.6);
    if (b.id === 'hp') {
      const pad = new THREE.Mesh(
        new THREE.RingGeometry(3.5, 3.7, 50),
        mat('#f5eddd'),
      );
      pad.rotation.x = -Math.PI / 2;
      pad.position.set(4, b.height + 0.73, 1);
      g.add(pad);
      const h = text('H', 3, 0.06, '#f7eddd', g, 4, b.height + 0.73, 2);
      h.rotation.x = -Math.PI / 2;
      const logo = sculpture('hp', 8, 0.2, '#4295ac');
      logo.position.set(-5, b.height + 1, 8);
      g.add(logo);
    }
    if (b.id === 'google') {
      const google = sculpture('google', 18, 0.45);
      google.position.set(0, b.height + 1, b.depth / 2 - 0.5);
      g.add(google);
      box(g, 0, b.height + 0.75, -2, 6, 0.35, 5, '#e68a13');
      const bMark = text('B', 3, 0.15, '#fff9e8', g, 0, b.height + 1.13, -0.3);
      bMark.rotation.x = -Math.PI / 2;
      cylinder(g, 6, b.height + 0.8, -3, 2.2, 1.2, colors.roof, 30);
    }
    if (b.id === 'youtube') {
      box(g, 0, b.height + 0.8, b.depth / 2 - 0.3, 20, 4.5, 0.4, '#f2eee1');
      const logo = sculpture('youtube-2013', 18, 0.5);
      logo.position.set(0, b.height + 1.15, b.depth / 2);
      g.add(logo);
    }
    if (b.id === 'twitter') {
      const disc = cylinder(g, 0, b.height + 1, 0, 4.8, 0.55, '#eee9dc', 40);
      disc.rotation.x = Math.PI / 2;
      disc.position.set(0, b.height + 5, b.depth / 2);
      const logo = sculpture('twitter-bird', 7, 0.3, '#39a7c4');
      logo.position.set(0, b.height + 2.2, b.depth / 2 + 0.5);
      g.add(logo);
      for (const x of [-2, 2])
        box(g, x, b.height + 0.6, b.depth / 2 - 0.2, 0.23, 3, 0.23, '#737b74');
    }
    if (b.id === 'campus') {
      box(g, -2, b.height + 0.75, 0, 9, 0.13, 7, '#40a5b6');
      for (let p = 0; p < 9; p++) person(g, -7 + p * 1.5, b.height + 0.8, 4, p);
    }
    batch(g);
  }
  // Mixed blocks continue past the crop. There is no floating platform or empty horizon.
  for (let z = -140; z < 285; z += 17)
    for (let x = -225; x < 225; x += 17) {
      const w = 7 + rand() * 5,
        d = 6 + rand() * 6,
        px = x + (rand() - 0.5) * 3,
        pz = z + (rand() - 0.5) * 3;
      if (
        xRoads.some((r) => Math.abs(r - px) < w / 2 + 5) ||
        zRoads.some((r) => Math.abs(r - pz) < d / 2 + 5) ||
        (px > -46 && px < 45 && pz > -53 && pz < 66) ||
        occupied.some(
          (b) =>
            Math.abs(px - b.x) < (w + b.w) / 2 + 1 &&
            Math.abs(pz - b.z) < (d + b.d) / 2 + 1,
        )
      )
        continue;
      const g = new THREE.Group();
      g.position.set(px, 0, pz);
      g.name = 'Neighborhood office';
      world.add(g);
      const h = 3 + rand() * 12;
      office(g, w, d, h, genericFacade, true);
      batch(g);
      occupied.push({ x: px, z: pz, w: w + 1, d: d + 1 });
    }
  // Authentic extruded billboards, with framing and supporting steel.
  const signs = new THREE.Group();
  signs.name = 'Fintoc billboards';
  world.add(signs);
  function billboard(
    x: number,
    z: number,
    w: number,
    h: number,
    asset: string,
    color: string,
    rotation = 0,
  ) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = rotation;
    signs.add(g);
    for (const dx of [-w * 0.35, w * 0.35])
      box(g, dx, 0, 0, 0.25, h, 0.35, '#6e756c');
    box(g, 0, h, 0, w + 0.8, w * 0.29, 0.5, '#ebe4d8');
    box(g, 0, h + 0.15, 0.27, w, w * 0.29 - 0.3, 0.1, '#26344a');
    const logo = sculpture(asset, w * 0.83, 0.2, color);
    logo.position.set(0, h + w * 0.045, 0.36);
    g.add(logo);
    batch(g);
    return g;
  }
  billboard(-36, -10, 20, 7, 'fintoc-logo', '#eae0cd', -0.25);
  billboard(22, 109, 21, 8, 'fintoc-logo', '#eae0cd', 0);
  billboard(-62, 149, 17, 6, 'facebook-lettering', '#eae0cd');
  billboard(-62, -40, 17, 6, 'facebook-lettering', '#e4ddd0');
  // Real letter-shaped buildings: red roofs, ivory walls, and glazed perimeter floors.
  let titleGroup = new THREE.Group();
  titleGroup.name = 'Title buildings';
  world.add(titleGroup);
  let letters: { group: THREE.Group; start: number }[] = [];
  function rebuildTitle() {
    world.remove(titleGroup);
    titleGroup.traverse((o) => {
      if (o instanceof THREE.Mesh) o.geometry.dispose();
    });
    titleGroup = new THREE.Group();
    titleGroup.name = 'Title buildings';
    world.add(titleGroup);
    letters = [];
    for (let row = 0; row < 2; row++) {
      const word = config.title[row] || ' ';
      const measure = new TextGeometry(word, {
        font: titleFont,
        size: 12,
        depth: 1,
        bevelEnabled: false,
      });
      measure.computeBoundingBox();
      const width = measure.boundingBox!.max.x;
      const scale = 74 / Math.max(width, 1),
        depthScale =
          11 /
          (Math.max(
            0.1,
            measure.boundingBox!.max.y - measure.boundingBox!.min.y,
          ) *
            scale);
      measure.dispose();
      let cursor = -37;
      for (let i = 0; i < word.length; i++) {
        const char = word[i],
          size = 12 * scale;
        if (!char.trim()) {
          cursor += size * 0.4;
          continue;
        }
        const shapes = titleFont.generateShapes(char, size);
        const g = new THREE.Group();
        g.name = `Title ${row + 1} · ${char}`;
        g.position.set(cursor, 0, 11 + row * 16);
        titleGroup.add(g);
        const height = row === 0 ? 10.8 : 9.2;
        const geo = new THREE.ExtrudeGeometry(shapes, {
          depth: height,
          bevelEnabled: false,
          curveSegments: 8,
        });
        geo.rotateX(-Math.PI / 2);
        geo.scale(1, 1, depthScale);
        mesh(g, geo, [titleMat, mat('#d9cdbb')]);
        for (const shape of shapes) {
          const loops = [
            shape.getPoints(12),
            ...shape.holes.map((h) => h.getPoints(10)),
          ];
          for (const loop of loops)
            for (let j = 0; j < loop.length - 1; j++) {
              const a = loop[j].clone(),
                b = loop[j + 1].clone();
              a.y *= depthScale;
              b.y *= depthScale;
              const dx = b.x - a.x,
                dz = -(b.y - a.y),
                len = Math.hypot(dx, dz);
              if (len < 0.04) continue;
              const mx = (a.x + b.x) / 2,
                mz = -(a.y + b.y) / 2,
                angle = -Math.atan2(dz, dx);
              for (let y = 0.85; y < height - 0.7; y += 1.45) {
                const strip = box(g, mx, y, mz, len, 0.72, 0.035, '#6f8580');
                strip.rotation.y = angle;
              }
              if (len > 0.5) {
                const n = Math.max(1, Math.round(len / 0.85));
                for (let k = 0; k <= n; k++) {
                  box(
                    g,
                    a.x + (dx * k) / n,
                    0.5,
                    -a.y + (dz * k) / n,
                    0.085,
                    height - 1,
                    0.085,
                    '#e2d6c3',
                  );
                }
              }
            }
        }
        batch(g);
        letters.push({ group: g, start: 5.15 + row * 0.48 + i * 0.18 });
        const glyph = (
          titleFont as Font & {
            data: {
              glyphs: Record<string, { ha: number }>;
              resolution: number;
            };
          }
        ).data.glyphs[char];
        cursor +=
          ((glyph?.ha ?? 700) /
            (titleFont as Font & { data: { resolution: number } }).data
              .resolution) *
          size;
      }
    }
  }
  rebuildTitle();
  // Low-poly trees are individually placed instances and remain real exportable meshes.
  const treePositions: { x: number; z: number; s: number }[] = [];
  for (let i = 0; i < 7000; i++) {
    const x = rand() * 450 - 225,
      z = rand() * 440 - 150,
      s = 0.7 + rand() * 0.8;
    if (
      xRoads.some((r) => Math.abs(r - x) < 4.8) ||
      zRoads.some((r) => Math.abs(r - z) < 4.8) ||
      (x > -42 && x < 42 && z > -8 && z < 31) ||
      occupied.some(
        (b) =>
          Math.abs(x - b.x) < b.w / 2 + 1 && Math.abs(z - b.z) < b.d / 2 + 1,
      )
    )
      continue;
    treePositions.push({ x, z, s });
  }
  for (const x of [-43, 40, 72, -73])
    for (let z = -52; z < 100; z += 4.2) {
      if (zRoads.some((r) => Math.abs(z - r) < 5)) continue;
      treePositions.push({ x, z, s: 1 });
    }
  const crowns = new THREE.InstancedMesh(
    new THREE.IcosahedronGeometry(1.4, 0),
    mat('#ffffff'),
    treePositions.length,
  );
  crowns.name = 'Tree crowns';
  crowns.castShadow = true;
  crowns.receiveShadow = true;
  const trunks = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.16, 0.22, 2.6, 5),
    mat(colors.trunk),
    treePositions.length,
  );
  trunks.name = 'Tree trunks';
  trunks.castShadow = true;
  const temp = new THREE.Object3D();
  treePositions.forEach(({ x, z, s }, i) => {
    temp.position.set(x, 2.6 * s, z);
    temp.scale.set(s, 1.28 * s, s);
    temp.rotation.set(0, i * 1.7, 0.12);
    temp.updateMatrix();
    crowns.setMatrixAt(i, temp.matrix);
    crowns.setColorAt(
      i,
      new THREE.Color(
        ['#355b17', '#466e21', '#567d24', '#668c29', '#3e631f'][i % 5],
      ),
    );
    temp.position.y = 1.3 * s;
    temp.rotation.set(0, 0, 0);
    temp.scale.set(s, s, s);
    temp.updateMatrix();
    trunks.setMatrixAt(i, temp.matrix);
  });
  world.add(crowns, trunks);
  const freeway = new THREE.Group();
  freeway.name = 'Elevated curved freeway';
  world.add(freeway);
  for (let i = 0; i < 72; i++) {
    const x = -165 + i * 4.6,
      x2 = x + 4.7,
      z = 79 - x * x * 0.0016,
      z2 = 79 - x2 * x2 * 0.0016,
      angle = -Math.atan2(z2 - z, x2 - x),
      len = Math.hypot(x2 - x, z2 - z);
    const slab = box(
      freeway,
      (x + x2) / 2,
      4,
      (z + z2) / 2,
      len,
      0.7,
      7.8,
      '#b5b3a2',
    );
    slab.rotation.y = angle;
    const surface = box(
      freeway,
      (x + x2) / 2,
      4.7,
      (z + z2) / 2,
      len,
      0.08,
      7.1,
      roadMat,
    );
    surface.rotation.y = angle;
    for (const side of [-1, 1]) {
      const wall = box(
        freeway,
        (x + x2) / 2,
        4.65,
        (z + z2) / 2 + side * 3.8,
        len,
        0.9,
        0.23,
        colors.roof,
      );
      wall.rotation.y = angle;
    }
    const stripe = box(
      freeway,
      (x + x2) / 2,
      4.8,
      (z + z2) / 2,
      len * 0.42,
      0.015,
      0.12,
      '#e5e0d0',
    );
    stripe.rotation.y = angle;
    if (i % 3 === 0) box(freeway, x, 0, z, 1.2, 4, 5, '#acada0');
  }
  batch(freeway);
  // Cars have bodywork, tinted windows, tires and lights. Their paths are deterministic.
  const carCount = 66;
  const wheelParts = [];
  for (const x of [-0.63, 0.63])
    for (const z of [-0.77, 0.77]) {
      const g = new THREE.CylinderGeometry(0.31, 0.31, 0.19, 8);
      g.rotateZ(Math.PI / 2);
      g.translate(x, 0.34, z);
      wheelParts.push(g);
    }
  const wheelGeometry = mergeGeometries(wheelParts)!;
  wheelParts.forEach((g) => g.dispose());
  const carSpecs = [
    {
      name: 'Car body',
      g: new THREE.BoxGeometry(1.2, 0.55, 2.3),
      p: [0, 0.56, 0],
      color: '#eeeeee',
    },
    {
      name: 'Car roof',
      g: new THREE.BoxGeometry(1.05, 0.56, 1.25),
      p: [0, 1.02, -0.1],
      color: '#c5d9d6',
    },
    {
      name: 'Car windows',
      g: new THREE.BoxGeometry(1.07, 0.39, 0.99),
      p: [0, 1.04, -0.1],
      color: '#526c78',
    },
    { name: 'Car wheels', g: wheelGeometry, p: [0, 0, 0], color: '#2b302e' },
  ];
  const carMeshes = carSpecs.map((spec) => {
    spec.g.translate(...(spec.p as [number, number, number]));
    const m = new THREE.InstancedMesh(spec.g, mat(spec.color), carCount);
    m.name = spec.name;
    m.castShadow = true;
    world.add(m);
    return m;
  });
  const carRoutes = Array.from({ length: carCount }, (_, i) => ({
    axis: i % 2,
    lane: i % 2 ? xRoads[i % xRoads.length] : zRoads[i % zRoads.length],
    phase: rand(),
    speed: 4 + rand() * 5,
    direction: i % 3 === 0 ? -1 : 1,
    bridge: i > 55,
  }));
  for (let i = 0; i < carCount; i++) {
    carMeshes[0].setColorAt(
      i,
      new THREE.Color(
        [
          '#c4332a',
          '#e4b441',
          '#578ba8',
          '#f0e7d2',
          '#518c71',
          '#dc7d36',
          '#c4cdca',
        ][i % 7],
      ),
    );
    carMeshes[1].setColorAt(
      i,
      new THREE.Color(['#a9c3c8', '#cbd3bf', '#c7d0c3'][i % 3]),
    );
  }
  const craneGroup = new THREE.Group();
  craneGroup.name = 'Construction cranes';
  world.add(craneGroup);
  const cranes: THREE.Group[] = [];
  function crane(x: number, z: number, h: number) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    craneGroup.add(g);
    for (const dx of [-0.45, 0.45])
      for (const dz of [-0.45, 0.45])
        box(g, dx, 0, dz, 0.16, h, 0.16, '#d0983c');
    for (let y = 1; y < h; y += 1.7) {
      box(g, 0, y, 0, 1.05, 0.15, 1.05, '#d6a440');
      const cross = box(g, 0, y, 0, 0.12, 1.9, 0.12, '#d6a440');
      cross.rotation.z = 0.5;
    }
    box(g, 2.5, h, 0, 19, 0.5, 0.55, '#d9ad4d');
    box(g, -5, h - 0.9, 0, 2.4, 0.9, 1.3, '#aaa89a');
    box(g, 8, h - 8, 0, 0.055, 8, 0.055, '#6a6b55');
    box(g, 8, h - 8.4, 0, 0.5, 0.4, 0.5, '#827b5b');
    batch(g);
    cranes.push(g);
  }
  crane(27, -8, 29);
  crane(-64, -54, 20);
  // The HP helicopter has independent main and tail rotors.
  const helicopter = new THREE.Group();
  helicopter.name = 'HP helicopter';
  world.add(helicopter);
  const fuselage = mesh(
    helicopter,
    new THREE.SphereGeometry(1, 12, 8),
    mat('#e0d939'),
  );
  fuselage.scale.set(0.72, 0.73, 1.8);
  const cockpit = mesh(
    helicopter,
    new THREE.SphereGeometry(1, 10, 7),
    mat('#698d91'),
    0,
    0.16,
    1.0,
  );
  cockpit.scale.set(0.68, 0.6, 0.91);
  box(helicopter, 0, -0.1, -2.5, 0.25, 0.33, 3.4, '#b9bd43');
  box(helicopter, 0, 0.1, -4, 0.14, 1.1, 0.6, '#c3c238');
  for (const x of [-0.9, 0.9]) {
    box(helicopter, x, -1, -0.1, 0.1, 0.12, 3.3, '#737c70');
    box(helicopter, x, -0.8, 0, 0.1, 0.7, 0.1, '#737c70');
  }
  const rotor = new THREE.Group();
  rotor.position.y = 1.15;
  helicopter.add(rotor);
  box(rotor, 0, 0, 0, 0.17, 0.1, 8, '#485149');
  box(rotor, 0, 0, 0, 8, 0.1, 0.17, '#485149');
  const tailRotor = box(helicopter, 0, 0.5, -4, 0.08, 0.1, 1.7, '#434b43');
  tailRotor.rotation.z = Math.PI / 2;
  // Street furniture and rooftop activity add scale without a texture backdrop.
  for (let i = 0; i < 65; i++) {
    const x = (i % 13) * 8 - 45,
      z = i < 26 ? 31 : 39 + Math.floor(i / 26) * 5;
    if (
      occupied.some(
        (b) => Math.abs(x - b.x) < b.w / 2 && Math.abs(z - b.z) < b.d / 2,
      )
    )
      continue;
    person(world, x, 0.2, z, i);
  }
  for (const x of [-44, 40])
    for (let z = -20; z < 35; z += 11) {
      box(world, x, 0.2, z, 0.11, 4.1, 0.11, '#66685b');
      const arm = box(world, x + 0.55, 4.2, z, 1.3, 0.12, 0.15, '#66685b');
      arm.name = 'Streetlamp';
      box(world, x + 1.1, 4.12, z, 0.56, 0.12, 0.3, '#e7e1c5');
    }
  batch(world);
  const selectable = buildings.map((b) => b.group);
  let selectHandler: ((id: string) => void) | undefined;
  const pointer = new THREE.Vector2(),
    raycaster = new THREE.Raycaster();
  let pointerStart: { x: number; y: number } | null = null;
  const onDown = (e: PointerEvent) => {
    pointerStart = { x: e.clientX, y: e.clientY };
  };
  const onUp = (e: PointerEvent) => {
    if (
      !pointerStart ||
      Math.hypot(e.clientX - pointerStart.x, e.clientY - pointerStart.y) > 5
    )
      return;
    const r = renderer.domElement.getBoundingClientRect();
    pointer.set(
      ((e.clientX - r.left) / r.width) * 2 - 1,
      (-(e.clientY - r.top) / r.height) * 2 + 1,
    );
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(selectable, true)[0];
    if (hit) {
      let o: THREE.Object3D | null = hit.object;
      while (o && o.parent !== world) o = o.parent;
      const b = buildings.find((b) => b.group === o);
      if (b) selectHandler?.(b.id);
    }
  };
  renderer.domElement.addEventListener('pointerdown', onDown);
  renderer.domElement.addEventListener('pointerup', onUp);
  let selected = 'fintoc';
  const selection = new THREE.BoxHelper(buildings[0].group, '#36adff');
  selection.name = 'Editor selection';
  selection.visible = false;
  scene.add(selection);
  function updateConfig(next: ValleyConfig) {
    const changed = config.title.join('|') !== next.title.join('|');
    config = structuredClone(next);
    grassMat.color.set(config.palette.grass);
    ambient.intensity = config.lighting.ambient;
    sun.intensity = config.lighting.sun;
    renderer.toneMappingExposure = config.lighting.exposure;
    ao.blendIntensity = config.lighting.occlusion;
    const se = THREE.MathUtils.degToRad(config.lighting.elevation);
    sun.position.set(
      -Math.cos(se) * 100,
      Math.sin(se) * 145,
      Math.cos(se) * 95,
    );
    roadMat.color.set(config.palette.asphalt);
    genericFacade.color.set(config.palette.facade);
    titleMat.color.set(config.palette.title);
    fintocMat.color.set(config.palette.fintoc);
    if (changed) rebuildTitle();
    for (const b of buildings) {
      const c = config.buildings.find((c) => c.id === b.id)!;
      b.facade.color.set(c.color);
      b.group.position.set(c.x, 0, c.z);
      b.group.visible = c.visible;
      b.group.scale.set(
        c.width / b.base.width,
        c.height / b.base.height,
        c.depth / b.base.depth,
      );
    }
    render(time);
  }
  function render(t: number) {
    time = t;
    for (const b of buildings) {
      const c = config.buildings.find((c) => c.id === b.id)!;
      const growth = b.id === 'fintoc' ? 0.24 + 0.76 * smooth(4.4, 7, t) : 1;
      b.group.scale.y = (c.height / b.base.height) * growth;
    }
    for (const letter of letters)
      letter.group.scale.y = Math.max(
        0.002,
        smooth(letter.start, letter.start + 1.0, t),
      );
    cranes.forEach((g, i) => {
      g.scale.y = Math.max(
        0.001,
        1 - smooth(7.6 + i * 0.25, 8.7 + i * 0.25, t),
      );
      g.rotation.y = Math.sin(t * 0.4 + i) * 0.08;
    });
    for (let i = 0; i < carCount; i++) {
      const c = carRoutes[i],
        p =
          ((((c.phase * 300 + t * c.speed * c.direction) % 300) + 300) % 300) -
          150;
      temp.rotation.set(
        0,
        c.bridge
          ? Math.PI / 2 + Math.atan(p * 0.0032)
          : (c.axis ? 0 : Math.PI / 2) + (c.direction < 0 ? Math.PI : 0),
        0,
      );
      temp.position.set(
        c.bridge ? p : c.axis ? c.lane + c.direction * 1.55 : p,
        c.bridge ? 4.82 : 0.12,
        c.bridge
          ? 79 - p * p * 0.0016 + c.direction * 1.6
          : c.axis
            ? p
            : c.lane + c.direction * 1.55,
      );
      temp.scale.set(1, i % 13 === 0 ? 1.25 : 1, i % 13 === 0 ? 1.6 : 1);
      temp.updateMatrix();
      carMeshes.forEach((m) => m.setMatrixAt(i, temp.matrix));
    }
    carMeshes.forEach((m) => (m.instanceMatrix.needsUpdate = true));
    helicopter.position.set(
      61 + Math.sin(t * 0.27) * 4,
      22 + Math.sin(t * 0.8) * 0.4,
      15 + Math.cos(t * 0.27) * 4,
    );
    helicopter.rotation.y = -0.4 + t * 0.12;
    rotor.rotation.y = t * 42;
    tailRotor.rotation.x = t * 50;
    if (!freeCamera) {
      // Measured from yU+co's plate: scale .672 → 1 over frames 0–183, then a hold.
      // This is an advancing camera with a gentle push in, not an orbit or pullback.
      const p = THREE.MathUtils.clamp(t / (183 / (24000 / 1001)), 0, 1),
        scale = 0.672 + 0.328 * p;
      const az = THREE.MathUtils.degToRad(config.camera.azimuth),
        el = THREE.MathUtils.degToRad(config.camera.elevation);
      const pixelScale = 1080 / 73,
        dx = (1 - scale) * (3116 - 960),
        dy = (1 - scale) * (-1048 - 540);
      const right = new THREE.Vector3(Math.cos(az), 0, -Math.sin(az)),
        forward = new THREE.Vector3(Math.sin(az), 0, Math.cos(az));
      const target = new THREE.Vector3(0, 3, 16)
        .addScaledVector(right, -dx / (scale * pixelScale))
        .addScaledVector(forward, -dy / (scale * pixelScale * Math.sin(el)));
      camera.position
        .copy(target)
        .add(
          new THREE.Vector3(
            Math.sin(az) * Math.cos(el),
            Math.sin(el),
            Math.cos(az) * Math.cos(el),
          ).multiplyScalar(260),
        );
      camera.lookAt(target);
      controls.target.copy(target);
      camera.zoom = scale * config.camera.zoom;
      camera.updateProjectionMatrix();
    } else controls.update();
    if (selection.visible) {
      const b = buildings.find((b) => b.id === selected);
      if (b) selection.setFromObject(b.group);
    }
    const sunAngle = THREE.MathUtils.degToRad(config.lighting.elevation);
    sun.target.position.copy(controls.target);
    sun.position
      .copy(controls.target)
      .add(
        new THREE.Vector3(
          -Math.cos(sunAngle) * 100,
          Math.sin(sunAngle) * 145,
          Math.cos(sunAngle) * 95,
        ),
      );
    sun.target.updateMatrixWorld();
    composer.render();
  }
  function resize() {
    const width = host.clientWidth,
      height = host.clientHeight,
      aspect = width / Math.max(height, 1);
    renderer.setSize(width, height, false);
    composer.setSize(width, height);
    camera.left = -36.5 * aspect;
    camera.right = 36.5 * aspect;
    camera.top = 36.5;
    camera.bottom = -36.5;
    camera.updateProjectionMatrix();
    render(time);
  }
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  resize();
  updateConfig(config);

  return {
    render,
    updateConfig,
    canvas: renderer.domElement,
    onSelect(handler: (id: string) => void) {
      selectHandler = handler;
    },
    select(id: string, show = true) {
      selected = id;
      selection.visible = show;
      render(time);
    },
    setFreeCamera(value: boolean) {
      freeCamera = value;
      controls.enabled = value;
      selection.visible = value;
      render(time);
    },
    async exportGLB() {
      selection.visible = false;
      render(10.9);
      const tracks: THREE.KeyframeTrack[] = [];
      const samples = Array.from({ length: 67 }, (_, i) => (i * 10.9) / 66);
      for (const item of letters) {
        const values = samples.flatMap((t) => [
          1,
          Math.max(0.002, smooth(item.start, item.start + 1, t)),
          1,
        ]);
        tracks.push(
          new THREE.VectorKeyframeTrack(
            item.group.uuid + '.scale',
            samples,
            values,
          ),
        );
      }
      const hq = buildings.find((b) => b.id === 'fintoc')!,
        c = config.buildings.find((b) => b.id === 'fintoc')!;
      tracks.push(
        new THREE.VectorKeyframeTrack(
          hq.group.uuid + '.scale',
          samples,
          samples.flatMap((t) => [
            c.width / hq.base.width,
            (c.height / hq.base.height) * (0.24 + 0.76 * smooth(4.4, 7, t)),
            c.depth / hq.base.depth,
          ]),
        ),
      );
      cranes.forEach((g, i) =>
        tracks.push(
          new THREE.VectorKeyframeTrack(
            g.uuid + '.scale',
            samples,
            samples.flatMap((t) => [
              1,
              Math.max(0.001, 1 - smooth(7.6 + i * 0.25, 8.7 + i * 0.25, t)),
              1,
            ]),
          ),
        ),
      );
      tracks.push(
        new THREE.VectorKeyframeTrack(
          helicopter.uuid + '.position',
          samples,
          samples.flatMap((t) => [
            61 + Math.sin(t * 0.27) * 4,
            22 + Math.sin(t * 0.8) * 0.4,
            15 + Math.cos(t * 0.27) * 4,
          ]),
        ),
      );
      const clip = new THREE.AnimationClip(
        'Silicon Valley opening',
        10.9,
        tracks,
      );
      const exporter = new GLTFExporter();
      const file = await exporter.parseAsync([world, sun, fill], {
        binary: true,
        onlyVisible: true,
        trs: true,
        animations: [clip],
      });
      return new Blob([file as ArrayBuffer], { type: 'model/gltf-binary' });
    },
    snapshot() {
      selection.visible = false;
      render(time);
      return renderer.domElement.toDataURL('image/png');
    },
    dispose() {
      observer.disconnect();
      controls.dispose();
      ao.dispose();
      composer.dispose();
      environmentTarget.dispose();
      renderer.domElement.removeEventListener('pointerdown', onDown);
      renderer.domElement.removeEventListener('pointerup', onUp);
      const geometries = new Set<THREE.BufferGeometry>(),
        materials = new Set<THREE.Material>();
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          geometries.add(o.geometry);
          (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) =>
            materials.add(m),
          );
        }
      });
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
