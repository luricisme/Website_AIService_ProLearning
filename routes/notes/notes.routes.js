import express from 'express';
import notesController from '../../controllers/notes/notes.controller.js';

const router = express.Router();

router.post('/explain', notesController.explainWithAI);

router.post('/summarize', notesController.summaryFileWithAI);

export default router;

