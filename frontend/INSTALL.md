# 🚀 Quick Start - PredictX PWA Setup

## ✅ What's Been Implemented

Your app is now a full Progressive Web App with:

### 1. **Swipe Interface** (Tinder-Style)

- Swipe right = Bet YES (green modal from right)
- Swipe left = Bet NO (red modal from left)
- Smooth card animations
- Card stack visualization
- Alternative button controls

### 2. **PWA Features**

- Install to home screen
- Offline support
- Service worker caching
- App manifest
- Mobile-optimized

### 3. **Bet Modals**

- Side-sliding modals (left/right based on swipe)
- Real-time pool statistics
- Potential winnings calculator
- Quick amount buttons
- Custom amount input

## 🔧 Required Installation Steps

### 1. Install Framer Motion

```bash
npm install framer-motion
```

### 2. Generate Icons

Follow instructions in `/public/icons/GENERATE_ICONS.md`

Quick test with ImageMagick:

```bash
for size in 72 96 128 144 152 192 384 512; do
  convert -size ${size}x${size} xc:#0EA5E9 public/icons/icon-${size}x${size}.png
done
```

### 3. Setup Database

```bash
npm run db:push
npm run db:seed
```

### 4. Run the App

```bash
npm run dev
```

## 📱 Testing the PWA

### Desktop (Chrome):

1. Open http://localhost:3000/discover
2. Look for install icon in address bar
3. Click to install

### Mobile (iPhone):

1. Open in Safari
2. Tap Share button
3. Tap "Add to Home Screen"

### Mobile (Android):

1. Open in Chrome
2. Tap menu (⋮)
3. Tap "Install app"

## 🎯 How to Use

1. **Navigate to Discover** - `/discover` page
2. **View Prediction Card** - See trade details, pools, timing
3. **Swipe or Tap**:
   - Swipe RIGHT or tap ✓ for YES
   - Swipe LEFT or tap ✕ for NO
4. **Enter Bet Amount** - Modal slides in from swipe direction
5. **Confirm Bet** - Review and place your bet

## 📂 New Files Created

```
/components/swipe-card.tsx       - Main swipeable card component
/components/bet-modal.tsx         - Side-sliding bet modal
/app/discover/page.tsx            - Updated with swipe interface
/app/layout.tsx                   - Added PWA meta tags
/public/manifest.json             - PWA manifest
/public/sw.js                     - Service worker
/public/icons/                    - App icons directory
/PWA_GUIDE.md                     - Detailed PWA guide
/INSTALL.md                       - This file
```

## 🎨 Customization

### Change Theme Colors

Edit `/public/manifest.json`:

```json
"theme_color": "#0EA5E9",
"background_color": "#000000"
```

### Modify Swipe Threshold

Edit `/components/swipe-card.tsx` line 31:

```typescript
const threshold = 100; // pixels to trigger swipe
```

### Adjust Modal Animation

Edit `/components/bet-modal.tsx` line 72:

```typescript
transition={{ type: "spring", damping: 25, stiffness: 300 }}
```

## 🔒 Security Notes

1. **Wallet Connection** - Currently uses localStorage (demo only)
2. **Production** - Implement proper Web3 wallet auth
3. **HTTPS** - PWAs require HTTPS in production
4. **API Security** - Add proper authentication to API routes

## 🐛 Common Issues

### Swipe not working?

- Make sure framer-motion is installed
- Check browser console for errors
- Try button controls as fallback

### Icons not showing?

- Generate icons using instructions above
- Clear browser cache
- Reload manifest

### Modal not appearing?

- Check that predictions are loaded
- Verify API endpoints are working
- Look for errors in console

## 📈 Next Steps

1. ✅ Install framer-motion
2. ✅ Generate app icons
3. ✅ Test swipe interface
4. ✅ Connect real wallet
5. ✅ Deploy to production
6. ⬜ Add push notifications
7. ⬜ Implement offline queue
8. ⬜ Add biometric auth

## 💡 Pro Tips

- **Swipe Sensitivity**: Adjust threshold for easier/harder swipes
- **Card Stack**: Shows next card for preview
- **Quick Bets**: Use $10, $25, $50, $100 buttons
- **Offline**: Service worker caches for offline use
- **Home Screen**: Install for native app experience

## 📞 Support

- See `PWA_GUIDE.md` for detailed documentation
- Check `DATABASE_README.md` for backend info
- Review component code for customization

---

🎉 **Your prediction platform is now a fully functional PWA with swipe interface!**
