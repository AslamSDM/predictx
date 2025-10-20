import { NextRequest, NextResponse } from "next/server";
import { R2Storage } from "@/lib/r2-store";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  try {
    // Check authentication

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const fileType = formData.get("fileType") as string; // 'image' or 'video'

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: "No file provided",
        },
        { status: 400 }
      );
    }

    // Validate file size (limit to 100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          error: "File size too large. Maximum allowed size is 100MB.",
        },
        { status: 400 }
      );
    }

    // Validate file type
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      return NextResponse.json(
        {
          success: false,
          error: "Only image and video files are supported.",
        },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const userId = randomUUID();
    // Generate unique key for R2 storage
    const fileKey = R2Storage.generateFileKey(userId, file.name, "input");

    console.log("Uploading file to R2:", {
      name: file.name,
      size: file.size,
      type: file.type,
      key: fileKey,
      bufferSize: buffer.length,
      originalMimeType: file.type,
    });

    // Upload file to R2
    const r2Url = await R2Storage.uploadFile(
      fileKey,
      new Uint8Array(buffer),
      file.type,
      {
        "original-name": file.name,
        "uploaded-by": userId,
        "upload-timestamp": new Date().toISOString(),
      }
    );

    console.log("File uploaded successfully to R2:", {
      url: r2Url,
      key: fileKey,
      preservedType: file.type,
    });

    return NextResponse.json({
      success: true,
      url: r2Url,
      key: fileKey,
      originalName: file.name,
      size: file.size,
      type: file.type,
      fileType: isVideo ? "video" : "image",
    });
  } catch (error) {
    console.error("Error uploading file to Replicate:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to upload file",
      },
      { status: 500 }
    );
  }
}
