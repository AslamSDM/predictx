# Follow Feature Implementation - Complete Guide 🤝

## Overview

Implemented a comprehensive user follow system allowing users to:

- Follow/unfollow other users
- View followers and following lists
- See follow counts on profiles
- Optimistic UI updates

## Database Schema

### New `Follow` Model

```prisma
model Follow {
  id          String   @id @default(cuid())
  followerId  String   // User who is following
  followingId String   // User being followed
  createdAt   DateTime @default(now())

  // Relations
  follower  User @relation("UserFollowing", fields: [followerId], references: [id], onDelete: Cascade)
  following User @relation("UserFollowers", fields: [followingId], references: [id], onDelete: Cascade)

  @@unique([followerId, followingId])
  @@index([followerId])
  @@index([followingId])
  @@map("follows")
}
```

### Updated `User` Model

```prisma
model User {
  // ... existing fields

  // Follow relations
  following   Follow[] @relation("UserFollowing")
  followers   Follow[] @relation("UserFollowers")
}
```

**Key Features:**

- Unique constraint on `[followerId, followingId]` prevents duplicate follows
- Cascade delete ensures follows are removed when users are deleted
- Indexed for fast queries
- Self-referential many-to-many relationship

## API Endpoints

### POST `/api/follow`

**Follow a user**

```typescript
// Request
{
  "followerId": "user123",
  "followingId": "user456"
}

// Response
{
  "success": true,
  "follow": {
    "id": "follow123",
    "followerId": "user123",
    "followingId": "user456",
    "createdAt": "2025-10-21T...",
    "following": {
      "id": "user456",
      "username": "CryptoTrader42",
      "avatar": "https://...",
      "walletAddress": "0x..."
    }
  }
}
```

**Validation:**

- Cannot follow yourself
- Cannot follow same user twice
- Both users must exist

### DELETE `/api/follow`

**Unfollow a user**

```typescript
// Request
DELETE /api/follow?followerId=user123&followingId=user456

// Response
{
  "success": true
}
```

### GET `/api/follow`

**Get follow data and counts**

```typescript
// Request - Basic counts
GET /api/follow?userId=user123

// Response
{
  "followersCount": 42,
  "followingCount": 18,
  "isFollowing": false
}

// Request - Check if following
GET /api/follow?userId=user123&checkFollowerId=currentUser

// Response
{
  "followersCount": 42,
  "followingCount": 18,
  "isFollowing": true  // currentUser follows user123
}

// Request - Get followers list
GET /api/follow?userId=user123&type=followers

// Response
{
  "followersCount": 42,
  "followingCount": 18,
  "list": [
    {
      "id": "follow1",
      "createdAt": "2025-10-21T...",
      "follower": {
        "id": "user456",
        "username": "Trader42",
        "avatar": "https://...",
        "walletAddress": "0x...",
        "_count": {
          "predictions": 15,
          "bets": 83
        }
      }
    }
  ]
}

// Request - Get following list
GET /api/follow?userId=user123&type=following

// Response
{
  "followersCount": 42,
  "followingCount": 18,
  "list": [
    {
      "id": "follow2",
      "createdAt": "2025-10-21T...",
      "following": {
        "id": "user789",
        "username": "ProTrader",
        "avatar": "https://...",
        "walletAddress": "0x...",
        "_count": {
          "predictions": 50,
          "bets": 200
        }
      }
    }
  ]
}
```

## Frontend API Client

### `followApi` Functions

```typescript
// Follow a user
await followApi.follow(currentUserId, targetUserId);

// Unfollow a user
await followApi.unfollow(currentUserId, targetUserId);

// Get follow data
const data = await followApi.getFollowData(userId, checkFollowerId);
// Returns: { followersCount, followingCount, isFollowing }

// Get followers list
const followers = await followApi.getFollowers(userId);

// Get following list
const following = await followApi.getFollowing(userId);
```

## Components

### 1. `<FollowButton />` Component

**Purpose:** Toggleable follow/unfollow button

```tsx
<FollowButton
  targetUserId="user123"
  targetUsername="CryptoTrader"
  variant="default" // or "compact"
  onFollowChange={(isFollowing) => console.log(isFollowing)}
/>
```

**Props:**

- `targetUserId` - User ID to follow/unfollow
- `targetUsername` - Optional username for display
- `variant` - "default" (with text) or "compact" (icon only)
- `onFollowChange` - Callback when follow status changes

**Features:**

- ✅ Automatic follow status check
- ✅ Loading states (checking, following, unfollowing)
- ✅ Optimistic UI updates
- ✅ Error handling
- ✅ Hidden for own profile
- ✅ Hidden when not authenticated

**States:**

```
┌─────────────┐
│  Checking   │ → Spinner + "Loading..."
└─────────────┘
       ↓
┌─────────────┐
│ Not Follow  │ → "+ Follow" (Blue button)
└─────────────┘
       ↓ (click)
┌─────────────┐
│ Following   │ → Spinner + "Following..."
└─────────────┘
       ↓
┌─────────────┐
│  Following  │ → "- Unfollow" (Gray button)
└─────────────┘
       ↓ (click)
┌─────────────┐
│Unfollowing  │ → Spinner + "Unfollowing..."
└─────────────┘
       ↓
┌─────────────┐
│ Not Follow  │ → Back to "+ Follow"
└─────────────┘
```

### 2. `<FollowListModal />` Component

**Purpose:** Modal showing followers or following list

```tsx
<FollowListModal
  isOpen={true}
  onClose={() => setShowModal(false)}
  userId="user123"
  type="followers" // or "following"
  username="CryptoTrader"
/>
```

**Features:**

- ✅ List of users with avatars and stats
- ✅ Follow buttons for each user
- ✅ Click user to visit profile
- ✅ Shows follower/following counts
- ✅ Loading state
- ✅ Empty state
- ✅ Smooth animations

**Layout:**

```
┌───────────────────────────────┐
│  👤 Followers                 │
│  @CryptoTrader              X │
├───────────────────────────────┤
│                               │
│  [Avatar] Username            │
│           0x1234...5678       │
│           15 predictions •... │
│                    [Follow]   │
│                               │
│  [Avatar] Another User        │
│           0xabcd...ef01       │
│           8 predictions •...  │
│                  [Unfollow]   │
│                               │
├───────────────────────────────┤
│       42          |      18   │
│    Followers      | Following │
└───────────────────────────────┘
```

## Profile Page Integration

### Follow Counts Display

```tsx
<button onClick={() => setShowFollowModal("followers")}>
  <div className="text-2xl font-bold text-primary">
    {followData.followersCount}
  </div>
  <div className="text-xs text-muted-foreground">
    👤 Followers
  </div>
</button>

<button onClick={() => setShowFollowModal("following")}>
  <div className="text-2xl font-bold text-primary">
    {followData.followingCount}
  </div>
  <div className="text-xs text-muted-foreground">
    👤 Following
  </div>
</button>
```

**Features:**

- Click to open followers/following modal
- Live counts from API
- Hover effect for interactivity

## Setup Instructions

### 1. Database Migration

```bash
# Generate Prisma client with new Follow model
npx prisma generate

# Create and apply migration
npx prisma migrate dev --name add_follow_feature

# Or push schema changes (for development)
npx prisma db push
```

### 2. Verify Database

```sql
-- Check Follow table
SELECT * FROM follows;

-- Check user follows
SELECT u.username,
       (SELECT COUNT(*) FROM follows WHERE following_id = u.id) as followers,
       (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) as following
FROM users u;
```

### 3. Test the API

```bash
# Follow a user
curl -X POST http://localhost:3000/api/follow \
  -H "Content-Type: application/json" \
  -d '{"followerId":"user1","followingId":"user2"}'

# Check follow status
curl "http://localhost:3000/api/follow?userId=user2&checkFollowerId=user1"

# Get followers
curl "http://localhost:3000/api/follow?userId=user2&type=followers"

# Unfollow
curl -X DELETE "http://localhost:3000/api/follow?followerId=user1&followingId=user2"
```

## Usage Examples

### In Profile Page

```tsx
import { followApi } from "@/lib/api";
import FollowListModal from "@/components/follow-list-modal";

// Fetch follow data
const [followData, setFollowData] = useState({
  followersCount: 0,
  followingCount: 0,
});

useEffect(() => {
  const fetchFollowData = async () => {
    const data = await followApi.getFollowData(userId);
    setFollowData({
      followersCount: data.followersCount,
      followingCount: data.followingCount,
    });
  };
  fetchFollowData();
}, [userId]);

// Show modal
<FollowListModal
  isOpen={showModal === "followers"}
  onClose={() => setShowModal(null)}
  userId={userId}
  type="followers"
/>;
```

### In User Card

```tsx
<div className="user-card">
  <img src={user.avatar} />
  <h3>{user.username}</h3>
  <FollowButton
    targetUserId={user.id}
    variant="compact"
    onFollowChange={(following) => {
      console.log(`Now ${following ? "following" : "not following"}`);
    }}
  />
</div>
```

### In Prediction Card

```tsx
<div className="prediction-card">
  <div className="creator-info">
    <img src={creator.avatar} />
    <span>{creator.username}</span>
    <FollowButton targetUserId={creator.id} variant="compact" />
  </div>
  {/* Prediction content */}
</div>
```

## Performance Optimizations

### Database Indexes

```prisma
@@index([followerId])  // Fast lookup of who a user follows
@@index([followingId]) // Fast lookup of who follows a user
@@unique([followerId, followingId]) // Prevent duplicates + fast checks
```

**Query Performance:**

- Get followers: O(log n) with index
- Get following: O(log n) with index
- Check if following: O(1) with unique constraint
- Count followers: O(log n) with index

### Frontend Caching

```typescript
// Cache follow status after check
const [isFollowing, setIsFollowing] = useState(false);
const [lastChecked, setLastChecked] = useState(0);

// Only re-check if >5 minutes old
if (Date.now() - lastChecked > 5 * 60 * 1000) {
  checkFollowStatus();
}
```

### API Response Optimization

```typescript
// Only include necessary fields
follower: {
  select: {
    id: true,
    username: true,
    avatar: true,
    walletAddress: true,
    _count: {
      select: {
        predictions: true,
        bets: true,
      },
    },
  },
}
```

## Security Considerations

### 1. Authentication Required

```typescript
if (!user?.id) {
  return null; // Don't show follow button
}
```

### 2. Cannot Follow Self

```typescript
if (followerId === followingId) {
  return NextResponse.json(
    { error: "Cannot follow yourself" },
    { status: 400 }
  );
}
```

### 3. Duplicate Prevention

```prisma
@@unique([followerId, followingId])
```

### 4. Cascade Delete

```prisma
onDelete: Cascade  // Remove follows when user deleted
```

## Testing Checklist

### API Tests

- [ ] Follow a user successfully
- [ ] Cannot follow yourself
- [ ] Cannot follow twice
- [ ] Unfollow successfully
- [ ] Get follower count
- [ ] Get following count
- [ ] Check follow status
- [ ] Get followers list
- [ ] Get following list

### UI Tests

- [ ] Follow button shows correct initial state
- [ ] Follow button toggles correctly
- [ ] Loading states show during API calls
- [ ] Error messages display on failure
- [ ] Follow counts update after follow/unfollow
- [ ] Modal opens and closes
- [ ] Modal shows correct list
- [ ] Can follow from modal
- [ ] Profile link works from modal

### Edge Cases

- [ ] Following user with no followers
- [ ] Unfollowing last follower
- [ ] Network error handling
- [ ] Race condition handling
- [ ] Rapid follow/unfollow clicks

## Future Enhancements

### 1. Follow Activity Feed

```typescript
// Show recent follows in activity feed
const recentFollows = await prisma.follow.findMany({
  where: { followerId: userId },
  orderBy: { createdAt: "desc" },
  take: 10,
});
```

### 2. Mutual Follows

```typescript
// Check if users follow each other
const isMutual =
  (await prisma.follow.count({
    where: {
      OR: [
        { followerId: user1, followingId: user2 },
        { followerId: user2, followingId: user1 },
      ],
    },
  })) === 2;
```

### 3. Follow Notifications

```typescript
// Notify user when someone follows them
await createNotification({
  userId: followingId,
  type: "NEW_FOLLOWER",
  message: `${follower.username} started following you`,
});
```

### 4. Follow Suggestions

```typescript
// Suggest users based on mutual follows
SELECT u.* FROM users u
WHERE u.id IN (
  SELECT following_id FROM follows
  WHERE follower_id IN (
    SELECT following_id FROM follows
    WHERE follower_id = current_user_id
  )
  AND following_id != current_user_id
);
```

### 5. Private Profiles

```typescript
// Require approval for follow requests
model FollowRequest {
  id         String   @id @default(cuid())
  requesterId String
  targetId   String
  status     String   @default("PENDING") // PENDING, ACCEPTED, REJECTED
  createdAt  DateTime @default(now())
}
```

## Summary

✅ **Database** - Follow model with unique constraints and indexes
✅ **API** - Complete CRUD operations for follow relationships
✅ **Components** - FollowButton and FollowListModal
✅ **Profile** - Integrated follow counts and modal
✅ **Performance** - Optimized queries and caching
✅ **Security** - Validation and authentication checks

Users can now follow each other and build their social network! 🚀
