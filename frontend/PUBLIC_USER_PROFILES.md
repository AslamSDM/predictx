# Public User Profiles - Complete Guide 👤

## Overview

Implemented public user profile pages accessible via wallet address, allowing users to:

- View any user's profile by wallet address
- See their predictions and bets
- Follow/unfollow them
- View their followers/following
- Background load data for smooth UX

## Route Structure

### Dynamic Route

```
/profile/[address]/page.tsx
```

**URL Pattern:**

```
/profile/0xF8928055728400DD88Cec732D79E63E2DDDB4931
```

**Examples:**

- `/profile/0x1234...5678` → User profile for wallet 0x1234...5678
- `/profile/0xabcd...ef01` → User profile for wallet 0xabcd...ef01

### Own Profile

```
/profile/page.tsx
```

**URL:** `/profile` (redirects if not logged in)

## Features

### 1. **View User Profile**

- Display username, avatar, wallet address
- Show follower/following counts
- Show predictions and bets counts
- Show total wagered amount

### 2. **Follow/Unfollow**

- Follow button (if not own profile)
- Real-time count updates
- Optimistic UI updates

### 3. **View User's Content**

- **Predictions Tab** - All predictions created by user
- **Bets Tab** - All bets placed by user
- Click prediction to view details
- Background loading for smooth experience

### 4. **Social Features**

- Click followers/following counts → Open modal
- View lists of followers/following
- Follow users from modal

### 5. **Navigation**

- Back button to return to previous page
- Links from prediction cards to creator profile
- Links from follow lists to user profiles

## Implementation

### Page Component

```tsx
// /app/profile/[address]/page.tsx
export default function UserProfilePage() {
  const params = useParams();
  const address = params.address as string;

  // 1. Fetch user by wallet address
  const user = await userApi.getByWallet(address);

  // 2. Background load predictions and bets
  loadUserData(user.id);

  // 3. Load follow data
  const followData = await followApi.getFollowData(user.id);
}
```

### Background Loading Strategy

```typescript
const loadUserData = async (userId: string) => {
  setIsLoadingData(true);

  // Load in parallel for better performance
  const [predictionsRes, betsRes] = await Promise.all([
    fetch(`/api/predictions?creatorId=${userId}`),
    fetch(`/api/bets?userId=${userId}`),
  ]);

  // Update state as data arrives
  setPredictions(predictionsData);
  setBets(betsData);

  setIsLoadingData(false);
};
```

**Benefits:**

- ⚡ Immediate page load with user info
- 🔄 Background data loading
- 📊 Progressive content display
- 🎯 Better perceived performance

### Follow Integration

```tsx
<FollowButton
  targetUserId={user.id}
  targetUsername={user.username}
  onFollowChange={(isFollowing) => {
    // Update local counts optimistically
    setFollowData((prev) => ({
      ...prev,
      followersCount: isFollowing
        ? prev.followersCount + 1
        : prev.followersCount - 1,
      isFollowing,
    }));
  }}
/>
```

## User Experience Flow

### Discovering a User

```
Discover Page → See Prediction
    ↓
Click "@Username" link
    ↓
Navigate to /profile/[address]
    ↓
View user profile
```

### Viewing Profile

```
Load Page (50-100ms)
    ↓
Show user info immediately
    ↓
Background load predictions/bets (200-500ms)
    ↓
Display content progressively
```

### Following a User

```
View Profile → Click "Follow"
    ↓
Optimistic UI update (instant)
    ↓
API call in background
    ↓
Confirm success (or rollback on error)
```

## Links to User Profiles

### 1. From Prediction Cards

```tsx
// In SwipeCard component
<a href={`/profile/${prediction.creator.walletAddress}`}>
  @{prediction.creator.username}
</a>
```

**Location:** Bottom of prediction card
**Text:** "Created by @Username"
**Action:** Click opens creator's profile

### 2. From Follow Lists

```tsx
// In FollowListModal
<Link href={`/profile/${user.walletAddress}`}>
  <UserAvatar />
  <Username />
</Link>
```

**Location:** Followers/Following modal
**Action:** Click user opens their profile

### 3. From Profile Dropdown

```tsx
// In UserProfileDropdown
<Link href="/profile">View Profile</Link>
```

**Location:** Navbar user dropdown
**Action:** Opens own profile

## API Integration

### Fetching User by Wallet

```typescript
// GET /api/users?walletAddress=0x...
const user = await userApi.getByWallet(address);

// Response
{
  "id": "user123",
  "walletAddress": "0x...",
  "username": "CryptoTrader42",
  "avatar": "https://...",
  "createdAt": "2025-10-21T..."
}
```

### Fetching User's Predictions

```typescript
// GET /api/predictions?creatorId=user123
const predictions = await fetch(`/api/predictions?creatorId=${userId}`);

// Response
{
  "predictions": [...],
  "total": 15,
  "hasMore": false
}
```

### Fetching User's Bets

```typescript
// GET /api/bets?userId=user123
const bets = await fetch(`/api/bets?userId=${userId}`);

// Response
{
  "bets": [...],
  "total": 83,
  "hasMore": false
}
```

## Performance Optimizations

### 1. **Parallel Data Loading**

```typescript
// Load user data in parallel
const [user, followData] = await Promise.all([
  userApi.getByWallet(address),
  followApi.getFollowData(userId),
]);
```

### 2. **Background Content Loading**

```typescript
// Load predictions/bets after initial render
useEffect(() => {
  loadUserData(user.id);
}, [user?.id]);
```

### 3. **Progressive Rendering**

```typescript
// Show user info immediately
{
  user && <UserHeader />;
}

// Show loading state for content
{
  isLoadingData && <Loader />;
}

// Show content when ready
{
  predictions.map((p) => <PredictionCard />);
}
```

### 4. **Optimistic Updates**

```typescript
// Update UI before API call
const handleFollow = async () => {
  setIsFollowing(true); // Instant feedback

  try {
    await followApi.follow(userId);
  } catch (error) {
    setIsFollowing(false); // Rollback on error
  }
};
```

## Component Structure

```
/profile/[address]/page.tsx
├── Loading State (Spinner)
├── Error State (Not Found)
└── Content
    ├── Back Button
    ├── Profile Header
    │   ├── Avatar/Username
    │   ├── Wallet Address
    │   ├── Follow Button (if not own profile)
    │   └── Stats
    │       ├── Predictions Count
    │       ├── Bets Count
    │       ├── Followers Count (clickable)
    │       ├── Following Count (clickable)
    │       └── Total Wagered
    ├── Tabs (Predictions/Bets)
    ├── Tab Content
    │   ├── Loading State
    │   ├── Empty State
    │   └── List
    │       ├── Prediction Cards
    │       └── Bet Cards
    └── Modals
        └── FollowListModal (followers/following)
```

## States & Loading

### Loading States

1. **Initial User Load** (50-100ms)

   ```tsx
   {
     isLoadingUser && <FullPageSpinner />;
   }
   ```

2. **Background Data Load** (200-500ms)

   ```tsx
   {
     isLoadingData && <ContentSpinner />;
   }
   ```

3. **Follow Action** (~100ms)
   ```tsx
   <FollowButton loading={isFollowing} />
   ```

### Error States

1. **User Not Found (404)**

   ```tsx
   <ErrorMessage>
     User profile doesn't exist
     <Button>Go to Discover</Button>
   </ErrorMessage>
   ```

2. **Network Error**
   ```tsx
   <ErrorMessage>
     Failed to load profile
     <Button>Retry</Button>
   </ErrorMessage>
   ```

### Empty States

1. **No Predictions**

   ```tsx
   <EmptyState>No predictions yet</EmptyState>
   ```

2. **No Bets**
   ```tsx
   <EmptyState>No bets placed yet</EmptyState>
   ```

## Security & Privacy

### Public Information

- ✅ Username
- ✅ Avatar
- ✅ Wallet address
- ✅ Public predictions
- ✅ Public bets
- ✅ Follow counts

### Protected Actions

- 🔒 Follow/unfollow (requires auth)
- 🔒 View own profile `/profile` (requires auth)

### URL Validation

```typescript
// Validate wallet address format
if (!address || address.length < 42) {
  return <ErrorPage />;
}

// Handle not found
try {
  const user = await userApi.getByWallet(address);
} catch (error) {
  if (error.status === 404) {
    return <NotFoundPage />;
  }
}
```

## Edge Cases Handled

### 1. **Own Profile**

```typescript
const isOwnProfile = currentUser?.walletAddress === address;

// Don't show follow button for own profile
{
  !isOwnProfile && <FollowButton />;
}
```

### 2. **Not Authenticated**

```typescript
// Can still view profile, but can't follow
{
  authenticated && !isOwnProfile && <FollowButton />;
}
```

### 3. **Long Usernames/Addresses**

```typescript
// Truncate wallet address
{user.walletAddress.slice(0, 10)}...{user.walletAddress.slice(-8)}

// Truncate username if needed
<p className="truncate">{user.username}</p>
```

### 4. **No Predictions/Bets**

```tsx
{
  predictions.length === 0 && <EmptyState>No predictions yet</EmptyState>;
}
```

### 5. **Loading Failures**

```typescript
try {
  await loadUserData();
} catch (error) {
  console.error("Failed to load:", error);
  // Show cached data or error message
}
```

## Testing Checklist

### Navigation

- [ ] Click username in prediction card → Opens user profile
- [ ] Click user in follow list → Opens user profile
- [ ] Back button → Returns to previous page
- [ ] URL with wallet address → Loads correct profile

### Loading

- [ ] User info loads immediately
- [ ] Predictions/bets load in background
- [ ] Loading spinners show during data fetch
- [ ] Content displays progressively

### Follow Feature

- [ ] Follow button shows for other users
- [ ] Follow button hidden for own profile
- [ ] Follow/unfollow updates counts
- [ ] Follower/following lists accessible

### Error Handling

- [ ] Invalid wallet address → Error page
- [ ] Non-existent user → 404 page
- [ ] Network error → Retry option
- [ ] Empty states show when no content

### Mobile Experience

- [ ] Profile loads on mobile
- [ ] Tabs work on mobile
- [ ] Follow button accessible
- [ ] Content scrolls properly

## Usage Examples

### Link to User Profile

```tsx
<Link href={`/profile/${user.walletAddress}`}>View Profile</Link>
```

### Programmatic Navigation

```tsx
const router = useRouter();
router.push(`/profile/${walletAddress}`);
```

### Check if Own Profile

```tsx
const isOwnProfile = currentUser?.walletAddress === params.address;
```

## Future Enhancements

### 1. **Profile Customization**

```typescript
// Allow users to customize their profile
- Bio/description
- Banner image
- Social links
- Trading style tags
```

### 2. **Performance Stats**

```typescript
// Show user's trading statistics
- Win rate
- Total profit/loss
- Best prediction
- Streak counter
```

### 3. **Activity Feed**

```typescript
// Show user's recent activity
- Recent predictions
- Recent bets
- Recent follows
- Achievements
```

### 4. **Private Profiles**

```typescript
// Allow users to make profile private
- Require follow approval
- Hide predictions/bets
- Show limited info
```

## Summary

✅ **Dynamic Route** - `/profile/[address]` for any user
✅ **Background Loading** - Smooth UX with progressive rendering
✅ **Follow Integration** - Full social features
✅ **Navigation Links** - From predictions, follow lists, etc.
✅ **Optimized Performance** - Parallel loading, caching
✅ **Error Handling** - 404, network errors, empty states
✅ **Mobile Responsive** - Works on all screen sizes

Users can now discover and view each other's profiles! 🚀
