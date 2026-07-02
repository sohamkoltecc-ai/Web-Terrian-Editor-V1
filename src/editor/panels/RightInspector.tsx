import { useEffect, useState } from 'react';
import { useEditorStore } from '../store/editorStore';
import { Section } from '../components/Section';
import { toolRegistry } from '../core/PluginRegistry';

export function RightInspector() {
  const activeToolId = useEditorStore((s) => s.activeToolId);
  const [toolLabel, setToolLabel] = useState('');

  useEffect(() => {
    return toolRegistry.subscribe(() => {
      setToolLabel(toolRegistry.get(activeToolId)?.label ?? activeToolId);
    });
  }, [activeToolId]);

  return (
    <div className="editor-panel">
      <div className="panel-header">Properties</div>
      <div className="panel-body">
        <Section title="Active tool">
          <div className="tree-row" style={{ paddingLeft: 0 }}>
            <span className="dot" style={{ background: 'var(--accent)' }} />
            <span>{toolLabel || activeToolId}</span>
          </div>
        </Section>

        <Section title="Terrain">
          <div className="slider-row">
            <div className="slider-label-row">
              <span>Resolution</span>
              <span className="slider-value">181 \u00D7 181</span>
            </div>
          </div>
          <div className="slider-row">
            <div className="slider-label-row">
              <span>World size</span>
              <span className="slider-value">200 \u00D7 200 m</span>
            </div>
          </div>
          <div className="slider-row">
            <div className="slider-label-row">
              <span>Tiles</span>
              <span className="slider-value">1 (single tile)</span>
            </div>
          </div>
        </Section>

        <Section title="Rendering">
          <div className="slider-row">
            <div className="slider-label-row">
              <span>Shadows</span>
              <span className="slider-value">On</span>
            </div>
          </div>
          <div className="slider-row">
            <div className="slider-label-row">
              <span>LOD</span>
              <span className="slider-value">Single (streaming planned)</span>
            </div>
          </div>
        </Section>

        <div className="empty-hint">
          Per-layer material properties (diffuse / normal / roughness / AO) appear here once the
          texture-painting module is wired up.
        </div>
      </div>
    </div>
  );
}
