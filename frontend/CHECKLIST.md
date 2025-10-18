# ✅ PredictX PWA - Setup Checklist

Use this checklist to ensure everything is properly configured.

## 🔧 Installation Steps

### Step 1: Install Dependencies

- [ ] Run `npm install framer-motion`
- [ ] Verify installation: `npm list framer-motion`

### Step 2: Generate App Icons

Choose ONE method:

**Option A: Quick Test (ImageMagick)**

- [ ] Install ImageMagick
- [ ] Run icon generation script:
  ```bash
  mkdir -p public/icons
  for size in 72 96 128 144 152 192 384 512; do
    convert -size ${size}x${size} xc:#0EA5E9 public/icons/icon-${size}x${size}.png
  done
  ```

**Option B: Online Tool (Recommended)**

- [ ] Visit https://www.pwabuilder.com/imageGenerator
- [ ] Upload your 512x512 logo
- [ ] Download generated icons
- [ ] Extract to `public/icons/` directory

**Option C: Custom Design**

- [ ] Design icons in Figma/Photoshop
- [ ] Export at required sizes (see list below)
- [ ] Save to `public/icons/` directory

Required icon sizes:

- [ ] 72x72
- [ ] 96x96
- [ ] 128x128
- [ ] 144x144
- [ ] 152x152
- [ ] 192x192
- [ ] 384x384
- [ ] 512x512

### Step 3: Database Setup

- [ ] Ensure PostgreSQL is running
- [ ] Update `.env` with DATABASE_URL
- [ ] Run `npm run db:push`
- [ ] Run `npm run db:seed`
- [ ] Verify with `npm run db:studio`

### Step 4: Start Development Server

- [ ] Run `npm run dev`
- [ ] Open http://localhost:3000
- [ ] Navigate to `/discover`
- [ ] Verify no console errors

## 🧪 Testing Checklist

### Basic Functionality

- [ ] Page loads without errors
- [ ] Predictions display in card format
- [ ] Card stack visible (next card behind)
- [ ] Progress indicator shows (1/X)

### Swipe Gestures (Touch Device)

- [ ] Swipe right shows "YES" overlay
- [ ] Swipe left shows "NO" overlay
- [ ] Card rotates during swipe
- [ ] Threshold triggers action
- [ ] Next card becomes current
- [ ] Modal opens from correct side

### Swipe Gestures (Desktop/Mouse)

- [ ] Drag right shows "YES" overlay
- [ ] Drag left shows "NO" overlay
- [ ] Card rotates during drag
- [ ] Drag threshold works
- [ ] Release triggers action

### Button Controls

- [ ] ✓ button triggers YES modal
- [ ] ✕ button triggers NO modal
- [ ] Modals slide from correct direction

### YES Modal (Right Swipe)

- [ ] Slides in from right
- [ ] Green theme applied
- [ ] Shows prediction details
- [ ] Displays current pools
- [ ] Amount input works
- [ ] Quick buttons work ($10, $25, $50, $100)
- [ ] Potential winnings calculate
- [ ] Confirm button works
- [ ] Cancel button works
- [ ] Close button works
- [ ] Backdrop click closes

### NO Modal (Left Swipe)

- [ ] Slides in from left
- [ ] Red theme applied
- [ ] Shows prediction details
- [ ] Displays current pools
- [ ] Amount input works
- [ ] Quick buttons work
- [ ] Potential winnings calculate
- [ ] Confirm button works
- [ ] Cancel button works
- [ ] Close button works
- [ ] Backdrop click closes

### Card Stack Behavior

- [ ] Shows next card behind current
- [ ] Next card appears scaled down
- [ ] Next card appears faded
- [ ] Cards advance correctly
- [ ] "All caught up" message shows at end
- [ ] "Start Over" button works

### PWA Features (Desktop)

- [ ] Install icon appears in address bar
- [ ] Manifest loads without errors
- [ ] Service worker registers
- [ ] App installs successfully
- [ ] Installed app opens correctly
- [ ] Offline page works

### PWA Features (Mobile)

- [ ] Install banner appears
- [ ] "Add to Home Screen" works (iOS)
- [ ] "Install app" works (Android)
- [ ] Icon appears on home screen
- [ ] App opens in standalone mode
- [ ] Status bar styled correctly
- [ ] Splash screen appears
- [ ] Works offline after install

### Performance

- [ ] Animations run at 60fps
- [ ] No jank during swipes
- [ ] Images load quickly
- [ ] Modal transitions smooth
- [ ] No memory leaks (check DevTools)
- [ ] Touch response instant

## 🎨 Visual Checks

### Discover Page

- [ ] Header centered and readable
- [ ] Instructions visible
- [ ] Progress indicator clear
- [ ] Card fills container properly
- [ ] Card corners rounded
- [ ] Card shadow visible
- [ ] Button controls visible
- [ ] Button icons clear

### Swipe Card

- [ ] Trade image displays (if present)
- [ ] Symbol and direction clear
- [ ] Title readable (max 2 lines)
- [ ] Description readable (max 3 lines)
- [ ] Entry/target prices visible
- [ ] Pool info displayed
- [ ] Time remaining shown
- [ ] Creator name visible
- [ ] Swipe instructions at bottom

### Modals

- [ ] Header with icon and title
- [ ] Close button top-right
- [ ] Prediction info section
- [ ] Current pool stats
- [ ] Amount input field
- [ ] Quick amount buttons
- [ ] Potential winnings box
- [ ] Warning message
- [ ] Action buttons at bottom
- [ ] Proper spacing/padding

### Install Banner

- [ ] Appears after page load
- [ ] Icon and title visible
- [ ] Description clear
- [ ] Install button prominent
- [ ] "Not now" button visible
- [ ] Close button works
- [ ] Dismisses properly
- [ ] Doesn't reappear after dismiss

## 🔍 Browser Console Checks

### No Errors For:

- [ ] Service worker registration
- [ ] Manifest loading
- [ ] Icon loading
- [ ] API calls
- [ ] Image loading
- [ ] Component rendering
- [ ] Framer Motion animations

### Warnings (Acceptable):

- ⚠️ Development server warnings
- ⚠️ HMR notifications
- ⚠️ Console.log statements

### Warnings (Fix Required):

- ❌ Missing dependencies
- ❌ Type errors
- ❌ Failed API calls
- ❌ 404 errors
- ❌ CORS errors

## 📱 Device Testing

### iPhone (Safari)

- [ ] Swipe gestures work
- [ ] Modals animate smoothly
- [ ] Install to home screen works
- [ ] Opens in standalone mode
- [ ] Status bar styled
- [ ] No viewport issues

### Android (Chrome)

- [ ] Swipe gestures work
- [ ] Modals animate smoothly
- [ ] Install app works
- [ ] Opens in standalone mode
- [ ] Status bar styled
- [ ] No viewport issues

### iPad/Tablet

- [ ] Layout responsive
- [ ] Card size appropriate
- [ ] Touch targets large enough
- [ ] Modals properly sized

### Desktop (Chrome)

- [ ] Mouse drag works
- [ ] Install prompt appears
- [ ] Buttons accessible
- [ ] Layout centered

### Desktop (Firefox)

- [ ] Mouse drag works
- [ ] Animations smooth
- [ ] Layout correct

### Desktop (Safari)

- [ ] Mouse drag works
- [ ] Animations smooth
- [ ] Layout correct

## 🚀 Production Readiness

### Before Deployment:

- [ ] Replace demo wallet connection
- [ ] Add Web3 integration
- [ ] Implement proper authentication
- [ ] Add error boundaries
- [ ] Set up error logging
- [ ] Configure analytics
- [ ] Add rate limiting
- [ ] Enable HTTPS
- [ ] Update environment variables
- [ ] Test on production URL
- [ ] Verify PWA works on HTTPS
- [ ] Test share functionality
- [ ] Add meta tags for SEO
- [ ] Create privacy policy
- [ ] Create terms of service

### Performance Optimization:

- [ ] Enable image optimization
- [ ] Add lazy loading
- [ ] Minimize bundle size
- [ ] Enable gzip compression
- [ ] Configure CDN
- [ ] Optimize database queries
- [ ] Add caching headers
- [ ] Monitor Core Web Vitals

## 📊 Success Criteria

Your PWA is ready when:

- ✅ All tests pass
- ✅ No console errors
- ✅ Smooth 60fps animations
- ✅ Installs on all devices
- ✅ Works offline
- ✅ Lighthouse PWA score >90
- ✅ Core Web Vitals green
- ✅ Responsive on all screens

## 🎯 Final Check

- [ ] Run `npm run build` successfully
- [ ] Test production build locally
- [ ] Verify service worker works in production
- [ ] Check manifest in production
- [ ] Test install flow in production
- [ ] Monitor for errors after deploy

---

## 📝 Notes

Use this space to track any issues or customizations:

```
Issues Found:
-

Custom Changes:
-

Performance Metrics:
-
```

---

**Once all items are checked, you're ready to launch! 🚀**
