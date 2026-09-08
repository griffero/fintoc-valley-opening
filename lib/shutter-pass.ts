import * as THREE from 'three';
import { Pass, FullScreenQuad } from 'three/addons/postprocessing/Pass.js';

/** Integrate actual subframes in linear light, then run AO and tone mapping once. */
export class ShutterPass extends Pass {
  time = 0;
  samples = 3;
  exposure = 0.8 / 24;
  private sampleTarget = new THREE.WebGLRenderTarget(1, 1, {
    type: THREE.HalfFloatType,
    samples: 4,
  });
  private accumulated = new THREE.WebGLRenderTarget(1, 1, {
    type: THREE.HalfFloatType,
    depthBuffer: false,
  });
  private material = new THREE.ShaderMaterial({
    uniforms: { image: { value: null }, weight: { value: 1 } },
    vertexShader: `varying vec2 uv0; void main(){uv0=uv;gl_Position=vec4(position.xy,0.,1.);}`,
    fragmentShader: `uniform sampler2D image; uniform float weight; varying vec2 uv0;
      void main(){gl_FragColor=texture2D(image,uv0)*weight;}`,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneFactor,
    blendEquation: THREE.AddEquation,
  });
  private quad = new FullScreenQuad(this.material);
  constructor(
    private scene: THREE.Scene,
    private camera: THREE.Camera,
    private updateActors: (time: number) => void,
  ) {
    super();
    this.needsSwap = false;
  }
  setSize(width: number, height: number) {
    this.sampleTarget.setSize(width, height);
    this.accumulated.setSize(width, height);
  }
  render(
    renderer: THREE.WebGLRenderer,
    _write: THREE.WebGLRenderTarget,
    read: THREE.WebGLRenderTarget,
  ) {
    const autoClear = renderer.autoClear;
    const clearColor = renderer.getClearColor(new THREE.Color());
    const clearAlpha = renderer.getClearAlpha();
    renderer.autoClear = false;
    const count = this.exposure > 0 ? Math.max(1, Math.round(this.samples)) : 1;
    if (count === 1) {
      this.updateActors(this.time);
      renderer.setRenderTarget(read);
      renderer.clear();
      renderer.render(this.scene, this.camera);
    } else {
      renderer.setRenderTarget(this.accumulated);
      renderer.setClearColor(0x000000, 0);
      renderer.clear();
      renderer.setClearColor(clearColor, clearAlpha);
      this.material.blending = THREE.CustomBlending;
      this.material.uniforms.weight.value = 1 / count;
      for (let i = 0; i < count; i++) {
        const offset = ((i + 0.5) / count - 0.5) * this.exposure;
        this.updateActors(Math.max(0, Math.min(10.9, this.time + offset)));
        renderer.setRenderTarget(this.sampleTarget);
        renderer.clear();
        renderer.render(this.scene, this.camera);
        renderer.setRenderTarget(this.accumulated);
        this.material.uniforms.image.value = this.sampleTarget.texture;
        this.quad.render(renderer);
      }
      this.updateActors(this.time);
      this.material.blending = THREE.NoBlending;
      this.material.uniforms.weight.value = 1;
      this.material.uniforms.image.value = this.accumulated.texture;
      renderer.setRenderTarget(read);
      renderer.clear();
      this.quad.render(renderer);
    }
    renderer.autoClear = autoClear;
  }
  dispose() {
    this.sampleTarget.dispose();
    this.accumulated.dispose();
    this.material.dispose();
    this.quad.dispose();
  }
}
