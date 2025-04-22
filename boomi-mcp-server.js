const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const { createServer } = require('http');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Helper for Boomi API authentication
const getBoomiAuthHeaders = (accountId, username, password) => {
  const auth = Buffer.from(`${username}:${password}`).toString('base64');
  return {
    'Authorization': `Basic ${auth}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };
};

const getBoomiApiUrl = (accountId) => `https://api.boomi.com/api/rest/v1/${accountId}`;

// Get process deployments
app.get('/api/deployments', async (req, res) => {
  try {
    const { accountId, username, password, processId } = req.query;

    if (!accountId || !username || !password) {
      return res.status(400).json({ error: 'Missing required authentication parameters' });
    }

    const headers = getBoomiAuthHeaders(accountId, username, password);
    const baseUrl = getBoomiApiUrl(accountId);
    const url = `${baseUrl}/ProcessDeployment/query`;

    const queryData = processId
      ? { processIds: [processId] }
      : { QueryFilter: { expression: { operator: "and", nestedExpression: [] } } };

    const response = await axios.post(url, queryData, { headers });

    const deployments = await Promise.all(
      response.data.map(async (deployment) => {
        const detailUrl = `${baseUrl}/ProcessDeployment/${deployment.id}`;
        const detailResponse = await axios.get(detailUrl, { headers });
        return detailResponse.data;
      })
    );

    res.json(deployments);
  } catch (error) {
    console.error('Error fetching deployments:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data || error.message
    });
  }
});

// Deployment type info
app.get('/api/deployment/:deploymentId/type', async (req, res) => {
  try {
    const { deploymentId } = req.params;
    const { accountId, username, password } = req.query;

    if (!accountId || !username || !password) {
      return res.status(400).json({ error: 'Missing required authentication parameters' });
    }

    const headers = getBoomiAuthHeaders(accountId, username, password);
    const baseUrl = getBoomiApiUrl(accountId);
    const url = `${baseUrl}/ProcessDeployment/${deploymentId}`;

    const response = await axios.get(url, { headers });
    const deployment = response.data;

    const type = {
      isListener: deployment.listenerStatus !== undefined,
      isScheduler: deployment.scheduleStatus !== undefined,
      status: deployment.listenerStatus || deployment.scheduleStatus || 'N/A',
      deploymentDetails: deployment
    };

    res.json(type);
  } catch (error) {
    console.error('Error checking deployment type:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data || error.message
    });
  }
});

// Toggle listener
app.post('/api/deployment/:deploymentId/listener/:action', async (req, res) => {
  try {
    const { deploymentId, action } = req.params;
    const { accountId, username, password } = req.body;

    if (!accountId || !username || !password) {
      return res.status(400).json({ error: 'Missing required authentication parameters' });
    }

    if (!['enable', 'disable'].includes(action)) {
      return res.status(400).json({ error: 'Action must be enable or disable' });
    }

    const headers = getBoomiAuthHeaders(accountId, username, password);
    const baseUrl = getBoomiApiUrl(accountId);
    const url = `${baseUrl}/ProcessDeployment/${deploymentId}/listener/${action}`;

    const response = await axios.post(url, {}, { headers });

    res.json({
      success: true,
      message: `Listener ${action}d successfully`,
      deploymentId,
      response: response.data
    });
  } catch (error) {
    console.error(`Error ${action}ing listener:`, error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data || error.message
    });
  }
});

// Toggle scheduler
app.post('/api/deployment/:deploymentId/scheduler/:action', async (req, res) => {
  try {
    const { deploymentId, action } = req.params;
    const { accountId, username, password } = req.body;

    if (!accountId || !username || !password) {
      return res.status(400).json({ error: 'Missing required authentication parameters' });
    }

    if (!['pause', 'resume'].includes(action)) {
      return res.status(400).json({ error: 'Action must be pause or resume' });
    }

    const headers = getBoomiAuthHeaders(accountId, username, password);
    const baseUrl = getBoomiApiUrl(accountId);
    const url = `${baseUrl}/ProcessDeployment/${deploymentId}/schedule/${action}`;

    const response = await axios.post(url, {}, { headers });

    res.json({
      success: true,
      message: `Scheduler ${action}d successfully`,
      deploymentId,
      response: response.data
    });
  } catch (error) {
    console.error(`Error ${action}ing scheduler:`, error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data || error.message
    });
  }
});

// Get all processes
app.get('/api/processes', async (req, res) => {
  try {
    const { accountId, username, password } = req.query;

    if (!accountId || !username || !password) {
      return res.status(400).json({ error: 'Missing required authentication parameters' });
    }

    const headers = getBoomiAuthHeaders(accountId, username, password);
    const baseUrl = getBoomiApiUrl(accountId);
    const url = `${baseUrl}/Process/query`;

    const response = await axios.post(url, {
      QueryFilter: {
        expression: {
          operator: "and",
          nestedExpression: []
        }
      }
    }, { headers });

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching processes:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data || error.message
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Start the server
let PORT = process.env.PORT || 0;
const server = createServer(app);

server.listen(PORT, () => {
  PORT = server.address().port;

  if (process.send) {
    // JSON-RPC expects this
    process.send({ port: PORT });
  } else {
    // Avoid printing to stdout
    console.error(`[boomi] Boomi MCS Server running on port ${PORT}`);
  }
});

server.on('error', (error) => {
  console.error('Server error:', error);
  process.exit(1);
});

module.exports = app;
