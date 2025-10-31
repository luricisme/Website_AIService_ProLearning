import express from 'express';
import testRoutes from './test.routes.js';
import notesRoutes from './notes.routes.js';

const router = express.Router();

router.use('/note', notesRoutes);
router.use('/', testRoutes);

export default router;
