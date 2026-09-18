const winston = require('winston');

const sanitizeSecrets = winston.format((info) => {
  if (typeof info.message === 'string') {
    info.message = info.message
      .replace(/ghp_[a-zA-Z0-9_]+/g, 'ghp_***')
      .replace(/github_pat_[a-zA-Z0-9_]+/g, 'github_pat_***')
      .replace(/(password|token|secret)=([^&\s]+)/gi, '$1=***');
  }
  return info;
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    sanitizeSecrets(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        sanitizeSecrets(),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message }) => {
          return `[${timestamp}] [${level}] ${message}`;
        })
      )
    })
  ]
});

module.exports = logger;
