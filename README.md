# Biscuit Framework

🍪Biscuit is a minimal and high-performance Node.js framework built for handling HTTP requests and building APIs with a focus on simplicity, extensibility, and resource optimization. It includes built-in support for middleware, routing, validation, error handling, and more.

## Features

- **Routing**: Advanced routing system with Trie-based cache for fast lookups and dynamic routing support.
- **Validation**: Schema-based validation using `jsonschema` with custom error handling.
- **Middleware Support**: Global and route-specific middleware handling.
- **Static File Serving**: Built-in static file serving capabilities.
- **Error Handling**: Custom error handling with the ability to capture validation and server errors.
- **Compression**: Built-in Gzip/Deflate compression support.
- **Security**: Helmet for setting HTTP headers to enhance security.
- **Cache**: Built-in LRU cache for improving performance with cached responses.

## Installation

To install Biscuit, use npm or yarn:

```bash
npm install biscuit-frame
```
Make sure to write the name properly 
```javascript
const Biscuit = require('biscuits-frame')
```
# Basic Usage

Creating an instance of Biscuit

```javascript
const Biscuit = require('biscuits-frame');
const app = new Biscuit();
```
# Routing

Biscuit supports basic HTTP methods such as GET, POST, PUT, and DELETE for routing:
```javascript
app.get('/', (req, res) => {
  res.send('Hello, This is Biscuit!');
});

app.get('/hello', (req, res) => {
  res.send('Hello, World!');
});

app.post('/submit', (req, res) => {
  res.json({ message: 'Data received' });
});

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
```
# Middleware

You can use middleware globally or for specific routes:

Global Middleware
```javascript
app.use((req, res, next) => {
  console.log(`Request received at ${req.url}`);
  next();
});
````
# Route-Specific Middleware
```javascript
app.get('/protected', (req, res, next) => {
  if (!req.headers['authorization']) {
    return res.status(401).send('Unauthorized');
  }
  next();
}, (req, res) => {
  res.send('Protected Route');
});
```
# Static File Serving

Serve static files using the static() method:
```javascript
app.static('/public', path.join(__dirname, 'public'));
```
# Validation

You can validate request data using JSON schemas:
```javascript
const schema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    age: { type: 'integer' }
  },
  required: ['name', 'age']
};

app.post('/user', app.validate(schema), (req, res) => {
  res.json({ message: 'User data is valid' });
});
```
# Error Handling

Custom error handling is provided out-of-the-box for both validation and server errors:
```javascript
app.use((err, req, res, next) => {
  if (err instanceof CustomValidationError) {
    return res.status(err.statusCode).json({
      error: err.message,
      error_code: err.error_code,
      details: err.details
    });
  }
  
  res.status(500).json({
    error: 'Internal Server Error',
    error_code: 'SERVER_ERROR'
  });
});
```
# Server

Start the server and listen for requests:
```javascript
app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});

Graceful Shutdown

You can gracefully shut down the server:

app.close(() => {
  console.log('Server closed');
});
```
# Configuration

You can configure various settings such as:

Views Directory: Default is views in the current working directory.

Cache: LRU Cache with configurable max size and TTL.

Security Headers: Automatically includes Helmet for security headers.

```javascript
app.settings = {
  views: path.join(process.cwd(), 'views'),
  'x-powered-by': false,
  env: process.env.NODE_ENV || 'development',
  cache: new LRUCache({ max: 1000, ttl: 3600000 }),
  'view cache': true
};
```
# Methods

get(path, ...handlers)

Defines a GET route for the given path.

post(path, ...handlers)

Defines a POST route for the given path.

put(path, ...handlers)

Defines a PUT route for the given path.

delete(path, ...handlers)

Defines a DELETE route for the given path.

use(middleware)

Adds a global middleware function to the stack.

static(prefix, rootPath, options)

Serves static files from the specified directory.

listen(port, callback)

Starts the server on the specified port.

close(callback)

Stops the server and performs cleanup.

# License

Biscuit is released under the MIT License.



---

This README provides an overview of the Biscuit framework, demonstrating how to set up routing, middleware, static file serving, validation, and error handling in a fast, minimalistic web server.
