import { useEffect, useState } from 'react';
import { IconButton } from '../components/IconButton';
import { useEditorStore } from '../store/editorStore';
import { commandStack } from '../core/CommandStack';

export function TopToolbar() {
  const theme = useEditorStore((s) => s.theme);
  const toggleTheme = useEditorStore((s) => s.toggleTheme);
  const rendererBackend = useEditorStore((s) => s.rendererBackend);
  const showMinimap = useEditorStore((s) => s.showMinimap);
  const toggleMinimap = useEditorStore((s) => s.toggleMinimap);

  const [history, setHistory] = useState(commandStack.getHistory());
  useEffect(() => commandStack.subscribe(() => setHistory(commandStack.getHistory())), []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      if (e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        commandStack.undo();
      } else if ((e.key.toLowerCase() === 'z' && e.shiftKey) || e.key.toLowerCase() === 'y') {
        e.preventDefault();
        commandStack.redo();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="toolbar">
      <div className="toolbar-brand">
        <span className="dot" />
        <span>Terrain &amp; World Editor</span>
      </div>

      <div className="toolbar-group">
        <IconButton glyph="\u21B6" label="Undo" square disabled={!history.canUndo} onClick={() => commandStack.undo()} title="Undo (Ctrl+Z)" />
        <IconButton glyph="\u21B7" label="Redo" square disabled={!history.canRedo} onClick={() => commandStack.redo()} title="Redo (Ctrl+Shift+Z)" />
      </div>

      <div className="toolbar-group">
        <IconButton glyph="\u2318" label="Scene" active title="Scene view (Game view is a future module)" />
      </div>

      <div className="toolbar-group">
        <IconButton glyph="\u25A6" label="Minimap" active={showMinimap} onClick={toggleMinimap} />
      </div>

      <div className="toolbar-spacer" />

      <div className="toolbar-status">
        <span className={`backend-pill ${rendererBackend}`}>{rendererBackend === 'webgpu' ? 'WEBGPU' : 'WEBGL2'}</span>
        <IconButton
          glyph={theme === 'dark' ? '\u263D' : '\u2600'}
          label={theme === 'dark' ? 'Dark' : 'Light'}
          onClick={toggleTheme}
          title="Toggle theme"
        />
      </div>
    </div>
  );
}
