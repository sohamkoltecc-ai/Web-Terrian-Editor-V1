import { toolRegistry } from '../core/PluginRegistry';
import { builtInSculptTools } from './sculptTools';

export function registerBuiltInTools() {
  builtInSculptTools.forEach((tool) => toolRegistry.register(tool));
}

/**
 * ------------------------------------------------------------------
 * Example: this is exactly how an external plugin package would hook
 * into the editor. A real plugin would live in its own npm package
 * and call `toolRegistry.register(...)` from its entry point.
 * ------------------------------------------------------------------
 *
 * import { toolRegistry } from 'terrain-editor/core/PluginRegistry';
 *
 * toolRegistry.register({
 *   id: 'my-crater-stamp',
 *   label: 'Crater Stamp',
 *   icon: 'C',
 *   category: 'sculpt',
 *   apply(ctx) {
 *     // read ctx.terrain heights, write new ones, call ctx.terrain.markDirty()
 *   },
 * });
 */
