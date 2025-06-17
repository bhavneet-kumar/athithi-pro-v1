import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Your API',
      version: '1.0.0',
    },
  },
  apis: [
    './src/module/**/*.ts', // <-- Make sure this includes all your controllers!
  ],
};

export const swaggerDocument = swaggerJsdoc(options);
export { swaggerUi };
