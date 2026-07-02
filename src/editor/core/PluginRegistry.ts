import type { ToolPlugin } from './types';

type Listener = (tools: ToolPlugin[]) => void;

/**
 * Central registry every terrain/spline/vegetation tool goes through - built-in tools
 * and third-party plugins alike. This is the plugin API mentioned in the brief:
 * a plugin author imports `toolRegistry` and calls `.register(myTool)`.
 */
class PluginRegistry {
  private tools = new Map<string, ToolPlugin>();
  private listeners = new Set<Listener>();

  register(tool: ToolPlugin) {
    if (this.tools.has(tool.id)) {
      console.warn(`[PluginRegistry] Tool "${tool.id}" is already registered - overwriting.`);
    }
    this.tools.set(tool.id, tool);
    this.notify();
    return () => this.unregister(tool.id); // returned disposer, handy for hot-reloading plugins
  }

  unregister(id: string) {
    this.tools.delete(id);
    this.notify();
  }

  get(id: string) {
    return this.tools.get(id);
  }

  list(category?: ToolPlugin['category']) {
    const all = Array.from(this.tools.values());
    return category ? all.filter((t) => t.category === category) : all;
  }

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    fn(this.list());
    return () => {
      this.listeners.delete(fn);
    };
  }

  private notify() {
    const all = this.list();
    this.listeners.forEach((fn) => fn(all));
  }
}

export const toolRegistry = new PluginRegistry();
