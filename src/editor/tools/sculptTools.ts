import type { SculptContext, ToolPlugin } from '../core/types';

/** Smooth radial falloff: 1 at brush center, 0 at brush edge. `falloff` softens the edge. */
function falloffWeight(distNormalized: number, falloff: number) {
  if (distNormalized >= 1) return 0;
  const edge = Math.max(0.001, falloff);
  const t = THREE_smoothstep(1, 1 - edge, distNormalized);
  return t;
}

// Local smoothstep so we don't need to import all of three.js MathUtils here.
function THREE_smoothstep(min: number, max: number, value: number) {
  const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return x * x * (3 - 2 * x);
}

function forEachVertexInBrush(ctx: SculptContext, fn: (ix: number, iz: number, weight: number) => void) {
  const { terrain, point, brush } = ctx;
  const center = terrainWorldToGridFloat(terrain, point.x, point.z);
  const step = terrain.worldSize / (terrain.resolution - 1);
  const radiusInVerts = Math.max(1, Math.round(brush.size / step));

  const cix = Math.round(center.ix);
  const ciz = Math.round(center.iz);

  for (let iz = ciz - radiusInVerts; iz <= ciz + radiusInVerts; iz++) {
    for (let ix = cix - radiusInVerts; ix <= cix + radiusInVerts; ix++) {
      if (ix < 0 || iz < 0 || ix >= terrain.resolution || iz >= terrain.resolution) continue;
      const dx = ix - center.ix;
      const dz = iz - center.iz;
      const dist = Math.sqrt(dx * dx + dz * dz) / radiusInVerts;
      const w = falloffWeight(dist, ctx.brush.falloff);
      if (w <= 0) continue;
      fn(ix, iz, w);
    }
  }
}

function terrainWorldToGridFloat(terrain: SculptContext['terrain'], x: number, z: number) {
  const half = terrain.worldSize / 2;
  const step = terrain.worldSize / (terrain.resolution - 1);
  return { ix: (x + half) / step, iz: (z + half) / step };
}

export const raiseTool: ToolPlugin = {
  id: 'raise',
  label: 'Raise',
  icon: '\u25B2',
  category: 'sculpt',
  apply(ctx) {
    const amount = ctx.brush.strength * ctx.brush.opacity * ctx.deltaSign * 0.6;
    forEachVertexInBrush(ctx, (ix, iz, w) => {
      terrainSetHeightClamped(ctx, ix, iz, ctx.terrain.getHeight(ix, iz) + amount * w);
    });
    ctx.terrain.markDirty();
  },
};

export const lowerTool: ToolPlugin = {
  id: 'lower',
  label: 'Lower',
  icon: '\u25BC',
  category: 'sculpt',
  apply(ctx) {
    const amount = ctx.brush.strength * ctx.brush.opacity * ctx.deltaSign * 0.6;
    forEachVertexInBrush(ctx, (ix, iz, w) => {
      terrainSetHeightClamped(ctx, ix, iz, ctx.terrain.getHeight(ix, iz) - amount * w);
    });
    ctx.terrain.markDirty();
  },
};

export const smoothTool: ToolPlugin = {
  id: 'smooth',
  label: 'Smooth',
  icon: '\u2248',
  category: 'sculpt',
  apply(ctx) {
    const { terrain } = ctx;
    const targets: { ix: number; iz: number; w: number }[] = [];
    forEachVertexInBrush(ctx, (ix, iz, w) => targets.push({ ix, iz, w }));
    // Read all original heights first so the averaging pass doesn't feed on its own output.
    const originals = targets.map((t) => terrain.getHeight(t.ix, t.iz));
    targets.forEach((t, i) => {
      const avg =
        (terrain.getHeight(t.ix - 1, t.iz) +
          terrain.getHeight(t.ix + 1, t.iz) +
          terrain.getHeight(t.ix, t.iz - 1) +
          terrain.getHeight(t.ix, t.iz + 1) +
          originals[i]) /
        5;
      const blended = originals[i] + (avg - originals[i]) * t.w * ctx.brush.strength * ctx.brush.opacity;
      terrainSetHeightClamped(ctx, t.ix, t.iz, blended);
    });
    ctx.terrain.markDirty();
  },
};

let flattenTargetHeight = 0;

export const flattenTool: ToolPlugin = {
  id: 'flatten',
  label: 'Flatten',
  icon: '\u2500',
  category: 'sculpt',
  onStrokeStart(ctx) {
    const g = terrainWorldToGridFloat(ctx.terrain, ctx.point.x, ctx.point.z);
    flattenTargetHeight = ctx.terrain.getHeight(Math.round(g.ix), Math.round(g.iz));
  },
  apply(ctx) {
    forEachVertexInBrush(ctx, (ix, iz, w) => {
      const h = ctx.terrain.getHeight(ix, iz);
      const blended = h + (flattenTargetHeight - h) * w * ctx.brush.strength * ctx.brush.opacity;
      terrainSetHeightClamped(ctx, ix, iz, blended);
    });
    ctx.terrain.markDirty();
  },
};

export const noiseTool: ToolPlugin = {
  id: 'noise',
  label: 'Noise',
  icon: '\u2731',
  category: 'sculpt',
  apply(ctx) {
    const amount = ctx.brush.strength * ctx.brush.opacity * 0.4 * (ctx.brush.noise || 1);
    forEachVertexInBrush(ctx, (ix, iz, w) => {
      const n = hash2D(ix, iz) * 2 - 1;
      terrainSetHeightClamped(ctx, ix, iz, ctx.terrain.getHeight(ix, iz) + n * amount * w);
    });
    ctx.terrain.markDirty();
  },
};

function hash2D(x: number, z: number) {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453123;
  return s - Math.floor(s);
}

function terrainSetHeightClamped(ctx: SculptContext, ix: number, iz: number, y: number) {
  const clamped = Math.max(-80, Math.min(200, y));
  ctx.terrain.setHeight(ix, iz, clamped);
}

export const builtInSculptTools: ToolPlugin[] = [raiseTool, lowerTool, smoothTool, flattenTool, noiseTool];
