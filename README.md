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
- **Cache**: Built-in zlib cache for improving performance with cached responses.
- **Utilities**: Biscuit has provided a punch of utilities of it's own jar that's help you to develope API faster
   - rateLimit
   - timeout
   - get headers & set them 
   - get the query & url & hostname &host & path

## Installation

To install Biscuit, use npm or yarn:

```bash
npm install biscuitsJar
```
## add the app default 
by adding the app default it will provide you with security and zlib cache
```javascript
Biscuit.default(app)
```
Make sure to write the name properly 
```javascript
const Biscuit = require('biscuitsJar')
```
# Basic Usage

Creating an instance of Biscuit

```javascript
const Biscuit = require('biscuitsJar');
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
Make usre you have public directory inside of it index.html
by default static will look over for index.html file
```javascript
app.static((path.join(__dirname, 'public'))) 
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
# Utilities
custom bulid in Utilities 
## rateLimit
```javascript
app.use(app.utils.rateLimit(50, 60000));
```
## timeout
```javascript
app.use(app.utils.timeout(3000)); 
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

# Full Example of Use
```javascript
const Biscuit = require('biscuitsJar');
const app = new Biscuit();


Biscuit.defaults(app);

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

 
const userSchema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    email: { type: 'string', format: 'email' },
  },
  required: ['name', 'email'],
};

app.post('/users', app.validate(userSchema), (req, res) => {
  const { name, email } = req.body;
  res.status(201).json({ message: 'User created successfully', user: { name, email } });
});


app.get('/users', (req, res) => {
  res.json([{ id: 1, name: 'Alice', email: 'alice@example.com' }]);
});


app.listen(3000, () => console.log('Biscuits server running on http://localhost:3000'));
```
in your terminal run the following to test
```terminal
add user 
curl -X POST http://localhost:3000/users \
-H "Content-Type: application/json" \
-d '{"name": "John Doe"}'

get users
curl http://localhost:3000/users

add invalid user it will throw an err 
curl -X POST http://localhost:3000/users \
-H "Content-Type: application/json" \
-d '{"name": "John Doe"}'

```
# License

Biscuit is released under the MIT License.



---

This README provides an overview of the Biscuit framework, demonstrating how to set up routing, middleware, static file serving, validation, and error handling in a fast, minimalistic web server.
