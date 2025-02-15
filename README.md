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
npm install biscuitsjar
```
## add the app default 
by adding the app default it will provide you with security and zlib cache
```javascript
Biscuit.default(app)
```
Make sure to write the name properly 
```javascript
const Biscuit = require('biscuitsjar')
```
# Basic Usage

Creating an instance of Biscuit

```javascript
const Biscuit = require('biscuitsjar');
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
const Biscuit = require('biscuitsjar');
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

# Benchmark
"These results are obtained after optimizing, so if you use Biscuit without the default app configuration, the results will likely be different, probably lower than this. Additionally, results may vary from machine to machine, so you may see different results."

```
Biscuit.defaults(app)

```
| الإطار       | المحاولة | عدد الطلبات | معدل الاستجابة (ms) | معدل الإنتاجية (req/s) | الأخطاء |
|--------------|-----------|--------------|----------------------|-------------------------|---------|
| **Express**  | الأولى    | 2585         | 386.16               | 258.5                  | 0       |
|              | الثانية   | 3695         | 269.4                | 369.5                  | 0       |
| **Fastify**  | الأولى    | 6287         | 159.8                | 628.71                 | 0       |
|              | الثانية   | 10854        | 92.9                 | 1085.41                | 0       |
| **Koa**      | الأولى    | 7328         | 136.88               | 732.8                  | 0       |
|              | الثانية   | 8345         | 119.81               | 834.5                  | 0       |
| **Biscuit**  | الأولى    | 8340         | 120.23               | 834                    | 0       |
|              | الثانية   | 11033        | 99.79                | 1003                   | 0       |

# English
| Framework   | Attempt   | Total Requests | Avg Latency (ms) | Avg Throughput (req/s) | Errors |
|-------------|-----------|----------------|------------------|------------------------|--------|
| **Express** | First     | 2585           | 386.16           | 258.5                 | 0      |
|             | Second    | 3695           | 269.4            | 369.5                 | 0      |
| **Fastify** | First     | 6287           | 159.8            | 628.71                | 0      |
|             | Second    | 10854          | 92.9             | 1085.41               | 0      |
| **Koa**     | First     | 7328           | 136.88           | 732.8                 | 0      |
|             | Second    | 8345           | 119.81           | 834.5                 | 0      |
| **Biscuit** | First     | 8340           | 120.23           | 834                   | 0      |
|             | Second    | 11033          | 99.79            | 1003                  | 0      |

# Find the benchmark test in own GitHub repository Download it or git it in your machine and try your self

## Yes, Biscuit has provided good performance in some cases, even outperforming Fastify on occasion. However, Fastify still maintains its performance advantage in all cases.

## Biscuit was built primarily to provide a fast and lightweight alternative with ease of use. You can literally learn Biscuit in 10 minutes if you have prior experience with Express.


### mark sure you install all dep

[Biscuits benchmark repository](https://github.com/Moham3dabdalla/Biscuit-benchmark)

```
npm install biscuitsjar
npm install express 
npm install koa
npm install fastify

npm install autocannon
```
## Run the test
```
node server
node benchmark
```
# the server code 
you can add another framework if you want 
```javascript
const express = require('express');
const fastify = require('fastify')();
const Koa = require('koa');
const Biscuit = require('biscuitsjar');

// إعداد Biscuits
const appBiscuits = new Biscuit();
appBiscuits.get('/', (req, res) => res.json({ message: 'Hello from Biscuits' }));

appBiscuits.listen(3004, () => console.log('Biscuits running on port 3004'));

// إعداد Express
const appExpress = express();
appExpress.get('/', (req, res) => res.send('Hello from Express'));
appExpress.listen(3001, () => console.log('Express running on port 3001'));

// إعداد Fastify
fastify.get('/', async (request, reply) => {
  reply.send('Hello from Fastify');
});
fastify.listen({ port: 3002 }, () => console.log('Fastify running on port 3002'));

// إعداد Koa
const appKoa = new Koa();
appKoa.use(async (ctx) => {
  ctx.body = 'Hello from Koa';
});
appKoa.listen(3003, () => console.log('Koa running on port 3003'));
```
## benchmark code
you can add different test to try 
control the
```javascript
const autocannon = require('autocannon');

const servers = [
  { name: 'Express', url: 'http://localhost:3001' },
  { name: 'Fastify', url: 'http://localhost:3002' },
  { name: 'Koa', url: 'http://localhost:3003' },
  { name: 'Biscuit', url: 'http://localhost:3004' },
];

async function runBenchmark(server) {
  console.log(`Running benchmark for ${server.name}...`);

  const result = await autocannon({
    url: server.url,
    connections: 100, // عدد الاتصالات المتزامنة
    //async connections 
    duration: 10, // المدة بالثواني
    // time of the test
    method: 'GET', // نوع الطلب
    // type of the req 
    path: '/', // المسار الذي سيتم اختباره
    // the path 
    rate: 10, // عدد الطلبات في الثانية
    // the rate req/s
  });

  console.log(`Results for ${server.name}:`);
  console.log(result);
}


(async () => {
  for (const server of servers) {
    await runBenchmark(server);
  }
})();

```
# License

Biscuit is released under the MIT License.



---

This README provides an overview of the Biscuit framework, demonstrating how to set up routing, middleware, static file serving, validation, and error handling in a fast, minimalistic web server.



