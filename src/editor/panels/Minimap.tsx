import { useEffect, useRef } from 'react';
import { sceneController } from '../scene/SceneController';
import { useEditorStore } from '../store/editorStore';

export function Minimap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const showMinimap = useEditorStore((s) => s.showMinimap);

  useEffect(() => {
    if (!showMinimap) return;
    let raf = 0;
    let last = 0;

    function draw(t: number) {
      raf = requestAnimationFrame(draw);
      if (t - last < 300) return; // redraw a few times a second, not every frame
      last = t;

      const terrain = sceneController.terrain;
      const canvas = canvasRef.current;
      if (!terrain || !canvas) return;

      const res = terrain.resolution;
      if (canvas.width !== res) {
        canvas.width = res;
        canvas.height = res;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = ctx.createImageData(res, res);
      let min = Infinity;
      let max = -Infinity;
      for (let i = 0; i < terrain.heights.length; i++) {
        const h = terrain.heights[i];
        if (h < min) min = h;
        if (h > max) max = h;
      }
      const range = Math.max(0.001, max - min);

      for (let z = 0; z < res; z++) {
        for (let x = 0; x < res; x++) {
          const h = terrain.heights[z * res + x];
          const v = Math.round(((h - min) / range) * 255);
          const srcIdx = z * res + x;
          const dstIdx = srcIdx * 4;
          img.data[dstIdx] = 60 + (v * (200 - 60)) / 255;
          img.data[dstIdx + 1] = 80 + (v * (215 - 80)) / 255;
          img.data[dstIdx + 2] = 70 + (v * (200 - 70)) / 255;
          img.data[dstIdx + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
    }
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [showMinimap]);

  if (!showMinimap) return null;

  return (
    <div className="minimap">
      <span className="minimap-label">Minimap</span>
      <canvas ref={canvasRef} />
    </div>
  );
}
