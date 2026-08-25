import { create } from 'zustand';
import api from '../lib/api';

export const useWorkflowStore = create((set, get) => ({
  workflow: null,
  nodes: [],
  edges: [],
  selectedNode: null,
  isGenerating: false,
  isSaving: false,
  isExecuting: false,
  error: null,

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  onNodesChange: (changes) => {
    // Handle React Flow node changes
    set((state) => {
      let updatedNodes = [...state.nodes];
      changes.forEach((change) => {
        if (change.type === 'position' && change.position) {
          updatedNodes = updatedNodes.map((n) =>
            n.id === change.id ? { ...n, position: change.position } : n
          );
        } else if (change.type === 'remove') {
          updatedNodes = updatedNodes.filter((n) => n.id !== change.id);
        } else if (change.type === 'select') {
          if (change.selected) {
            const found = updatedNodes.find((n) => n.id === change.id);
            set({ selectedNode: found || null });
          }
        }
      });
      return { nodes: updatedNodes };
    });
  },

  onEdgesChange: (changes) => {
    set((state) => {
      let updatedEdges = [...state.edges];
      changes.forEach((change) => {
        if (change.type === 'remove') {
          updatedEdges = updatedEdges.filter((e) => e.id !== change.id);
        }
      });
      return { edges: updatedEdges };
    });
  },

  onConnect: (connection) => {
    const newEdge = {
      id: `e_${connection.source}_${connection.target}_${Date.now()}`,
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle,
      targetHandle: connection.targetHandle,
      animated: true,
      style: { stroke: '#6366f1', strokeWidth: 2.5 },
    };
    set((state) => ({ edges: [...state.edges, newEdge] }));
  },

  addNodeFromPalette: (item, position = { x: 250, y: 150 }) => {
    const newId = `node_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newNode = {
      id: newId,
      type: item.type,
      position,
      data: {
        label: item.label,
        description: item.description,
        icon: item.icon,
        category: item.category,
        config: { ...item.defaultConfig },
      },
    };

    set((state) => ({
      nodes: [...state.nodes, newNode],
      selectedNode: newNode,
    }));
  },

  setSelectedNode: (node) => set({ selectedNode: node }),

  updateSelectedNodeConfig: (key, value) => {
    const { selectedNode, nodes } = get();
    if (!selectedNode) return;

    const updatedConfig = {
      ...(selectedNode.data?.config || {}),
      [key]: value,
    };

    const updatedNode = {
      ...selectedNode,
      data: {
        ...selectedNode.data,
        config: updatedConfig,
      },
    };

    const updatedNodes = nodes.map((n) => (n.id === selectedNode.id ? updatedNode : n));
    set({ nodes: updatedNodes, selectedNode: updatedNode });
  },

  updateSelectedNodeLabel: (label) => {
    const { selectedNode, nodes } = get();
    if (!selectedNode) return;

    const updatedNode = {
      ...selectedNode,
      data: {
        ...selectedNode.data,
        label,
      },
    };

    const updatedNodes = nodes.map((n) => (n.id === selectedNode.id ? updatedNode : n));
    set({ nodes: updatedNodes, selectedNode: updatedNode });
  },

  deleteNode: (nodeId) => {
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== nodeId),
      edges: state.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
      selectedNode: state.selectedNode?.id === nodeId ? null : state.selectedNode,
    }));
  },

  clearCanvas: () => {
    set({
      workflow: null,
      nodes: [],
      edges: [],
      selectedNode: null,
      error: null,
    });
  },

  loadWorkflow: async (id) => {
    set({ isSaving: true, error: null });
    try {
      const res = await api.get(`/workflows/${id}`);
      const wf = res.data.workflow;
      set({
        workflow: wf,
        nodes: wf.nodes || [],
        edges: wf.edges || [],
        selectedNode: null,
        isSaving: false,
      });
      return wf;
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to load workflow';
      set({ error: msg, isSaving: false });
      throw err;
    }
  },

  saveCurrentWorkflow: async (name, description, status = 'active') => {
    const { workflow, nodes, edges } = get();
    set({ isSaving: true, error: null });
    try {
      if (workflow && (workflow._id || workflow.id)) {
        const id = workflow._id || workflow.id;
        const res = await api.put(`/workflows/${id}`, {
          name: name || workflow.name,
          description: description !== undefined ? description : workflow.description,
          status,
          nodes,
          edges,
          triggerConfig: nodes.length > 0 && nodes[0].type.startsWith('trigger_')
            ? { type: nodes[0].type.replace('trigger_', ''), config: nodes[0].data?.config }
            : { type: 'manual', config: {} }
        });
        set({ workflow: res.data.workflow, isSaving: false });
        return res.data.workflow;
      } else {
        const res = await api.post('/workflows', {
          name: name || 'New Agentic Workflow',
          description: description || 'Visual multi-agent automation workflow',
          status,
          nodes,
          edges,
          triggerConfig: nodes.length > 0 && nodes[0].type.startsWith('trigger_')
            ? { type: nodes[0].type.replace('trigger_', ''), config: nodes[0].data?.config }
            : { type: 'manual', config: {} }
        });
        set({ workflow: res.data.workflow, isSaving: false });
        return res.data.workflow;
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to save workflow';
      set({ error: msg, isSaving: false });
      throw err;
    }
  },

  generateFromPrompt: async (prompt) => {
    set({ isGenerating: true, error: null });
    try {
      const res = await api.post('/workflows/generate', { prompt });
      const generated = res.data.workflow;

      set({
        workflow: {
          name: generated.name,
          description: generated.description,
          tags: generated.tags,
          generator: generated.generator,
        },
        nodes: generated.nodes || [],
        edges: generated.edges || [],
        selectedNode: (generated.nodes && generated.nodes[0]) || null,
        isGenerating: false,
      });

      return generated;
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Workflow generation failed';
      set({ error: msg, isGenerating: false });
      throw err;
    }
  },
}));
