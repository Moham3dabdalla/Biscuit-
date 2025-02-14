const { createServer } = require('http');
const Router = require('find-my-way');
const EventEmitter = require('events');
const { Validator, ValidationError } = require('jsonschema');
const helmet = require('helmet');
const compress = require('compression');
const path = require('path');
const { LRUCache } = require('lru-cache');
const serveStatic = require('serve-static');
const { pipeline } = require('stream/promises');
const { Writable } = require('stream');

class CustomValidationError extends ValidationError {
  constructor(errors) {
    super(errors);
    this.statusCode = 400;
    this.error_code = 'VALIDATION_FAILED';
    this.details = errors.map(err => ({
      field: err.property.replace(/^instance\./, ''),
      message: err.message
    }));
  }
}

class TrieNode {
  constructor() {
    this.staticChildren = new Map();
    this.dynamicChild = null;
    this.handlers = new Map();
  }
}

class TrieCache {
  constructor() {
    this.root = new TrieNode();
  }

  add(method, path, handler) {
    const parts = path.split('/').filter(Boolean);
    let node = this.root;

    for (let part of parts) {
      if (part.startsWith(':')) {
        if (!node.dynamicChild) {
          node.dynamicChild = new TrieNode();
          node.dynamicChild.paramName = part.slice(1);
        }
        node = node.dynamicChild;
      } else {
        if (!node.staticChildren.has(part)) {
          node.staticChildren.set(part, new TrieNode());
        }
        node = node.staticChildren.get(part);
      }
    }

    node.handlers.set(method, handler);
  }

  get(method, path) {
    const parts = path.split('/').filter(Boolean);
    let node = this.root;
    const params = {};

    for (const part of parts) {
      if (node.staticChildren.has(part)) {
        node = node.staticChildren.get(part);
      } else if (node.dynamicChild) {
        node = node.dynamicChild;
        params[node.paramName] = part;
      } else {
        return null;
      }
    }

    return node.handlers.get(method) ? { handler: node.handlers.get(method), params } : null;
  }
}

class Biscuits extends EventEmitter {
  constructor() {
    super();
    this.router = Router({ defaultRoute: this._send404.bind(this) });
    this.trieCache = new TrieCache();
    this.globalMiddleware = [];
    this.errorHandlers = [];
    this._validator = new Validator();
    this.settings = {
      views: path.join(process.cwd(), 'views'),
      'x-powered-by': false,
      env: process.env.NODE_ENV || 'development',
      cache: new LRUCache({ max: 1000, ttl: 3600000 }),
      'view cache': true,
    };
    this._templateCache = new LRUCache({ max: 500, ttl: 86400000 });
    this.server = null;
    this._sigintHandler = () => this.close();
    this._sigtermHandler = () => this.close();

    this._applyCoreMiddleware();
  }

  _enhanceResponse(res) {
    if (res._enhanced) return;
    res._enhanced = true;

    res.status = function(statusCode) {
      this.statusCode = statusCode;
      return this;
    };

    res.send = function(body) {
      if (body instanceof Buffer) {
        if (!this.getHeader('Content-Type')) {
          this.setHeader('Content-Type', 'application/octet-stream');
        }
        return this.end(body);
      }

      let type = this.getHeader('Content-Type');
      if (!type) {
        if (typeof body === 'object' && body !== null) {
          if (Buffer.isBuffer(body)) {
            type = 'application/octet-stream';
          } else {
            type = 'application/json';
            body = JSON.stringify(body);
          }
        } else if (typeof body === 'string') {
          type = /^\s*</.test(body) ? 'text/html' : 'text/plain';
        } else {
          body = body.toString();
          type = 'text/plain';
        }
        this.setHeader('Content-Type', type);
      }
      this.end(body);
    };

    res.json = function(obj) {
      this.setHeader('Content-Type', 'application/json');
      this.end(JSON.stringify(obj));
    };

    res.set = function(field, value) {
      if (typeof field === 'object') {
        Object.entries(field).forEach(([key, val]) => {
          this.setHeader(key, val);
        });
      } else {
        this.setHeader(field, value);
      }
      return this;
    };

    res.redirect = function(...args) {
      let status = 302;
      let url;
      if (args.length === 1) {
        url = args[0];
      } else {
        status = args[0];
        url = args[1];
      }
      this.statusCode = status;
      this.setHeader('Location', url);
      this.end();
    };
  }

  async _parseBody(req) {
    if (req.method === 'GET' || req.method === 'DELETE') return null;
    if (!req.headers['content-type']?.includes('application/json')) return {};

    return new Promise(async (resolve, reject) => {
      const chunks = [];
      const writable = new Writable({
        write(chunk, encoding, callback) {
          chunks.push(chunk);
          callback();
        }
      });

      try {
        await pipeline(req, writable);
        const data = Buffer.concat(chunks).toString();
        resolve(data ? JSON.parse(data) : {});
      } catch (err) {
        reject(new CustomValidationError([{ message: 'Invalid JSON payload' }]));
      }
    });
  }

  async _executeMiddlewareStack(req, res, middlewares) {
    let index = 0;
    const next = async (err) => {
      if (err) throw err;
      if (index >= middlewares.length) return;
      const layer = middlewares[index++];
      try {
        await layer(req, res, next);
      } catch (error) {
        await next(error);
      }
    };
    await next();
  }

  _addRoute(method, path, ...handlers) {
    const wrappedHandler = this._wrapHandlers(handlers);
    this.router.on(method, path, wrappedHandler);
    this.trieCache.add(method, path, wrappedHandler);
  }

  _wrapHandlers(handlers) {
    return async (req, res, params, next) => {
      try {
        req.params = params;
        req.body = await this._parseBody(req);

        const execute = async (index) => {
          if (index >= handlers.length) return next?.();
          const handler = handlers[index];
          await handler(req, res, () => execute(index + 1));
        };

        await execute(0);
      } catch (err) {
        this._handleError(err, req, res);
      }
    };
  }

  _handleError(err, req, res) {
    if (!res.writable || res.headersSent) return;

    if (err instanceof CustomValidationError) {
      res.status(err.statusCode).json({
        error: err.message,
        error_code: err.error_code,
        details: err.details
      });
      return;
    }

    this.emit('error', err);
    res.status(500).json({
      error: 'Internal Server Error',
      error_code: 'SERVER_ERROR'
    });
  }

  async _handleRequest(req, res) {
    this._enhanceResponse(res);
    try {
      await this._executeMiddlewareStack(req, res, this.globalMiddleware);
      await this._executeRouteHandlers(req, res);
    } catch (err) {
      this._handleError(err, req, res);
    }
  }

  async _executeRouteHandlers(req, res) {
    const route = this.trieCache.get(req.method, req.url);
    if (route) {
      await route.handler(req, res, route.params);
    } else {
      this.router.lookup(req, res);
    }
  }

  _send404(req, res) {
    if (!res.writableEnded) {
      res.statusCode = 404;
      res.end('Not Found');
    }
  }

  use(...args) {
    if (typeof args[0] === 'string') {
      const [routePath, ...handlers] = args;
      this.router.on(['GET', 'POST', 'PUT', 'DELETE'], routePath, this._wrapHandlers(handlers));
    } else {
      this.globalMiddleware.push((req, res, next) => args[0](req, res, next));
    }
    return this;
  }

  get(path, ...handlers) { this._addRoute('GET', path, ...handlers); return this; }
  post(path, ...handlers) { this._addRoute('POST', path, ...handlers); return this; }
  put(path, ...handlers) { this._addRoute('PUT', path, ...handlers); return this; }
  delete(path, ...handlers) { this._addRoute('DELETE', path, ...handlers); return this; }

  validate(schema, asyncValidators = []) {
    if (schema.$id && !this._validator.getSchema(schema.$id)) {
      this._validator.addSchema(schema, schema.$id);
    }
    
    return async (req, res) => {
      const result = this._validator.validate(
        { body: req.body, params: req.params },
        schema.$id ? { $ref: schema.$id } : schema
      );
      if (result.errors.length > 0) throw new CustomValidationError(result.errors);

      for (const validator of asyncValidators) {
        await validator(req);
      }
    };
  }

  _applyCoreMiddleware() {
    this.use(helmet({ contentSecurityPolicy: false }));
    this.use(compress({
      level: 6,
      threshold: '1kb',
      filter: (req, res) => {
        const type = res.getHeader('Content-Type') || '';
        return type.startsWith('text/') || 
               type.includes('json') || 
               type.includes('javascript');
      }
    }));
  }

  static(prefix, rootPath, options = { 
    etag: true,
    lastModified: true,
    maxAge: '1d',
    cacheControl: true
  }) {
    if (arguments.length === 1) {
      rootPath = prefix;
      prefix = '/';
    }
    const staticHandler = serveStatic(path.resolve(rootPath), {
      ...options,
      async: true
    });

    this.use(prefix, (req, res, next) => {
      return new Promise((resolve) => {
        staticHandler(req, res, (err) => {
          if (err) next(err);
          else resolve();
        });
      });
    });
    return this;
  }

  listen(port, callback) {
    this.server = createServer(this._handleRequest.bind(this));
    this.server.listen(port, callback);

    process.on('SIGINT', this._sigintHandler);
    process.on('SIGTERM', this._sigtermHandler);
  }

  close(callback) {
    if (this.server) {
      this.server.close(() => {
        process.off('SIGINT', this._sigintHandler);
        process.off('SIGTERM', this._sigtermHandler);
        this.emit('close');
        if (callback) callback();
      });
    }
  }
}

module.exports = Biscuits;