import express from 'express';
import flashcardsController from '../../controllers/flashcards/flashcards.controller.js';

const router = express.Router();

router.post('/generate', flashcardsController.generateFlashcard);

export default router;
