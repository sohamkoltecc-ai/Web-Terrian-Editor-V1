import { create } from 'zustand';
import type { BrushSettings, LogEntry, RendererBackend, Theme } from '../core/types';

interface Stats {
  fps: number;
  triangles: number;
  drawCalls: number;
}

interface EditorState {
  theme: Theme;
  toggleTheme: () => void;

  rendererBackend: RendererBackend;
  setRendererBackend: (b: RendererBackend) => void;

  activeToolId: string;
  setActiveTool: (id: string) => void;

  brush: BrushSettings;
  setBrush: (patch: Partial<BrushSettings>) => void;

  stats: Stats;
  setStats: (s: Stats) => void;

  logs: LogEntry[];
  log: (message: string, level?: LogEntry['level']) => void;
  clearLogs: () => void;

  bottomTab: 'assets' | 'console' | 'history';
  setBottomTab: (t: 'assets' | 'console' | 'history') => void;

  showMinimap: boolean;
  toggleMinimap: () => void;
}

let logId = 0;

export const useEditorStore = create<EditorState>((set) => ({
  theme: 'dark',
  toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),

  rendererBackend: 'webgl2',
  setRendererBackend: (b) => set({ rendererBackend: b }),

  activeToolId: 'raise',
  setActiveTool: (id) => set({ activeToolId: id }),

  brush: { size: 12, strength: 0.5, falloff: 0.6, opacity: 1, spacing: 0.15, noise: 0 },
  setBrush: (patch) => set((s) => ({ brush: { ...s.brush, ...patch } })),

  stats: { fps: 0, triangles: 0, drawCalls: 0 },
  setStats: (stats) => set({ stats }),

  logs: [{ id: -1, level: 'info', message: 'Editor initialized.', time: new Date().toLocaleTimeString() }],
  log: (message, level = 'info') =>
    set((s) => ({
      logs: [...s.logs.slice(-199), { id: logId++, message, level, time: new Date().toLocaleTimeString() }],
    })),
  clearLogs: () => set({ logs: [] }),

  bottomTab: 'console',
  setBottomTab: (t) => set({ bottomTab: t }),

  showMinimap: true,
  toggleMinimap: () => set((s) => ({ showMinimap: !s.showMinimap })),
}));
