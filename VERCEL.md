# Vercel deployment

The repository uses vinext, not the Next.js build command. `vercel.json` selects
`npm run build:vercel`, which builds a Nitro Vercel function and the static assets
in `.vercel/output`. The root directory in Vercel must be the repository root.
Node.js 24 is recommended. Pushes to `main` trigger the connected Vercel project.

The existing Cloudflare build remains available through `npm run build` outside
Vercel. Do not serve `dist/client` as a static-only app: the application requires
server routing for `/`, `/conversation/preview`, and `/student/ai-conversation`.

## Calendar database

Oral Production uses browser storage and needs no database credentials. Calendar
operations use D1. On Vercel, configure these **server-only** environment variables:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_D1_DATABASE_ID`
- `CLOUDFLARE_D1_API_TOKEN` with D1 permissions for that database

Use the existing database only if it is accessible in your Cloudflare account;
a database managed by the previous hosting provider may require an export and
migration. This change does not copy or reset that database. No credentials are
stored in Git. Without configuration, the dashboard still renders, but calendar
requests fail explicitly rather than claiming to save data. Apply the existing
`drizzle` migrations when provisioning a new D1 database.

## Validation

```sh
npm ci
npm run build:vercel
node --test tests/oral-production.test.mjs tests/vercel-deployment.test.mjs
```
