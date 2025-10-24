# Follow Feature - Quick Setup Guide ⚡

## Step 1: Database Migration (REQUIRED)

```bash
# Navigate to frontend directory
cd frontend

# Generate Prisma client with new Follow model
npx prisma generate

# Create and apply migration
npx prisma migrate dev --name add_follow_feature

# ✅ This creates the 'follows' table
```

## Step 2: Verify Installation

```bash
# Check if Follow model exists
npx prisma studio

# You should see:
# - users table (existing)
# - follows table (new)
```

## Step 3: Test the Feature

### Manual Testing

1. **Login** to the app
2. **Go to Profile** page (`/profile`)
3. **See** followers (0) and following (0) counts
4. **Click** on "Followers" or "Following" → Modal opens
5. **Create** another user account (different wallet)
6. **View** their profile (future feature)
7. **Click** "Follow" button
8. **See** counts update

### API Testing

```bash
# Replace USER_IDs with actual IDs from your database

# 1. Follow a user
curl -X POST http://localhost:3000/api/follow \
  -H "Content-Type: application/json" \
  -d '{"followerId":"USER1_ID","followingId":"USER2_ID"}'

# 2. Check follow status
curl "http://localhost:3000/api/follow?userId=USER2_ID&checkFollowerId=USER1_ID"

# Expected: { "followersCount": 1, "followingCount": 0, "isFollowing": true }

# 3. Get followers list
curl "http://localhost:3000/api/follow?userId=USER2_ID&type=followers"

# 4. Unfollow
curl -X DELETE "http://localhost:3000/api/follow?followerId=USER1_ID&followingId=USER2_ID"
```

## What's New

### Files Created

- ✅ `/app/api/follow/route.ts` - Follow API endpoints
- ✅ `/components/follow-button.tsx` - Follow/unfollow button
- ✅ `/components/follow-list-modal.tsx` - Followers/following modal

### Files Modified

- ✅ `/prisma/schema.prisma` - Added Follow model
- ✅ `/lib/types.ts` - Added FollowData types
- ✅ `/lib/api.ts` - Added followApi functions
- ✅ `/app/profile/page.tsx` - Added follow counts and modal

### Database Changes

```sql
-- New table: follows
CREATE TABLE follows (
  id TEXT PRIMARY KEY,
  follower_id TEXT NOT NULL,
  following_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  FOREIGN KEY(follower_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(following_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);
```

## Usage in Code

### 1. In Profile Page

```tsx
import { followApi } from "@/lib/api";
import FollowListModal from "@/components/follow-list-modal";

// Get follow counts
const data = await followApi.getFollowData(userId);
console.log(data.followersCount, data.followingCount);
```

### 2. In User Card Component

```tsx
import FollowButton from "@/components/follow-button";

<FollowButton targetUserId={user.id} variant="compact" />;
```

### 3. Show Followers/Following

```tsx
const [showModal, setShowModal] = useState(null);

<button onClick={() => setShowModal("followers")}>
  {followersCount} Followers
</button>

<FollowListModal
  isOpen={showModal === "followers"}
  onClose={() => setShowModal(null)}
  userId={userId}
  type="followers"
/>
```

## Common Issues

### Issue: "Property 'follow' does not exist on PrismaClient"

**Solution:** Run `npx prisma generate` to regenerate Prisma client

### Issue: Follow button doesn't appear

**Solution:** Make sure you're logged in and viewing another user's profile

### Issue: Modal doesn't open

**Solution:** Check browser console for errors, ensure user ID is valid

### Issue: Follow counts are 0

**Solution:** Create test follows using API or UI first

## Next Steps

- [ ] Run database migration
- [ ] Test follow/unfollow functionality
- [ ] View followers/following lists
- [ ] Optional: Add FollowButton to prediction cards (show creator)
- [ ] Optional: Create user profile pages (`/profile/[userId]`)
- [ ] Optional: Add activity feed showing who followed who

## Quick Commands

```bash
# Regenerate Prisma client
npx prisma generate

# Apply migration
npx prisma migrate dev

# View database
npx prisma studio

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

## Summary

✅ Database schema updated with Follow model
✅ API endpoints for follow/unfollow operations
✅ Follow button component (auto-toggle, loading states)
✅ Follow list modal (view followers/following)
✅ Profile page integration with live counts

**Ready to use!** Just run the migration and start following users! 🚀
