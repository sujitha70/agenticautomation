const BaseAgent = require('./baseAgent');

class PlannerAgent extends BaseAgent {
  constructor() {
    super('planner', 'Graph Topology & Execution Planning');
  }

  async planExecution({ executionId, workflowId, workflowSnapshot, inputPayload = {} }) {
    const { nodes = [], edges = [] } = workflowSnapshot;

    await this.logEvent({
      executionId,
      workflowId,
      eventType: 'PLANNING_STARTED',
      message: `Planner Agent analyzing workflow with ${nodes.length} nodes and ${edges.length} connections.`,
      metadata: { nodeCount: nodes.length, edgeCount: edges.length }
    });

    if (nodes.length === 0) {
      throw new Error('PLAN_ERROR: Workflow contains no nodes to execute.');
    }

    // 1. Build adjacency list and in-degree map for topological sort
    const adj = new Map();
    const inDegree = new Map();
    const nodeMap = new Map();

    nodes.forEach((n) => {
      nodeMap.set(n.id, n);
      adj.set(n.id, []);
      inDegree.set(n.id, 0);
    });

    edges.forEach((e) => {
      if (adj.has(e.source) && adj.has(e.target)) {
        adj.get(e.source).push({ target: e.target, label: e.label || '' });
        inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
      }
    });

    // 2. Identify start/trigger nodes
    const queue = [];
    inDegree.forEach((deg, nodeId) => {
      if (deg === 0) {
        queue.push(nodeId);
      }
    });

    // If no zero in-degree node found (e.g. cycle), pick the first trigger or node_1
    if (queue.length === 0) {
      const triggerNode = nodes.find(n => n.type && n.type.startsWith('trigger_')) || nodes[0];
      queue.push(triggerNode.id);
    }

    // 3. Topological sorting
    const executionOrder = [];
    const visited = new Set();

    while (queue.length > 0) {
      const currentId = queue.shift();
      if (visited.has(currentId)) continue;
      visited.add(currentId);
      executionOrder.push(currentId);

      const neighbors = adj.get(currentId) || [];
      for (const edge of neighbors) {
        const nextId = edge.target;
        const currentDeg = inDegree.get(nextId) - 1;
        inDegree.set(nextId, currentDeg);
        if (currentDeg <= 0 && !visited.has(nextId)) {
          queue.push(nextId);
        }
      }
    }

    // Add any remaining disconnected nodes
    nodes.forEach(n => {
      if (!visited.has(n.id)) {
        executionOrder.push(n.id);
      }
    });

    // 4. Calculate Confidence Score based on node configuration completeness
    let configuredNodes = 0;
    nodes.forEach((n) => {
      const config = (n.data && n.data.config) || {};
      const keys = Object.keys(config);
      if (keys.length > 0 || n.type.startsWith('trigger_')) configuredNodes++;
    });

    const confidenceScore = Number((configuredNodes / nodes.length).toFixed(2));

    const plan = {
      executionOrder,
      nodeMap: Object.fromEntries(nodeMap),
      adjList: Object.fromEntries(adj),
      confidenceScore,
      totalSteps: executionOrder.length,
      estimatedDurationMs: executionOrder.length * 800,
    };

    await this.remember(executionId, workflowId, 'execution_plan', plan, confidenceScore);

    await this.logEvent({
      executionId,
      workflowId,
      level: 'success',
      eventType: 'PLAN_GENERATED',
      message: `Planner Agent created execution path of ${executionOrder.length} steps with confidence ${(confidenceScore * 100).toFixed(0)}%.`,
      metadata: { executionOrder, confidenceScore }
    });

    return plan;
  }
}

module.exports = new PlannerAgent();
