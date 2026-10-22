const winston = require('winston');
const path = require('path');

const redactSensitive = winston.format((info) => {
    const sensitiveKeys = ['password', 'token', 'otp', 'code', 'session', 'secret'];
    
    const redact = (obj) => {
        if (!obj || typeof obj !== 'object') return obj;
        for (const key of Object.keys(obj)) {
            if (sensitiveKeys.some(k => key.toLowerCase().includes(k))) {
                obj[key] = '[REDACTED]';
            } else if (typeof obj[key] === 'object') {
                obj[key] = redact(Array.isArray(obj[key]) ? [...obj[key]] : { ...obj[key] });
            }
        }
        return obj;
    };

    if (info.meta) {
        info.meta = redact({ ...info.meta });
    }
    
    // Check if the message itself is an object or contains sensitive strings
    if (typeof info.message === 'object') {
        info.message = redact({ ...info.message });
    }

    return info;
});

const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    redactSensitive(),
    winston.format.splat(),
    winston.format.json()
);

const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: logFormat,
    defaultMeta: { service: 'mobilaz-api' },
    transports: [
        new winston.transports.File({ filename: path.join(__dirname, '../logs/error.log'), level: 'error' }),
        new winston.transports.File({ filename: path.join(__dirname, '../logs/combined.log') })
    ]
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ level, message, timestamp, stack }) => {
                return `${timestamp} ${level}: ${message} ${stack ? '\n' + stack : ''}`;
            })
        )
    }));
}

module.exports = logger;
