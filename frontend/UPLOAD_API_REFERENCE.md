# Upload API Reference

## Endpoint

```
POST /api/upload
```

## Request

### Headers

```
Content-Type: multipart/form-data
```

### Body (FormData)

| Field    | Type   | Required | Description                                        |
| -------- | ------ | -------- | -------------------------------------------------- |
| file     | File   | Yes      | The file to upload (image or video)                |
| fileType | string | No       | "image" or "video" (auto-detected if not provided) |

## Response

### Success (200)

```typescript
{
  success: true,
  url: string,           // Public R2 URL: "https://pub-xxx.r2.dev/input/user-id/timestamp-random-filename.jpg"
  key: string,           // R2 storage key: "input/user-id/timestamp-random-filename.jpg"
  originalName: string,  // Original filename: "my-trade.jpg"
  size: number,          // File size in bytes: 524288
  type: string,          // MIME type: "image/jpeg"
  fileType: "image" | "video"  // Detected file type
}
```

### Error Responses

#### 400 - Bad Request

```json
{
  "success": false,
  "error": "No file provided"
}
```

```json
{
  "success": false,
  "error": "File size too large. Maximum allowed size is 100MB."
}
```

```json
{
  "success": false,
  "error": "Only image and video files are supported."
}
```

#### 500 - Server Error

```json
{
  "success": false,
  "error": "Failed to upload file to R2: [error details]"
}
```

## Client Usage

### Using the API Helper (Recommended)

```typescript
import { uploadApi } from "@/lib/api";

// Upload image or video
const result = await uploadApi.uploadImage(file);
console.log(result.url); // Use this URL in your prediction

// Upload video specifically
const videoResult = await uploadApi.uploadVideo(file);
```

### Using Fetch Directly

```typescript
const formData = new FormData();
formData.append("file", file);
formData.append("fileType", "image");

const response = await fetch("/api/upload", {
  method: "POST",
  body: formData,
});

const result = await response.json();
```

## File Storage Structure

Files are stored in R2 with the following structure:

```
bucket-name/
  └── input/
      └── [user-id]/
          └── [timestamp]-[random-id]-[filename]
```

Example:

```
reelsfly/
  └── input/
      └── abc123-user/
          └── 1729450000000-a1b2c3-trade-screenshot.jpg
```

## Metadata

Each uploaded file includes metadata:

```typescript
{
  "original-name": "my-trade-screenshot.jpg",
  "uploaded-by": "user-id-123",
  "upload-timestamp": "2025-10-20T12:34:56.789Z"
}
```

## Supported File Types

### Images

- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)
- SVG (.svg)
- AVIF (.avif)

### Videos

- MP4 (.mp4)
- WebM (.webm)
- MOV (.mov)
- AVI (.avi)
- MKV (.mkv)

## Size Limits

| Location                 | Limit | Purpose          |
| ------------------------ | ----- | ---------------- |
| Client validation (form) | 10MB  | Quick feedback   |
| Server validation (API)  | 100MB | Final check      |
| R2 storage               | 5GB   | Per file maximum |

## Error Handling

```typescript
try {
  const result = await uploadApi.uploadImage(file);
  // Use result.url
} catch (error) {
  if (error.status === 400) {
    // Bad request - show user-friendly message
    alert(error.message);
  } else if (error.status === 500) {
    // Server error - log and show generic message
    console.error("Upload failed:", error);
    alert("Upload failed. Please try again.");
  }
}
```

## Best Practices

1. **Validate on Client First**

   ```typescript
   if (file.size > 10 * 1024 * 1024) {
     alert("File too large");
     return;
   }
   ```

2. **Show Upload Progress**

   ```typescript
   setIsUploading(true);
   try {
     const result = await uploadApi.uploadImage(file);
   } finally {
     setIsUploading(false);
   }
   ```

3. **Store Both URL and Key**

   ```typescript
   // Store in database
   {
     imageUrl: result.url,      // For display
     imageKey: result.key,      // For deletion/management
     imageSize: result.size,
     imageType: result.type
   }
   ```

4. **Clean Up on Error**
   ```typescript
   // If prediction creation fails after upload
   // Consider implementing deletion via key
   await R2Storage.deleteFile(result.key);
   ```

## Security Considerations

1. **File Type Validation** - Only images and videos allowed
2. **Size Limits** - Prevents abuse and storage overflow
3. **Unique Keys** - Prevents overwriting and conflicts
4. **Metadata Tracking** - Audit trail for uploads
5. **Public Access** - Files are publicly readable via R2

## Testing

```bash
# Test with curl
curl -X POST http://localhost:3000/api/upload \
  -F "file=@/path/to/image.jpg" \
  -F "fileType=image"

# Expected response
{
  "success": true,
  "url": "https://pub-xxx.r2.dev/input/user/timestamp-file.jpg",
  ...
}
```

## Monitoring

Check R2 dashboard for:

- Storage usage
- Bandwidth usage
- Number of requests
- Error rates

## Troubleshooting

| Issue               | Solution                              |
| ------------------- | ------------------------------------- |
| "No file provided"  | Ensure FormData includes 'file' field |
| "Upload failed"     | Check R2 credentials in .env          |
| File not accessible | Verify R2_PUBLIC_DOMAIN is set        |
| CORS errors         | Configure CORS on R2 bucket           |
| Slow uploads        | Consider implementing compression     |

## Future Enhancements

- [ ] Image optimization/compression
- [ ] Progress tracking with XMLHttpRequest
- [ ] Drag & drop upload
- [ ] Multiple file upload
- [ ] File deletion endpoint
- [ ] Signed URLs for private files
- [ ] CDN integration
- [ ] Thumbnail generation
