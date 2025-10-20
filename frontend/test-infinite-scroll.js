/**
 * Infinite Scroll Test Suite
 * 
 * Run this in your browser console on the /discover page to test infinite scrolling
 */

// Test 1: Check store state
function checkStoreState() {
  console.log("🧪 Checking store state...");
  
  // Access the store (you'll need to import this in the app context)
  const store = window.__ZUSTAND_STORES__?.predictions || {};
  
  console.log("Store State:", {
    predictions: store.predictions?.length || 0,
    isLoading: store.isLoading,
    isLoadingMore: store.isLoadingMore,
    hasMore: store.hasMore,
    offset: store.offset,
    limit: store.limit,
    error: store.error,
  });
}

// Test 2: Simulate rapid swiping
async function testRapidSwipe(count = 10) {
  console.log(`🧪 Testing rapid swipe (${count} swipes)...`);
  
  for (let i = 0; i < count; i++) {
    // Find and click the skip button
    const skipButton = document.querySelector('[aria-label="Skip"]');
    if (skipButton) {
      skipButton.click();
      console.log(`Swipe ${i + 1}/${count}`);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  console.log("✅ Rapid swipe test complete");
}

// Test 3: Monitor API calls
function monitorAPIcalls() {
  console.log("🧪 Monitoring API calls...");
  
  const originalFetch = window.fetch;
  let callCount = 0;
  
  window.fetch = async function(...args) {
    const url = args[0];
    if (typeof url === 'string' && url.includes('/api/predictions')) {
      callCount++;
      console.log(`📡 API Call #${callCount}:`, url);
      
      const response = await originalFetch(...args);
      const clone = response.clone();
      const data = await clone.json();
      
      console.log(`📥 Response #${callCount}:`, {
        predictions: data.predictions?.length,
        total: data.total,
        hasMore: data.hasMore,
      });
      
      return response;
    }
    return originalFetch(...args);
  };
  
  console.log("✅ API monitoring active");
}

// Test 4: Check for duplicate predictions
function checkDuplicates() {
  console.log("🧪 Checking for duplicate predictions...");
  
  // Get all prediction cards
  const cards = document.querySelectorAll('[data-prediction-id]');
  const ids = Array.from(cards).map(card => card.getAttribute('data-prediction-id'));
  
  const uniqueIds = new Set(ids);
  
  if (ids.length === uniqueIds.size) {
    console.log("✅ No duplicates found");
  } else {
    console.error("❌ Duplicates detected:", {
      total: ids.length,
      unique: uniqueIds.size,
      duplicates: ids.length - uniqueIds.size,
    });
  }
  
  return { total: ids.length, unique: uniqueIds.size };
}

// Test 5: Performance monitoring
function monitorPerformance() {
  console.log("🧪 Monitoring performance...");
  
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'navigation') {
        console.log("📊 Navigation Timing:", {
          loadTime: entry.loadEventEnd - entry.fetchStart,
          domContentLoaded: entry.domContentLoadedEventEnd - entry.fetchStart,
          domInteractive: entry.domInteractive - entry.fetchStart,
        });
      }
      
      if (entry.entryType === 'resource' && entry.name.includes('/api/predictions')) {
        console.log("📊 API Request Timing:", {
          duration: entry.duration,
          transferSize: entry.transferSize,
          name: entry.name,
        });
      }
    }
  });
  
  observer.observe({ entryTypes: ['navigation', 'resource'] });
  console.log("✅ Performance monitoring active");
}

// Test 6: Scroll to specific position
async function scrollToIndex(targetIndex) {
  console.log(`🧪 Scrolling to index ${targetIndex}...`);
  
  for (let i = 0; i < targetIndex; i++) {
    const skipButton = document.querySelector('[aria-label="Skip"]');
    if (skipButton) {
      skipButton.click();
      await new Promise(resolve => setTimeout(resolve, 200));
    } else {
      console.error("❌ Skip button not found");
      break;
    }
  }
  
  console.log(`✅ Reached index ${targetIndex}`);
}

// Test 7: Test load more trigger
function testLoadMoreTrigger() {
  console.log("🧪 Testing load more trigger...");
  
  // Check the threshold
  const threshold = 5; // Should match the -5 in the code
  
  // Get current state
  const currentIndex = parseInt(
    document.querySelector('[class*="text-xs text-muted-foreground"]')?.textContent?.split('/')[0] || '0'
  );
  
  const totalPredictions = parseInt(
    document.querySelector('[class*="text-xs text-muted-foreground"]')?.textContent?.split('/')[1]?.split('+')[0] || '0'
  );
  
  const remainingCards = totalPredictions - currentIndex;
  const shouldTrigger = remainingCards <= threshold;
  
  console.log("Load More Analysis:", {
    currentIndex,
    totalPredictions,
    remainingCards,
    threshold,
    shouldTriggerLoad: shouldTrigger,
  });
  
  return shouldTrigger;
}

// Test 8: Full integration test
async function runFullTest() {
  console.log("🧪 Running full integration test...");
  
  try {
    // Step 1: Check initial state
    console.log("\n1️⃣ Checking initial state...");
    checkStoreState();
    
    // Step 2: Monitor API calls
    console.log("\n2️⃣ Setting up API monitoring...");
    monitorAPIcalls();
    
    // Step 3: Test rapid swiping
    console.log("\n3️⃣ Testing rapid swipe...");
    await testRapidSwipe(15);
    
    // Step 4: Wait for any pending loads
    console.log("\n4️⃣ Waiting for loads to complete...");
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 5: Check for duplicates
    console.log("\n5️⃣ Checking for duplicates...");
    checkDuplicates();
    
    // Step 6: Check load more trigger
    console.log("\n6️⃣ Checking load more trigger...");
    testLoadMoreTrigger();
    
    // Step 7: Check final state
    console.log("\n7️⃣ Checking final state...");
    checkStoreState();
    
    console.log("\n🎉 Full test complete!");
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Export test functions
window.infiniteScrollTests = {
  checkStoreState,
  testRapidSwipe,
  monitorAPIcalls,
  checkDuplicates,
  monitorPerformance,
  scrollToIndex,
  testLoadMoreTrigger,
  runFullTest,
};

console.log("📦 Infinite scroll test suite loaded!");
console.log("Available tests:");
console.log("  - infiniteScrollTests.checkStoreState()");
console.log("  - infiniteScrollTests.testRapidSwipe(count)");
console.log("  - infiniteScrollTests.monitorAPIcalls()");
console.log("  - infiniteScrollTests.checkDuplicates()");
console.log("  - infiniteScrollTests.monitorPerformance()");
console.log("  - infiniteScrollTests.scrollToIndex(index)");
console.log("  - infiniteScrollTests.testLoadMoreTrigger()");
console.log("  - infiniteScrollTests.runFullTest() ⭐️");
