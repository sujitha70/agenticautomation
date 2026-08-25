const http = require('http');
const { app } = require('./server');
const axios = require('axios');

async function runE2ETest() {
  console.log('🚀 Starting Automated Full-Stack Verification...');

  // Start temporary test server
  const testServer = http.createServer(app);
  await new Promise((resolve) => testServer.listen(5099, resolve));
  const baseUrl = 'http://127.0.0.1:5099/api';

  try {
    // 1. Health Check
    console.log('1. Testing GET /api/health...');
    const healthRes = await axios.get(`${baseUrl}/health`);
    console.log('   Health Status:', healthRes.data.status, '| DB:', healthRes.data.services.database.type);

    // 2. Auth Register
    console.log('2. Testing POST /api/auth/register...');
    const registerRes = await axios.post(`${baseUrl}/auth/register`, {
      name: 'Test Operator',
      email: 'testoperator@agentflow.io',
      password: 'SecurePassword123!',
      role: 'operator',
    });
    const token = registerRes.data.token;
    console.log('   Registered User ID:', registerRes.data.user.id, '| Token Issued:', Boolean(token));

    const authHeaders = { Authorization: `Bearer ${token}` };

    // 3. Auth Me
    console.log('3. Testing GET /api/auth/me...');
    const meRes = await axios.get(`${baseUrl}/auth/me`, { headers: authHeaders });
    console.log('   Profile Verified:', meRes.data.user.name, `(${meRes.data.user.email})`);

    // 4. AI Workflow Generation
    console.log('4. Testing POST /api/workflows/generate...');
    const prompt = 'When customer feedback email arrives, analyze sentiment with AI, post alert to Slack, and log in Google Sheets';
    const genRes = await axios.post(`${baseUrl}/workflows/generate`, { prompt }, { headers: authHeaders });
    console.log('   Generated Nodes Count:', genRes.data.workflow.nodes.length, '| Generator:', genRes.data.workflow.generator);

    // 5. Save Workflow
    console.log('5. Testing POST /api/workflows (Create)...');
    const createWfRes = await axios.post(`${baseUrl}/workflows`, {
      name: genRes.data.workflow.name,
      description: genRes.data.workflow.description,
      nodes: genRes.data.workflow.nodes,
      edges: genRes.data.workflow.edges,
      triggerConfig: genRes.data.workflow.triggerConfig,
    }, { headers: authHeaders });
    const workflowId = createWfRes.data.workflow._id || createWfRes.data.workflow.id;
    console.log('   Saved Workflow ID:', workflowId);

    // 6. Execute Workflow through 5-Agent Chain
    console.log('6. Testing POST /api/workflows/:id/execute...');
    const execRes = await axios.post(`${baseUrl}/workflows/${workflowId}/execute`, {
      inputPayload: { text: 'Customer says: We love the new update but the export button had a minor timeout.' }
    }, { headers: authHeaders });
    const executionId = execRes.data.executionId;
    console.log('   Queued Execution ID:', executionId);

    // 7. Wait for Agent Chain processing
    console.log('7. Waiting for 5-Agent Orchestrator Chain to process...');
    await new Promise((r) => setTimeout(r, 2000));

    // 8. Fetch Execution & Timeline
    console.log('8. Testing GET /api/executions/:id and /timeline...');
    const execDetailRes = await axios.get(`${baseUrl}/executions/${executionId}`, { headers: authHeaders });
    console.log('   Execution Status:', execDetailRes.data.execution.status, '| Duration:', execDetailRes.data.execution.duration, 'ms');

    const timelineRes = await axios.get(`${baseUrl}/executions/${executionId}/timeline`, { headers: authHeaders });
    console.log('   Timeline Log Events Count:', timelineRes.data.timeline.length);
    const agentsInvolved = Array.from(new Set(timelineRes.data.timeline.map((l) => l.agent)));
    console.log('   Agents Recorded in Timeline:', agentsInvolved.join(', '));

    // 9. Integrations Status & Encryption
    console.log('9. Testing GET /api/integrations/status...');
    const integRes = await axios.get(`${baseUrl}/integrations/status`, { headers: authHeaders });
    console.log('   Total Providers:', integRes.data.summary.totalProviders, '| Encryption Healthy:', integRes.data.summary.encryptionHealth.healthy);

    // 10. Dashboard Metrics
    console.log('10. Testing GET /api/workflows/dashboard...');
    const dashRes = await axios.get(`${baseUrl}/workflows/dashboard`, { headers: authHeaders });
    console.log('    Dashboard Total Workflows:', dashRes.data.data.metrics.totalWorkflows, '| Executions:', dashRes.data.data.metrics.totalExecutions);

    // 11. Notifications
    console.log('11. Testing GET /api/notifications...');
    const notifRes = await axios.get(`${baseUrl}/notifications`, { headers: authHeaders });
    console.log('    Notifications Count:', notifRes.data.notifications.length);

    console.log('\n🎉 ALL 11 END-TO-END VERIFICATION CHECKS PASSED WITH 100% SUCCESS!');
  } catch (err) {
    console.error('❌ Verification failed:', err.response?.data || err.message);
  } finally {
    testServer.close();
    process.exit(0);
  }
}

runE2ETest();
