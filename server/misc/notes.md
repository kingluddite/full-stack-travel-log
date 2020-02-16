# Notes for app using
* Node.js
* Express
* MongoDB
* React + Hooks and Mapbox

## Update package.json

```
// MORE CODE

  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "lint": "eslint src/"
  },

// MORE CODE
```

## Add linter
`$ npx eslint --init`

* You will get questions
    - Use:
* How would you like to use ESLint?
    - `To check stytax, find problems, and enforce code style`
* What type of modules does your project use?
    - `CommonJS (require/exports)`
* What framework does your project use?
    - (This is not frontend code so we'll select `None of these`)
* Does your project use TypeScript?
    - `N`
* Where does your code run?
    - `Node` (This is tricky - read instructions carefully)
* How would you like to define a style for your project?
    - Use a popular style guide
* Which style guide do you want to follow?
    - `Airbnb: https://github.com/airbnb/javascript`
* What format do you want your config file to be in?
    - `JavaScript`
* Would you like to install them now with npm?
    - `Y`

### Eslint is now setup
* Now eslint should give us errors in our editor

## Run app
`$ npm run dev`

* Will get `Cannot GET /` in the browser

## Add morgan middleware
* morgan is a logger
* It automatically logs all incoming requests

`server/src/index.js`

```
const express = require('express');
const morgan = require('morgan'); // add

const app = express();
app.use(morgan('common')); // add

const PORT = process.env.PORT | 1337;
app.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});
```

### See how morgan works
* Not specific to Express - works for any general HTTP server
* Headers are for browser based apps
* Refresh the browser and you'll now see in the terminal more info about the request
    - It will show that a request came in
    - It will show IP address
    - The date
    - The method "GET"
    - The protocol HTTP/1.1
    - The status code (404)
    - And the number of milliseconds it took to respond (139)
* We are using `common` but you can read the Morgan docs and setup your own string of what you want to see for all requests

## Add headers
* Currently we can use the chrome console to view Headers
* Click `Network` > `Refresh the page` (with All selected)
* Click `Headers` tab
* You will see the 404 status code
    - You'll also see X-Powered-By: Express

![powered by Express](https://i.imgur.com/Mzkus5V.png)

### We'll add Helmet
* It will add Headers for us and remove some Headers for us
* The problem is a hacker can see from the request that we are using Express and then they could try certain attacks that `Express` could be vulnerable to
* Helmet will automatically remove that `X-Powered-By` Header so it will be harder for hackers to know our backend and thwart us

`index.js`

```
const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');

const app = express();
app.use(morgan('common'));
app.use(helmet());

const PORT = process.env.PORT | 1337;
app.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});
```

* Now we can't see we have an Express server on the backend

![do not know what powers our backend](https://i.imgur.com/hPSDkIc.png)

* Helmet also added:
    - XSS-Protection
    - X-Frame-Options: SAMEORIGIN (That prevents this site from being loaded in an IFRAME)
    - X-Download-Options: noopen
    - X-DNS-Prefetch-Control: off
    - So now that we have these added to the Headers, our app is more secure!
    - Another Header that is good to hide is specific version numbers, so people can't just search for `nginx` version X vulnerabilities
        + (example: if you are using PHP it will say Express powered by PHP X version... and then an attacker can look up that version number and see if there are any vulnerabilities/exploits)
        + Same with nginx - you can disable those headers as well

## Do I need logs for production?
* Yes for debugging
* If a client says something is going wrong, you can look at your server side logs to see what requests came in
    - You can also recognize malicious activity if you see a bunch of requests in your log from the same IP address
    - **note** Right now we are running locally so we just see that the IP address is IP6 `::1` (on a deployed server you will actually see the IP address of all the incoming requests)

## Should I use Morgan in production?
* Sure

## Add CORS middleware
* CORS - Cross Origin Resource Sharing Header
    - by default it sets the access-control-Header to `*` (meaning any origin can make requests from our backend)
* We'll set up our origin to only allow from `http://localhost:3000` (because we are using React)
    - This says that in the browser only requests coming from this origin can reach our backend

```
const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors'); // add
j;
const app = express();
app.use(morgan('common'));
app.use(helmet());

// add the cors middleware below
app.use(
  cors({
    origin: 'http://localhost:3000',
  })
);

const PORT = process.env.PORT | 1337;
app.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});
```

## Current errors show up not so friendly
* We will improve our errors

### Now when someone hits our `/` route we'll show some json
```
// MORE CODE
app.get('/', (req, res) => {
  res.json({
    message: 'Hello World!',
  });
});

const PORT = process.env.PORT | 1337;
app.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});
```

* View in browser at `/`
* You will see:

```
{
"message": "Hello World!"
}
```

* If your JSON is not formatted nicely add a chrome extension

## Fix 404 errors
* We still get an ugly error if we request something that doesn't exist

```
http://localhost:1337/dasdfsdf
```

* Will give you:

`Cannot GET /dasdfsdf`

### Typically you want this to be the last middleware that is registered
```
app.use((req, res, next) => {
 // 404 page
});

const PORT = process.env.PORT | 1337;
app.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});
```

* If we get to the last middleware, it means we didn't find the route we were looking for
    - Let's create an error that show's the path they were originally looking for

```
app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`); // add 
  res.status(404); // add
  next(error); // add
});

const PORT = process.env.PORT | 1337;
app.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});
```

* We generate an error
* next() is s funtion that goes to the next middleware
* We tell the server it is a 404 error server status code
* If we pass `error` to our `next()` it will go to our error handling middleware

## Now we'll create our error handling middleware
* Our error handling middleware had 4 arguments instead of 3
* **important** For error handling in Express you MUST have 4 arguments or it won't work, the first argument is your error

1. set the status code (check for 200) if it is we reached the error from some other route and we want our error to be a generic 500 error code otherwise we want the status code to be what it is

```
app.use((error, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
});
```

* Add more error info

```
app.use((error, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    message: error.message,
    stack: error.stack,
  });
});
```

* We send back json with our error and a stack trace (great for debugging)
* We don't want to do this is production (we'll fix that in a moment)

## Test drive
* Refresh browser and you'll see we have a error message and a stack trace
* `"message": "Not Found - /dasdfsdf",`
* And the line number of the error in the stack trace

## Hide stack trace in production
* You never want to show code line numbers of bugs in production
    - You expose your folder structure
    - What files are running
    - All info that can be used against us

```
// MORE CODE

app.use((error, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    message: error.message,
    stack:
      process.env.NODE_ENV === 'production' ? 'Pancake Stack' : error.stack,
  });
});

// MORE CODE
```

* So if we are in production show some 'Pancake Stack' text and if in development show our stack trace
* We just need to make sure NODE_ENV is equal to `production` on server (most 3rd party hosting servers (like Heroku) are setup with NODE_ENV to 'production' by default)

## Linter complaints
* Next isn't being used and our linter is mad
* We can ignore just that line

```
// eslint-disable-next-line no-unused-vars
app.use((error, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    message: error.message,
    stack:
      process.env.NODE_ENV === 'production' ? 'Pancake Stack' : error.stack,
  });
});
```

* We turn off eslint for that line because even though we aren't using an argument we need all 4 to avoid breaking our app

## Emojis on mac
`cmd` + `cntrl` + `spacebar`
## Emojis on windos
`Windows` + `.`

## When to use `next()`
* You don't always need to use it, you can add it if you want to sent it to other middle for every request

## Why multiple error methods
* One is specific for 404 because we don't want all routes to have 404
* And we have a general error handler for other routes, if they set other error codes they will just forward on to the general error code
    - one error for 404 not found
    - All other errors for any general error that happens

### Examples
* like a token check middleware
    - so if the token is invalid, you could call next with an error that says invalid token (and before that you could set the status code to be 401 unauthorized) and that will go to the general error handling in our express app, which will then return the error response
    - Which is different than a 404

## Extract 2 function into separate middlewares folder

```
// MORE CODE

const middlewares = require('./middlewares');

// MORE CODE

app.use(middlewares.notFound);
app.use(middlewares.errorHandler);

const PORT = process.env.PORT | 1337;
app.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});

// MORE CODE
```

`middlewares.js`

```
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (error, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    message: error.message,
    stack: process.env.NODE_ENV === 'production' ? '🥞' : error.stack,
  });
};

module.exports = {
  notFound,
  errorHandler,
};
```

## Our data model

### Log Entry
* Title (Text)
* Description (Text)
* Comments (Text)
* Rating - (scale of 1 - 10)
* Image - Text - URL
* Start Date - DateTime
* End Date - DateTime
* Latitude - Number
* Longitude - Number
* Created At - DateTime
* Updated At - DateTime

## Install Mongoose
`$ npm i mongoose`

### Mongoose is?
* An ORM for MongoDB
* It allows us to create a model that represents that data we listed above
* And we'll use that model to get the data in and out of the Database

`src/models/LogEntry.js`

### OPEN ESLINT IN THE FOLDER WHERE .eslintrc.js resides
* Huge Fix for terrible problem!
* In order for eslint to work you need to open your editor in the root site where your .eslintrc.js file is
* I opened it in the parent `server` folder and didn't see eslint working
* I closed down vs code and opened directly inside server and then I saw eslint working
stop: 52:42



