# Icon Generation Instructions

To generate all required PWA icons from the SVG template:

## Option 1: Using Online Tools (Easiest)

1. Go to https://www.pwabuilder.com/imageGenerator
2. Upload your logo/icon (512x512 minimum)
3. Download the generated icon pack
4. Extract to `/public/icons/` directory

## Option 2: Using ImageMagick (Command Line)

If you have ImageMagick installed:

```bash
# Install ImageMagick if needed
# macOS: brew install imagemagick
# Ubuntu: sudo apt-get install imagemagick

# Convert SVG to PNGs at different sizes
convert public/icons/icon-template.svg -resize 72x72 public/icons/icon-72x72.png
convert public/icons/icon-template.svg -resize 96x96 public/icons/icon-96x96.png
convert public/icons/icon-template.svg -resize 128x128 public/icons/icon-128x128.png
convert public/icons/icon-template.svg -resize 144x144 public/icons/icon-144x144.png
convert public/icons/icon-template.svg -resize 152x152 public/icons/icon-152x152.png
convert public/icons/icon-template.svg -resize 192x192 public/icons/icon-192x192.png
convert public/icons/icon-template.svg -resize 384x384 public/icons/icon-384x384.png
convert public/icons/icon-template.svg -resize 512x512 public/icons/icon-512x512.png
```

## Option 3: Quick Test (Using Placeholder)

For quick testing, create a simple colored square:

```bash
mkdir -p public/icons

# Create placeholder icons (requires ImageMagick)
for size in 72 96 128 144 152 192 384 512; do
  convert -size ${size}x${size} xc:#0EA5E9 public/icons/icon-${size}x${size}.png
done
```

## Recommended Icon Design

Your app icon should:

- Be 512x512 pixels minimum
- Have a simple, recognizable design
- Work well on both light and dark backgrounds
- Include your brand colors (#0EA5E9 - primary blue)
- Be saved as PNG with transparency

## Testing Your Icons

After generating icons:

1. Clear browser cache
2. Reload the app
3. Try installing as PWA
4. Check if icon appears correctly on home screen
