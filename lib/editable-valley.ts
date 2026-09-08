import * as THREE from 'three';
import { FontLoader, type Font } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { DEFAULT_CONFIG, type ValleyConfig } from './scene-config';
import { createCityLife, createMotion } from './city-life';
import { sampleDaylight, CAMERA_HOLD } from './solar-motion';
import { ShutterPass } from './shutter-pass';
import { constructionStage, type CraneDelivery } from './construction-timeline';
import { createFintocHQ } from './fintoc-hq';
import { createCoffeeKiosk } from './coffee-kiosk';
import {
  createSurface,
  outdoorEnvironment,
  type SurfaceRole,
} from './outdoor-materials';

const smooth = (a: number, b: number, t: number) => {
  const p = THREE.MathUtils.clamp((t - a) / (b - a), 0, 1);
  return p * p * (3 - 2 * p);
};
const colors = {
  roof: '#ece2d3',
  glass: '#a0bbbf',
  darkGlass: '#7c9ca5',
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
    'old-fintoc-logo',
    'old-fintoc-symbol',
    'ebay-1999-2012',
    'intel-2006-2020',
    'myspace-2008',
    'google',
    'twitter-bird',
    'facebook-lettering',
    'youtube-2013',
    'yahoo-lettering',
    'hp',
    'think-logo',
  ];
  const svgs = new Map<string, ReturnType<SVGLoader['parse']>>();
  await Promise.all(
    assetNames.map(async (name) => {
      const r = await fetch(`/assets/${name}.svg`);
      if (!r.ok) throw new Error(`No se pudo cargar ${name}`);
      // SVG currentColor has no inherited CSS context when parsed into geometry.
      const source = (await r.text()).replaceAll('currentColor', '#000000');
      svgs.set(name, new SVGLoader().parse(source));
    }),
  );
  let config = structuredClone(initial),
    time = 10.9,
    freeCamera = false;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#afbba0');
  scene.fog = new THREE.Fog('#d4d6bd', 260, 760);
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
  renderer.shadowMap.type = THREE.PCFShadowMap;
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
    '#cbd8e8',
    '#8c7773',
    config.lighting.ambient,
  );
  scene.add(ambient);
  const sun = new THREE.DirectionalLight('#ffe3ba', config.lighting.sun);
  const sunRig = new THREE.Group();
  sunRig.name = 'Time-lapse daylight · alternating roof and facade';
  sun.position.set(0, 0, 0);
  sun.target.position.set(0, 0, -1);
  sun.add(sun.target);
  sunRig.add(sun);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  Object.assign(sun.shadow.camera, {
    left: -150,
    right: 150,
    top: 150,
    bottom: -150,
    far: 350,
  });
  sun.shadow.normalBias = 0.15;
  sun.shadow.bias = -0.00012;
  sun.shadow.radius = 4;
  sun.name = 'Moving daylight';
  scene.add(sunRig);
  const fill = new THREE.DirectionalLight('#a8bde3', 0.18);
  fill.position.set(90, 40, -80);
  fill.lookAt(0, 0, 0);
  fill.target.position.set(0, 0, -1);
  fill.add(fill.target);
  fill.name = 'Cool sky fill';
  scene.add(fill);
  const exportRoot = new THREE.Group();
  exportRoot.name = 'Fintoc Valley · geometry and animated daylight';
  exportRoot.add(world, sunRig, fill);
  scene.add(exportRoot);
  const environmentTarget = outdoorEnvironment(renderer);
  scene.environment = environmentTarget.texture;
  scene.environmentIntensity = 0.22;
  const composer = new EffectComposer(renderer);
  composer.renderTarget1.samples = 4;
  composer.renderTarget2.samples = 4;
  const shutter = new ShutterPass(scene, camera, updateActors);
  composer.addPass(shutter);
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
  const atmosphere = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, veil: { value: 0.035 } },
    vertexShader: `varying vec2 uv0; void main(){uv0=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `uniform sampler2D tDiffuse; uniform float veil; varying vec2 uv0;
      void main(){vec4 c=texture2D(tDiffuse,uv0);
        float luma=dot(c.rgb,vec3(.2126,.7152,.0722));
        c.rgb+=vec3(1.,.91,.82)*.0215*exp(-luma/.06);
        float field=exp(-dot((uv0-vec2(.03,1.05))*vec2(1.8,1.7),(uv0-vec2(.03,1.05))*vec2(1.8,1.7)));
        c.rgb=mix(c.rgb,vec3(1.55,1.24,1.03),field*veil);
        gl_FragColor=c;}`,
  });
  composer.addPass(atmosphere);
  const output = new OutputPass();
  composer.addPass(output);
  const mats = new Map<string, THREE.MeshStandardMaterial>();
  function mat(color: string, role: SurfaceRole = 'masonry') {
    const key = `${role}:${color}`;
    let m = mats.get(key);
    if (!m) {
      m = createSurface(color, role);
      mats.set(key, m);
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
  const titleMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(config.palette.title).multiplyScalar(0.52),
    roughness: 0.58,
    metalness: 0.05,
  });
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
    for (const o of parent.children)
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
      const mixedIndices =
        list.some((m) => m.geometry.index) &&
        list.some((m) => !m.geometry.index);
      const gs = list.map((m) => {
        m.updateMatrix();
        const geometry =
          mixedIndices && m.geometry.index
            ? m.geometry.toNonIndexed()
            : m.geometry.clone();
        return geometry.applyMatrix4(m.matrix);
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
    separate = false,
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
    if (!separate) batch(group);
    return group;
  }
  const motion = createMotion();
  const deliveries: CraneDelivery[] = [];
  function logoPieces(logo: THREE.Group, start: number, old = false) {
    const parts = logo.children.filter(
      (o): o is THREE.Mesh => o instanceof THREE.Mesh,
    );
    // Center the genuine SVG shapes so each letter/bar rotates about its own pivot.
    parts.sort((a, b) => {
      a.geometry.computeBoundingBox();
      b.geometry.computeBoundingBox();
      return a.geometry.boundingBox!.min.x - b.geometry.boundingBox!.min.x;
    });
    parts.forEach((part, i) => {
      const center = part.geometry.boundingBox!.getCenter(new THREE.Vector3());
      part.geometry.translate(-center.x, -center.y, -center.z);
      part.name = `${old ? '2021' : '2024'} Fintoc · component ${i + 1}`;
      motion.track(part, (t) => {
        const born = smooth(start + i * 0.055, start + 0.65 + i * 0.055, t);
        const split = old ? smooth(1.85 + i * 0.025, 2.9 + i * 0.025, t) : 0;
        const gone = old ? smooth(2.55 + i * 0.025, 3.05 + i * 0.025, t) : 0;
        const spread = i - (parts.length - 1) / 2;
        part.position.set(
          center.x + spread * (old ? split * 2 : (1 - born) * 1.9),
          center.y +
            (old
              ? (1 - born) * -5 + Math.sin(split * Math.PI) * 8 + split * 8
              : (1 - born) * (8 + (i % 3) * 2)),
          center.z + ((i % 3) - 1) * (old ? split * 6 : (1 - born) * 5),
        );
        part.rotation.set(
          old ? split * (i % 2 ? 1 : -1) : (1 - born) * 0.4,
          0,
          old ? split * spread * 0.35 : (1 - born) * spread * 0.15,
        );
        part.scale.setScalar(Math.max(0.001, born * (1 - gone)));
      });
    });
  }
  const occupied: { x: number; z: number; w: number; d: number }[] = [];
  const xRoads = [-198, -168, -138, -108, -78, -48, 45, 77, 109, 141, 173, 205],
    zRoads = [-114, -84, -55, -27, 35, 68, 100, 132, 164, 196, 228, 260];
  const avenueX = (z: number) => {
    const u = THREE.MathUtils.clamp((z + 10) / 50, 0, 1);
    return 45 - 4 * Math.sin(Math.PI * u) ** 2;
  };
  box(world, 0, -0.5, 0, 620, 0.5, 660, grassMat).name = 'Ground';
  for (const x of xRoads) {
    const spans =
      x === 45
        ? [
            [-295, -10],
            [40, 295],
          ]
        : [[-295, 295]];
    for (const [a, b] of spans) {
      box(world, x, 0, (a + b) / 2, 7, 0.06, b - a, roadMat);
      for (const side of [-1, 1])
        box(
          world,
          x + side * 3.9,
          0,
          (a + b) / 2,
          0.8,
          0.18,
          b - a,
          colors.curb,
        );
    }
    if (x === 45) {
      const bend = new THREE.Group();
      bend.name = 'Curving title avenue';
      world.add(bend);
      for (let z = -10; z < 40; z += 0.65) {
        const end = Math.min(40, z + 0.65),
          mid = (z + end) / 2;
        const dx = avenueX(end) - avenueX(z),
          dz = end - z;
        const length = Math.hypot(dx, dz) + 0.035;
        const road = box(bend, avenueX(mid), 0, mid, 7, 0.06, length, roadMat);
        road.rotation.y = Math.atan2(dx, dz);
        for (const side of [-1, 1]) {
          const edge = box(
            bend,
            avenueX(mid) + side * 3.9,
            0,
            mid,
            0.8,
            0.18,
            length,
            colors.curb,
          );
          edge.rotation.y = road.rotation.y;
        }
      }
      batch(bend);
    }
    for (let z = -280; z < 285; z += 4.5) {
      if (zRoads.some((r) => Math.abs(r - z) < 5)) continue;
      const dash = box(
        world,
        x === 45 ? avenueX(z) : x,
        0.065,
        z,
        0.12,
        0.015,
        1.7,
        '#e2ddc9',
      );
      if (x === 45)
        dash.rotation.y = Math.atan2(avenueX(z + 0.1) - avenueX(z - 0.1), 0.2);
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
  function titleParcel(inset: number, y: number, material: THREE.Material) {
    const shape = new THREE.Shape();
    shape.moveTo(-42 + inset, 8 - inset);
    for (let z = -8 + inset; z <= 32 - inset; z += 0.5)
      shape.lineTo(avenueX(z) - 4.4 - inset, -z);
    shape.lineTo(-42 + inset, -32 + inset);
    shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: 0.12,
      bevelEnabled: false,
    });
    geometry.rotateX(-Math.PI / 2);
    mesh(world, geometry, material, 0, y, 0);
  }
  const parcelMat = createSurface(config.palette.grass);
  titleParcel(0, 0.06, mat('#c8c4b3'));
  titleParcel(0.7, 0.19, parcelMat);
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
  function pedestrian(x: number, z: number, i: number) {
    const walker = new THREE.Group();
    walker.name = `Time-lapse pedestrian ${i + 1}`;
    world.add(walker);
    person(walker, 0, 0, 0, i);
    batch(walker);
    motion.track(walker, (t) => {
      const phase = (t * (0.46 + (i % 4) * 0.035) + i * 0.137) % 1;
      const p = phase < 0.5 ? phase * 2 : 2 - phase * 2;
      const stride = smooth(0.1, 0.9, p);
      walker.position.set(x + (stride - 0.5) * 8, 0.2, z);
      walker.rotation.y = phase < 0.5 ? Math.PI / 2 : -Math.PI / 2;
    });
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
          mat(colors.glass, 'glass'),
        );
        box(
          parent,
          s * (w / 2 + 0.018),
          y,
          0,
          0.045,
          1.4,
          d - 0.35,
          mat(colors.darkGlass, 'glass'),
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
    if (b.id !== 'fintoc')
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
      const anchors = createFintocHQ(
        g,
        b,
        facade,
        { box, mesh, mat, batch },
        motion,
      );
      const logo = sculpture(
        'fintoc-logo',
        anchors.logoWidth,
        0.65,
        fintocMat,
        true,
      );
      logo.position.set(0, anchors.roof.y, anchors.roof.z);
      g.add(logo);
      logoPieces(logo, 4.9);
    }
    if (b.id === 'startup') {
      const logo = sculpture('old-fintoc-logo', 17, 0.65, undefined, true);
      logo.position.set(0, b.height + 1, b.depth / 2 - 0.5);
      g.add(logo);
      logoPieces(logo, 0.05, true);
      const expansion = new THREE.Group();
      expansion.name = 'Fintoc expansion · two new floors';
      expansion.position.y = b.height + 0.65;
      office(expansion, b.width + 3, b.depth + 1, 6.3, facade, false);
      batch(expansion);
      g.add(expansion);
      motion.track(
        expansion,
        (t) => (expansion.scale.y = Math.max(0.001, smooth(2.35, 3.55, t))),
      );
      const newLogo = sculpture('fintoc-logo', 28, 0.85, fintocMat, true);
      newLogo.name = 'Fintoc · new identity assembled larger';
      newLogo.position.set(0, b.height + 8.1, b.depth / 2 + 0.3);
      g.add(newLogo);
      logoPieces(newLogo, 2.6);
      const terrace = new THREE.Group();
      terrace.name = 'Fintoc rooftop team';
      g.add(terrace);
      for (let p = 0; p < 8; p++)
        person(terrace, -8 + p * 2.2, b.height + 0.8, -2 + (p % 2) * 2, p);
      batch(terrace);
      motion.track(
        terrace,
        (t) => (terrace.position.y = smooth(2.35, 3.55, t) * 7),
      );
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
  const coffeeSite = createCoffeeKiosk(
    world,
    sculpture('think-logo', 2.86, 0.028, '#111411'),
    { mat, box, mesh, batch, person },
    motion,
  );
  occupied.push(coffeeSite);
  occupied.push(
    ...createCityLife(
      world,
      { mat, box, mesh, batch, person, sculpture, text },
      motion,
      deliveries,
    ),
  );
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
      world.add(g);
      const h = 3 + rand() * 12;
      const kind = Math.floor(rand() * 5);
      g.name = [
        'Courtyard office',
        'Stepped office',
        'Tower and podium',
        'Low industrial studio',
        'Ribbon office',
      ][kind];
      const wing = (
        x: number,
        y: number,
        z: number,
        width: number,
        depth: number,
        height: number,
      ) => {
        const part = new THREE.Group();
        part.position.set(x, y, z);
        office(part, width, depth, height, genericFacade, true);
        // Bake each wing's placement into its geometry so the whole block can batch.
        // Reparenting removes children from part; iterate over a stable copy.
        for (const child of part.children.slice()) {
          child.position.add(part.position);
          g.add(child);
        }
      };
      if (kind === 0) {
        wing(0, 0, -d * 0.29, w, d * 0.42, h * 0.7);
        wing(-w * 0.3, 0, d * 0.21, w * 0.4, d * 0.58, h * 0.7);
      } else if (kind === 1) {
        wing(0, 0, 0, w, d, h * 0.58);
        wing(-w * 0.12, h * 0.58 + 0.6, -d * 0.16, w * 0.66, d * 0.6, h * 0.42);
      } else if (kind === 2) {
        wing(0, 0, 0, w, d, 2.5);
        wing(w * 0.13, 3.1, -d * 0.08, w * 0.56, d * 0.66, h);
      } else if (kind === 3) {
        wing(0, 0, 0, w, d, 3.3);
        for (let i = 0; i < 3; i++)
          box(
            g,
            -w * 0.28 + i * w * 0.28,
            4.2,
            0,
            w * 0.17,
            0.4,
            d * 0.6,
            mat('#a7b7b1', 'glass'),
          );
      } else office(g, w, d, h, genericFacade, true);
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
  billboard(-62, -40, 17, 6, 'facebook-lettering', '#e4ddd0');
  // Real letter-shaped buildings: red roofs, ivory walls, and glazed perimeter floors.
  let titleGroup = new THREE.Group();
  titleGroup.name = 'Title buildings';
  world.add(titleGroup);
  let letters: {
    group: THREE.Group;
    frame: THREE.Group;
    footing: THREE.Group;
    start: number;
    foundationTime: number;
    steel: { group: THREE.Group; start: number; end: number }[];
    floors: { group: THREE.Group; y: number; start: number }[];
  }[] = [];
  function rebuildTitle() {
    world.remove(titleGroup);
    titleGroup.traverse((o) => {
      if (o instanceof THREE.Mesh) o.geometry.dispose();
    });
    titleGroup = new THREE.Group();
    titleGroup.name = 'Title buildings';
    world.add(titleGroup);
    letters = [];
    deliveries.length = 0;
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
        const frame = new THREE.Group(),
          footing = new THREE.Group();
        frame.name = `Exposed steel · ${row + 1} ${char}`;
        footing.name = `Foundation · ${row + 1} ${char}`;
        frame.position.copy(g.position);
        footing.position.copy(g.position);
        titleGroup.add(frame, footing);
        const height = row === 0 ? 12.2 : 10.4;
        const count = row === 0 ? 6 : 5,
          floorHeight = height / count;
        const stage = constructionStage(row, i, word.length, count);
        const start = stage.steel;
        const steel = Array.from({ length: count }, (_, level) => {
          const group = new THREE.Group();
          group.name = `${char} · steel level ${level + 1}`;
          group.position.y = level * floorHeight;
          frame.add(group);
          return {
            group,
            start: stage.floors[level] - 0.17,
            end: stage.floors[level] + 0.12,
          };
        });
        const floors: { group: THREE.Group; y: number; start: number }[] = [];
        const extrude = (depth: number, bevel = false) => {
          const geometry = new THREE.ExtrudeGeometry(shapes, {
            depth,
            curveSegments: 8,
            bevelEnabled: bevel,
            bevelSize: 0.055,
            bevelThickness: 0.045,
            bevelSegments: 1,
          });
          geometry.rotateX(-Math.PI / 2);
          geometry.scale(1, 1, depthScale);
          return geometry;
        };
        for (let level = 0; level < count; level++) {
          const floor = new THREE.Group();
          floor.name = `${char} · rigid floor ${level + 1}`;
          floor.position.y = level * floorHeight;
          g.add(floor);
          mesh(floor, extrude(floorHeight), mat('#d9cdbb'));
          floors.push({
            group: floor,
            y: level * floorHeight,
            start: stage.floors[level],
          });
        }
        const cap = new THREE.Group();
        cap.name = `${char} · beveled red roof and dark fascia`;
        g.add(cap);
        mesh(cap, extrude(0.2), mat('#72342e'));
        mesh(cap, extrude(0.16, true), titleMat, 0, 0.16, 0);
        floors.push({ group: cap, y: height, start: stage.roof - 0.12 });
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
              for (const level of steel) {
                const rail = box(
                  level.group,
                  mx,
                  floorHeight - 0.1,
                  mz,
                  len,
                  0.1,
                  0.1,
                  '#36433f',
                );
                rail.rotation.y = angle;
              }
              if (len > 0.35) {
                const posts = Math.max(1, Math.ceil(len / 2.3));
                for (let k = 0; k < posts; k++) {
                  box(
                    footing,
                    a.x + (dx * k) / posts,
                    0.08,
                    -a.y + (dz * k) / posts,
                    0.65,
                    0.18,
                    0.65,
                    '#b5b2a0',
                  );
                  for (const level of steel)
                    box(
                      level.group,
                      a.x + (dx * k) / posts,
                      0,
                      -a.y + (dz * k) / posts,
                      0.105,
                      floorHeight,
                      0.105,
                      '#36433f',
                    );
                }
              }
              for (let level = 0; level < count; level++) {
                const floor = floors[level].group;
                const glass = mat(
                  ['#829da0', '#76959a', '#9caea9'][(i + level) % 3],
                  'glass',
                );
                const vertical = row === 1 && i >= 2 && i <= 4;
                const strip = box(
                  floor,
                  mx,
                  vertical ? 0.25 : 0.52,
                  mz,
                  len,
                  floorHeight * (vertical ? 0.77 : 0.58),
                  0.055,
                  glass,
                );
                strip.rotation.y = angle;
                if (len > 0.5) {
                  const n = Math.max(
                    1,
                    Math.round(
                      len / (vertical ? 0.7 : i % 3 === 0 ? 0.95 : 1.35),
                    ),
                  );
                  for (let k = 0; k <= n; k++)
                    box(
                      floor,
                      a.x + (dx * k) / n,
                      0.18,
                      -a.y + (dz * k) / n,
                      vertical ? 0.24 : i % 3 === 1 ? 0.16 : 0.09,
                      floorHeight - 0.2,
                      0.11,
                      '#e2d6c3',
                    );
                }
              }
            }
        }
        floors.forEach((floor) => batch(floor.group));
        batch(g);
        batch(frame);
        steel.forEach((level) => batch(level.group));
        if (
          (row === 0 && [0, 1, 4, 5, 6].includes(i)) ||
          (row === 1 && [1, 4].includes(i))
        ) {
          g.updateWorldMatrix(true, true);
          const bounds = new THREE.Box3().setFromObject(cap);
          const center = bounds.getCenter(new THREE.Vector3());
          const roof = !(row === 0 && [0, 5].includes(i));
          const tx =
            row === 0 && i === 4
              ? bounds.min.x + 0.6
              : row === 0 && i === 5
                ? bounds.max.x - 0.6
                : center.x;
          deliveries.push({
            time: roof ? stage.roof : stage.floors[2] + 0.12,
            target: [tx, roof ? height + 0.32 : 3 * floorHeight, center.z],
            row,
            index: i,
            roof,
          });
        }
        letters.push({
          group: g,
          frame,
          footing,
          start,
          foundationTime: stage.foundation,
          steel,
          floors,
        });
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
  // The previous low-rise campus is cleared before the first title foundations.
  for (let i = 0; i < 8; i++) {
    const block = new THREE.Group();
    block.name = `Previous campus · demolition ${i + 1}`;
    block.position.set(-28 + (i % 4) * 19, 0, 5 + Math.floor(i / 4) * 16);
    office(block, 13, 7, 3.6 + (i % 3) * 0.7, mat('#dfd6c7'), false);
    batch(block);
    world.add(block);
    motion.track(block, (t) => {
      const gone = smooth(3.25 + i * 0.025, 3.6 + i * 0.023, t);
      block.position.y = -7 * gone;
      block.scale.setScalar(gone >= 1 ? 0.001 : 1);
    });
    for (let chunk = 0; chunk < 3; chunk++) {
      const debris = new THREE.Group();
      debris.name = 'Demolition debris';
      box(debris, 0, 0, 0, 0.7, 0.55, 0.65, '#b8aa94');
      world.add(debris);
      motion.track(debris, (t) => {
        const p = THREE.MathUtils.clamp(
          (t - 3.28 - i * 0.025 - chunk * 0.018) / 0.46,
          0,
          1,
        );
        debris.scale.setScalar(p > 0 && p < 1 ? 1 : 0.001);
        debris.position.set(
          block.position.x + (chunk - 1) * (2 + p * 3),
          0.2 + Math.sin(p * Math.PI) * 3.7,
          block.position.z + (chunk % 2 ? -1 : 1) * p * 3,
        );
        debris.rotation.set(p * 5, p * 3, p * 4);
      });
    }
  }
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
      if (Math.abs(x - avenueX(z)) < 4.8) continue;
      if (
        Math.abs(x - coffeeSite.x) < coffeeSite.w / 2 + 2 &&
        Math.abs(z - coffeeSite.z) < coffeeSite.d / 2 + 2
      )
        continue;
      treePositions.push({ x, z, s: 1 });
    }
  const crowns = new THREE.InstancedMesh(
    new THREE.IcosahedronGeometry(1.4, 1),
    mat('#ffffff'),
    treePositions.length,
  );
  crowns.name = 'Rounded broadleaf tree crowns';
  const conifers = new THREE.InstancedMesh(
    new THREE.ConeGeometry(1.1, 4.6, 8),
    mat('#ffffff'),
    treePositions.length,
  );
  conifers.name = 'Narrow conifers';
  conifers.castShadow = conifers.receiveShadow = true;
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
    temp.scale.set(s * 1.05, (i % 3 === 0 ? 1.35 : 0.92) * s, s);
    temp.rotation.set(0, i * 1.7, 0.12);
    temp.updateMatrix();
    const broadleaf = temp.matrix.clone();
    if (i % 6 === 0) temp.scale.setScalar(0.001);
    temp.updateMatrix();
    crowns.setMatrixAt(i, temp.matrix);
    temp.matrix.copy(broadleaf);
    if (i % 6 !== 0) temp.matrix.makeScale(0.001, 0.001, 0.001);
    conifers.setMatrixAt(i, temp.matrix);
    conifers.setColorAt(i, new THREE.Color(i % 2 ? '#47682c' : '#365c29'));
    crowns.setColorAt(
      i,
      new THREE.Color(
        ['#45692c', '#55782d', '#648337', '#728f3e', '#40642c'][i % 5],
      ),
    );
    temp.position.y = 1.3 * s;
    temp.rotation.set(0, 0, 0);
    temp.scale.set(s, s, s);
    temp.updateMatrix();
    trunks.setMatrixAt(i, temp.matrix);
  });
  world.add(crowns, conifers, trunks);
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
    // Match the source's time-lapse traffic: roughly 180–280 px/s at 1080p.
    speed: 14 + rand() * 10,
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
  motion.track(helicopter, (t) => {
    const arrival = smooth(6.1, 8.0, t);
    helicopter.position.set(
      61 + (1 - arrival) * 29 + Math.sin(t * 1.7) * 0.65,
      22 + (1 - arrival) * 8 + Math.sin(t * 2.3) * 0.25,
      15 - (1 - arrival) * 18 + Math.cos(t * 1.7) * 0.65,
    );
    helicopter.rotation.y = -0.7 + arrival * 0.5;
  });
  motion.track(rotor, (t) => {
    rotor.rotation.y = t * 150;
  });
  motion.track(tailRotor, (t) => {
    tailRotor.rotation.x = t * 190;
  });
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
    pedestrian(x, z, i);
  }
  for (const x of [-44, 40])
    for (let z = -20; z < 35; z += 11) {
      if (x === 40 && z > -10 && z < 32) continue;
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
    grassMat.color.set(config.palette.grass).multiplyScalar(1.38);
    ambient.intensity = config.lighting.ambient;
    sun.intensity = config.lighting.sun;
    renderer.toneMappingExposure = config.lighting.exposure;
    ao.blendIntensity = config.lighting.occlusion;
    roadMat.color.set(config.palette.asphalt);
    genericFacade.color.set(config.palette.facade);
    titleMat.color.set(config.palette.title).multiplyScalar(0.52);
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
  function updateActors(t: number) {
    for (const b of buildings) {
      const c = config.buildings.find((c) => c.id === b.id)!;
      b.group.scale.y = c.height / b.base.height;
      if (b.id === 'fintoc')
        b.group.position.y = -(c.height + 7) * (1 - smooth(4.4, 7, t));
    }
    for (const letter of letters) {
      for (const floor of letter.floors) {
        floor.group.scale.setScalar(t < floor.start ? 0.001 : 1);
        floor.group.position.y =
          floor.y + 0.35 * (1 - smooth(floor.start, floor.start + 0.12, t));
      }
      for (const level of letter.steel) {
        level.group.scale.setScalar(
          t >= level.start && t < level.end ? 1 : 0.001,
        );
      }
      letter.footing.scale.setScalar(t >= letter.foundationTime ? 1 : 0.001);
    }
    parcelMat.color
      .set(config.palette.grass)
      .lerp(new THREE.Color('#9a8e66'), smooth(3.2, 3.75, t))
      .lerp(roadMat.color, smooth(6.45, 7.35, t));
    motion.update(t);
    for (let i = 0; i < carCount; i++) {
      const c = carRoutes[i],
        p =
          ((((c.phase * 300 +
            (t + 0.065 * Math.sin(t * 7 + c.phase * 20)) *
              c.speed *
              c.direction) %
            300) +
            300) %
            300) -
          150;
      temp.rotation.set(
        0,
        c.bridge
          ? Math.PI / 2 +
              Math.atan(p * 0.0032) +
              (c.direction < 0 ? Math.PI : 0)
          : (c.axis
              ? c.lane === 45
                ? Math.atan2(avenueX(p + 0.1) - avenueX(p - 0.1), 0.2)
                : 0
              : Math.PI / 2) + (c.direction < 0 ? Math.PI : 0),
        0,
      );
      temp.position.set(
        c.bridge
          ? p
          : c.axis
            ? (c.lane === 45 ? avenueX(p) : c.lane) + c.direction * 1.55
            : p,
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
    updateView(t);
  }
  function updateView(t: number) {
    if (!freeCamera) {
      // Measured from yU+co's plate: scale .672 → 1 over frames 0–183, then a hold.
      // This is an advancing camera with a gentle push in, not an orbit or pullback.
      const p = THREE.MathUtils.clamp(t / CAMERA_HOLD, 0, 1),
        scale = 0.672 + 0.328 * p;
      const az = THREE.MathUtils.degToRad(config.camera.azimuth),
        el = THREE.MathUtils.degToRad(config.camera.elevation);
      const pixelScale = 1080 / 73,
        dx = (1 - scale) * (3116 - 960),
        dy = (1 - scale) * (-1048 - 540);
      const right = new THREE.Vector3(Math.cos(az), 0, -Math.sin(az)),
        forward = new THREE.Vector3(Math.sin(az), 0, Math.cos(az));
      // Reframe the corrected 27°/46° view while preserving the measured push.
      const target = new THREE.Vector3(0, 3, 16)
        .addScaledVector(right, 4.9)
        .addScaledVector(forward, -9.5)
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
    const daylight = sampleDaylight(
      t,
      config.lighting.elevation,
      config.lighting.timeLapse,
    );
    sunRig.position.copy(controls.target).add(daylight.offset);
    sunRig.quaternion.copy(daylight.rotation);
    sun.color.copy(daylight.color);
    sun.intensity = config.lighting.sun * daylight.sunFactor;
    ambient.intensity = config.lighting.ambient * daylight.ambientFactor;
    atmosphere.uniforms.veil.value = daylight.haze;
    sunRig.updateMatrixWorld(true);
  }
  function render(t: number, samples = 3) {
    time = t;
    shutter.time = t;
    shutter.samples = freeCamera ? 1 : samples;
    shutter.exposure = freeCamera ? 0 : config.lighting.shutter / 24;
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
      const previousTime = time;
      const previousSelection = selection.visible;
      try {
        selection.visible = false;
        render(10.9);
        const tracks: THREE.KeyframeTrack[] = [];
        const samples = [
          ...new Set([
            ...Array.from({ length: 263 }, (_, i) => (i * 10.9) / 262),
            ...deliveries.flatMap((job) => [
              job.time - 0.588,
              job.time - 0.0001,
              job.time,
              job.time + 0.12,
            ]),
            ...letters.flatMap((letter) => [
              ...letter.floors.map((floor) => floor.start),
              ...letter.steel.flatMap((level) => [level.start, level.end]),
              letter.foundationTime,
            ]),
          ]),
        ]
          .filter((t) => t <= 10.9)
          .sort((a, b) => a - b);
        for (const item of letters) {
          for (const floor of item.floors) {
            tracks.push(
              new THREE.VectorKeyframeTrack(
                floor.group.uuid + '.scale',
                samples,
                samples.flatMap((t) =>
                  Array(3).fill(t < floor.start ? 0.001 : 1),
                ),
                THREE.InterpolateDiscrete,
              ),
            );
            tracks.push(
              new THREE.VectorKeyframeTrack(
                floor.group.uuid + '.position',
                samples,
                samples.flatMap((t) => [
                  0,
                  floor.y +
                    0.35 * (1 - smooth(floor.start, floor.start + 0.12, t)),
                  0,
                ]),
              ),
            );
          }
          for (const level of item.steel) {
            tracks.push(
              new THREE.VectorKeyframeTrack(
                level.group.uuid + '.scale',
                samples,
                samples.flatMap((t) =>
                  Array(3).fill(t >= level.start && t < level.end ? 1 : 0.001),
                ),
                THREE.InterpolateDiscrete,
              ),
            );
          }
          tracks.push(
            new THREE.VectorKeyframeTrack(
              item.footing.uuid + '.scale',
              samples,
              samples.flatMap((t) =>
                Array(3).fill(t >= item.foundationTime ? 1 : 0.001),
              ),
              THREE.InterpolateDiscrete,
            ),
          );
        }
        const hq = buildings.find((b) => b.id === 'fintoc')!,
          c = config.buildings.find((b) => b.id === 'fintoc')!;
        tracks.push(
          new THREE.VectorKeyframeTrack(
            hq.group.uuid + '.position',
            samples,
            samples.flatMap((t) => [
              c.x,
              -(c.height + 7) * (1 - smooth(4.4, 7, t)),
              c.z,
            ]),
          ),
        );
        tracks.push(...motion.bake(samples));
        tracks.push(
          new THREE.QuaternionKeyframeTrack(
            sunRig.uuid + '.quaternion',
            samples,
            samples.flatMap((t) =>
              sampleDaylight(
                t,
                config.lighting.elevation,
                config.lighting.timeLapse,
              ).rotation.toArray(),
            ),
          ),
        );
        const exportedNodes = new Set<string>();
        exportRoot.traverseVisible((node) => exportedNodes.add(node.uuid));
        const clip = new THREE.AnimationClip(
          'Silicon Valley opening',
          10.9,
          tracks.filter((track) => exportedNodes.has(track.name.split('.')[0])),
        );
        const exporter = new GLTFExporter();
        const file = await exporter.parseAsync(exportRoot, {
          binary: true,
          onlyVisible: true,
          trs: true,
          animations: [clip],
        });
        return new Blob([file as ArrayBuffer], { type: 'model/gltf-binary' });
      } finally {
        selection.visible = previousSelection;
        render(previousTime);
      }
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
      ao.gtaoMaterial.dispose();
      ao.blendMaterial.dispose();
      shutter.dispose();
      atmosphere.dispose();
      output.dispose();
      composer.dispose();
      environmentTarget.dispose();
      renderer.domElement.removeEventListener('pointerdown', onDown);
      renderer.domElement.removeEventListener('pointerup', onUp);
      const geometries = new Set<THREE.BufferGeometry>(),
        materials = new Set<THREE.Material>();
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh || o instanceof THREE.LineSegments) {
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
