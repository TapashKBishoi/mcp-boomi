# Boomi AtomSphere MCS Server

A Node.js-based MCS (Microservices) server that provides a simplified interface to the Boomi AtomSphere API. This server allows you to:

- Check which processes are deployed
- Determine if a deployment is a listener or scheduler
- Enable/disable listeners
- Pause/unpause schedulers

## Prerequisites

- Node.js 14.x or higher
- NPM 6.x or higher
- A Boomi AtomSphere account with API access

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/boomi-mcs-server.git
   cd boomi-mcs-server
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file from the sample:
   ```
   cp .env.sample .env
   ```

4. Edit the `.env` file to configure your port and optional default credentials.

5. Start the server:
   ```
   npm start
   ```

For development with auto-reload:
```
npm run dev
```

## API Documentation

### GET /api/deployments
Get all process deployments or filter by process ID.

Query Parameters:
- `accountId` (required): Boomi account ID
- `username` (required): Boomi username  
- `password` (required): Boomi password
- `processId` (optional): Filter by specific process ID

### GET /api/deployment/:deploymentId/type
Check if a deployment is a listener or scheduler.

Path Parameters:
- `deploymentId`: ID of the deployment to check

Query Parameters:
- `accountId` (required): Boomi account ID
- `username` (required): Boomi username
- `password` (required): Boomi password

### POST /api/deployment/:deploymentId/listener/:action
Enable or disable a listener.

Path Parameters:
- `deploymentId`: ID of the deployment
- `action`: Either 'enable' or 'disable'

Body Parameters (JSON):
```json
{
  "accountId": "your-account-id",
  "username": "your-username", 
  "password": "your-password"
}
```

### POST /api/deployment/:deploymentId/scheduler/:action
Pause or resume a scheduler.

Path Parameters:
- `deploymentId`: ID of the deployment
- `action`: Either 'pause' or 'resume'

Body Parameters (JSON):
```json
{
  "accountId": "your-account-id",
  "username": "your-username",
  "password": "your-password" 
}
```

### GET /api/processes
Get all processes in the account.

Query Parameters:
- `accountId` (required): Boomi account ID
- `username` (required): Boomi username
- `password` (required): Boomi password

### GET /health
Check if the MCS server is running properly.

## Claude Desktop Configuration

To connect this MCS server to Claude Desktop:

1. Start the MCS server
2. Copy the `claude-desktop-config.json` file to your Claude Desktop config directory
3. In Claude Desktop, load the "Boomi AtomSphere Manager" configuration

## Security Considerations

- This server transmits and processes Boomi credentials. It's recommended to use HTTPS in production.
- Consider implementing additional authentication for the MCS server itself.
- Store sensitive information in environment variables, not in code.

## License

MIT