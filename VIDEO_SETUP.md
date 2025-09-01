# Quick Video Setup Guide

## Replace the Placeholder Video with Rich Nick's Content

### Current Status:
- ❌ Rick Astley video removed
- ✅ Placeholder ready for Rich Nick's video

### Steps to Add Rich Nick's Video:

1. **Visit Rich Nick's YouTube Channel:**
   - Go to: https://www.youtube.com/@richhnick
   - Browse his videos to find one that best represents his content

2. **Get the Video ID:**
   - Click on the video you want to use
   - Copy the video ID from the URL
   - Example: `https://www.youtube.com/watch?v=dQw4w9WgXcQ` → Video ID is `dQw4w9WgXcQ`

3. **Update the Code:**
   - Open `src/RichNickLanding.jsx`
   - Go to line 28
   - Replace `VIDEO_ID_HERE` with the actual video ID
   - Example: `"https://www.youtube.com/embed/YOUR_VIDEO_ID?autoplay=0&mute=1&controls=1"`

4. **Test the Video:**
   - Run `npm run dev` to test locally
   - Make sure the video loads and plays correctly

### Recommended Video Types:
- Content creation tips
- Growth strategies
- Behind-the-scenes of his process
- Any video that showcases his expertise

### Video Settings:
- Autoplay: Disabled (better for user experience)
- Muted: Yes (required for autoplay if enabled)
- Controls: Enabled (users can play/pause)

### Example:
If Rich Nick has a video with URL: `https://www.youtube.com/watch?v=abc123xyz`
Then the embed URL should be: `https://www.youtube.com/embed/abc123xyz?autoplay=0&mute=1&controls=1`
