#!/bin/bash
# Deploy S3 Permissions Fix

echo "🚀 Deploying S3 permissions fix..."
echo "This will update your S3 bucket to allow public read access for profile photos"

# Navigate to project directory
cd /c/dev/fa-dev-01

# Deploy Amplify backend with storage configuration
echo "Running: npx amplify push"
npx amplify push

echo "✅ S3 permissions fix deployed!"
echo "Now Tulasi should be able to view Arya's avatar pictures"
