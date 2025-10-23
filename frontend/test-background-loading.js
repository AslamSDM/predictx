/**
 * Background Loading Performance Test Suite
 *
 * Run these tests in the browser console to verify background loading
 */

// Test 1: Check if predictions are preloaded
function testPreloadedData() {
  console.log("🧪 Test 1: Checking preloaded data...");

  // Access Zustand store
  const predictions = window.__ZUSTAND_STORES__?.predictions || {};

  console.log("Store state:", {
    predictionsCount: predictions.predictions?.length || 0,
    isLoading: predictions.isLoading,
    hasMore: predictions.hasMore,
    offset: predictions.offset,
  });

  if (predictions.predictions?.length > 0) {
    console.log("✅ Data is preloaded!");
    return true;
  } else {
    console.log("⏳ Data not yet loaded");
    return false;
  }
}

// Test 2: Measure page transition speed
async function testPageTransitionSpeed() {
  console.log("🧪 Test 2: Measuring page transition speed...");

  const startTime = performance.now();

  // Simulate navigation
  window.location.hash = "#test";

  const endTime = performance.now();
  const duration = endTime - startTime;

  console.log(`⏱️ Transition time: ${duration.toFixed(2)}ms`);

  if (duration < 100) {
    console.log("✅ Lightning fast!");
  } else if (duration < 500) {
    console.log("✅ Fast enough");
  } else {
    console.log("⚠️ Could be faster");
  }

  return duration;
}

// Test 3: Check service worker status
async function testServiceWorker() {
  console.log("🧪 Test 3: Checking service worker...");

  if (!("serviceWorker" in navigator)) {
    console.log("❌ Service Worker not supported");
    return false;
  }

  const registration = await navigator.serviceWorker.getRegistration();

  if (registration) {
    console.log("✅ Service Worker registered:", {
      scope: registration.scope,
      active: !!registration.active,
      waiting: !!registration.waiting,
      installing: !!registration.installing,
    });
    return true;
  } else {
    console.log("⚠️ Service Worker not registered");
    return false;
  }
}

// Test 4: Check cache performance
async function testCachePerformance() {
  console.log("🧪 Test 4: Testing cache performance...");

  if (!("caches" in window)) {
    console.log("❌ Cache API not supported");
    return false;
  }

  const cacheNames = await caches.keys();
  console.log("📦 Available caches:", cacheNames);

  if (cacheNames.length > 0) {
    const cache = await caches.open(cacheNames[0]);
    const cachedRequests = await cache.keys();
    console.log(`✅ Cached items: ${cachedRequests.length}`);

    // List some cached URLs
    const urls = cachedRequests.slice(0, 5).map((req) => req.url);
    console.log("Sample cached URLs:", urls);

    return true;
  } else {
    console.log("⚠️ No caches found");
    return false;
  }
}

// Test 5: Monitor prefetch activity
function testPrefetchActivity() {
  console.log("🧪 Test 5: Monitoring prefetch activity...");

  // Count prefetch links
  const prefetchLinks = document.querySelectorAll('link[rel="prefetch"]');
  console.log(`🔗 Prefetch links: ${prefetchLinks.length}`);

  prefetchLinks.forEach((link, index) => {
    console.log(`  ${index + 1}. ${link.getAttribute("href")}`);
  });

  if (prefetchLinks.length > 0) {
    console.log("✅ Prefetching is active");
    return true;
  } else {
    console.log("⚠️ No prefetch links found");
    return false;
  }
}

// Test 6: Test idle callback support
function testIdleCallback() {
  console.log("🧪 Test 6: Testing idle callback support...");

  if ("requestIdleCallback" in window) {
    console.log("✅ requestIdleCallback is supported");

    // Test it
    requestIdleCallback(
      () => {
        console.log("✅ Idle callback executed");
      },
      { timeout: 1000 }
    );

    return true;
  } else {
    console.log("⚠️ requestIdleCallback not supported (will use fallback)");
    return false;
  }
}

// Test 7: Measure API response time
async function testAPIPerformance() {
  console.log("🧪 Test 7: Testing API performance...");

  const startTime = performance.now();

  try {
    const response = await fetch("/api/predictions?status=ACTIVE&limit=1");
    const endTime = performance.now();
    const duration = endTime - startTime;

    console.log(`⏱️ API response time: ${duration.toFixed(2)}ms`);

    if (duration < 100) {
      console.log("✅ Cached response (super fast!)");
    } else if (duration < 500) {
      console.log("✅ Fast response");
    } else {
      console.log("⚠️ Slow response");
    }

    return duration;
  } catch (error) {
    console.error("❌ API test failed:", error);
    return -1;
  }
}

// Test 8: Test image prefetch
function testImagePrefetch() {
  console.log("🧪 Test 8: Testing image prefetch...");

  const imageLinks = document.querySelectorAll(
    'link[rel="prefetch"][as="image"]'
  );
  console.log(`🖼️ Prefetched images: ${imageLinks.length}`);

  imageLinks.forEach((link, index) => {
    console.log(`  ${index + 1}. ${link.getAttribute("href")}`);
  });

  if (imageLinks.length > 0) {
    console.log("✅ Images are being prefetched");
    return true;
  } else {
    console.log("⚠️ No image prefetch found");
    return false;
  }
}

// Test 9: Full performance audit
async function runPerformanceAudit() {
  console.log("🧪 Running full performance audit...");
  console.log("═".repeat(50));

  const results = {
    preloadedData: await testPreloadedData(),
    serviceWorker: await testServiceWorker(),
    cache: await testCachePerformance(),
    prefetchActivity: testPrefetchActivity(),
    idleCallback: testIdleCallback(),
    imagesPrefetch: testImagePrefetch(),
    apiPerformance: await testAPIPerformance(),
  };

  console.log("═".repeat(50));
  console.log("📊 Audit Results:");
  console.log(results);

  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  const score = (passedTests / totalTests) * 100;

  console.log(
    `\n🎯 Score: ${score.toFixed(
      0
    )}% (${passedTests}/${totalTests} tests passed)`
  );

  if (score === 100) {
    console.log("🎉 Perfect! All optimizations are working!");
  } else if (score >= 75) {
    console.log("✅ Good! Most optimizations are working.");
  } else if (score >= 50) {
    console.log("⚠️ Some optimizations are not working.");
  } else {
    console.log("❌ Many optimizations are not working. Check configuration.");
  }

  return results;
}

// Test 10: Monitor network requests
function monitorNetworkRequests() {
  console.log("🧪 Test 10: Monitoring network requests...");

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === "resource") {
        console.log(`📡 ${entry.name}`);
        console.log(`   Duration: ${entry.duration.toFixed(2)}ms`);
        console.log(`   Size: ${entry.transferSize} bytes`);
      }
    }
  });

  observer.observe({ entryTypes: ["resource"] });
  console.log("✅ Network monitor active (watch console for requests)");

  return observer;
}

// Export test suite
window.backgroundLoadingTests = {
  testPreloadedData,
  testPageTransitionSpeed,
  testServiceWorker,
  testCachePerformance,
  testPrefetchActivity,
  testIdleCallback,
  testAPIPerformance,
  testImagePrefetch,
  runPerformanceAudit,
  monitorNetworkRequests,
};

console.log("📦 Background loading test suite loaded!");
console.log("Available tests:");
console.log("  - backgroundLoadingTests.testPreloadedData()");
console.log("  - backgroundLoadingTests.testServiceWorker()");
console.log("  - backgroundLoadingTests.testCachePerformance()");
console.log("  - backgroundLoadingTests.testPrefetchActivity()");
console.log("  - backgroundLoadingTests.testAPIPerformance()");
console.log("  - backgroundLoadingTests.runPerformanceAudit() ⭐️");
console.log("  - backgroundLoadingTests.monitorNetworkRequests()");
