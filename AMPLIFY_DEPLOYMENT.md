# Deploy Amplify Backend

## Steps to deploy the updated backend with UserProfile model:

1. **Install/Update Amplify CLI** (if not already installed):
   ```bash
   npm install -g @aws-amplify/cli
   ```

2. **Deploy the backend changes**:
   ```bash
   cd c:/dev/fa-dev-01
   npx ampx sandbox
   ```
   
   OR if you want to deploy to a permanent environment:
   ```bash
   npx ampx pipeline-deploy --branch main
   ```

3. **Generate updated client types** (after deployment):
   ```bash
   npx ampx generate client-config --out ./src/amplifyconfiguration.json
   ```

## What this deployment includes:

- **UserProfile Model**: Stores all profile data (name, email, phone, bio, etc.)
- **Owner-based Authorization**: Each user can only access their own profile data
- **AWS DynamoDB Table**: Automatically created and managed by Amplify
- **GraphQL API**: Auto-generated CRUD operations for UserProfile

## After deployment:

Your app will be able to:
- ✅ Save profile data to AWS DynamoDB
- ✅ Load existing profile data when editing
- ✅ Update profile information
- ✅ Secure data access (owner-only)

## Note:
Make sure you're authenticated with AWS CLI and have proper permissions to deploy Amplify resources.
