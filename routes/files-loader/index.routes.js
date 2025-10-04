import express from 'express';
import filesLoaderRoutes from './files-loader.routes.js';

const router = express.Router();

router.use('/files-loader', filesLoaderRoutes);


export default router;