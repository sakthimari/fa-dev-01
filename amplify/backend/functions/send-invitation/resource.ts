import { defineFunction } from '@aws-amplify/backend';

export const sendInvitation = defineFunction({
  name: 'send-invitation',
  entry: './handler.ts',
  runtime: 20,
  environment: {
    SES_FROM_EMAIL: 'sakthimari@gmail.com',
    //APP_URL: 'https://main.d14dyhki3v6xyw.amplifyapp.com/modern-auth/sign-in' || 'http://localhost:5173',
      APP_URL: 'https://main.d14dyhki3v6xyw.amplifyapp.com/modern-auth/sign-in'
  },
});