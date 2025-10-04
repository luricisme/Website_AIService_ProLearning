import express from 'express';
import filesLoaderController from '../../controllers/files-loader/files-loader.controller.js';

const router = express.Router();

router.get('/pdf', filesLoaderController.pdfLoader);

export default router;

