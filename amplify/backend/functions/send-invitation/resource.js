import { defineFunction } from '@aws-amplify/backend';
export const sendInvitation = defineFunction({
    name: 'send-invitation',
    entry: './index.ts',
    runtime: 20,
    environment: {
        SES_FROM_EMAIL: 'sakthimari@gmail.com',
        APP_URL: process.env.APP_URL || 'http://localhost:5173',
    },
});
