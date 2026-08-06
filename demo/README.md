# RampKit LATAM — Demo App

The reference application for [RampKit LATAM](../README.md), deployed at
**[rampkit-latam.vercel.app](https://rampkit-latam.vercel.app)**. Built with Next.js 16 (App
Router) and consuming `rampkit-latam-core` and `rampkit-latam-ui` through the npm workspace.

## Running it

From the repository root:

```bash
npm install
npm run build     # the demo imports the workspace packages' build output
npm run dev       # http://localhost:3000
```

No configuration is required. Anchor sandboxes reject the placeholder keys and the SDK falls
back to simulated quotes, so every screen works on a clean clone. Supply real credentials in
`.env` (`ETHERFUSE_API_KEY`, `MANTECA_API_KEY`, `KOYWE_API_KEY`) to hit the live sandboxes.

## Routes

| Route | What it shows |
|---|---|
| `/` | Landing page — problem, solution, and corridor coverage, in PT/ES/EN |
| `/playground` | `<RampWidget />` and `<SavingsWidget />` side by side |
| `/remittance` | Cross-border corridors with the full two-leg settlement breakdown |

## API routes

Server-side handlers keep anchor API keys off the client. All four share one `RampRouter`
instance from [`src/app/api/router.ts`](src/app/api/router.ts).

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/quotes` | POST | Parallel quotes across configured anchors |
| `/api/ramp` | POST / GET | Execute an order; poll its status |
| `/api/assets` | GET | Tokenized assets exposed by the anchors |
| `/api/remittance` | POST / GET | Quote and execute a two-leg remittance; list corridors |

## Localization

Language is held in [`LanguageContext`](src/context/LanguageContext.tsx) and persisted to
`localStorage`. Because the provider defers render until it has read that value, pages are
client-rendered — view source will show an empty shell, which is expected rather than a bug.

Portuguese uses `pt-BR` number formatting throughout, so amounts render as `1.632,52`.
