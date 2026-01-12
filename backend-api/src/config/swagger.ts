import { Application, Request, Response } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'DRybros Backend API',
            version: '1.0.0',
            description: 'API documentation for the Drybros driver-on-demand platform.',
            contact: {
                name: 'Drybros Support',
            },
        },
        servers: [
            {
                url: process.env.SERVER_URL || 'http://localhost:5000',
                description: 'Local Development Server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
        // Manual definition for Health check as requested
        paths: {
            '/health': {
                get: {
                    tags: ['Health'],
                    summary: 'Check API Health',
                    description: 'Returns the status of the server to ensure it is running correctly.',
                    responses: {
                        200: {
                            description: 'Service is UP',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            status: {
                                                type: 'string',
                                                example: 'OK',
                                            },
                                            service: {
                                                type: 'string',
                                                example: 'DRybros Backend API',
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    },
    apis: ['./src/routes/*.ts', './src/models/*.ts'], // Points to future route files
};

const swaggerSpec: any = swaggerJsdoc(options);

export const swaggerDocs = (app: Application, port: number | string) => {
    // Dynamic server URL based on current port if not in env
    if (!process.env.SERVER_URL) {
        swaggerSpec.servers = [
            {
                url: `http://localhost:${port}`,
                description: 'Local Development Server',
            },
        ];
    }

    // Swagger page
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

    // Docs in JSON format
    app.get('/api/docs.json', (req: Request, res: Response) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerSpec);
    });

    console.log(`📄 Swagger docs available at http://localhost:${port}/api/docs`);
};
