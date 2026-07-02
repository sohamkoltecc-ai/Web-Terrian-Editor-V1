import { useEditorStore } from '../store/editorStore';

export function StatusBar() {
  const stats = useEditorStore((s) => s.stats);
  const rendererBackend = useEditorStore((s) => s.rendererBackend);
  const activeToolId = useEditorStore((s) => s.activeToolId);

  return (
    <div className="status-bar">
      <span>
        FPS <span className="accent">{stats.fps}</span>
      </span>
      <span className="sep">|</span>
      <span>Tris {stats.triangles.toLocaleString()}</span>
      <span className="sep">|</span>
      <span>Draw calls {stats.drawCalls}</span>
      <span className="sep">|</span>
      <span>Backend {rendererBackend.toUpperCase()}</span>
      <span className="sep">|</span>
      <span>Tool {activeToolId}</span>
    </div>
  );
}
