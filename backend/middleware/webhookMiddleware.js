/**
 * webhookMiddleware.js — Capture raw body for payment webhook signature verification.
 *
 * IMPORTANT: Razorpay webhook signature verification requires the RAW request body.
 * If body is parsed by express.json() first, the signature cannot be verified correctly.
 *
 * This middleware captures the raw body and makes it available on req.rawBody
 * while still providing parsed JSON on req.body.
 */

/**
 * Middleware to capture raw body for webhook routes.
 * Mount this BEFORE express.json() for webhook-specific routes,
 * OR use it as route-level middleware.
 *
 * Usage in route:
 *   router.post('/webhook', captureRawBody, express.json(), webhookHandler)
 *
 * OR register a separate body parser for the webhook path in server.js.
 */
export const captureRawBody = (req, res, next) => {
  let rawData = [];

  req.on('data', (chunk) => {
    rawData.push(chunk);
  });

  req.on('end', () => {
    req.rawBody = Buffer.concat(rawData);
    try {
      req.body = JSON.parse(req.rawBody.toString('utf-8'));
    } catch {
      req.body = {};
    }
    next();
  });

  req.on('error', (err) => {
    console.error('[WebhookMiddleware] Error reading webhook body:', err.message);
    res.status(400).json({ message: 'Failed to read webhook body.' });
  });
};

/**
 * Express middleware to preserve raw body alongside parsed JSON.
 * Use with express.json() verify option in server.js:
 *
 * app.use(express.json({
 *   verify: (req, res, buf) => { req.rawBody = buf; }
 * }));
 *
 * This is the preferred approach as it integrates with the global JSON parser.
 */
export const rawBodyPreserver = (req, res, buf) => {
  req.rawBody = buf;
};
