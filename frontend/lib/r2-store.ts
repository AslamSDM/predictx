import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Cloudflare R2 configuration
const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!, // e.g., https://your-account-id.r2.cloudflarestorage.com
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME!;
const PUBLIC_DOMAIN = process.env.R2_PUBLIC_DOMAIN!; // Your public domain for R2 (required for public access)

export class R2Storage {
  /**
   * Upload a file to R2 storage and return public URL
   */
  static async uploadFile(
    key: string,
    file: Buffer | Uint8Array | string,
    contentType: string,
    metadata?: Record<string, string>
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: file,
        ContentType: contentType,
        Metadata: metadata,
      });

      await r2Client.send(command);

      // Return the public URL (R2 bucket must be configured for public access)
      return `${PUBLIC_DOMAIN}/${key}`;
    } catch (error) {
      console.error("Error uploading to R2:", error);
      throw new Error(`Failed to upload file to R2: ${error}`);
    }
  }

  /**
   * Download a file from a URL and upload it to R2
   */
  static async transferFromUrl(
    sourceUrl: string,
    destinationKey: string,
    contentType?: string
  ): Promise<string> {
    try {
      console.log(`Transferring file from ${sourceUrl} to R2...`);

      // Download the file from the source URL
      const response = await fetch(sourceUrl);
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
      }

      const fileBuffer = await response.arrayBuffer();
      const detectedContentType =
        contentType ||
        response.headers.get("content-type") ||
        "application/octet-stream";

      // Upload to R2
      const r2Url = await this.uploadFile(
        destinationKey,
        new Uint8Array(fileBuffer),
        detectedContentType,
        {
          "source-url": sourceUrl,
          "transferred-at": new Date().toISOString(),
        }
      );

      console.log(`File transferred successfully to R2: ${r2Url}`);
      return r2Url;
    } catch (error) {
      console.error("Error transferring file to R2:", error);
      throw new Error(`Failed to transfer file to R2: ${error}`);
    }
  }

  /**
   * Generate a presigned URL for uploading
   */
  static async getPresignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn: number = 3600
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        ContentType: contentType,
      });

      return await getSignedUrl(r2Client, command, { expiresIn });
    } catch (error) {
      console.error("Error generating presigned URL:", error);
      throw new Error(`Failed to generate presigned URL: ${error}`);
    }
  }

  /**
   * Delete a file from R2
   */
  static async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      await r2Client.send(command);
    } catch (error) {
      console.error("Error deleting from R2:", error);
      throw new Error(`Failed to delete file from R2: ${error}`);
    }
  }

  /**
   * Generate a unique key for a file
   */
  static generateFileKey(
    userId: string,
    originalName: string,
    type: "input" | "output" | "temp"
  ): string {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2);
    const extension = originalName.split(".").pop();
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, "_");

    return `${type}/${userId}/${timestamp}-${randomId}-${sanitizedName}`;
  }

  /**
   * Get file info from R2
   */
  static async getFileInfo(key: string) {
    try {
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      const response = await r2Client.send(command);
      return {
        contentType: response.ContentType,
        contentLength: response.ContentLength,
        lastModified: response.LastModified,
        metadata: response.Metadata,
      };
    } catch (error) {
      console.error("Error getting file info from R2:", error);
      throw new Error(`Failed to get file info from R2: ${error}`);
    }
  }
}

export default R2Storage;
