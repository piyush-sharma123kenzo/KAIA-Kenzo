/**
 * KAIA Technologies — Production Structured Logger
 * 
 * Provides consistent leveled logging (INFO, WARN, ERROR, DEBUG) with
 * ISO timestamps, metadata serialization, and safe error sanitization.
 */

const isProduction = process.env.NODE_ENV === 'production';

const formatTimestamp = () => new Date().toISOString();

const sanitizeMeta = (meta) => {
  if (!meta || typeof meta !== 'object') return meta;
  const sanitized = { ...meta };
  // Never log sensitive fields
  const sensitiveKeys = ['password', 'token', 'authorization', 'secret', 'jwt_secret', 'apiKey', 'rawOtp'];
  for (const key of Object.keys(sanitized)) {
    if (sensitiveKeys.some((s) => key.toLowerCase().includes(s))) {
      sanitized[key] = '[REDACTED]';
    }
  }
  return sanitized;
};

export const logger = {
  info: (message, meta) => {
    const metaStr = meta ? ` | ${JSON.stringify(sanitizeMeta(meta))}` : '';
    console.log(`[${formatTimestamp()}] [INFO] [KAIA] ${message}${metaStr}`);
  },

  warn: (message, meta) => {
    const metaStr = meta ? ` | ${JSON.stringify(sanitizeMeta(meta))}` : '';
    console.warn(`[${formatTimestamp()}] [WARN] [KAIA] ${message}${metaStr}`);
  },

  error: (message, error, meta) => {
    let errDetail = '';
    if (error instanceof Error) {
      errDetail = ` | Error: ${error.message}`;
      if (!isProduction && error.stack) {
        errDetail += `\n${error.stack}`;
      }
    } else if (error) {
      errDetail = ` | Error: ${JSON.stringify(error)}`;
    }

    const metaStr = meta ? ` | ${JSON.stringify(sanitizeMeta(meta))}` : '';
    console.error(`[${formatTimestamp()}] [ERROR] [KAIA] ${message}${errDetail}${metaStr}`);
  },

  debug: (message, meta) => {
    if (!isProduction) {
      const metaStr = meta ? ` | ${JSON.stringify(sanitizeMeta(meta))}` : '';
      console.log(`[${formatTimestamp()}] [DEBUG] [KAIA] ${message}${metaStr}`);
    }
  },

  // HTTP request logger middleware
  requestLogger: (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      const status = res.statusCode;
      const logFn = status >= 500 ? logger.error : status >= 400 ? logger.warn : logger.info;
      
      // Skip health check logging to keep logs clean
      if (!req.path.startsWith('/health')) {
        logFn(`${req.method} ${req.originalUrl || req.url} ${status} (${duration}ms)`);
      }
    });
    next();
  },
};

export default logger;
