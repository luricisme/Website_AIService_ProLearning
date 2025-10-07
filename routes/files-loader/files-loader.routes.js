import express from 'express';
import filesLoaderController from '../../controllers/files-loader/files-loader.controller.js';

const router = express.Router();

router.get('/all', filesLoaderController.fileLoader);

export default router;

