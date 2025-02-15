'use strict'
 /**
 * Biscuit v-1.0.0
 * Arthor : Mohamed Abdalla
 * license: MIT
 * Build : 15-2-2025
 */

const http = require('http');
const { Validator, ValidationError } = require('jsonschema');
const helmet = require('helmet');
const zlib = require('zlib'); // استبدال compression بـ zlib
const Router = require('find-my-way');
const { parse } = require('querystring');
const send = require('@polka/send-type');
const serveStatic = require('serve-static');
const BiscuitsJar = require('./BiscuitsJar'); // استيراد BiscuitsJar

class BiscuitError extends Error {
  constructor(message, code = 'SERVER_ERROR', status = 500, details) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

class Biscuit {
  constructor() {
    this.globalMiddlewares = [];
    this.router = Router();
    this.validator = new Validator();
    this.settings = { env: process.env.NODE_ENV || 'development' };
    this.utils = BiscuitsJar; // إضافة BiscuitsJar كـ utilities
  }

  // --- Middleware Handling ---
  use(middleware) {
    this.globalMiddlewares.push(middleware);
    return this;
  }

  // --- Route Registration ---
  route(method, path, ...handlers) {
    const wrappedHandlers = [...this.globalMiddlewares, ...handlers];
    this.router.on(method, path, (req, res, params) => {
      req.params = params;
      this._executeHandlers(req, res, wrappedHandlers);
    });
    return this;
  }

  get(path, ...handlers) { return this.route('GET', path, ...handlers); }
  post(path, ...handlers) { return this.route('POST', path, ...handlers); }
  put(path, ...handlers) { return this.route('PUT', path, ...handlers); }
  delete(path, ...handlers) { return this.route('DELETE', path, ...handlers); }

  // --- Enhanced Validation ---
  validate(schema) {
    return (req, res, next) => {
      const result = this.validator.validate(req.body, schema);
      if (!result.valid) {
        const errors = result.errors.map(err => ({
          field: err.property.replace('instance.', ''),
          message: err.message
        }));
        throw new BiscuitError('Validation failed', 'VALIDATION_ERROR', 400, errors);
      }
      next();
    };
  }

  // --- Improved Request Handling ---
  async handle(req, res) {
    try {
      this._enhance(req, res);
      await this._parseBody(req);
      this.router.lookup(req, res);
    } catch (err) {
      this._handleError(err, req, res);
    }
  }

  // --- Optimized Server Initialization with Graceful Shutdown ---
  listen(...args) {
    const server = http.createServer((req, res) => this.handle(req, res));

    // Graceful shutdown logic
    const gracefulShutdown = () => {
      console.log('Shutting down gracefully...');
      server.close(() => {
        console.log('Server closed.');
      });

      // Force close server after 10 seconds
      setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
      }, 10000);
    };

    // Handle shutdown signals
    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);

    // Start the server
    return server.listen.apply(server, args);
  }

  // --- Enhanced Internal Utilities ---
  _enhance(req, res) {
    // Improved URL parsing with query support
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    req.path = parsedUrl.pathname;
    req.query = parse(parsedUrl.searchParams.toString()); // Better query parsing
    req.search = parsedUrl.search;

    // Unified response handler
    res.send = (data, status = 200) => {
      send(res, status, data);
    };

    res.status = code => {
      res.statusCode = code;
      return res;
    };

    res.json = data => {
      send(res, res.statusCode || 200, data);
    };
  }

  // --- Async Handler Execution ---
  async _executeHandlers(req, res, handlers) {
    const next = async (index = 0) => {
      if (index >= handlers.length) return;
      const handler = handlers[index];
      await handler(req, res, () => next(index + 1));
    };

    try {
      await next();
    } catch (err) {
      this._handleError(err, req, res);
    }
  }

  // --- Robust Body Parsing ---
  async _parseBody(req) {
    return new Promise((resolve, reject) => {
      if (['GET', 'HEAD'].includes(req.method)) {
        req.body = {};
        return resolve();
      }

      let data = '';
      req.on('data', chunk => data += chunk);
      req.on('end', () => {
        try {
          req.body = data ? JSON.parse(data) : {};
          resolve();
        } catch (err) {
          reject(new BiscuitError('Invalid JSON', 'INVALID_JSON', 400));
        }
      });
    });
  }

  static(directory, options = {}) {
    const staticMiddleware = serveStatic(directory, options);
    this.use(staticMiddleware);
    return this;
  }

  // --- Error Handling ---
  _handleError(err, req, res) {
    const error = err instanceof BiscuitError ? err :
      new BiscuitError(err.message, 'INTERNAL_ERROR', 500);

    // إلقاء الخطأ بدلاً من إرسال رد إلى العميل
    console.error('Error:', error.message, error.details);
    throw error; // إلقاء الخطأ
  }
}

// --- Default Setup ---
Biscuit.defaults = (app) => {
  app.use(helmet());

  app.use((req, res, next) => {
    const acceptEncoding = req.headers['accept-encoding'] || '';
    let stream;

    if (acceptEncoding.includes('gzip')) {
      res.setHeader('Content-Encoding', 'gzip');
      stream = zlib.createGzip();
    } else if (acceptEncoding.includes('deflate')) {
      res.setHeader('Content-Encoding', 'deflate');
      stream = zlib.createDeflate();
    }

    if (stream) {
      const originalWrite = res.write.bind(res);
      const originalEnd = res.end.bind(res);

      stream.on('data', (chunk) => originalWrite(chunk));
      stream.on('end', () => originalEnd());

      res.write = (data) => stream.write(data);
      res.end = (data) => {
        if (data) stream.write(data);
        stream.end();
      };
    }

    next();
  });
};
module.exports = Biscuit;
