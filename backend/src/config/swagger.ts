import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express, Request, Response } from 'express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ADL LMS API',
      version: '1.0.0',
      description: 'API documentation for ADL Learning Management System',
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'sessionId',
        },
      },
    },
  },
  apis: [
    './src/routes/*.ts', 
    './src/app.ts', 
    './src/schema/swaggerSchemas.ts'
  ], // paths to files containing OpenAPI definitions
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Express): void => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'ADL LMS API Documentation',
  }));
  app.use("/api-docs.json", async (req : Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
    
  })
};

export default specs;
