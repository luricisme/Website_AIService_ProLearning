const express = require('express');
const router = express.Router();
const testController = require('../../controllers/takenotes/test.controller');

/**
 * @swagger
 * /hello-world:
 *   get:
 *     summary: Test working of APIs
 *     description: Test API to check if the server is running correctly.
 *     tags: [Test]
 *     responses:
 *       200:
 *         description: Successfully returns a greeting message
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: Hello, Express!
 */
router.get('/hello-world', testController.helloWorld);

module.exports = router;

