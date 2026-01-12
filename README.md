# ADH-Do

An ADHD-friendly task manager with AI-powered suggestions.

## Features

- 🧠 AI-powered task suggestions based on time, weather, and energy
- 🕳️ "The Void" - a cosmic staging area for unsorted tasks
- 📅 Smart sections: Today, Tomorrow, This Week, Later
- 🔥 Urgent task prioritization
- 🎯 Micro-step breakdowns for intimidating tasks
- 🌙 Evening mode with dark theme
- 🎉 Celebration animations on task completion

## Setup

### 1. Clone and Install

```bash
git clone https://github.com/YOUR_USERNAME/adhdo-app.git
cd adhdo-app
npm install
```

### 2. Set up Environment Variables

Create a `.env.local` file:

```
ANTHROPIC_API_KEY=your-api-key-here
```

Get your API key from [console.anthropic.com](https://console.anthropic.com)

### 3. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

1. Push to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repo
3. Add `ANTHROPIC_API_KEY` in Settings → Environment Variables
4. Deploy!

## Tech Stack

- Next.js 14
- React 18
- Lucide React icons
- Claude AI (Anthropic API)

## License

MIT
