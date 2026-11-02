# Mobilim.az

Mobilim.az is a mobile-device marketplace with a static frontend and a Node.js/Express backend.

## Structure

- `Front end/`: HTML, CSS, JavaScript, and TypeScript frontend files
- `Backend/`: main Express and MongoDB backend API

## Local setup

### Frontend

```powershell
cd "Front end"
npm install
npm run check:encoding
npm run build
```

Open `index.html` in a browser or serve the folder with a local static server.

### Backend

```powershell
cd "Backend"
copy .env.example .env
npm install
npm run dev
```

Set real values in `Backend/.env` before starting the API.

## Production Deployment (PM2)

Mobilim.az backend is configured for high availability using **PM2 Cluster Mode** with zero-downtime rolling reload.

### 1. Prerequisites
- Node.js >= 18.x
- MongoDB Replica Set (required for Mongoose multi-document transactions)
- Redis (optional, enables distributed scheduler locks and caching)
- PM2 installed globally:
  ```bash
  npm install -g pm2
  ```

### 2. Configuration
Copy and configure production environment variables:
```bash
cd Backend
cp .env.example .env
# Set strong secrets:
# JWT_SECRET (32+ chars), CSRF_SECRET (64-hex), PAYMENT_WEBHOOK_SECRET,
# TWO_FACTOR_SECRET_ENCRYPTION_KEY=64-hex (generate: openssl rand -hex 32)
# Payriff live keys: PAYRIFF_API_URL, PAYRIFF_API_KEY, PAYRIFF_SECRET, WEBHOOK_SECRET, MERCHANT_ID
# SMTP credentials, etc.
```

### 3. Start & Manage with PM2
Configuration is defined in `Backend/ecosystem.config.js`.

```bash
# Navigate to backend directory
cd Backend

# Start application in production mode (cluster mode on all CPU cores)
npm run pm2:start
# or: pm2 start ecosystem.config.js --env production

# Zero-downtime rolling reload (seamless update without dropped requests)
npm run pm2:reload
# or: pm2 reload ecosystem.config.js --env production

# Monitor real-time performance and memory
npm run pm2:monit
# or: pm2 monit

# View aggregated logs
npm run pm2:logs
# or: pm2 logs mobilimaz-backend

# Stop or restart processes
npm run pm2:stop
npm run pm2:restart

# Configure PM2 to restart automatically on server reboot
pm2 save
pm2 startup
```

### 4. Health Checks & Verification
Verify that the service is operational:
```bash
curl http://localhost:5000/api/health
```
Expected response:
```json
{
  "status": "ok",
  "uptime": 123.45,
  "timestamp": "2026-10-12T19:28:00.000Z"
}
```

### 5. Log Files
Logs are maintained in `Backend/logs/`:
- `pm2-out.log`: PM2 standard process output
- `pm2-error.log`: PM2 runtime errors
- `combined.log`: Application-level Winston combined log
- `error.log`: Application-level Winston error log

## Notes

- `Backend/.env` is intentionally excluded from git.
- `node_modules` and uploaded files are excluded from git.
- The main backend is `Backend/`, not `Back end/`.
- Source files should stay in UTF-8. PowerShell output may still display some Azerbaijani characters incorrectly even when the file itself is valid UTF-8, so prefer browser rendering or UTF-8-aware tooling when verifying text.

