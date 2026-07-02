import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createRenderer } from './Renderer';
import { TerrainTile } from './TerrainMesh';
import { sceneController } from './SceneController';
import { toolRegistry } from '../core/PluginRegistry';
import { commandStack } from '../core/CommandStack';
import { useEditorStore } from '../store/editorStore';
import type { SculptContext } from '../core/types';

const TERRAIN_RESOLUTION = 181; // vertices per side - kept modest for a smooth CPU sculpt loop
const TERRAIN_WORLD_SIZE = 200;

export function SceneViewport() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeToolId = useEditorStore((s) => s.activeToolId);
  const brush = useEditorStore((s) => s.brush);
  const setRendererBackend = useEditorStore((s) => s.setRendererBackend);
  const setStats = useEditorStore((s) => s.setStats);
  const log = useEditorStore((s) => s.log);

  // Keep latest tool/brush in refs so the render loop (set up once) always reads current values.
  const activeToolIdRef = useRef(activeToolId);
  const brushRef = useRef(brush);
  activeToolIdRef.current = activeToolId;
  brushRef.current = brush;

  useEffect(() => {
    let disposed = false;
    let raf = 0;

    const canvas = canvasRef.current!;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1b2129);
    scene.fog = new THREE.Fog(0x1b2129, 140, 420);

    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 2000);
    camera.position.set(90, 70, 90);

    const hemi = new THREE.HemisphereLight(0x9fb8d9, 0x39352b, 0.9);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xfff2d8, 1.4);
    sun.position.set(120, 180, 60);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -150;
    sun.shadow.camera.right = 150;
    sun.shadow.camera.top = 150;
    sun.shadow.camera.bottom = -150;
    scene.add(sun);

    const terrain = new TerrainTile({ resolution: TERRAIN_RESOLUTION, worldSize: TERRAIN_WORLD_SIZE });
    scene.add(terrain.mesh);
    sceneController.scene = scene;
    sceneController.camera = camera;
    sceneController.setTerrain(terrain);

    const grid = new THREE.GridHelper(TERRAIN_WORLD_SIZE * 1.4, 28, 0x3a4350, 0x272d36);
    grid.position.y = -0.05;
    scene.add(grid);

    // Brush cursor ring, projected onto the terrain surface each pointer move.
    const cursorGeo = new THREE.RingGeometry(1, 1.05, 48);
    cursorGeo.rotateX(-Math.PI / 2);
    const cursorMat = new THREE.MeshBasicMaterial({ color: 0x5ad1ff, transparent: true, opacity: 0.85, depthTest: false });
    const cursor = new THREE.Mesh(cursorGeo, cursorMat);
    cursor.renderOrder = 10;
    cursor.visible = false;
    scene.add(cursor);

    let controls: OrbitControls;
    let handle: Awaited<ReturnType<typeof createRenderer>> | null = null;

    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    let isStroking = false;
    let lastStampTime = 0;

    function pointerToNdc(e: PointerEvent) {
      const rect = canvas.getBoundingClientRect();
      ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    }

    function raycastTerrain(): THREE.Vector3 | null {
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObject(terrain.mesh, false);
      return hits.length ? hits[0].point.clone() : null;
    }

    function buildContext(point: THREE.Vector3, deltaSign: 1 | -1): SculptContext {
      return {
        terrain: {
          heights: terrain.heights,
          resolution: terrain.resolution,
          worldSize: terrain.worldSize,
          getHeight: (ix, iz) => terrain.getHeight(ix, iz),
          setHeight: (ix, iz, y) => terrain.setHeight(ix, iz, y),
          markDirty: () => terrain.applyHeightsToGeometry(),
        },
        point,
        brush: brushRef.current,
        deltaSign,
      };
    }

    let strokeRegion: ReturnType<TerrainTile['snapshotRegion']> | null = null;
    let strokeCenter = { ix: 0, iz: 0 };

    function onPointerDown(e: PointerEvent) {
      if (e.button !== 0) return; // left button sculpts; right/middle reserved for camera
      pointerToNdc(e);
      const point = raycastTerrain();
      if (!point) return;
      const tool = toolRegistry.get(activeToolIdRef.current);
      if (!tool) return;

      isStroking = true;
      const g = terrain.worldToGrid(point.x, point.z);
      strokeCenter = g;
      const radiusInVerts = Math.max(2, Math.round((brushRef.current.size / terrain.worldSize) * (terrain.resolution - 1)) + 2);
      strokeRegion = terrain.snapshotRegion(g.ix, g.iz, radiusInVerts);

      tool.onStrokeStart?.(buildContext(point, e.shiftKey ? -1 : 1));
      tool.apply(buildContext(point, e.shiftKey ? -1 : 1));
      canvas.setPointerCapture(e.pointerId);
    }

    function onPointerMove(e: PointerEvent) {
      pointerToNdc(e);
      const point = raycastTerrain();
      if (point) {
        cursor.visible = true;
        cursor.position.copy(point);
        cursor.position.y += 0.15;
        cursor.scale.setScalar(brushRef.current.size);
      } else {
        cursor.visible = false;
      }

      if (!isStroking || !point) return;
      const now = performance.now();
      const spacingMs = 8 + brushRef.current.spacing * 60;
      if (now - lastStampTime < spacingMs) return;
      lastStampTime = now;

      const tool = toolRegistry.get(activeToolIdRef.current);
      if (!tool) return;
      tool.apply(buildContext(point, e.shiftKey ? -1 : 1));
    }

    function onPointerUp(e: PointerEvent) {
      if (!isStroking) return;
      isStroking = false;
      const tool = toolRegistry.get(activeToolIdRef.current);
      tool?.onStrokeEnd?.();

      if (strokeRegion) {
        const before = strokeRegion;
        const radiusInVerts = Math.max(
          2,
          Math.round((brushRef.current.size / terrain.worldSize) * (terrain.resolution - 1)) + 2,
        );
        const after = terrain.snapshotRegion(strokeCenter.ix, strokeCenter.iz, radiusInVerts);
        commandStack.push({
          label: `${tool?.label ?? 'Sculpt'} stroke`,
          undo: () => terrain.restoreRegion(before),
          redo: () => terrain.restoreRegion(after),
        });
        strokeRegion = null;
        sceneController.notifyTerrain();
      }
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        /* no-op */
      }
    }

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    function resize() {
      const parent = canvas.parentElement;
      if (!parent) return;
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      camera.aspect = w / Math.max(1, h);
      camera.updateProjectionMatrix();
      handle?.renderer.setSize(w, h, false);
    }
    const resizeObserver = new ResizeObserver(resize);
    if (canvas.parentElement) resizeObserver.observe(canvas.parentElement);

    let frames = 0;
    let lastFpsTime = performance.now();

    createRenderer(canvas).then((h) => {
      if (disposed) return;
      handle = h;
      setRendererBackend(h.backend);
      sceneController.backend = h.backend;
      log(`Renderer ready: ${h.backend === 'webgpu' ? 'WebGPU' : 'WebGL2 (fallback)'}`, 'info');

      controls = new OrbitControls(camera, canvas);
      controls.mouseButtons = {
        LEFT: null as unknown as THREE.MOUSE, // reserved for sculpting
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.ROTATE,
      };
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.target.set(0, 4, 0);
      controls.minDistance = 15;
      controls.maxDistance = 400;
      controls.maxPolarAngle = Math.PI * 0.49;

      resize();

      const loop = () => {
        if (disposed) return;
        controls.update();
        handle!.render(scene, camera);

        frames++;
        const now = performance.now();
        if (now - lastFpsTime >= 500) {
          setStats({
            fps: Math.round((frames * 1000) / (now - lastFpsTime)),
            triangles: Math.round(terrain.triangleCount()),
            drawCalls: (handle!.renderer as any).info?.render?.calls ?? 0,
          });
          frames = 0;
          lastFpsTime = now;
        }
        raf = requestAnimationFrame(loop);
      };
      loop();
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      controls?.dispose();
      terrain.dispose();
      cursorGeo.dispose();
      cursorMat.dispose();
      handle?.dispose();
    };
    // Intentionally run once - tool/brush changes are read via refs so the scene isn't torn down per keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="viewport-host">
      <canvas ref={canvasRef} className="viewport-canvas" />
    </div>
  );
}
