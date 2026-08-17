import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './index';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Tikane API',
      version: '1.0.0',
      description: 'API REST pour la plateforme Tikane - Tontine/Sòl/Sabotay numérique pour Haïti',
      contact: {
        name: 'Tikane Support',
        email: 'support@tikane.ht',
      },
    },
    servers: [
      {
        url: `${config.appUrl}${config.apiPrefix}`,
        description: config.isDev ? 'Serveur de développement' : 'Serveur de production',
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
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth', description: 'Authentification et gestion des sessions' },
      { name: 'Users', description: 'Gestion des utilisateurs' },
      { name: 'Plans', description: 'Gestion des plans de sòl/tontine' },
      { name: 'Subscriptions', description: 'Souscriptions aux plans' },
      { name: 'Payments', description: 'Paiements et versements' },
      { name: 'Transactions', description: 'Historique des transactions' },
      { name: 'Withdrawals', description: 'Retraits et transferts' },
      { name: 'Agents', description: 'Gestion des agents collecteurs' },
      { name: 'Admin', description: 'Administration de la plateforme' },
      { name: 'Notifications', description: 'Système de notifications' },
    ],
  },
  apis: ['./src/modules/**/*.routes.ts', './src/modules/**/*.dto.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
