# ecsmy.com

Company website for Elements Computer System. Static HTML served by a Cloudflare Worker, with a contact form that sends enquiries to Telegram (protected by Turnstile).

## Structure

```
public/
  index.html     Home page (all sections)
  retired.html   Notice for the retired blog/guide subdomains
  _redirects     Old Blogger URLs -> new pages
src/worker.js    Contact form handler (Turnstile + Telegram)
wrangler.jsonc   Worker config
```

## Editing

Text changes: edit `public/index.html` directly on GitHub. Pushing to `main` redeploys automatically (once connected below).

## Setup (one time)

1. **Connect the repo:** Cloudflare dashboard → Workers & Pages → Create → Import a repository → pick this repo. Build command: none. Deploy command: `npx wrangler deploy`.
2. **Secrets:** in the Worker's Settings → Variables and Secrets, add `TURNSTILE_SECRET`, `TG_BOT_TOKEN`, `TG_CHAT_ID`.
3. **Turnstile:** create a widget for `www.ecsmy.com`, put the site key in `index.html` (`YOUR_TURNSTILE_SITE_KEY`).
4. **Domain:** Worker → Settings → Domains & Routes → add custom domain `www.ecsmy.com` (and `ecsmy.com` redirecting to www).
5. **Retired subdomains:** add `blog.ecsmy.com` and `guide.ecsmy.com` as custom domains on the same Worker. The Worker redirects both to `/retired`.
   (Alternative: a Cloudflare Redirect Rule per hostname → `https://www.ecsmy.com/retired`.)

## Cutover from Blogger

1. Move DNS for ecsmy.com to Cloudflare (keep existing records, check MX/email first).
2. Remove the Blogger CNAME for `www`, then add the custom domain in step 4.
3. In Blogger settings, remove the custom domain.
