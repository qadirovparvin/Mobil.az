/**
 * PM2 Application Configuration for Mobil.az Backend API
 *
 * Usage:
 *   pm2 start ecosystem.config.js --env production
 *   pm2 reload ecosystem.config.js --env production   (Zero-Downtime Reload)
 *   pm2 restart ecosystem.config.js
 *   pm2 stop ecosystem.config.js
 *   pm2 logs mobilaz-backend
 *   pm2 monit
 */

const path = require('path');

module.exports = {
    apps: [
        {
            name: 'mobilaz-backend',
            script: 'server.js',
            cwd: __dirname,

            // Cluster mode across available CPU cores (or set custom instance count via PM2_INSTANCES)
            instances: process.env.PM2_INSTANCES || 'max',
            exec_mode: 'cluster',

            // Auto-recovery and resilience
            autorestart: true,
            watch: false,
            max_memory_restart: '1G',
            restart_delay: 3000,
            max_restarts: 10,
            min_uptime: '10s',

            // Zero-downtime rolling restart / reload settings
            wait_ready: true,
            listen_timeout: 10000,
            kill_timeout: 5000,

            // PM2 Logging
            error_file: path.join(__dirname, 'logs', 'pm2-error.log'),
            out_file: path.join(__dirname, 'logs', 'pm2-out.log'),
            merge_logs: true,
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

            // Environments
            env: {
                NODE_ENV: 'development',
                PORT: 5000,
                REDIS_URL: process.env.REDIS_URL || 'redis://127.0.0.1:6379'
            },
            env_production: {
                NODE_ENV: 'production',
                PORT: 5000,
                REDIS_URL: process.env.REDIS_URL || 'redis://127.0.0.1:6379'
            },
            env_staging: {
                NODE_ENV: 'staging',
                PORT: 5000,
                REDIS_URL: process.env.REDIS_URL || 'redis://127.0.0.1:6379'
            }
        }
    ]
};
