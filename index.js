import 'dotenv/config'; 
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import corsOptions from './config/corsOptions.js';
import setupSwagger from './config/swaggerConfig.js';
import route from './routes/app.routes.js';

const app = express();
const ENV = process.env.NODE_ENV || "development";
const PORT = process.env.PORT || 3333;

// Setup cors
app.use(cors(corsOptions));

// Middleware (to parse JSON requests)
app.use(express.json());

// Setup logging
if (ENV === "development") {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined')); // 
}

// Setup swagger
setupSwagger(app);

// Setup route for APIs
route(app);

// Start server
app.listen(PORT, () => {
  if (ENV === "development") {
    console.log(`❄️  Server is running on http://localhost:${PORT}`);
    console.log(`📌 Swagger UI available at http://localhost:${PORT}/api-docs`);
  } else {
    console.log(`🚀 Server is running in ${ENV} mode`);
    console.log(`🌍 Live URL: https://prolearning-aiservice.onrender.com`);
    console.log(`📘 Swagger UI: https://prolearning-aiservice.onrender.com/api-docs`);
  }
});