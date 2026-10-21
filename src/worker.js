// Cloudflare Worker: serves the static site and handles the contact form.
// Contact flow: verify Turnstile -> send message to Telegram.
//
// Secrets (set with `npx wrangler secret put <NAME>`):
//   TURNSTILE_SECRET   - Turnstile secret key
//   TG_BOT_TOKEN       - Telegram bot token
//   TG_CHAT_ID         - chat/group ID that receives enquiries

const RETIRED_HOSTS = ["blog.ecsmy.com", "guide.ecsmy.com"];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Old subdomains (if routed to this Worker) all land on the retired notice
    if (RETIRED_HOSTS.includes(url.hostname)) {
      return Response.redirect("https://www.ecsmy.com/retired", 301);
    }

    if (url.pathname === "/api/contact") {
      if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
      return handleContact(request, env);
    }

    // Everything else: static files from /public (including _redirects)
    return env.ASSETS.fetch(request);
  },
};

async function handleContact(request, env) {
  const form = await request.formData();
  const field = (k, max = 2000) => String(form.get(k) || "").trim().slice(0, max);

  const name = field("name", 200);
  const email = field("email", 200);
  const message = field("message");
  if (!name || !email || !message) return new Response("Missing fields", { status: 400 });

  // 1. Verify Turnstile
  const verify = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: new URLSearchParams({
      secret: env.TURNSTILE_SECRET,
      response: field("cf-turnstile-response"),
      remoteip: request.headers.get("CF-Connecting-IP") || "",
    }),
  });
  const result = await verify.json();
  if (!result.success) return new Response("Bot check failed", { status: 403 });

  // 2. Send to Telegram
  const text = [
    "📩 New enquiry from ecsmy.com",
    `Name: ${name}`,
    `Company: ${field("company", 200) || "-"}`,
    `Email: ${email}`,
    `Phone: ${field("phone", 50) || "-"}`,
    "",
    message,
  ].join("\n");

  const tg = await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: env.TG_CHAT_ID, text }),
  });
  if (!tg.ok) return new Response("Could not deliver message", { status: 502 });

  return new Response("OK");
}
