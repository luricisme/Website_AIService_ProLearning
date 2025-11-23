import express from 'express';
import flashcardsRoute from './flashcards.routes.js';

const router = express.Router();

router.use('/flashcard', flashcardsRoute);

export default router;
