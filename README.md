# ecsmy.com

Company website for Elements Computer System. Static HTML on Cloudflare Pages, with a Pages Function that sends contact-form enquiries to Telegram (protected by Turnstile).

## Structure

```
public/
  index.html          Home page (all sections)
  retired.html        Notice for the retired blog/guide subdomains
  _redirects          Old Blogger URLs -> new pages
functions/api/contact.js   Contact form handler (Turnstile + Telegram)
wrangler.jsonc       Pages config (output dir = public)
```

## Editing

Edit `public/index.html` directly on GitHub. Every push to `main` redeploys automatically.

## Setup (one time)

1. **Pages project:** connected to this repo. Build command: none. Build output directory: `public` (also set by `wrangler.jsonc`).
2. **Secrets:** Pages project → Settings → Variables and Secrets: `TURNSTILE_SECRET`, `TG_BOT_TOKEN`, `TG_CHAT_ID`. Redeploy after adding them.
3. **Turnstile:** create a widget for `www.ecsmy.com` (and `ecsmy.pages.dev` for testing), put the site key in `index.html` (`YOUR_TURNSTILE_SITE_KEY`).
4. **Domain:** Pages project → Custom domains → add `www.ecsmy.com`. Add a Redirect Rule so `ecsmy.com` → `https://www.ecsmy.com`.
5. **Retired subdomains:** for `blog.ecsmy.com` and `guide.ecsmy.com`, create proxied DNS records (e.g. AAAA `100::`) and a Redirect Rule:
   hostname is in {blog.ecsmy.com guide.ecsmy.com} → `https://www.ecsmy.com/retired` (301).

## Cutover from Blogger

1. Move DNS for ecsmy.com to Cloudflare (keep existing records, check MX/email first).
2. Remove the Blogger CNAME for `www`, then add the custom domain in step 4.
3. In Blogger settings, remove the custom domain.
