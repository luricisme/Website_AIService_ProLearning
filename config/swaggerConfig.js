import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const apiOptions = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "API document for BookStore Website",
            version: "1.0.0",
            description: "API project of Web Development in HCMUS"
        },
        servers: [
            {
                url: 'http://localhost:3333',
                description: 'Local server'
            },
        ],
    },
    apis: [path.join(__dirname, '../routes/**/*.js')],
}

const swaggerSpec = swaggerJSDoc(apiOptions);

const setupSwagger = (app) => {
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};

export default setupSwagger;