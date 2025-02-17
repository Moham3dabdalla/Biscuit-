# Biscuit Framework

🍪Biscuit is a minimal and high-performance Node.js framework built for handling HTTP requests and building APIs with a focus on simplicity, extensibility, and resource optimization. It includes built-in support for middleware, routing, validation, error handling, and more.

## Features

- **Routing**: Advanced routing system Using find-my-way for fast lookups and dynamic routing support.
- **Validation**: Schema-based validation using `jsonschema` with custom error handling.
- **Middleware Support**: Global and route-specific middleware handling.
- **Static File Serving**: Built-in static file serving capabilities.
- **Error Handling**: Custom error handling with the ability to capture validation and server errors.
- **Compression**: Built-in Gzip/Deflate compression support.
- **Security**: Helmet for setting HTTP headers to enhance security.
- **Utilities**: Biscuit has provided a punch of utilities of it's own jar that's help you to develope API faster
   - rateLimit
   - timeout

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
"Biscuit has a simple cache system. If you want to add caching, it only works with GET requests. The reason Biscuit doesn't have a large cache system is that it was designed to give users the freedom to create their own system. You have the freedom to create your own caching, clustering, and worker systems. Biscuit was designed to be small and fast in execution. You can enable caching by adding 'bake' to your installation."

```javascript
app.bake()
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
# subRouting 
The sub-routing system is a feature of the Biscuit framework that allows developers to create modular and reusable routing components. This system enables the creation of separate routers for different parts of an application, making it easier to manage and maintain complex routing logic.

Creating a Sub-Router

To create a sub-router, you need to instantiate a new instance of the `Biscuit.SubRouter` class.

```javascript
const userRouter = new Biscuit.SubRouter();
```

Defining Routes on a Sub-Router

Once you have created a sub-router, you can define routes on it just like you would on the main application router.

```javascript
userRouter.get('/profile', (req, res) => {
  res.send({ user: 'Profile Data' });
});

userRouter.post('/profile', (req, res) => {
  res.json({ message: 'data received' });
});
```

Mounting a Sub-Router

To use a sub-router in your application, you need to mount it on the main application router using the `use()` method.

```javascript
app.use('/', userRouter);
```

In this example, the `userRouter` sub-router is mounted on the root path (`'/'`) of the main application router.

Example Use Case

Here is a complete example that demonstrates the use of the sub-routing system:

```javascript
const Biscuit = require('./index.js');

const userRouter = new Biscuit.SubRouter();

const app = new Biscuit();

app.get('/', (req, res) => {
  res.send('hello world');
});

userRouter.get('/profile', (req, res) => {
  res.send({ user: 'Profile Data' });
});

userRouter.post('/profile', (req, res) => {
  res.json({ message: 'data received' });
});

app.use('/', userRouter);

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
```

In this example, we create a sub-router (`userRouter`) and define two routes on it (`GET /profile` and `POST /profile`). We then mount the sub-router on the main application router (`app`) and start the server.
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
## **Available Features**

### **1. Rate Limiting**

Limit the number of requests from a single IP address within a specified time window.

#### **Usage**
```javascript
app.use(app.utils.rateLimit(max, windowMs));
```

- **max**: Maximum number of allowed requests.
- **windowMs**: Time window in milliseconds.

#### **Example**
```javascript
app.use(app.utils.rateLimit(50, 60000)); // 50 requests per minute
```

---

### **2. Request Timeout**

Set a timeout for incoming requests. If a request exceeds the timeout, a `408 Request Timeout` response is sent.

#### **Usage**
```javascript
app.use(app.utils.timeout(delay));
```

- **delay**: Timeout duration in milliseconds.

#### **Example**
```javascript
app.use(app.utils.timeout(5000)); // 5 seconds
```

---

### **3. Temporary Data Storage**

Store temporary data with a time-to-live (TTL).

#### **Usage**
```javascript
app.utils.setTempData(key, value, ttl);
app.utils.getTempData(key);
```

- **key**: Key to store the data.
- **value**: Value to store.
- **ttl**: Time-to-live in milliseconds.

#### **Example**
```javascript
app.utils.setTempData('user:123', { name: 'John' }, 30000); // Store for 30 seconds
const user = app.utils.getTempData('user:123'); // Retrieve data
```

---

### **4. Secure Token Generation**

Generate secure random tokens using `crypto`.

#### **Usage**
```javascript
const token = app.utils.generateToken(length);
```

- **length**: Length of the token in bytes.

#### **Example**
```javascript
const token = app.utils.generateToken(32); // Generate a 32-byte token
```

---

### **5. Session Management**

Create and validate user sessions.

#### **Usage**
```javascript
const sessionId = app.utils.createSession(userId, ttl);
const userId = app.utils.validateSession(sessionId);
```

- **userId**: User identifier.
- **ttl**: Session duration in milliseconds.
- **sessionId**: Session identifier.

#### **Example**
```javascript
const sessionId = app.utils.createSession('user:123', 3600000); // 1-hour session
const userId = app.utils.validateSession(sessionId); // Validate session
```

---

## **Usage Examples**

### **Example 1: Rate Limiting**
```javascript
const Biscuit = require('biscuitsjar');
const app = new Biscuit();

app.use(app.utils.rateLimit(50, 60000)); // 50 requests per minute

app.get('/', (req, res) => {
  res.send('Hello, this is an example of rate limiting!');
});

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
```

---

### **Example 2: Session Management**
```javascript
const Biscuit = require('biscuitsjar');
const app = new Biscuit();

app.post('/login', (req, res) => {
  const userId = 'user:123';
  const sessionId = app.utils.createSession(userId, 3600000); // 1-hour session
  res.json({ sessionId });
});

app.get('/profile', (req, res) => {
  const sessionId = req.headers['x-session-id'];
  const userId = app.utils.validateSession(sessionId);
  if (userId) {
    res.json({ message: 'Welcome back!', userId });
  } else {
    res.status(401).json({ error: 'Invalid or expired session.' });
  }
});

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
```

---

### **Example 3: Temporary Data Storage**
```javascript
const Biscuit = require('biscuitsjar');
const app = new Biscuit();

app.post('/cache', (req, res) => {
  const { key, value } = req.body;
  app.utils.setTempData(key, value, 30000); // Store for 30 seconds
  res.json({ message: 'Data stored successfully!' });
});

app.get('/cache/:key', (req, res) => {
  const { key } = req.params;
  const value = app.utils.getTempData(key);
  if (value) {
    res.json({ value });
  } else {
    res.status(404).json({ error: 'Data not found or expired.' });
  }
});

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
```

---

### **Example 4: Secure Token Generation**
```javascript
const Biscuit = require('biscuitsjar');
const app = new Biscuit();

app.get('/token', (req, res) => {
  const token = app.utils.generateToken(32); // Generate a 32-byte token
  res.json({ token });
});

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
```

---

## **Testing**

You can test the features using `curl` or any other tool:

### **Create a New Session**
```bash
curl -X POST http://localhost:3000/login
```

### **Validate a Session**
```bash
curl -H "x-session-id: <sessionId>" http://localhost:3000/profile
```

### **Store Temporary Data**
```bash
curl -X POST -H "Content-Type: application/json" -d '{"key": "test", "value": "data"}' http://localhost:3000/cache
```

### **Retrieve Temporary Data**
```bash
curl http://localhost:3000/cache/test
```

### **Generate a Secure Token**
```bash
curl http://localhost:3000/token
```

# Error Handling

Custom error handling is provided out-of-the-box for both validation and server errors:
```javascript
const Biscuit = require('./Biscuit');
const app = new Biscuit();

app.get('/example', (req, res) => {
  throw new Biscuit.BiscuitError('Something went wrong!', 'EXAMPLE_ERROR', 400);
});

app.listen(3000, () => console.log('Server running on port 3000'));
```
### As Middleware
```javascript
app.use((req, res, next) => {
  if (!req.headers['authorization']) {
    throw new Biscuit.BiscuitError('Unauthorized', 'AUTH_ERROR', 401);
  }
  next();
});
```
### Custom handle 
```javascript
app._handleError = (err, req, res) => {
  res.status(500).json({ error: 'Custom Error Handler', details: err.message });
};
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
# License

Biscuit is released under the [MIT](https://github.com/Moham3dabdalla/Biscuit-/blob/main/.LICENSE) License.



---

This README provides an overview of the Biscuit framework, demonstrating how to set up routing, middleware, static file serving, validation, and error handling in a fast, minimalistic web server.



