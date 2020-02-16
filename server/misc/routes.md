# Routes
* Now we need to create an endpoint for creating new log entries

`server/src/api/logs.js`

```
const express = require('express');

cosnt router = express.Router();
```

* This will be a router that has multiple routes for interacting with our log entry document store

## Refactor by destructuring
* This is a simple router (it only handle one route)

```
const { Router } = require('express');

const router = Router();

router.get('/', (req, res) => {
  res.json({
    message: '🌎',
  });
});

module.exports = router;
```

## Add this router to our actual Express app
`src/index.js`

```
// MORE CODE

const middlewares = require('./middlewares');
const logs = require('./api/logs');

// MORE CODE
```

* Now we want to use this router after our middlewares but before our notfound

`index.js`

```
// MORE CODE
app.use('/api/logs', logs); // add this line

app.use(middlewares.notFound);
app.use(middlewares.errorHandler);

const PORT = process.env.PORT || 1337;
app.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});
```

* When a request comes into our server on `/api/logs` it will go into the logs router and see if any of the routes match

`api/logs.js`

```
// MORE CODE

router.get('/', (req, res) => {
  res.json({
    message: '🌎',
  });
});

// MORE CODE
```

## Visit route
`http://localhost:1337/api/logs`

* And you'll see we get a response (a json response)

```
{
"message": "🌎"
}
```

## Now make a post request against this to make a new log entry
## Postman
* Fireup Postman
    - There is a browser based postwoman.io (doensn't work with localhost without config because of CORS issues)
* Postman is a tool for testing APIs
* We'll use this to create a route and make a POST request with a log entry we'd like to create
* When you fill out a form and hit 'submit' this is the backend route that you will hit

![postman with post request route](https://i.imgur.com/Bwh7K7S.png)

* We enter our route
* We select `Body` tab
* We select the `raw` radio button
* We choose JSON (application/json) from the dropdown
* We write in the body

```
{
    "title": "Empire State Buidling"
}
```

* **note** The raw test data in body needs to be in JSON format
* **note** We get a 404 not found error because the route does not yet exist

## Let's create that post route
* When we receive a POST request on the `/` route, this is the handler that is going to run
    - We will log the `req.body` (this is the thing that we are sending to the server)
    - That's this data

```
{
  "title": "Empire State Building"
}
```

### connection error
`(node:23325) UnhandledPromiseRejectionWarning: MongoParseError: Invalid connection string`

* We spelled `mongo` instead of `mongodb`

`.env`

```
// MORE CODE
DATABASE_URL=mongodb://localhost/retail-apocalypse
CORS_ORIGIN=http://localhost:3000
```

## Fix mongo terminal error by adding this:
`index.js`

```
// MORE CODE

mongoose.connect(process.env.DATABASE_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// MORE CODE
```

## View in Postman
* Click send again and it just hangs
* The reason is we need to add body parsing middleware

## Body parsing middleware
* Since we are using `req.body` we need a body parsing middleware
* So we'll need to add that
    - Used to have to install a separate bodyParser npm module but now it is built in

`index.js`

```
// MORE CODE

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
  }),
);
// add body parsing middleware
app.use(express.json());

// MORE CODE
```

* Why are we only using JSON?
    - Good observation, we only include JSON because we are only going to be dealing with backend
* If we also wanted to deal with URLs we would add both of these:

```
app.use(bodyParser.urlencoded());

app.use(bodyParser.json());
```

* **note** the bodyParser() constructor has been deprecated, as of 2014-06-19
## Now try to Send on Postman again
* You will see the data on the back end terminal

![req.body in terminal](https://i.imgur.com/WP4Nqi1.png)

```
{ title: 'Empire State Building' }
```

## Now we are getting data on the backend
* [JSON viewer](https://chrome.google.com/webstore/detail/json-viewer/gbmdgpbipfallnflgajpaliibnhdgobh?hl=en-US) (best json viewer)

## Now we need to pull in LogEntry model
* And attempt to create a new log entry
* `.save()` will create it
* will also run all the validation we set in our schema
* Made prettier use single quotes
* remove errors on eslint for dangling commas

`.eslintrc.js`
```
// MORE CODE

rules: {
    quotes: [2, 'single', { avoidEscape: true }],
    'comma-dangle': ['error', 'never']
  }
};
// MORE CODE
```

### Constructing documents
* We create an instance and use `.save()`
* **note** `.save()` returns a Promise

![returns a Promise document](https://i.imgur.com/MhTn5R5.png)

`logs.js`

```
const { Router } = require('express');
const LogEntry = require('../models/LogEntry');

const router = Router();

router.get('/', (req, res) => {
  res.json({
    message: '🌎',
  });
});

router.post('/', async (req, res) => {
  try {
    const logEntry = new LogEntry(req.body);
    await logEntry.save();
  } catch (error) {
    //
  }
});

module.exports = router;
```

* Run Postman
* Hit enter and now you will see error because Mongoose is running our validations by default
    1. The call to `.save()`
    2. Threw an error
    3. We pass that on to our error handler (defined in index.js) which then actually responds

```
// MORE CODE

router.post("/", async (req, res, next) => {
  try {
    const logEntry = new LogEntry(req.body);
    const createdEntry = await logEntry.save();
    res.json(createdEntry);
  } catch (error) {
    next(error);
  }
});
// MORE CODE
```

## What error status should we throw?
* 404? 422?

```
router.post('/', async (req, res, next) => {
  try {
    const logEntry = new LogEntry(req.body);
    const createdEntry = await logEntry.save();
    res.json(createdEntry);
  } catch (error) {
    // console.log(error.constructor);
    next(error);
  }
});
```

* Now we find out that it is a mongoose error

```
router.post('/', async (req, res, next) => {
  try {
    const logEntry = new LogEntry(req.body);
    const createdEntry = await logEntry.save();
    res.json(createdEntry);
  } catch (error) {
    // console.log(error.constructor);
    next(error);
  }
});
```

* Now we use error.name and that will give us a Validation error
* And you will see `ValidationError`
    - So if there is a validation error we'll set status code to 422

```
// MORE CODE

router.post('/', async (req, res, next) => {
  try {
    const logEntry = new LogEntry(req.body);
    const createdEntry = await logEntry.save();
    res.json(createdEntry);
  } catch (error) {
    if (error.name === 'ValidationError') {
      res.status(422);
    }
    next(error);
  }
});
// MORE CODE
```

## duckduckgo search engine
* Make default search engine
![Make Default search engine](https://i.imgur.com/W7SyLnC.png)
* Search empire state buiding
* Maps (duckduckgo uses apple maps)
* [How to find long and lat?](https://www.latlong.net/convert-address-to-lat-long.html)
    - Long: 40.749300
    - Lat: -73.986470
* Google maps gives you lat and lng directly in URL of address you are searching

## Add a visit date?
### Problem: How does Mongo interpret dates?
* We need to pass date as an ISO string

### How do we get an ISO data string
* Let's test in client console

```
> const place = { data: new Date() }
< undefined
> JSON.stringify(place)
< "{"data":"2020-02-16T20:38:50.895Z"}"
```

### How to directly get ISO date for today
```
> const now = new Date()
< undefined
> now.toISOString()
< "2020-02-16T20:40:00.632Z"
```

* Mongoose likes ISO date string and that is what we give it
    - And then mongoose will be able to convert that to a date/time

## knexjs.com
* [docs](http://knexjs.org/)
* [tutorial video on using knex to build a Node.js Express JSON API - CRUD Stickers](https://www.youtube.com/watch?v=xFsaRVNLtxI)
* "Knex.js is a "batteries included" SQL query builder for Postgres, MSSQL, MySQL, MariaDB, SQLite3, Oracle, and Amazon Redshift designed to be flexible, portable, and fun to use. It features both traditional node style callbacks as well as a promise interface for cleaner async flow control, a stream interface, full featured query and schema builders, transaction support (with savepoints), connection pooling and standardized responses between different query clients and dialects."

## Let's add post to our Database in Postman
* This is your body entry:

```
{
  "title": "Empire State Building",
  "comment": "Went to the top floor. Amazing view!",
  "latitude": 40.749300,
  "longitude": -73.986470,
  "visitDate": "2020-02-16T20:40:00.632Z",
  "rating": 7,
  "image": "https://en.wikipedia.org/wiki/File:Empire_State_Building_(aerial_view).jpg"
}
```

* Fix if you get errors
* You should get a 200 OK status

### Postman output
```
{
    "rating": 7,
    "_id": "5e49ac3fd1053c69eb3172d3",
    "title": "Empire State Building",
    "latitude": 40.7493,
    "longitude": -73.98647,
    "visitDate": "2020-02-16T20:40:00.632Z",
    "image": "https://en.wikipedia.org/wiki/File:Empire_State_Building_(aerial_view).jpg",
    "createdAt": "2020-02-16T20:55:27.367Z",
    "updatedAt": "2020-02-16T20:55:27.367Z",
    "__v": 0
}
```

* **notes**
    - createdAt and updatedAt automatically get set (this is because we set timestamps to true)
    - We also see that visitDate also gets set properly

## Congrats
* You've successfully tested your POST route. Success!

## Now we need to create a route that will list all logs
* We will update this get route

`src/api/logs.js`

```
// MORE CODE

router.get('/', (req, res) => {
  res.json({
    message: '🌎'
  });
});
// MORE CODE
```

* Update to

```
// MORE CODE

router.get('/', async (req, res) => {
  const entries = await LogEntry.find();
  res.json(entries);
});
// MORE CODE
```

* Now this URL is not the home page although it looks like it with `/`
* Why?
    - Because in `index.js` we import our logs route
    - And then we set the route to `/api/logs` and point it to that file
    - So the `/` in `api/logs.js` is really `/api/logs`

```
// MORE CODE

const logs = require('./api/logs');

// MORE CODE

app.get('/', (req, res) => {
  res.json({
    message: 'Hello World!'
  });
});

app.use('/api/logs', logs);
// MORE CODE
```

* This is important because if you just go to `/` you will only see this:

```
// 20200216130532
// http://localhost:1337/

{
  "message": "Hello World!"
}
```

* But viewing `http://localhost:1337/api/logs` will show you the one entry we created and saved to our MongoDb Database via mongoose

## Output is an array of all log entries in our Database
* Output from hitting route

```
[
  {
    "rating": 7,
    "_id": "5e49ac3fd1053c69eb3172d3",
    "title": "Empire State Building",
    "latitude": 40.7493,
    "longitude": -73.98647,
    "visitDate": "2020-02-16T20:40:00.632Z",
    "image": "https://en.wikipedia.org/wiki/File:Empire_State_Building_(aerial_view).jpg",
    "createdAt": "2020-02-16T20:55:27.367Z",
    "updatedAt": "2020-02-16T20:55:27.367Z",
    "__v": 0
  }
]
```

## Better to be safe then sorry
* Even though this is a simple route and should have too many problems it is a best practice to wrap it in a try/catch

```
// MORE CODE

router.get('/', async (req, res, next) => {
  try {
    const entries = await LogEntry.find();
    res.json(entries);
  } catch (error) {
    next(error);
  }
});
// MORE CODE
```

* Now if there is an error we'll forward to our main error hander at the bottom of `index.js`
* **note** We need to add a third `next` argument
    - `next()` forwards the error onto the "next" middleware

## Use compass
* Delete the last entry and add these 2

```
// 20200216133024
// http://localhost:1337/api/logs

[
  {
    "rating": 2,
    "_id": "5e49b3218ad0e36af7171a2f",
    "title": "Sears Newark, CA",
    "latitude": 37.52531,
    "longitude": -122.00728,
    "visitDate": "2020-02-16T20:40:00.632Z",
    "image": "http://photos.wikimapia.org/p/00/02/42/82/65_big.jpg",
    "createdAt": "2020-02-16T21:24:49.134Z",
    "updatedAt": "2020-02-16T21:24:49.134Z",
    "__v": 0
  },
  {
    "rating": 1,
    "_id": "5e49b3f48ad0e36af7171a30",
    "title": "Sears Thousand Oaks CA",
    "latitude": -34.632462,
    "longitude": -58.483589,
    "visitDate": "2020-02-16T20:40:00.632Z",
    "image": "https://ocbj.media.clients.ellingtoncms.com/img/photos/2018/07/02/WEB-Sears_THOUSAND_OAKS_Nm2TAbY_t670.jpg?b3f6a5d7692ccc373d56e40cf708e3fa67d9af9d",
    "createdAt": "2020-02-16T21:28:20.212Z",
    "updatedAt": "2020-02-16T21:28:20.212Z",
    "__v": 0
  }
]
```

* You can update the dates to be different (remember to click update in Compass)
* Visit `/api/logs` and you will now see 2 entries

## Add git
* `$ git init`
* copy the .env and rename to `.env.example`
* [Video for creating gitignore from command line](https://www.youtube.com/watch?v=vQuE_1jCQMw)
* [add to zsh](https://docs.gitignore.io/install/command-line#macos)
* `$ gi node,macos >> .gitignore`
* `$ git status` and you won't see `.env` or `node_modules`
* Done!



