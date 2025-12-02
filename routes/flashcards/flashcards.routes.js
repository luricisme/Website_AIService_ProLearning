import express from 'express';
import flashcardsController from '../../controllers/flashcards/flashcards.controller.js';

const router = express.Router();

router.post('/generate-by-file', flashcardsController.generateFlashcardByFile);
router.post('/generate-by-note', flashcardsController.generateFlashcardByNote);

export default router;
