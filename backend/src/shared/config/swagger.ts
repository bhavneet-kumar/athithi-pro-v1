import fs from 'node:fs';

import yaml from 'js-yaml';

const swaggerDocument = yaml.load(fs.readFileSync('./docs/swagger.yaml', 'utf8')) as Record<string, unknown>;

export { swaggerDocument };

export { default as swaggerUi } from 'swagger-ui-express';
