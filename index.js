l'use strict';

const http = require('http');
const { Validator, ValidationError } = require('jsonschema');
const helmet = require('helmet');
const compression = require('compression'); // استيراد compression
const Router = require('find-my-way');
const { parse } = require('querystring');
const send = require('@polka/send-type');
const serveStatic = require('serve-static');
const BiscuitsJar = require('./BiscuitsJar');

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
    this.utils = BiscuitsJar;
  }

  use(middleware) {
    this.globalMiddlewares.push(middleware);
    return this;
  }

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

  async handle(req, res) {
    try {
      this._enhance(req, res);
      await this._parseBody(req);
      this.router.lookup(req, res);
    } catch (err) {
      this._handleError(err, req, res);
    }
  }

  listen(...args) {
    const server = http.createServer((req, res) => this.handle(req, res));

    const gracefulShutdown = () => {
      console.log('Shutting down gracefully...');
      server.close(() => {
        console.log('Server closed.');
      });

      setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
      }, 10000);
    };

    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);

    return server.listen.apply(server, args);
  }

  _enhance(req, res) {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    req.path = parsedUrl.pathname;
    req.query = parse(parsedUrl.searchParams.toString());
    req.search = parsedUrl.search;

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

  _handleError(err, req, res) {
    const error = err instanceof BiscuitError ? err :
      new BiscuitError(err.message, 'INTERNAL_ERROR', 500);

    console.error('Error:', error.message, error.details);
    throw error;
  }
}

// --- Default Setup ---
Biscuit.defaults = (app) => {
  app.use(helmet());
  app.use(compression()); // استخدام compression للضغط التلقائي
};

