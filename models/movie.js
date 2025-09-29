const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },
  genre: {
    type: String,
    required: true,
  },
  runtime: {
    type: Number,
    required: true,
  },
  director: {
    type: String,
    required: true,
  },
  cast: {
    type: String,
    required: true,
  },
  avgRating: {
    type: Number,
    default: 0,
  },
  reviewId: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review'
  }]
});

const Movie = mongoose.model('Movie', movieSchema);
module.exports = Movie;