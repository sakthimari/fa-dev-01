import { defineFunction } from '@aws-amplify/backend';

export const sendInvitation = defineFunction({
  name: 'send-invitation',
  entry: './handler.ts',
  runtime: 20,
  environment: {
    SES_FROM_EMAIL: 'sakthimari@email.com',
    APP_URL: process.env.APP_URL || 'http://localhost:5173',
  },
});