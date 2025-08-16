import { defineBackend } from '@aws-amplify/backend';
import { PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
// ...existing code...
export const backend = defineBackend({
    auth,
    data,
    storage,
    // ...existing code...
});
// ...existing code...
