# Infinite Scroll Visual Guide

## 📊 How It Works - Visual Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    DISCOVER PAGE                             │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │         Discover Markets                            │    │
│  │       Use buttons below or arrow keys               │    │
│  │                                                      │    │
│  │            15 / 24+  🔄                             │    │
│  │         ═══════════════════════                     │    │
│  │         ████████████░░░░░░░░░░░                     │    │
│  │            Progress Bar                              │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │                                                      │    │
│  │              [Next Card Preview]                    │    │
│  │           (Scale: 95%, Opacity: 50%)               │    │
│  │                                                      │    │
│  │    ┌────────────────────────────────────────┐     │    │
│  │    │                                          │     │    │
│  │    │        [Current Prediction Card]        │     │    │
│  │    │                                          │     │    │
│  │    │  • BTC to hit $75k?                     │     │    │
│  │    │  • Charts & Details                     │     │    │
│  │    │  • YES: 65% | NO: 35%                   │     │    │
│  │    │                                          │     │    │
│  │    └────────────────────────────────────────┘     │    │
│  │                                                      │    │
│  │    [🔄 Loading more predictions...]                │    │
│  │                                                      │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │              Navigation Controls                     │    │
│  │                     ↑ Skip                          │    │
│  │                                                      │    │
│  │              ✕ NO      ✓ YES                        │    │
│  │                                                      │    │
│  │                     ↓ Back                          │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 Loading Sequence

```
Initial State (0 predictions):
┌─────────────┐
│   Loading   │
│      🔄     │
└─────────────┘

After First Load (20 predictions):
┌─────────────┐
│  1 / 20+    │ ← Shows "+" because more available
│  ████░░░░░  │ ← Progress bar
│             │
│  [Card 1]   │
└─────────────┘

User Swipes to Card 16:
┌─────────────┐
│  16 / 20+ 🔄│ ← Spinner appears (loading triggered)
│  ███████░░  │
│             │
│  [Card 16]  │
└─────────────┘

After Load Complete (40 predictions):
┌─────────────┐
│  16 / 40+   │ ← Updated count
│  ████░░░░░░ │ ← Progress bar adjusted
│             │
│  [Card 16]  │
└─────────────┘

End of Predictions:
┌─────────────┐
│  40 / 40    │ ← No "+" sign
│  ██████████ │ ← Bar at 100%
│             │
│ All caught  │
│    up! 🎉   │
└─────────────┘
```

## 📈 State Diagram

```
                    ┌──────────────┐
                    │   Initial    │
                    │   Mount      │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  Fetch First │
                    │   20 items   │
                    └──────┬───────┘
                           │
                           ▼
        ┌──────────────────────────────────────┐
        │                                       │
    ┌───▼────┐                          ┌──────▼──────┐
    │ Error  │                          │   Success   │
    │ State  │                          │  (20 items) │
    └───┬────┘                          └──────┬──────┘
        │                                       │
        │ Retry                                 │
        └───────────────────────────────────────┘
                                                │
                                                ▼
                                        ┌───────────────┐
                                        │  User Swipes  │
                                        │   (index++)   │
                                        └───────┬───────┘
                                                │
                                                ▼
                          ┌─────────────────────────────────────┐
                          │   Check: index >= length - 5?       │
                          └─────────┬───────────────┬───────────┘
                                    │               │
                               YES  │               │  NO
                                    ▼               ▼
                          ┌─────────────┐    ┌──────────────┐
                          │  Load More  │    │   Continue   │
                          │  (+20 more) │    │   Swiping    │
                          └─────┬───────┘    └──────────────┘
                                │
                                ▼
                          ┌─────────────┐
                          │  Dedupe &   │
                          │   Append    │
                          └─────┬───────┘
                                │
                                ▼
                          ┌─────────────┐
                          │ hasMore? ───┼───► No  ──► End State (🎉)
                          └─────┬───────┘
                                │
                               Yes
                                │
                                └──────► Back to User Swipes
```

## 🎯 Trigger Threshold Visualization

```
Current Cards in Memory: 20
Current Index: 15
Threshold: 5 cards before end

┌─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│  1  │  2  │  3  │  4  │  5  │  6  │  7  │  8  │  9  │ 10  │
└─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘

┌─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│ 11  │ 12  │ 13  │ 14  │ 15  │ 16  │ 17  │ 18  │ 19  │ 20  │
└─────┴─────┴─────┴─────┴──▲──┴─────┴─────┴─────┴─────┴─────┘
                           │
                    You are here
                           │
                ┌──────────┴──────────┐
                │  5 cards remaining  │
                │  🔄 LOAD MORE!      │
                └─────────────────────┘

After Load:
┌─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│  1  │  2  │  3  │  4  │  5  │  6  │  7  │  8  │  9  │ 10  │
└─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘

┌─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│ 11  │ 12  │ 13  │ 14  │ 15  │ 16  │ 17  │ 18  │ 19  │ 20  │
└─────┴─────┴─────┴─────┴──▲──┴─────┴─────┴─────┴─────┴─────┘
                           │
┌─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│ 21  │ 22  │ 23  │ 24  │ 25  │ 26  │ 27  │ 28  │ 29  │ 30  │
└─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘

┌─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│ 31  │ 32  │ 33  │ 34  │ 35  │ 36  │ 37  │ 38  │ 39  │ 40  │
└─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘
                           ▲
                    Still at position 15
                    But now 25 more available!
```

## 🔢 Counter States

```
State 1: Initial Load
┌──────────┐
│  1 / 20+ │ ← "+" means more available
└──────────┘

State 2: Loading More
┌──────────┐
│ 15/20+ 🔄│ ← Spinner indicates loading
└──────────┘

State 3: Load Complete
┌──────────┐
│  15 / 40+│ ← Updated count
└──────────┘

State 4: No More Available
┌──────────┐
│  40 / 40 │ ← No "+" sign
└──────────┘
```

## 📊 Progress Bar States

```
0% - Start
[░░░░░░░░░░░░░░░░░░░░]

25% - Quarter way
[█████░░░░░░░░░░░░░░░]

50% - Halfway
[██████████░░░░░░░░░░]

75% - Three quarters
[███████████████░░░░░]

100% - Complete
[████████████████████]
```

## 🎭 Component Hierarchy

```
DiscoverPage
├─┬─ Header
│ ├── Title
│ ├── Instructions
│ ├── Counter (15 / 20+)
│ ├── Loading Spinner (conditional)
│ └── Progress Bar
│
├─┬─ Card Stack Container
│ ├── Next Card Preview (behind)
│ ├── Current Card (front)
│ └── Loading Overlay (conditional)
│
├─┬─ Navigation Controls (desktop)
│ ├── Skip Up Button
│ ├── Bet NO Button (left)
│ ├── Bet YES Button (right)
│ └── Back Down Button
│
└─┬─ Modals (conditional)
  ├── Bet Modal
  ├── Login Modal
  └── Chat Modal
```

## 🔄 Data Flow Diagram

```
┌─────────────┐
│   User      │
│   Action    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Swipe or   │
│  Click      │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Index       │
│ Increments  │
└──────┬──────┘
       │
       ▼
┌─────────────┐     YES    ┌─────────────┐
│  Check      │─────────►  │  Trigger    │
│  Threshold  │            │  loadMore() │
└──────┬──────┘            └──────┬──────┘
       │                          │
      NO                          ▼
       │                   ┌─────────────┐
       │                   │  API Call   │
       │                   │  offset+20  │
       │                   └──────┬──────┘
       │                          │
       │                          ▼
       │                   ┌─────────────┐
       │                   │  Response   │
       │                   │  20 items   │
       │                   └──────┬──────┘
       │                          │
       │                          ▼
       │                   ┌─────────────┐
       │                   │  Filter     │
       │                   │  Duplicates │
       │                   └──────┬──────┘
       │                          │
       │                          ▼
       │                   ┌─────────────┐
       │                   │  Append to  │
       │                   │  Array      │
       │                   └──────┬──────┘
       │                          │
       └──────────┬───────────────┘
                  │
                  ▼
           ┌─────────────┐
           │  Re-render  │
           │  Components │
           └──────┬──────┘
                  │
                  ▼
           ┌─────────────┐
           │  User sees  │
           │  new cards  │
           └─────────────┘
```

## 💾 Store State Transitions

```
Initial:
{ predictions: [], offset: 0, hasMore: true, isLoading: false }

After fetchPredictions():
{ predictions: [1..20], offset: 20, hasMore: true, isLoading: false }

Trigger loadMore():
{ predictions: [1..20], offset: 20, hasMore: true, isLoadingMore: true }

After loadMore():
{ predictions: [1..40], offset: 40, hasMore: true, isLoadingMore: false }

Continue until:
{ predictions: [1..100], offset: 100, hasMore: false, isLoadingMore: false }
```

These visual guides should help understand how the infinite scroll system works! 🎨
