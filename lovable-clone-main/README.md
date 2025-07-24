# Lovable Clone

This project demonstrates generating a Next.js site using the Claude Code SDK and running it inside a Daytona sandbox.

## Getting Started

1. Copy `.env.example` to `.env` and add your API keys.
2. Install dependencies and run the Next.js app.

```bash
cp .env.example .env
cd lovable-ui
npm install
npm run dev
```

The app starts on [http://localhost:3000](http://localhost:3000).

### Daytona Scripts

Utilities for managing sandboxes live in `lovable-ui/scripts`.

```bash
# Generate a site in a new sandbox
npx tsx scripts/generate-in-daytona.ts "Build a marketing site"

# Get a running preview URL
npx tsx scripts/get-preview-url.ts <sandbox-id>
```

See the `examples/` folder for additional sample files and tests.

### Linting & Tests

```bash
npm run lint
npm test
```

## Environment Variables

```
ANTHROPIC_API_KEY=your_anthropic_api_key
DAYTONA_API_KEY=your_daytona_api_key
```

## License

MIT
