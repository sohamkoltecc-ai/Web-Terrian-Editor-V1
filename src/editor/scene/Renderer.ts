import * as THREE from 'three';
import type { RendererBackend } from '../core/types';

export interface RendererHandle {
  backend: RendererBackend;
  renderer: THREE.WebGLRenderer | (THREE.WebGLRenderer & { init: () => Promise<void> });
  /** Three's WebGPURenderer.render() can be async under the hood; this normalizes both paths. */
  render: (scene: THREE.Scene, camera: THREE.Camera) => void;
  dispose: () => void;
}

/**
 * Creates the best available renderer for this browser: WebGPU when the device and
 * browser support it, otherwise a standard WebGL2 renderer. Both paths expose the
 * same THREE.Scene/Camera API, so the rest of the app never branches on backend.
 */
export async function createRenderer(canvas: HTMLCanvasElement): Promise<RendererHandle> {
  const hasWebGPU = typeof navigator !== 'undefined' && 'gpu' in navigator;

  if (hasWebGPU) {
    try {
      const { WebGPURenderer } = await import('three/webgpu');
      const renderer = new WebGPURenderer({ canvas, antialias: true }) as unknown as THREE.WebGLRenderer & {
        init: () => Promise<void>;
      };
      await renderer.init();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      return {
        backend: 'webgpu',
        renderer,
        render: (scene, camera) => renderer.render(scene as any, camera as any),
        dispose: () => renderer.dispose(),
      };
    } catch (err) {
      console.warn('[Renderer] WebGPU init failed, falling back to WebGL2:', err);
    }
  }

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  return {
    backend: 'webgl2',
    renderer,
    render: (scene, camera) => renderer.render(scene, camera),
    dispose: () => renderer.dispose(),
  };
}
