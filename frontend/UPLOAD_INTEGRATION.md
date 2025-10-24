# Upload API Integration - Complete Guide

## ✅ Integration Status

The upload API has been fully integrated into the prediction form with the following enhancements:

## 🎯 Features Implemented

### 1. **File Upload with R2 Storage**

- Files are uploaded to Cloudflare R2 (S3-compatible storage)
- Supports both images and videos
- Public URLs are returned for display
- Metadata tracking (uploader, timestamp, original filename)

### 2. **Enhanced Prediction Form**

- ✅ File validation (type and size)
- ✅ Real-time preview for images and videos
- ✅ Upload progress indication
- ✅ Better error handling
- ✅ Maximum file size: 10MB (configurable)
- ✅ Supported formats: PNG, JPG, MP4, MOV, etc.

### 3. **Upload API Functions**

Located in `/lib/api.ts`:

```typescript
// Upload image or video
uploadApi.uploadImage(file: File)

// Upload video specifically
uploadApi.uploadVideo(file: File)
```

Both return:

```typescript
{
  success: boolean;
  url: string; // Public R2 URL
  key: string; // R2 storage key
  originalName: string;
  size: number;
  type: string; // MIME type
  fileType: "image" | "video";
}
```

## 📁 File Structure

```
frontend/
├── lib/
│   ├── api.ts              # Upload API functions
│   ├── r2-store.ts         # R2 storage implementation
│   └── types.ts
├── components/
│   └── prediction-form.tsx # Form with upload integration
└── app/
    └── api/
        └── upload/
            └── route.ts    # Upload endpoint
```

## 🔧 Configuration

### Required Environment Variables

```env
# R2 Configuration (Already set in .env)
R2_ENDPOINT="https://820b251b57951011c6bcc9add6ca5ca4.r2.cloudflarestorage.com"
R2_BUCKET_NAME="reelsfly"
R2_ACCESS_KEY_ID="09075b2b7a057e70d9305ab5008ad347"
R2_SECRET_ACCESS_KEY="cd6f30790859bc2272050ef81fc7761a11784ae136ec1de7020f18b7b121b537"
R2_PUBLIC_DOMAIN="https://pub-d842b814c7c64f5caefc4f21e1f4ef6b.r2.dev"
```

## 🚀 Usage in Prediction Form

### Flow:

1. **User selects file** → Client-side validation (size, type)
2. **Preview generated** → Local preview shown
3. **Form submission** → File uploaded to R2
4. **URL returned** → Stored in prediction metadata
5. **Prediction created** → Image URL saved to database

### Code Example:

```typescript
// In prediction-form.tsx
const uploadResult = await uploadApi.uploadImage(file);

// Result includes:
// - url: Public R2 URL to display image
// - key: Storage key for deletion/management
// - fileType: "image" or "video"
```

## 📊 Upload Limits

| Type            | Limit                    |
| --------------- | ------------------------ |
| Max file size   | 10MB (form validation)   |
| API limit       | 100MB (route validation) |
| Supported types | images/_, video/_        |

## 🎨 UI Enhancements

### Before Upload:

- File input with accept attribute
- Size and type hints

### During Upload:

- Loading spinner
- "Uploading..." text
- Disabled form controls

### After Upload:

- Preview display (image or video)
- Success indication
- Ready to submit prediction

## 🔒 Security Features

1. **File Validation**

   - Type checking (image/video only)
   - Size limits (client & server)
   - MIME type verification

2. **Unique Keys**

   - Timestamp-based naming
   - Random ID generation
   - User ID prefixing

3. **Metadata Tracking**
   - Original filename preserved
   - Upload timestamp
   - Uploader ID

## 🐛 Error Handling

### Common Errors & Solutions:

| Error                                      | Cause               | Solution                    |
| ------------------------------------------ | ------------------- | --------------------------- |
| "File size too large"                      | File > 10MB         | Compress or resize file     |
| "Only image and video files are supported" | Wrong file type     | Use PNG, JPG, MP4, etc.     |
| "Upload failed"                            | R2 connection issue | Check environment variables |
| "Insufficient funds"                       | Missing API keys    | Verify R2 credentials       |

## 📝 Testing Checklist

- [x] Upload image (< 10MB)
- [x] Upload video (< 10MB)
- [x] File size validation
- [x] File type validation
- [x] Preview display
- [x] Upload progress indication
- [x] Error handling
- [x] Form submission with uploaded file
- [x] Database storage of URL

## 🔄 Next Steps

1. **Optional Improvements:**

   - Add image compression before upload
   - Implement drag & drop upload
   - Add multiple file upload support
   - Show upload percentage
   - Add file cropping/editing

2. **Monitoring:**

   - Track upload success rates
   - Monitor R2 storage usage
   - Log failed uploads

3. **Optimization:**
   - Implement lazy loading for previews
   - Add CDN caching
   - Optimize image serving

## 💡 Tips

1. **Testing locally:**

   ```bash
   # Make sure R2 credentials are set
   npm run dev
   # Navigate to /create and try uploading
   ```

2. **Debugging uploads:**

   ```typescript
   // Check console logs for:
   console.log("File uploaded successfully:", uploadResult);
   ```

3. **R2 Dashboard:**
   - View uploaded files: Cloudflare Dashboard → R2
   - Monitor storage usage
   - Manage public access

## 🎉 Success!

The upload API is fully integrated and ready to use. Users can now:

- Upload trade screenshots
- Upload video explanations
- Preview before submission
- Store files reliably on R2
- Access files via public URLs

All validation, error handling, and user feedback are in place!
