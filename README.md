# Rich Nick Viral Growth Landing Page

A high-converting landing page for Rich Nick's viral growth coaching program. Built with React, Tailwind CSS, and Vite.

## Features

- 🎯 High-converting landing page design
- ⏰ 10-minute rolling countdown timer
- 📱 Responsive design for all devices
- 🎨 Modern glass UI with gradient effects
- 📊 Lead capture form with validation
- 💳 Stripe integration ready
- 📅 Calendly integration ready
- 🚀 Optimized for Vercel deployment

## Tech Stack

- **React 18** - UI framework
- **Tailwind CSS** - Styling
- **Vite** - Build tool
- **Lucide React** - Icons
- **Vercel** - Deployment platform

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd rnlanding
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:5173](http://localhost:5173) in your browser.

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Configuration

Edit the `SITE` object in `src/RichNickLanding.jsx` to customize:

- Brand name and messaging
- Video URLs (currently using placeholder - replace with actual Rich Nick YouTube video)
- Pricing information
- Calendly and Stripe links
- Lead capture webhook URL

### Rich Nick's Social Media Links (Already Added):
- YouTube: https://www.youtube.com/@richhnick
- Instagram: https://www.instagram.com/richhnick  
- Facebook: https://www.facebook.com/nick.burks.3

### To Add Rich Nick's Logo:
1. Save Rich Nick's logo as `public/rich-nick-logo.png`
2. Uncomment the logo line in `src/RichNickLanding.jsx` (around line 85)
3. Adjust size classes if needed

### To Add Rich Nick's YouTube Video:
1. Go to [Rich Nick's YouTube channel](https://www.youtube.com/@richhnick)
2. Choose a compelling video that showcases his content
3. Copy the video ID from the URL (e.g., from `https://www.youtube.com/watch?v=ABC123`, the ID is `ABC123`)
4. Replace `VIDEO_ID_HERE` in line 28 of `src/RichNickLanding.jsx` with the actual video ID
5. The final URL should look like: `https://www.youtube.com/embed/ABC123?autoplay=0&mute=1&controls=1`

## Deployment

This project is optimized for Vercel deployment. Simply connect your GitHub repository to Vercel and it will automatically build and deploy.

### Manual Deployment

1. Build the project:
```bash
npm run build
```

2. Deploy the `dist` folder to your hosting provider.

## Customization

### Colors and Styling

The design uses Tailwind CSS classes. Main color scheme:
- Primary: Indigo to Fuchsia gradient
- Background: Black to Slate gradients
- Text: White with opacity variations

### Content Updates

All content is in the `SITE` configuration object at the top of `src/RichNickLanding.jsx`. Update these values to match your brand and offerings.

## License

MIT License - see LICENSE file for details.

## Support

For questions or support, contact Rich Nick directly.
