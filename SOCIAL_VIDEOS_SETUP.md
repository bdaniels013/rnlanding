# Social Media Videos Setup Guide

## Add Instagram Reels & Facebook Videos with View Counts

### Current Setup:
- ✅ YouTube Shorts video added (autoplay, portrait layout)
- ✅ Multi-platform video showcase structure ready
- ✅ View count display system implemented

### How to Add Instagram Reels:

1. **Find Rich Nick's Instagram Reels:**
   - Go to: https://www.instagram.com/richhnick
   - Look for Reels with good engagement

2. **Get the Reel URL:**
   - Click on a Reel
   - Copy the URL (format: `https://www.instagram.com/reel/REEL_ID/`)

3. **Create Embed URL:**
   - Add `/embed/` to the end of the Reel URL
   - Example: `https://www.instagram.com/reel/REEL_ID/embed/`

4. **Update the Code:**
   - Open `src/RichNickLanding.jsx`
   - Find the `socialVideos` array (around line 45)
   - Uncomment the Instagram section
   - Replace `YOUR_REEL_ID` with the actual Reel ID
   - Update the view count

### How to Add Facebook Videos:

1. **Find Rich Nick's Facebook Videos:**
   - Go to: https://www.facebook.com/nick.burks.3
   - Look for videos with good engagement

2. **Get the Video URL:**
   - Click on a video
   - Copy the URL (format: `https://www.facebook.com/nick.burks.3/videos/VIDEO_ID`)

3. **Create Embed URL:**
   - Use format: `https://www.facebook.com/plugins/video.php?href=VIDEO_URL`
   - Example: `https://www.facebook.com/plugins/video.php?href=https://www.facebook.com/nick.burks.3/videos/VIDEO_ID`

4. **Update the Code:**
   - Open `src/RichNickLanding.jsx`
   - Find the `socialVideos` array (around line 45)
   - Uncomment the Facebook section
   - Replace `YOUR_VIDEO_ID` with the actual video ID
   - Update the view count

### Example Configuration:

```javascript
socialVideos: [
  {
    platform: "YouTube",
    url: "https://youtube.com/shorts/0UBnHDSiNJQ",
    embedUrl: "https://www.youtube.com/embed/0UBnHDSiNJQ?autoplay=1&mute=1&controls=1&loop=1&playlist=0UBnHDSiNJQ",
    views: "50K+",
    icon: Youtube
  },
  {
    platform: "Instagram",
    url: "https://www.instagram.com/reel/ABC123xyz/",
    embedUrl: "https://www.instagram.com/reel/ABC123xyz/embed/",
    views: "25K+",
    icon: Instagram
  },
  {
    platform: "Facebook",
    url: "https://www.facebook.com/nick.burks.3/videos/123456789",
    embedUrl: "https://www.facebook.com/plugins/video.php?href=https://www.facebook.com/nick.burks.3/videos/123456789",
    views: "30K+",
    icon: Facebook
  }
]
```

### Features:
- 🎥 **Portrait layout** optimized for mobile
- 🔄 **Autoplay** with muted sound
- 📊 **View counts** displayed on each video
- 🎯 **Clickable** - opens original post
- 📱 **Responsive** design for all devices
- 🎨 **Hover effects** and smooth transitions

### Tips for Choosing Videos:
- Pick videos with high engagement
- Choose content that showcases Rich Nick's expertise
- Mix different types of content (tips, behind-the-scenes, results)
- Update view counts regularly for credibility

### View Count Formatting:
- Use "K+" for thousands (e.g., "25K+")
- Use "M+" for millions (e.g., "1.2M+")
- Keep it simple and readable
