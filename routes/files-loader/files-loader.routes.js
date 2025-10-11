import express from 'express';
import filesLoaderController from '../../controllers/files-loader/files-loader.controller.js';

const router = express.Router();

router.post('/all', filesLoaderController.fileLoader);

export default router;

