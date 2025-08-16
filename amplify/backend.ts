import { defineBackend } from '@aws-amplify/backend';
import { PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
// Removed sendInvitation import

export const backend = defineBackend({
  auth,
  data,
  storage,
  // Removed sendInvitation from backend definition
});

// Grant SES permissions to the sendInvitation function
// Removed SES permissions for sendInvitation function
