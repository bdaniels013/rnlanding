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
- Video URLs
- Pricing information
- Calendly and Stripe links
- Lead capture webhook URL

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
