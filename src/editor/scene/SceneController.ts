import * as THREE from 'three';
import type { TerrainTile } from './TerrainMesh';
import type { RendererBackend } from '../core/types';

type TerrainListener = () => void;

/**
 * Holds references the rest of the UI needs but shouldn't own directly (the terrain tile,
 * the three.js camera/scene). Panels like the Minimap or Scene Hierarchy subscribe here
 * instead of reaching into the viewport component.
 */
class SceneController {
  scene: THREE.Scene | null = null;
  camera: THREE.PerspectiveCamera | null = null;
  terrain: TerrainTile | null = null;
  backend: RendererBackend = 'webgl2';

  private terrainListeners = new Set<TerrainListener>();

  setTerrain(tile: TerrainTile) {
    this.terrain = tile;
    this.notifyTerrain();
  }

  notifyTerrain() {
    this.terrainListeners.forEach((fn) => fn());
  }

  onTerrainChange(fn: TerrainListener) {
    this.terrainListeners.add(fn);
    return () => {
      this.terrainListeners.delete(fn);
    };
  }
}

export const sceneController = new SceneController();
