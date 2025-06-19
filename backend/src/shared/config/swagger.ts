import swaggerJsdoc from 'swagger-jsdoc';

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

export { default as swaggerUi } from 'swagger-ui-express';
