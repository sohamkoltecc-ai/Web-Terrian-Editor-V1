import { useEffect, useState } from 'react';
import { sceneController } from '../scene/SceneController';

interface Row {
  id: string;
  label: string;
}

export function SceneHierarchy() {
  const [selected, setSelected] = useState('terrain-0');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsub = sceneController.onTerrainChange(() => setReady(!!sceneController.terrain));
    setReady(!!sceneController.terrain);
    return unsub;
  }, []);

  const rows: Row[] = [
    { id: 'terrain-0', label: 'Terrain Tile [0,0]' },
    { id: 'sun', label: 'Directional Light (Sun)' },
    { id: 'hemi', label: 'Hemisphere Light' },
    { id: 'grid', label: 'Reference Grid' },
    { id: 'camera', label: 'Scene Camera' },
  ];

  return (
    <div className="editor-panel">
      <div className="panel-header">Scene Hierarchy</div>
      <div className="panel-body">
        {rows.map((r) => (
          <div key={r.id} className={`tree-row${selected === r.id ? ' selected' : ''}`} onClick={() => setSelected(r.id)}>
            <span className="dot" />
            <span>{r.label}</span>
          </div>
        ))}
        {!ready && <div className="empty-hint">Loading scene\u2026</div>}
      </div>
    </div>
  );
}
