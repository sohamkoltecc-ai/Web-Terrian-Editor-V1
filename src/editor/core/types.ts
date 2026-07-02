import * as THREE from 'three';

/** A single undoable action. Every mutation to editor state should go through a Command. */
export interface Command {
  label: string;
  undo: () => void;
  redo: () => void;
}

/** Brush parameters shared by every sculpt/paint tool. */
export interface BrushSettings {
  size: number;
  strength: number;
  falloff: number; // 0 = hard edge, 1 = fully soft
  opacity: number;
  spacing: number;
  noise: number;
}

export interface SculptContext {
  terrain: {
    heights: Float32Array;
    resolution: number; // vertices per side
    worldSize: number; // world units per side
    getHeight: (ix: number, iz: number) => number;
    setHeight: (ix: number, iz: number, y: number) => void;
    markDirty: () => void;
  };
  point: THREE.Vector3; // world-space brush hit point
  brush: BrushSettings;
  deltaSign: 1 | -1; // 1 = primary click, -1 = modifier (e.g. shift) inverts
}

/**
 * Plugin contract for a terrain tool. Built-in tools (Raise, Lower, Smooth...) are
 * registered through the exact same interface third-party plugins would use -
 * see toolRegistry.ts for the registration call.
 */
export interface ToolPlugin {
  id: string;
  label: string;
  icon: string; // short glyph/letter used in the toolbar until real icon assets are added
  category: 'sculpt' | 'paint' | 'spline' | 'vegetation' | 'select';
  /** Called continuously (per pointer move / stamp tick) while the tool is active and the pointer is down. */
  apply: (ctx: SculptContext) => void;
  /** Optional: called once when the stroke begins, useful for snapshotting state for undo. */
  onStrokeStart?: (ctx: SculptContext) => void;
  /** Optional: called once when the stroke ends, typically to push a Command onto the undo stack. */
  onStrokeEnd?: () => void;
}

export type RendererBackend = 'webgpu' | 'webgl2';

export type Theme = 'dark' | 'light';

export interface LogEntry {
  id: number;
  level: 'info' | 'warn' | 'error';
  message: string;
  time: string;
}
