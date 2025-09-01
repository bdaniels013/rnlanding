# Public Assets Directory

This directory contains static assets for the Rich Nick landing page.

## Logo & Brand Assets

### To add Rich Nick's logo:
1. Save Rich Nick's logo as `rich-nick-logo.png` in this directory
2. Uncomment the logo line in `src/RichNickLanding.jsx` (around line 85)
3. Adjust the size classes if needed (currently set to `h-8 w-auto`)

### Recommended logo specifications:
- Format: PNG or SVG (preferred)
- Size: At least 200px wide for crisp display
- Background: Transparent or dark background
- Style: Should work well on dark backgrounds

## Other Media Assets

### Video Content:
- Replace the placeholder YouTube video URL in the `SITE` configuration
- Find a compelling video from Rich Nick's YouTube channel
- Use the embed URL format: `https://www.youtube.com/embed/VIDEO_ID`

### Images:
- Add any additional brand images here
- Reference them in the code as `/filename.ext`

## File Structure:
```
public/
├── README.md
├── rich-nick-logo.png (to be added)
└── other-assets/ (optional)
```
