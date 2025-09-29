const express = require('express');
const router = express.Router();
const Review = require('../models/review.js');
const Movie = require('../models/movie.js');

router.post('/', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect('/auth/sign-in');
    }

    const existingReview = await Review.findOne({
      movieId: req.body.movieId,
      userId: req.session.user._id
    });

    if (existingReview) {
      return res.send('You have already reviewed this movie. Please edit your existing review.');
    }

    req.body.userId = req.session.user._id;
    const newReview = await Review.create(req.body);

    await Movie.findByIdAndUpdate(req.body.movieId, {
      $push: { reviewId: newReview._id }
    });

    const allReviews = await Review.find({ movieId: req.body.movieId });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    await Movie.findByIdAndUpdate(req.body.movieId, { avgRating: avgRating.toFixed(1) });

    res.redirect(`/movies/${req.body.movieId}`);
  } catch (error) {
    console.log(error);
    res.redirect('/movies');
  }
});

router.get('/:id/edit', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect('/auth/sign-in');
    }

    const review = await Review.findById(req.params.id).populate('movieId');

    if (review.userId.toString() !== req.session.user._id) {
      return res.send('You can only edit your own reviews');
    }

    res.render('reviews/edit.ejs', { review });
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

    const review = await Review.findById(req.params.id);

    if (review.userId.toString() !== req.session.user._id) {
      return res.send('You can only edit your own reviews');
    }

    await Review.findByIdAndUpdate(req.params.id, req.body);

    const allReviews = await Review.find({ movieId: review.movieId });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    await Movie.findByIdAndUpdate(review.movieId, { avgRating: avgRating.toFixed(1) });

    res.redirect(`/movies/${review.movieId}`);
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

    const review = await Review.findById(req.params.id);

    if (review.userId.toString() !== req.session.user._id) {
      return res.send('You can only delete your own reviews');
    }

    const movieId = review.movieId;
    await Review.findByIdAndDelete(req.params.id);

    await Movie.findByIdAndUpdate(movieId, {
      $pull: { reviewId: req.params.id }
    });

    const allReviews = await Review.find({ movieId });
    if (allReviews.length > 0) {
      const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
      await Movie.findByIdAndUpdate(movieId, { avgRating: avgRating.toFixed(1) });
    } else {
      await Movie.findByIdAndUpdate(movieId, { avgRating: 0 });
    }

    res.redirect(`/movies/${movieId}`);
  } catch (error) {
    console.log(error);
    res.redirect('/movies');
  }
});

module.exports = router;