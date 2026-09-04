// src/lib/email.ts

/**
 * Simple email sending utility.
 * Supports SendGrid (default) or generic webhook (e.g., Mailgun).
 * Configuration is read from environment variables in wrangler.toml.
 */
export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}): Promise<{ success: boolean; error?: string }> {
  const provider = (process.env.EMAIL_PROVIDER || "sendgrid").toLowerCase();
  const from = params.from ?? process.env.EMAIL_FROM ?? "no-reply@double7logistics.com";

  try {
    if (provider === "sendgrid") {
      const apiKey = process.env.SENDGRID_API_KEY;
      if (!apiKey) throw new Error("SENDGRID_API_KEY not set");
      const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: params.to }] }],
          from: { email: from },
          subject: params.subject,
          content: [{ type: "text/html", value: params.html }],
        }),
      });
      if (!response.ok) {
        const txt = await response.text();
        throw new Error(`SendGrid error ${response.status}: ${txt}`);
      }
      return { success: true };
    }
    // Fallback: generic webhook URL (e.g., Mailgun HTTP API)
    const webhookUrl = process.env.EMAIL_WEBHOOK_URL;
    if (!webhookUrl) throw new Error("Unsupported email provider and no webhook configured");
    const resp = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: params.to,
        subject: params.subject,
        html: params.html,
      }),
    });
    if (!resp.ok) {
      const txt = await resp.text();
      throw new Error(`Webhook error ${resp.status}: ${txt}`);
    }
    return { success: true };
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    return { success: false, error: err };
  }
}
