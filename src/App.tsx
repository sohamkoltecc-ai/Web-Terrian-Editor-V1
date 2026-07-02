import { useEffect } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { TopToolbar } from './editor/panels/TopToolbar';
import { LeftToolPanel } from './editor/panels/LeftToolPanel';
import { RightInspector } from './editor/panels/RightInspector';
import { SceneHierarchy } from './editor/panels/SceneHierarchy';
import { BottomDock } from './editor/panels/BottomDock';
import { StatusBar } from './editor/panels/StatusBar';
import { SceneViewport } from './editor/scene/SceneViewport';
import { Minimap } from './editor/panels/Minimap';
import { useEditorStore } from './editor/store/editorStore';
import { registerBuiltInTools } from './editor/tools/toolRegistry';
import './editor/styles/theme.css';
import './editor/styles/layout.css';

registerBuiltInTools();

export default function App() {
  const theme = useEditorStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <div className="editor-root" data-theme={theme}>
      <TopToolbar />

      <PanelGroup direction="vertical" className="main-panels">
        <Panel defaultSize={78} minSize={40}>
          <PanelGroup direction="horizontal">
            <Panel defaultSize={18} minSize={13} maxSize={30}>
              <LeftToolPanel />
            </Panel>
            <PanelResizeHandle className="resize-handle resize-handle-h" />

            <Panel defaultSize={60} minSize={30}>
              <div style={{ position: 'relative', height: '100%' }}>
                <SceneViewport />
                <div className="viewport-overlay-tl">
                  <span className="viewport-chip">Scene View</span>
                  <span className="viewport-chip">200 \u00D7 200 m tile</span>
                </div>
                <Minimap />
              </div>
            </Panel>
            <PanelResizeHandle className="resize-handle resize-handle-h" />

            <Panel defaultSize={22} minSize={16} maxSize={34}>
              <PanelGroup direction="vertical">
                <Panel defaultSize={55} minSize={20}>
                  <RightInspector />
                </Panel>
                <PanelResizeHandle className="resize-handle resize-handle-v" />
                <Panel defaultSize={45} minSize={20}>
                  <SceneHierarchy />
                </Panel>
              </PanelGroup>
            </Panel>
          </PanelGroup>
        </Panel>

        <PanelResizeHandle className="resize-handle resize-handle-v" />

        <Panel defaultSize={22} minSize={12} maxSize={50}>
          <BottomDock />
        </Panel>
      </PanelGroup>

      <StatusBar />
    </div>
  );
}
