// Cloudflare Pages Function: POST /api/contact
// Verify Turnstile -> send enquiry to Telegram.
//
// Secrets (Pages project > Settings > Variables and Secrets):
//   TURNSTILE_SECRET   - Turnstile secret key
//   TG_BOT_TOKEN       - Telegram bot token
//   TG_CHAT_ID         - chat/group ID that receives enquiries

export async function onRequestPost({ request, env }) {
  const missing = ["TURNSTILE_SECRET", "TG_BOT_TOKEN", "TG_CHAT_ID"].filter((k) => !env[k]);
  if (missing.length) return new Response(`Server not configured, missing: ${missing.join(", ")}`, { status: 500 });

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
  if (!result.success) {
    return new Response(`Bot check failed: ${(result["error-codes"] || []).join(", ")}`, { status: 403 });
  }

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
  if (!tg.ok) {
    const detail = await tg.json().catch(() => ({}));
    return new Response(
      `Telegram error: ${detail.description || tg.status} (chat_id used: ${JSON.stringify(env.TG_CHAT_ID)})`,
      { status: 502 }
    );
  }

  return new Response("OK");
}
