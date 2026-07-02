import * as THREE from 'three';

export interface TerrainTileOptions {
  resolution: number; // vertices per side (e.g. 257 -> 256x256 quads)
  worldSize: number; // world units per side
}

/**
 * A single terrain tile. Multiple tiles laid out on a grid (with shared-edge stitching)
 * is how the world-partition / infinite-terrain system in the full spec would be built;
 * this scaffold ships one tile with the exact read/write API the rest of the tile grid
 * would reuse, so extending to N x N tiles is additive, not a rewrite.
 */
export class TerrainTile {
  readonly resolution: number;
  readonly worldSize: number;
  readonly heights: Float32Array;
  readonly geometry: THREE.PlaneGeometry;
  readonly mesh: THREE.Mesh;

  constructor(opts: TerrainTileOptions) {
    this.resolution = opts.resolution;
    this.worldSize = opts.worldSize;
    const segs = this.resolution - 1;

    this.geometry = new THREE.PlaneGeometry(this.worldSize, this.worldSize, segs, segs);
    this.geometry.rotateX(-Math.PI / 2);

    this.heights = new Float32Array(this.resolution * this.resolution);

    const material = new THREE.MeshStandardMaterial({
      color: 0x6b7d5a,
      roughness: 0.92,
      metalness: 0.0,
      flatShading: false,
    });

    this.mesh = new THREE.Mesh(this.geometry, material);
    this.mesh.receiveShadow = true;
    this.mesh.castShadow = true;
    this.mesh.name = 'Terrain';
    this.applyHeightsToGeometry();
  }

  index(ix: number, iz: number) {
    return iz * this.resolution + ix;
  }

  getHeight(ix: number, iz: number): number {
    if (ix < 0 || iz < 0 || ix >= this.resolution || iz >= this.resolution) return 0;
    return this.heights[this.index(ix, iz)];
  }

  setHeight(ix: number, iz: number, y: number) {
    if (ix < 0 || iz < 0 || ix >= this.resolution || iz >= this.resolution) return;
    this.heights[this.index(ix, iz)] = y;
  }

  /** Converts a world-space X/Z to the nearest vertex indices. */
  worldToGrid(x: number, z: number) {
    const half = this.worldSize / 2;
    const u = (x + half) / this.worldSize; // 0..1
    const v = (z + half) / this.worldSize; // 0..1
    const ix = Math.round(u * (this.resolution - 1));
    const iz = Math.round(v * (this.resolution - 1));
    return { ix, iz };
  }

  gridToWorld(ix: number, iz: number) {
    const half = this.worldSize / 2;
    const step = this.worldSize / (this.resolution - 1);
    return { x: ix * step - half, z: iz * step - half };
  }

  /** Push the heights array into the geometry's position attribute and recompute normals. */
  applyHeightsToGeometry() {
    const pos = this.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < this.heights.length; i++) {
      pos.setY(i, this.heights[i]);
    }
    pos.needsUpdate = true;
    this.geometry.computeVertexNormals();
    this.geometry.computeBoundingBox();
    this.geometry.computeBoundingSphere();
  }

  /** Snapshot a square sub-region of heights (used by undo commands). */
  snapshotRegion(centerIx: number, centerIz: number, radiusInVerts: number) {
    const minX = Math.max(0, centerIx - radiusInVerts);
    const maxX = Math.min(this.resolution - 1, centerIx + radiusInVerts);
    const minZ = Math.max(0, centerIz - radiusInVerts);
    const maxZ = Math.min(this.resolution - 1, centerIz + radiusInVerts);
    const w = maxX - minX + 1;
    const h = maxZ - minZ + 1;
    const data = new Float32Array(w * h);
    let k = 0;
    for (let z = minZ; z <= maxZ; z++) {
      for (let x = minX; x <= maxX; x++) {
        data[k++] = this.heights[this.index(x, z)];
      }
    }
    return { minX, minZ, w, h, data };
  }

  restoreRegion(region: { minX: number; minZ: number; w: number; h: number; data: Float32Array }) {
    let k = 0;
    for (let z = region.minZ; z < region.minZ + region.h; z++) {
      for (let x = region.minX; x < region.minX + region.w; x++) {
        this.heights[this.index(x, z)] = region.data[k++];
      }
    }
    this.applyHeightsToGeometry();
  }

  triangleCount() {
    return (this.geometry.index?.count ?? 0) / 3;
  }

  dispose() {
    this.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}
