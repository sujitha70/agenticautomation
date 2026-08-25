import React, { useCallback, useRef } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { nodeTypes } from './NodeTypes';
import { useWorkflowStore } from '../../store/workflowStore';

function FlowCanvas({ onNodeSelect }) {
  const reactFlowWrapper = useRef(null);
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNodeFromPalette,
    setSelectedNode,
  } = useWorkflowStore();

  const { screenToFlowPosition } = useReactFlow();

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const rawData = event.dataTransfer.getData('application/agentflow-node');
      if (!rawData) return;

      try {
        const item = JSON.parse(rawData);
        const position = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });

        addNodeFromPalette(item, position);
      } catch (err) {
        console.error('Failed to parse dropped node data:', err);
      }
    },
    [screenToFlowPosition, addNodeFromPalette]
  );

  const handleNodeClick = useCallback(
    (event, node) => {
      setSelectedNode(node);
      if (onNodeSelect) onNodeSelect(node);
    },
    [setSelectedNode, onNodeSelect]
  );

  const handlePaneClick = useCallback(() => {
    setSelectedNode(null);
    if (onNodeSelect) onNodeSelect(null);
  }, [setSelectedNode, onNodeSelect]);

  return (
    <div className="w-full h-full relative" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        onDragOver={onDragOver}
        onDrop={onDrop}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={2}
        defaultEdgeOptions={{
          animated: true,
          style: { stroke: '#6366f1', strokeWidth: 2.5 },
        }}
      >
        <Controls className="!bg-[#0f1424] !border-[#1e273c] !text-slate-200 fill-slate-300" />
        <MiniMap
          nodeColor={(node) => {
            if (node.type?.startsWith('trigger_')) return '#10b981';
            if (node.type?.startsWith('ai_')) return '#a855f7';
            if (node.type?.startsWith('action_')) return '#3b82f6';
            return '#f59e0b';
          }}
          maskColor="rgba(9, 13, 22, 0.75)"
          className="!bg-[#0d121f] !border-[#1e273c]"
        />
        <Background variant={BackgroundVariant.Dots} gap={18} size={1.2} color="#1b2438" />
      </ReactFlow>

      {nodes.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-6 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <span className="text-2xl font-bold">+</span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-200">Empty Automation Canvas</h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              Drag nodes from the left palette or describe your automation with the AI generator to auto-build the graph.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function WorkflowCanvas(props) {
  return (
    <ReactFlowProvider>
      <FlowCanvas {...props} />
    </ReactFlowProvider>
  );
}
