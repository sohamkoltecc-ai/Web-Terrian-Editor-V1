import { useEffect, useState } from 'react';
import { useEditorStore } from '../store/editorStore';
import { commandStack } from '../core/CommandStack';

const ASSET_PLACEHOLDERS = [
  { name: 'Rock_A', glyph: '\u26F0', color: '#8a7d6b' },
  { name: 'Pine_01', glyph: '\u2668', color: '#4c7a52' },
  { name: 'Grass_Mix', glyph: '\u2766', color: '#5f9153' },
  { name: 'Cliff_Mat', glyph: '\u25A3', color: '#6d675e' },
  { name: 'Road_Asphalt', glyph: '\u2261', color: '#4a4f57' },
  { name: 'River_Mat', glyph: '\u2248', color: '#3d7ea6' },
  { name: 'Sand_Dune', glyph: '\u2591', color: '#c2a15e' },
  { name: 'Snow_Peak', glyph: '\u2744', color: '#c9d6e0' },
];

function AssetBrowser() {
  return (
    <div className="asset-grid">
      {ASSET_PLACEHOLDERS.map((a) => (
        <div className="asset-card" key={a.name} title={`${a.name} (placeholder - wire up the real asset pipeline here)`}>
          <div className="asset-thumb" style={{ background: a.color }}>
            {a.glyph}
          </div>
          <span className="asset-name">{a.name}</span>
        </div>
      ))}
    </div>
  );
}

function Console() {
  const logs = useEditorStore((s) => s.logs);
  const clearLogs = useEditorStore((s) => s.clearLogs);
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 6 }}>
        <button className="icon-btn" onClick={clearLogs} type="button">
          Clear
        </button>
      </div>
      <div className="console-log">
        {logs.map((l) => (
          <div className={`console-line ${l.level}`} key={l.id}>
            <span className="console-time">{l.time}</span>
            <span className="console-msg">{l.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function History() {
  const [state, setState] = useState(commandStack.getHistory());
  useEffect(() => commandStack.subscribe(() => setState(commandStack.getHistory())), []);

  if (state.stack.length === 0) {
    return <div className="empty-hint">No actions yet. Sculpt something to build history.</div>;
  }

  return (
    <div>
      {state.stack.map((cmd, i) => (
        <div className={`history-row${i <= state.index ? ' applied' : ''}${i === state.index ? ' current' : ''}`} key={i}>
          <span>{i + 1}.</span>
          <span>{cmd.label}</span>
        </div>
      ))}
    </div>
  );
}

export function BottomDock() {
  const bottomTab = useEditorStore((s) => s.bottomTab);
  const setBottomTab = useEditorStore((s) => s.setBottomTab);

  return (
    <div className="editor-panel">
      <div className="tab-row">
        <button className={`tab-btn${bottomTab === 'assets' ? ' active' : ''}`} onClick={() => setBottomTab('assets')} type="button">
          Asset Browser
        </button>
        <button className={`tab-btn${bottomTab === 'console' ? ' active' : ''}`} onClick={() => setBottomTab('console')} type="button">
          Console
        </button>
        <button className={`tab-btn${bottomTab === 'history' ? ' active' : ''}`} onClick={() => setBottomTab('history')} type="button">
          History
        </button>
      </div>
      <div className="panel-body">
        {bottomTab === 'assets' && <AssetBrowser />}
        {bottomTab === 'console' && <Console />}
        {bottomTab === 'history' && <History />}
      </div>
    </div>
  );
}
