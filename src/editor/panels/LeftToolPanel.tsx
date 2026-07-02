import { useEffect, useState } from 'react';
import { toolRegistry } from '../core/PluginRegistry';
import { useEditorStore } from '../store/editorStore';
import { Section } from '../components/Section';
import { Slider } from '../components/Slider';
import type { ToolPlugin } from '../core/types';

export function LeftToolPanel() {
  const [tools, setTools] = useState<ToolPlugin[]>([]);
  const activeToolId = useEditorStore((s) => s.activeToolId);
  const setActiveTool = useEditorStore((s) => s.setActiveTool);
  const brush = useEditorStore((s) => s.brush);
  const setBrush = useEditorStore((s) => s.setBrush);
  const log = useEditorStore((s) => s.log);

  useEffect(() => toolRegistry.subscribe(setTools), []);

  const sculptTools = tools.filter((t) => t.category === 'sculpt');

  return (
    <div className="editor-panel">
      <div className="panel-header">Tools</div>
      <div className="panel-body">
        <Section title="Sculpt">
          <div className="tool-grid">
            {sculptTools.map((tool) => (
              <div
                key={tool.id}
                className={`tool-cell${activeToolId === tool.id ? ' active' : ''}`}
                onClick={() => {
                  setActiveTool(tool.id);
                  log(`Active tool: ${tool.label}`);
                }}
              >
                <span className="glyph">{tool.icon}</span>
                <span>{tool.label}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Terrain generators">
          <div className="tool-grid">
            {['River', 'Crater', 'Mountain', 'Canyon', 'Plateau', 'Island'].map((g) => (
              <div key={g} className="tool-cell" title="Coming in a future module" style={{ opacity: 0.45, cursor: 'not-allowed' }}>
                <span className="glyph">\u2726</span>
                <span>{g}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Brush">
          <Slider label="Size" value={brush.size} min={1} max={60} step={0.5} precision={1} onChange={(v) => setBrush({ size: v })} />
          <Slider label="Strength" value={brush.strength} min={0} max={1} onChange={(v) => setBrush({ strength: v })} />
          <Slider label="Falloff" value={brush.falloff} min={0.02} max={1} onChange={(v) => setBrush({ falloff: v })} />
          <Slider label="Opacity" value={brush.opacity} min={0} max={1} onChange={(v) => setBrush({ opacity: v })} />
          <Slider label="Spacing" value={brush.spacing} min={0} max={1} onChange={(v) => setBrush({ spacing: v })} />
        </Section>

        <div className="empty-hint">
          Left-click + drag on the terrain to sculpt. Hold Shift to invert. Right-drag to orbit, middle-drag to zoom.
        </div>
      </div>
    </div>
  );
}
