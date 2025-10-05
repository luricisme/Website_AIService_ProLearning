import express from 'express';
import takeNotesController from '../../controllers/takenotes/take-notes.controller.js';

const router = express.Router();

router.get('/explain', takeNotesController.explainWithAI);

export default router;

