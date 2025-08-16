import { defineBackend } from '@aws-amplify/backend';
import { PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { sendInvitation } from './backend/functions/send-invitation/resource';

export const backend = defineBackend({
  auth,
  data,
  storage,
  sendInvitation
});


