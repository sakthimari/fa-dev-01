# Image Upload Setup and Testing Guide

## 🖼️ Image Upload Features Added

### New Components Created:
1. **ImageUploadService** (`src/services/ImageUploadService.ts`)
   - Handles profile and cover photo uploads
   - File validation (size, type)
   - AWS S3 storage integration

2. **ImageUpload Component** (`src/components/ImageUpload.tsx`)
   - Reusable upload component
   - Drag & drop support
   - Progress indicators
   - Error handling

3. **Storage Configuration** (`amplify/storage/resource.ts`)
   - S3 bucket configuration
   - Access permissions per user
   - Organized file structure

### Updated Components:
- **EditProfile** - Now includes image upload functionality
- **Backend Config** - Added storage to Amplify backend
- **Data Schema** - Added photo URL and key fields

## 🚀 Setup Instructions

### 1. Deploy Amplify Backend (Required)
```bash
cd c:/dev/fa-dev-01
npx ampx sandbox
```
This creates:
- S3 bucket for image storage
- DynamoDB table with new fields
- API endpoints for file operations

### 2. Test Local Development
```bash
npm run dev
```

### 3. Test Image Upload Flow
1. Navigate to `/profile/edit`
2. Click "Upload Cover" or "Upload Photo"
3. Select an image file (JPG, PNG, WebP)
4. File uploads to S3 automatically
5. URL saves to user profile in DynamoDB
6. Image displays immediately

## 📁 File Organization in S3

```
profile-storage-bucket/
├── public/
│   ├── profile-photos/
│   │   └── {user-id}/
│   │       ├── profile-123456.jpg
│   │       └── profile-789012.png
│   └── cover-photos/
│       └── {user-id}/
│           ├── cover-123456.jpg
│           └── cover-789012.png
└── private/
    └── {cognito-identity-id}/
        ├── profile-photos/
        │   └── {user-id}/
        └── cover-photos/
            └── {user-id}/
```

## 🔒 Security Features

- **User Isolation**: Each user can only access their own photos
- **File Validation**: Size limit (5MB), type checking
- **Secure URLs**: Temporary signed URLs for access
- **Auto Cleanup**: Old files can be programmatically removed

## 📝 Supported Features

### ✅ What Works:
- Upload profile photos
- Upload cover photos  
- File validation (size, type)
- Real-time preview
- Error handling
- Progress indicators
- Remove photos functionality

### 🔄 File Types Supported:
- JPEG/JPG
- PNG
- WebP
- Max size: 5MB

## 🧪 Testing Checklist

### Image Upload Tests:
- [ ] Upload valid image (JPG/PNG)
- [ ] Try uploading large file (>5MB) - should error
- [ ] Try uploading non-image file - should error
- [ ] Upload profile photo - should display immediately
- [ ] Upload cover photo - should display immediately
- [ ] Remove photo - should revert to default
- [ ] Save profile - URLs should persist
- [ ] Reload page - images should load from saved URLs

### Error Handling Tests:
- [ ] Network disconnection during upload
- [ ] Invalid file format
- [ ] File too large
- [ ] S3 permission errors

## 🐛 Troubleshooting

### Common Issues:

1. **"Storage not configured" Error**
   - Run `npx ampx sandbox` to deploy backend
   - Check `amplify_outputs.json` is updated

2. **Upload fails silently**
   - Check browser console for errors
   - Verify user is authenticated
   - Check S3 bucket permissions

3. **Images don't display**
   - Check if URLs are valid in network tab
   - Verify S3 bucket CORS settings
   - Check image file permissions

### Debug Steps:
1. Open browser developer tools
2. Check Network tab during upload
3. Look for failed requests
4. Check Console for error messages

## 🎯 Next Steps

### Possible Enhancements:
- Image compression before upload
- Multiple image support
- Drag & drop upload area
- Image cropping/editing
- Progressive image loading
- Automatic thumbnail generation

### Integration:
- Use uploaded photos in ProfileLayout
- Display in user cards/avatars
- Social feed integration
- Profile sharing features
