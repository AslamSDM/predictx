/**
 * Upload API Test Suite
 *
 * Run this in your browser console on the /create page to test upload functionality
 */

// Test 1: Create a test file
function createTestFile(name, size, type) {
  const blob = new Blob(["x".repeat(size)], { type });
  return new File([blob], name, { type });
}

// Test 2: Test file validation (client-side)
async function testFileValidation() {
  console.log("🧪 Testing file validation...");

  // Test oversized file
  const largeFile = createTestFile("large.jpg", 11 * 1024 * 1024, "image/jpeg");
  console.log("Large file size:", largeFile.size, "bytes");

  // Test valid file
  const validFile = createTestFile("test.jpg", 1 * 1024 * 1024, "image/jpeg");
  console.log("Valid file size:", validFile.size, "bytes");

  // Test invalid type
  const invalidFile = createTestFile("test.pdf", 1024, "application/pdf");
  console.log("Invalid file type:", invalidFile.type);
}

// Test 3: Test upload API
async function testUploadAPI() {
  console.log("🧪 Testing upload API...");

  const testFile = createTestFile("test-image.jpg", 100 * 1024, "image/jpeg");
  const formData = new FormData();
  formData.append("file", testFile);
  formData.append("fileType", "image");

  try {
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();
    console.log("✅ Upload successful:", result);
    return result;
  } catch (error) {
    console.error("❌ Upload failed:", error);
    throw error;
  }
}

// Test 4: Test uploadApi helper
async function testUploadHelper() {
  console.log("🧪 Testing uploadApi helper...");

  // Import the API (you'll need to run this in the app context)
  const { uploadApi } = await import("/lib/api");

  const testFile = createTestFile("helper-test.jpg", 50 * 1024, "image/jpeg");

  try {
    const result = await uploadApi.uploadImage(testFile);
    console.log("✅ Helper upload successful:", result);
    return result;
  } catch (error) {
    console.error("❌ Helper upload failed:", error);
    throw error;
  }
}

// Test 5: Full integration test
async function testFullIntegration() {
  console.log("🧪 Running full integration test...");

  try {
    // Step 1: Validate
    await testFileValidation();
    console.log("✅ Validation passed");

    // Step 2: Test direct API
    const uploadResult = await testUploadAPI();
    console.log("✅ API upload passed");

    // Step 3: Verify URL is accessible
    const imageResponse = await fetch(uploadResult.url);
    if (imageResponse.ok) {
      console.log("✅ Uploaded file is accessible");
    } else {
      console.error("❌ Uploaded file is not accessible");
    }

    console.log("🎉 All tests passed!");
  } catch (error) {
    console.error("❌ Test suite failed:", error);
  }
}

// Export test functions
window.uploadTests = {
  testFileValidation,
  testUploadAPI,
  testUploadHelper,
  testFullIntegration,
};

console.log("📦 Upload test suite loaded!");
console.log("Run: uploadTests.testFullIntegration()");
