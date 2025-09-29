const express = require('express');
const router = express.Router();
const Movie = require('../models/movie.js');
const Review = require('../models/review.js');

router.get('/', async (req, res) => {
  try {
    const { search, genre, year, minRating } = req.query;
    let query = {};

    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    if (genre) {
      query.genre = genre;
    }

    if (year) {
      query.year = parseInt(year);
    }

    if (minRating) {
      query.avgRating = { $gte: parseFloat(minRating) };
    }

    const movies = await Movie.find(query).sort({ createdAt: -1 });

    res.render('movies/index.ejs', { 
      movies,
      filters: { search, genre, year, minRating }
    });
  } catch (error) {
    console.log(error);
    res.redirect('/');
  }
});

router.get('/new', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/auth/sign-in');
  }
  if (req.session.user.role !== 'admin') {
    return res.send('Only admins can add movies');
  }
  res.render('movies/new.ejs');
});

router.get('/:id', async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id).populate({
      path: 'reviewId',
      populate: { path: 'userId' }
    });

    let userReview = null;
    if (req.session.user) {
      userReview = movie.reviewId.find(r => r.userId._id.toString() === req.session.user._id);
    }

    res.render('movies/show.ejs', {
      movie,
      userReview
    });
  } catch (error) {
    console.log(error);
    res.redirect('/movies');
  }
});

router.post('/', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect('/auth/sign-in');
    }
    if (req.session.user.role !== 'admin') {
      return res.send('Only admins can add movies');
    }
    await Movie.create(req.body);
    res.redirect('/movies');
  } catch (error) {
    console.log(error);
    res.redirect('/movies/new');
  }
});

router.get('/:id/edit', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect('/auth/sign-in');
    }
    if (req.session.user.role !== 'admin') {
      return res.send('Only admins can edit movies');
    }
    const movie = await Movie.findById(req.params.id);
    res.render('movies/edit.ejs', { movie });
  } catch (error) {
    console.log(error);
    res.redirect('/movies');
  }
});

router.put('/:id', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect('/auth/sign-in');
    }
    if (req.session.user.role !== 'admin') {
      return res.send('Only admins can edit movies');
    }
    await Movie.findByIdAndUpdate(req.params.id, req.body);
    res.redirect(`/movies/${req.params.id}`);
  } catch (error) {
    console.log(error);
    res.redirect('/movies');
  }
});

router.delete('/:id', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect('/auth/sign-in');
    }
    if (req.session.user.role !== 'admin') {
      return res.send('Only admins can delete movies');
    }
    await Review.deleteMany({ movieId: req.params.id });
    await Movie.findByIdAndDelete(req.params.id);
    res.redirect('/movies');
  } catch (error) {
    console.log(error);
    res.redirect('/movies');
  }
});

module.exports = router;