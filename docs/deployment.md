# Deployment

OpenMaintainer is a Next.js application. Vercel is the recommended host because the app uses Route Handlers for repository analysis and optional OpenAI analysis.

Current deployment:

- Live preview: https://openmaintainer.vercel.app
- Vercel project: `meicun/openmaintainer`

## Preview deployment

Run:

```bash
npx vercel deploy -y
```

If the CLI reports `No existing credentials found`, complete the one-time Vercel login:

```bash
npx vercel login
```

Then run the preview deploy again:

```bash
npx vercel deploy -y
```

## Production deployment

Only after the preview is verified:

```bash
npx vercel deploy --prod -y
```

## Environment variables

The app works without credentials, but production deployments can set:

```bash
GITHUB_TOKEN=
OPENAI_API_KEY=
OPENMAINTAINER_MODEL=gpt-5.4-mini
```

## Deployment acceptance

- Home page loads
- Demo mode works without credentials
- `/api/repository?repo=demo` returns JSON analysis
- `/api/analyze` returns deterministic fallback when no OpenAI key is configured
- README is updated with the live preview URL
