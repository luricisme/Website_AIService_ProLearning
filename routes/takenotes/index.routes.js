import express from 'express';
import testRoutes from './test.routes.js';
import takeNotesRoutes from './take-notes.routes.js';

const router = express.Router();

router.use('/take-notes', takeNotesRoutes);
router.use('/', testRoutes);

export default router;
