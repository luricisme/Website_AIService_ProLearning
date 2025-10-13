import express from 'express';
import takeNotesController from '../../controllers/takenotes/take-notes.controller.js';

const router = express.Router();

router.post('/explain', takeNotesController.explainWithAI);

router.post('/summarize', takeNotesController.summaryFileWithAI);

export default router;

