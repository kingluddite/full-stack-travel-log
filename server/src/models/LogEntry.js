const mongoose = require('mongoose');

const { Schema } = mongoose;

const requiredNumber = {
  type: Number,
  required: true
};

const logEntrySchema = new Schema(
  {
    // title: String, // String is shorthand for {type: String}
    title: {
      type: String,
      require: true
    },
    description: String,
    comments: String,
    image: String,
    rating: {
      type: Number,
      min: 0,
      max: 10,
      default: 0
    },
    latitude: {
      requiredNumber,
      ...requiredNumber,
      min: -90,
      max: 90
    },
    longitude: {
      ...requiredNumber,
      min: -180,
      max: 180
    },
    visitDate: {
      required: true,
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// compile our schema into a Model
const LogEntry = mongoose.model('LogEntry', logEntrySchema);

module.exports = LogEntry;
