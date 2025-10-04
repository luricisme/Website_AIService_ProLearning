const express = require("express");
const cors = require('cors');
const corsOptions = require('./config/corsOptions');
const setupSwagger = require('./config/swaggerConfig');
const route = require('./routes/app.routes');

const app = express();
const PORT = 3333;

// Setup cors
app.use(cors(corsOptions));

// Middleware (to parse JSON requests)
app.use(express.json());

// Setup swagger
setupSwagger(app);

// Setup route for APIs
route(app);

// Start server
app.listen(PORT, () => {
  console.log(`❄️ Server is running on http://localhost:${PORT}`);
  console.log(`📌 Swagger UI available at http://localhost:${PORT}/api-docs`);
});
