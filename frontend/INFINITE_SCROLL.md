# Infinite Scrolling Implementation

## ✅ Implementation Complete

The discover page now features a smooth infinite scrolling experience for browsing prediction markets.

## 🎯 How It Works

### 1. **Automatic Loading**

- When user reaches **5 cards from the end**, more predictions are automatically fetched
- No manual "Load More" button needed
- Seamless background loading

### 2. **Smart Preloading**

```typescript
// Trigger condition
currentIndex >= predictions.length - 5 && hasMore && !isLoading;
```

### 3. **State Management**

The Zustand store (`usePredictionsStore`) manages:

- `predictions`: Array of loaded predictions
- `isLoading`: Initial load state
- `isLoadingMore`: Loading additional predictions
- `hasMore`: Whether more predictions exist
- `offset`: Current pagination offset
- `limit`: Items per page (20)

## 📊 User Experience

### Visual Indicators

1. **Progress Counter**

   ```
   5 / 24+
   ```

   - Shows current position
   - `+` indicates more available
   - Loading spinner when fetching

2. **Progress Bar**

   - Visual indicator of position in deck
   - Fills as user swipes through cards
   - Smooth transitions

3. **Loading States**
   - Small spinner in header during load
   - Bottom notification for background loading
   - Full-screen loader between batches

### End States

#### All Caught Up

When no more predictions:

```
🎉 All caught up!
You've seen all 42 active predictions
[Start Over]
```

#### Loading More

When waiting for next batch:

```
Loading more predictions...
Viewed 20 of 20
```

## 🔧 Technical Implementation

### Store Functions

#### `fetchPredictions(reset?: boolean)`

Initial load or reset to beginning

```typescript
await fetchPredictions(true); // Reset and fetch from start
```

#### `loadMore()`

Load next batch of predictions

```typescript
await loadMore(); // Append next 20 predictions
```

### Page Logic

```typescript
// Monitor current index and trigger loads
useEffect(() => {
  const shouldLoadMore =
    currentIndex >= predictions.length - 5 && hasMore && !isLoading;
  if (shouldLoadMore) {
    loadMore();
  }
}, [currentIndex, predictions.length, hasMore, isLoading, loadMore]);
```

## 📈 Performance Optimizations

### 1. **Duplicate Prevention**

```typescript
// Filter out duplicates by ID
const existingIds = new Set(state.predictions.map((p) => p.id));
const newPredictions = response.predictions.filter(
  (p) => !existingIds.has(p.id)
);
```

### 2. **Debounced Loading**

- Only one load operation at a time
- Checks prevent multiple simultaneous requests
- Loading states prevent race conditions

### 3. **Efficient Rendering**

- Only current and next card rendered
- Cards unmount when scrolled past
- Minimal re-renders with React keys

## 🎮 Navigation

### Swipe Gestures (Mobile)

- ⬅️ **Swipe Left**: Bet NO, move to next
- ➡️ **Swipe Right**: Bet YES, move to next
- ⬆️ **Swipe Up**: Skip, move to next
- ⬇️ **Swipe Down**: Go back to previous

### Desktop Buttons

- ✕ **Red Button**: Bet NO
- ✓ **Green Button**: Bet YES
- ↑ **Blue Button**: Skip forward
- ↓ **Blue Button**: Go back

### Keyboard Support (Future)

- Arrow keys for navigation
- Enter/Space for actions

## 🔍 Debug Logging

Console logs help track loading:

```javascript
📥 Fetched predictions: { received: 20, hasMore: true, total: 100 }
🔄 Loading more predictions... { currentIndex: 15, totalPredictions: 20 }
✅ Loaded more predictions: { received: 20, newTotal: 40 }
```

## 📊 Configuration

### Adjust Load Timing

```typescript
// In discover/page.tsx
currentIndex >= predictions.length - 5; // Load when 5 cards remaining
```

Change `- 5` to adjust when loading triggers:

- `- 3`: More aggressive, earlier loading
- `- 10`: Very aggressive, prevents any lag
- `- 1`: Conservative, loads at last card

### Adjust Batch Size

```typescript
// In lib/store.ts
limit: 20; // Number of predictions per batch
```

Considerations:

- **Smaller batches (10)**: Faster initial load, more API calls
- **Larger batches (30)**: Fewer API calls, slower initial load

## 🐛 Troubleshooting

### Issue: Cards run out before loading

**Solution**: Increase preload threshold (`-5` → `-10`)

### Issue: Too many API calls

**Solution**: Increase batch size (20 → 30)

### Issue: Loading state flickers

**Solution**: Check `isLoading` conditions in render

### Issue: Duplicate cards

**Solution**: Store deduplicates, but check API response

## 📱 Mobile Optimization

1. **Touch Events**: Smooth swipe detection
2. **Preloading**: Next card always ready
3. **Minimal Layout Shifts**: Loading happens in background
4. **Visual Feedback**: Clear loading indicators

## 🚀 Performance Metrics

### Target Performance

- **Initial Load**: < 1s
- **Subsequent Loads**: < 500ms (background)
- **Swipe Response**: < 16ms (60 FPS)
- **Cards in Memory**: Current + Next only

### Memory Management

- Old cards are unmounted
- Only 2 cards rendered at a time
- Images lazy loaded

## 🔄 Data Flow

```
User swipes → Index changes → Check threshold → Trigger loadMore()
              ↓
Store checks hasMore & loading states
              ↓
API call with offset + limit
              ↓
Response appended to predictions array
              ↓
UI updates with new cards available
```

## 🎨 UI Components

### Loading Indicator (Bottom Overlay)

```tsx
<div className="absolute bottom-4 ...">
  <Loader2 /> Loading more predictions...
</div>
```

### Progress Bar (Header)

```tsx
<div className="h-1 bg-border">
  <div style={{ width: `${progress}%` }} />
</div>
```

### Counter (Header)

```tsx
{currentIndex + 1} / {predictions.length}{hasMore && '+'}
```

## ✨ Future Enhancements

### Planned Features

- [ ] Pull to refresh
- [ ] Keyboard navigation
- [ ] Prefetch images for smoother experience
- [ ] Cache predictions locally (IndexedDB)
- [ ] Offline support with service worker
- [ ] Analytics for swipe patterns
- [ ] A/B testing different preload thresholds

### Advanced Features

- [ ] Reverse infinite scroll (load previous)
- [ ] Jump to specific prediction
- [ ] Search/filter while scrolling
- [ ] Save position across sessions
- [ ] Share specific card position

## 📖 API Integration

### Endpoint Used

```
GET /api/predictions?status=ACTIVE&limit=20&offset=0
```

### Response Format

```typescript
{
  predictions: PredictionWithRelations[],
  total: number,
  hasMore: boolean
}
```

### Pagination Logic

```typescript
offset = currentPage * limit;
// Page 1: offset=0,  limit=20 → items 0-19
// Page 2: offset=20, limit=20 → items 20-39
// Page 3: offset=40, limit=20 → items 40-59
```

## 🎯 Success Criteria

- ✅ Smooth scrolling with no janky loads
- ✅ Users never see "No more cards" unless truly empty
- ✅ Loading happens in background (non-blocking)
- ✅ Clear visual feedback of loading state
- ✅ Works on mobile and desktop
- ✅ Handles edge cases (empty, error, single page)
- ✅ Memory efficient (only loads what's needed)
- ✅ No duplicate cards

## 🏆 Best Practices Implemented

1. **Predictive Loading**: Load before user needs it
2. **Visual Feedback**: Always show loading state
3. **Error Handling**: Graceful failures with retry
4. **Performance**: Minimal rerenders and API calls
5. **UX**: Seamless experience, no interruptions
6. **Accessibility**: Loading announcements for screen readers
7. **Responsive**: Works on all screen sizes

The infinite scroll implementation provides a modern, app-like experience for discovering prediction markets! 🎉
