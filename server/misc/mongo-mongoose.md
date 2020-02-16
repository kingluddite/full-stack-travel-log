# MongoDB and Mongoose
* MongoDB doesn't have schemas built into it
* Add automatic createdAt and updatedAt

```
// MORE CODE

const logEntrySchema = new Schema(
  {
    // title: String, // String is shorthand for {type: String}
    title: {
      type: String,
      require: true,
    },
    description: String,
    comments: String,
    rating: {
      type: Number,
      min: 0,
      max: 10,
      default: 0,
    },
    longitude: requiredNumber,
    latitude: requiredNumber,
  },
  {
    timestamps: true, // this is what makes them automatic
  },
);

// MORE CODE
```

## Final Schema
`src/models/LogEntry.js`

```
const mongoose = require('mongoose');

const { Schema } = mongoose;

const requiredNumber = {
  type: Number,
  required: true,
};

const logEntrySchema = new Schema(
  {
    // title: String, // String is shorthand for {type: String}
    title: {
      type: String,
      require: true,
    },
    description: String,
    comments: String,
    image: String,
    rating: {
      type: Number,
      min: 0,
      max: 10,
      default: 0,
    },
    latitude: {
      requiredNumber,
      ...requiredNumber,
      min: -90,
      max: 90,
    },
    longitude: {
      ...requiredNumber,
      min: -180,
      max: 180,
    },
    visitDate: {
      required: true,
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

// compile our schema into a Model
const LogEntry = mongoose.model('LogEntry', logEntrySchema);

module.exports = LogEntry;
```

* The model is what gives us methods like `find()`, `create()`, `update()` ...


## Connect mongoose to Database
* Add environmental variables

`$ npm dotenv`

* Create `.env` file in server rool

`.env`

```
NODE_ENV=development
PORT=1337
DATABASE_URL=mongo://localhost/retail-apocalypse
CORS_ORIGIN=http://localhost:3000
```

## Add environment variables
```
// MORE CODE

const mongoose = require('mongoose');

// bring in environment variables
require('dotenv').config();

const middlewares = require('./middlewares');

mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true });

// MORE CODE

app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
  }),
);

// MORE CODE

const PORT = process.env.PORT | 1337;
app.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});

// MORE CODE
```

* By calling `require('dotenv').config()`
    - It will automatically read in `.env` (if it exists), set those environment variables
    - And anywhere we use `process.env.SOME_VARIABLE` it will use those environoment variable values

