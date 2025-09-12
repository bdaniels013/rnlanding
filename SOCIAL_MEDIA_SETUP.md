# Social Media Live Ticker Setup Guide

This guide will help you set up live follower counts for YouTube, Instagram, and Facebook on your landing page.

## 🔐 **SECURITY WARNING**

**NEVER commit these API keys to your repository!** Add them to your `.env` file and ensure `.env` is in your `.gitignore`.

## 📋 **Required Information**

You provided these credentials:
- **YouTube API Key**: `AIzaSyBZ94K7fkeaO_j33uFAb3rTZ03KyqImNjY` ✅
- **Instagram App ID**: `759448650300994` ✅
- **Instagram App Secret**: `753292063006d88921f0368a1a3ebcb8` ✅
- **Meta App ID**: `2532849530385570` ✅
- **Meta App Secret**: `753292063006d88921f0368a1a3ebcb8` ✅
- **Facebook/Instagram Graph API Key**: `EAAUVzbp9bqsBPW3C8pK0CGzCoqSwj4nABJIGv3Y32pyQZB7TZCjvzqvng5FqrwMPV30ixEcvsIZBmFVDXlTodWQ6RXrYzZB7OZAuibkGHgqoAUGDC8r7xBC5oCaJYMQrCq824SNn6AvQuL14AEkM3ZBfMURmexT8jdvpFZCcFZAaUggzgsYxfEZBTbVnV1oGDasQX66eIQgegkiZCLNxNdZCS4JTvPqhbpc4j2fGY3AHZALkB8WKGSjVKed89NCELIcxvAZDZD` ✅

## 🛠 **Setup Steps**

### 1. **Get YouTube Channel ID**

1. Go to your YouTube channel: https://www.youtube.com/@richhnick
2. Click on your profile picture → **YouTube Studio**
3. Go to **Settings** → **Channel** → **Basic info**
4. Copy your **Channel ID** (starts with `UC...`)

### 2. **Get Instagram User ID**

1. Go to https://developers.facebook.com/tools/explorer/
2. Select your app: **RN Landing-IG**
3. Generate a User Access Token with `instagram_basic` permissions
4. Use this API call to get your User ID:
   ```
   GET https://graph.instagram.com/me?fields=id&access_token=YOUR_ACCESS_TOKEN
   ```

### 3. **Get Facebook Page ID**

1. Go to your Facebook page: https://www.facebook.com/nick.burks.3
2. Click **About** → **Page Info**
3. Copy your **Page ID** (numeric)

### 4. **Update Environment Variables**

Add these to your `.env` file:

```bash
# YouTube API
YOUTUBE_API_KEY=AIzaSyBZ94K7fkeaO_j33uFAb3rTZ03KyqImNjY
YOUTUBE_CHANNEL_ID=UCyour-actual-channel-id-here

# Instagram API
INSTAGRAM_ACCESS_TOKEN=your-instagram-access-token-here
INSTAGRAM_USER_ID=your-instagram-user-id-here

# Facebook API
FACEBOOK_ACCESS_TOKEN=EAAUVzbp9bqsBPW3C8pK0CGzCoqSwj4nABJIGv3Y32pyQZB7TZCjvzqvng5FqrwMPV30ixEcvsIZBmFVDXlTodWQ6RXrYzZB7OZAuibkGHgqoAUGDC8r7xBC5oCaJYMQrCq824SNn6AvQuL14AEkM3ZBfMURmexT8jdvpFZCcFZAaUggzgsYxfEZBTbVnV1oGDasQX66eIQgegkiZCLNxNdZCS4JTvPqhbpc4j2fGY3AHZALkB8WKGSjVKed89NCELIcxvAZDZD
FACEBOOK_PAGE_ID=your-facebook-page-id-here
```

## 🔧 **API Permissions Required**

### YouTube API
- **API Key**: Already provided ✅
- **Permissions**: Public data only (no additional setup needed)

### Instagram API
- **App**: RN Landing-IG (ID: 759448650300994)
- **Permissions**: `instagram_basic`
- **Token Type**: User Access Token

### Facebook API
- **App**: RN Landing (ID: 2532849530385570)
- **Permissions**: `pages_read_engagement`
- **Token Type**: Page Access Token

## 🚀 **Testing**

1. **Start your server**: `npm start`
2. **Test the API**: Visit `http://localhost:3000/api/social-media/counts`
3. **Check the landing page**: The ticker should appear below the hero section

## 🐛 **Troubleshooting**

### Common Issues:

1. **"API key not configured"**
   - Check your `.env` file has the correct variable names
   - Restart your server after adding environment variables

2. **"Instagram API error: 400"**
   - Your access token may have expired
   - Generate a new User Access Token

3. **"Facebook API error: 403"**
   - Check your Page ID is correct
   - Ensure your access token has page permissions

4. **"YouTube API error: 403"**
   - Verify your Channel ID is correct
   - Check if your API key has quota remaining

## 📊 **Features**

- ✅ **Real-time counts** from all three platforms
- ✅ **Auto-refresh** every 5 minutes
- ✅ **Manual refresh** button
- ✅ **Error handling** with fallback to 0
- ✅ **Loading states** with spinners
- ✅ **Responsive design** for all devices
- ✅ **Formatted numbers** (1.2M, 150K, etc.)

## 🔄 **Next Steps**

1. Get your Channel ID and Page ID
2. Generate Instagram access token
3. Update your `.env` file
4. Restart your server
5. Test the live ticker!

The ticker will show live follower counts and automatically refresh every 5 minutes. Users can also manually refresh by clicking the "Refresh Counts" button.
