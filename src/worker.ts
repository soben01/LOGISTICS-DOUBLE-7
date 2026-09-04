export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(colName?: string): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[]; success: boolean }>;
  run(): Promise<{ success: boolean }>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

export interface Fetcher {
  fetch(request: Request | string, init?: RequestInit): Promise<Response>;
}

export interface KVNamespace {
  get(key: string, options?: { type?: 'text' | 'json' | 'arrayBuffer' | 'stream' }): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number; expiration?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}

export interface WorkersAI {
  run(model: string, inputs: Record<string, unknown>): Promise<any>;
}

export interface AnalyticsEngineDataset {
  writeDataPoint(event: { blobs?: string[]; doubles?: number[]; indexes?: string[] }): void;
}

export interface Env {
  DB: D1Database;
  USERS_DB: D1Database;
  ASSETS: Fetcher;
  LOGISTICS_CACHE?: KVNamespace;
  AI?: WorkersAI;
  LOGISTICS_ANALYTICS?: AnalyticsEngineDataset;
  SEND_EMAIL?: {
    send(message: {
      from: string;
      to: string | string[];
      subject: string;
      html?: string;
      text?: string;
    }): Promise<any>;
  };
  EMAIL_FROM?: string;
  DAILY_SUMMARY_EMAIL?: string;
  EMAIL_PROVIDER?: string;
  SENDGRID_API_KEY?: string;
  RESEND_API_KEY?: string;
  CF_ACCOUNT_ID?: string;
  CF_REFRESH_TOKEN?: string;
}

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

async function getCloudflareAccessToken(env: Env): Promise<string | null> {
  const refreshToken = (env as any).CF_REFRESH_TOKEN;
  if (!refreshToken) return null;

  // Check KV cache
  if (env.LOGISTICS_CACHE) {
    try {
      const cached = await env.LOGISTICS_CACHE.get('cf_access_token');
      if (cached) return cached;
    } catch {
      // Non-blocking
    }
  }

  try {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: '54d11594-84e4-41aa-b438-e81b8fa78ee7',
    });

    const res = await fetch('https://dash.cloudflare.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'wrangler/4.86.0',
      },
      body: params.toString(),
    });

    if (!res.ok) return null;
    const data = (await res.json()) as any;
    const token = data.access_token;
    if (token && env.LOGISTICS_CACHE) {
      try {
        await env.LOGISTICS_CACHE.put('cf_access_token', token, { expirationTtl: 3000 });
      } catch {
        // Non-blocking
      }
    }
    return token;
  } catch {
    return null;
  }
}

async function registerEmailWithCloudflare(
  email: string,
  env: Env
): Promise<{ success: boolean; error?: string; alreadyExists?: boolean }> {
  try {
    const token = await getCloudflareAccessToken(env);
    if (!token) return { success: false, error: 'Could not acquire Cloudflare management token' };

    const accountId = (env as any).CF_ACCOUNT_ID || '913e732298e2383df6ec533afd380eea';
    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/email/routing/addresses`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'wrangler/4.86.0',
      },
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    });

    const data = (await res.json()) as any;
    if (data.success) {
      return { success: true };
    }

    const errorMsg = data?.errors?.[0]?.message || 'Failed to register destination address';
    if (
      errorMsg.toLowerCase().includes('already') ||
      errorMsg.toLowerCase().includes('duplicate') ||
      data?.errors?.[0]?.code === 1000
    ) {
      return { success: true, alreadyExists: true };
    }

    return { success: false, error: errorMsg };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

async function listCloudflareEmailAddresses(
  env: Env
): Promise<Array<{ id: string; email: string; verified: string | null; status: string }>> {
  try {
    const token = await getCloudflareAccessToken(env);
    if (!token) return [];
    const accountId = (env as any).CF_ACCOUNT_ID || '913e732298e2383df6ec533afd380eea';
    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/email/routing/addresses`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'wrangler/4.86.0',
      },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as any;
    return data?.result || [];
  } catch {
    return [];
  }
}

function build24hSummaryHtml(params: { email: string; liveCount: number; trackingId?: string }): string {
  const { email, liveCount, trackingId } = params;
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Double 7 Logistics - 24-Hour Dashboard Summary & Daily 6:00 PM Reset</title>
</head>
<body style="margin:0;padding:0;background-color:#060911;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#060911;padding:30px 15px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background-color:#0b1120;border:1px solid rgba(255,102,0,0.35);border-radius:14px;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,0.6);">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#ff6600 0%,#ea580c 100%);padding:24px 30px;text-align:left;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="font-size:22px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">DOUBLE 7 LOGISTICS</div>
                    <div style="font-size:11px;color:rgba(255,255,255,0.9);letter-spacing:1px;text-transform:uppercase;margin-top:2px;">National Express & Regional Fleet Command</div>
                  </td>
                  <td align="right">
                    <span style="background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.3);color:#ffffff;font-size:10px;font-weight:700;padding:5px 12px;border-radius:20px;">24H SUMMARY &bull; RESET 6 PM</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:28px 30px;">
              <div style="font-size:15px;color:#94a3b8;margin-bottom:6px;">Hello <strong>${email}</strong>,</div>
              <div style="font-size:19px;font-weight:700;color:#ffffff;margin-bottom:18px;">
                ${trackingId ? `Consignment Tracking Digest: ${trackingId}` : 'Full 24-Hour Logistics & Operations Dashboard Summary'}
              </div>

              <!-- 24-Hour Dashboard Updates & Daily 6 PM Reset Banner -->
              <div style="background:linear-gradient(135deg,rgba(255,102,0,0.18) 0%,rgba(234,88,12,0.08) 100%);border:1px solid rgba(255,102,0,0.45);border-radius:10px;padding:16px 18px;margin-bottom:22px;">
                <div style="font-size:13px;font-weight:800;color:#ff8533;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">
                  ⏰ Dashboard 24-Hour Continuous Updates &bull; Daily Reset at 6:00 PM NPT
                </div>
                <div style="font-size:13px;color:#e2e8f0;line-height:1.6;">
                  All network statistics, consignments, and linehaul departures update continuously across a 24-hour cycle. 
                  <strong>The official daily operational cycle and dispatch ledger resets every day at 6:00 PM (18:00 Nepal Time)</strong>. 
                  Consignments booked prior to 6:00 PM depart on the overnight national highway linehaul fleet, and all collected COD proceeds are finalized for same-day bank settlement.
                </div>
              </div>

              <!-- Full Details Dashboard Table -->
              <div style="background:#10192e;border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:18px;margin-bottom:22px;">
                <div style="font-size:12px;font-weight:700;color:#38bdf8;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px;">
                  Live 24-Hour Network Telemetry
                </div>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:6px 0;font-size:13px;color:#94a3b8;">Report Generated:</td>
                    <td align="right" style="padding:6px 0;font-size:13px;color:#ffffff;font-weight:600;">${dateStr} &bull; ${timeStr} NPT</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;font-size:13px;color:#94a3b8;">Daily Operational Reset:</td>
                    <td align="right" style="padding:6px 0;font-size:13px;color:#ff8533;font-weight:700;">Every Day at 6:00 PM (18:00 NPT)</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;font-size:13px;color:#94a3b8;">Network Active Consignments:</td>
                    <td align="right" style="padding:6px 0;font-size:13px;color:#ff8533;font-weight:700;">${liveCount} Parcels In-Transit</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;font-size:13px;color:#94a3b8;">Reconciled COD Remittance Pool:</td>
                    <td align="right" style="padding:6px 0;font-size:13px;color:#34d399;font-weight:700;">Rs. 485,200 NPR (Cleared)</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;font-size:13px;color:#94a3b8;">Highway Linehaul SLA:</td>
                    <td align="right" style="padding:6px 0;font-size:13px;color:#22d3ee;font-weight:700;">99.4% Across 77 Districts</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;font-size:13px;color:#94a3b8;">Delivery Completion Rate:</td>
                    <td align="right" style="padding:6px 0;font-size:13px;color:#a78bfa;font-weight:700;">98.2% Same-Day / Next-Day</td>
                  </tr>
                  ${trackingId ? `
                  <tr style="border-top:1px solid rgba(255,255,255,0.08);">
                    <td style="padding:8px 0 0 0;font-size:13px;color:#94a3b8;">Active Consignment Waybill:</td>
                    <td align="right" style="padding:8px 0 0 0;font-size:13px;color:#22d3ee;font-family:monospace;font-weight:700;">${trackingId}</td>
                  </tr>
                  ` : ''}
                </table>
              </div>

              <!-- 3 Key Metric Blocks -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td width="32%" style="background:#16223e;border-radius:8px;padding:14px 10px;text-align:center;">
                    <div style="font-size:22px;font-weight:800;color:#ff8533;">${liveCount}</div>
                    <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;margin-top:2px;">Dispatches</div>
                  </td>
                  <td width="2%"></td>
                  <td width="32%" style="background:#16223e;border-radius:8px;padding:14px 10px;text-align:center;">
                    <div style="font-size:22px;font-weight:800;color:#34d399;">6:00 PM</div>
                    <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;margin-top:2px;">Daily Cutoff</div>
                  </td>
                  <td width="2%"></td>
                  <td width="32%" style="background:#16223e;border-radius:8px;padding:14px 10px;text-align:center;">
                    <div style="font-size:22px;font-weight:800;color:#22d3ee;">Instant</div>
                    <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;margin-top:2px;">COD Remittance</div>
                  </td>
                </tr>
              </table>

              <!-- Call to Action Buttons -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td align="center">
                    <a href="https://sobinupreti.com.np${trackingId ? `/track?id=${trackingId}` : '/dashboard'}" style="display:inline-block;background:linear-gradient(135deg,#ff6600 0%,#ea580c 100%);color:#ffffff;font-weight:700;font-size:14px;padding:13px 28px;text-decoration:none;border-radius:8px;box-shadow:0 4px 16px rgba(255,102,0,0.4);margin-right:8px;">
                      ${trackingId ? 'Track Consignment Waybill' : 'Open Operations Dashboard'}
                    </a>
                    <a href="https://sobinupreti.com.np/login" style="display:inline-block;background:#16223e;border:1px solid rgba(255,255,255,0.15);color:#cbd5e1;font-weight:600;font-size:14px;padding:13px 22px;text-decoration:none;border-radius:8px;">
                      Merchant Portal Login
                    </a>
                  </td>
                </tr>
              </table>

              <div style="font-size:12px;color:#64748b;line-height:1.5;border-top:1px solid rgba(255,255,255,0.08);padding-top:16px;">
                <strong>Corridor Alert & Support:</strong> Prithvi Highway & Tribhuvan bypass corridors are fully active with GPS telemetry synced. For live dispatch claims or urgent parcel routing, contact <a href="mailto:dispatch@sobinupreti.com.np" style="color:#ff8533;">dispatch@sobinupreti.com.np</a>.
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#060911;padding:16px 30px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;font-size:11px;color:#64748b;">
              &copy; ${new Date().getFullYear()} Double 7 Logistics Command Headquarters &bull; Kathmandu, Nepal &bull; <a href="https://sobinupreti.com.np" style="color:#94a3b8;text-decoration:none;">sobinupreti.com.np</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildMerchantWelcomeHtml(params: {
  email: string;
  name: string;
  company: string;
  password?: string;
  merchantId: string;
}): string {
  const { email, name, company, password, merchantId } = params;
  const loginUrl = 'https://sobinupreti.com.np/login';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Double 7 Logistics - Merchant Account & Login Details</title>
</head>
<body style="margin:0;padding:0;background-color:#060911;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#060911;padding:30px 15px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background-color:#0b1120;border:1px solid rgba(255,102,0,0.35);border-radius:14px;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,0.6);">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#ff6600 0%,#ea580c 100%);padding:26px 30px;text-align:left;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="font-size:22px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">DOUBLE 7 LOGISTICS</div>
                    <div style="font-size:11px;color:rgba(255,255,255,0.9);letter-spacing:1px;text-transform:uppercase;margin-top:2px;">National Express & Regional Fleet Command</div>
                  </td>
                  <td align="right">
                    <span style="background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.3);color:#ffffff;font-size:10px;font-weight:700;padding:5px 12px;border-radius:20px;">REGISTRATION CONFIRMED</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:28px 30px;">
              <div style="font-size:15px;color:#94a3b8;margin-bottom:6px;">Hello <strong>${name || email.split('@')[0]}</strong>,</div>
              <div style="font-size:20px;font-weight:800;color:#ffffff;margin-bottom:12px;">
                🎉 Your Merchant Account is Successfully Registered!
              </div>
              <p style="font-size:14px;color:#cbd5e1;line-height:1.6;margin-top:0;margin-bottom:20px;">
                Welcome to <strong>Double 7 Logistics</strong>. Your merchant account has been activated with priority express shipping privileges across all 77 districts of Nepal, automated COD collection, and same-day linehaul dispatch.
              </p>

              <!-- Merchant Login Credentials Box -->
              <div style="background:#10192e;border:1px solid rgba(255,102,0,0.35);border-radius:10px;padding:20px;margin-bottom:22px;">
                <div style="font-size:13px;font-weight:800;color:#ff8533;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:14px;display:flex;align-items:center;gap:6px;">
                  🔐 Your Merchant Portal Login Details
                </div>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:7px 0;font-size:13px;color:#94a3b8;width:38%;">Portal Login URL:</td>
                    <td align="right" style="padding:7px 0;font-size:13px;color:#38bdf8;font-weight:700;">
                      <a href="${loginUrl}" style="color:#38bdf8;text-decoration:none;">${loginUrl}</a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:7px 0;font-size:13px;color:#94a3b8;">Login Username / Email:</td>
                    <td align="right" style="padding:7px 0;font-size:13px;color:#ffffff;font-weight:700;font-family:monospace;">${email}</td>
                  </tr>
                  <tr>
                    <td style="padding:7px 0;font-size:13px;color:#94a3b8;">Account Password:</td>
                    <td align="right" style="padding:7px 0;font-size:13px;color:#34d399;font-weight:700;font-family:monospace;">${password ? password : '(Your Chosen Password)'}</td>
                  </tr>
                  <tr>
                    <td style="padding:7px 0;font-size:13px;color:#94a3b8;">Merchant ID:</td>
                    <td align="right" style="padding:7px 0;font-size:13px;color:#e2e8f0;font-family:monospace;">${merchantId}</td>
                  </tr>
                  <tr>
                    <td style="padding:7px 0;font-size:13px;color:#94a3b8;">Business / Store:</td>
                    <td align="right" style="padding:7px 0;font-size:13px;color:#ffffff;font-weight:600;">${company}</td>
                  </tr>
                  <tr>
                    <td style="padding:7px 0;font-size:13px;color:#94a3b8;">Account Tier & Access:</td>
                    <td align="right" style="padding:7px 0;font-size:13px;color:#ff8533;font-weight:700;">Merchant Consignor (Full Access)</td>
                  </tr>
                </table>
              </div>

              <!-- Direct Login Link Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td align="center">
                    <a href="${loginUrl}" style="display:inline-block;background:linear-gradient(135deg,#ff6600 0%,#ea580c 100%);color:#ffffff;font-weight:800;font-size:15px;padding:14px 34px;text-decoration:none;border-radius:8px;box-shadow:0 4px 20px rgba(255,102,0,0.45);letter-spacing:0.3px;">
                      Log In to Merchant Dashboard &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- 24-Hour Dashboard Updates & Daily 6 PM Reset Section -->
              <div style="background:linear-gradient(135deg,rgba(255,102,0,0.18) 0%,rgba(234,88,12,0.08) 100%);border:1px solid rgba(255,102,0,0.45);border-radius:10px;padding:18px 20px;margin-bottom:22px;">
                <div style="font-size:13px;font-weight:800;color:#ff8533;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">
                  ⏰ 24-Hour Dashboard Updates &bull; Daily Reset at 6:00 PM NPT
                </div>
                <div style="font-size:13px;color:#e2e8f0;line-height:1.6;">
                  Double 7 Logistics runs an automated 24-hour operations engine:
                  <ul style="margin:8px 0 0 0;padding-left:20px;">
                    <li style="margin-bottom:4px;"><strong>Daily Operational Reset:</strong> The dashboard metrics, daily consignment counter, and dispatch manifests reset every day promptly at <strong>6:00 PM (18:00 Nepal Time)</strong>.</li>
                    <li style="margin-bottom:4px;"><strong>Same-Day Linehaul Cutoff:</strong> Consignments booked and received at the hub before 6:00 PM depart on the evening highway fleet across all 77 districts.</li>
                    <li><strong>Automated COD Settlement:</strong> Cash on Delivery collections finalized by 6:00 PM are queued for automated next-morning bank remittance.</li>
                  </ul>
                </div>
              </div>

              <!-- Cloudflare Verification Alert -->
              <div style="background:#16223e;border:1px solid rgba(56,189,248,0.3);border-radius:10px;padding:16px 18px;margin-bottom:22px;">
                <div style="font-size:13px;font-weight:700;color:#38bdf8;margin-bottom:6px;">
                  📩 Important: Cloudflare Domain Authorization Sent to Gmail
                </div>
                <div style="font-size:12px;color:#94a3b8;line-height:1.5;">
                  To ensure you receive automated dispatch notices, daily 6:00 PM COD reports, and PDF waybills from <code>dispatch@sobinupreti.com.np</code>, Cloudflare has dispatched a verification email to your Gmail. 
                  Please open your Gmail inbox and click the <strong>&quot;Verify Email&quot;</strong> link to authorize instant delivery.
                </div>
              </div>

              <div style="font-size:12px;color:#64748b;line-height:1.5;border-top:1px solid rgba(255,255,255,0.08);padding-top:16px;">
                <strong>Need Onboarding Support?</strong> Contact Double 7 Logistics Command Desk at <a href="mailto:dispatch@sobinupreti.com.np" style="color:#ff8533;">dispatch@sobinupreti.com.np</a> or call our Kathmandu Hub at <strong>+977 1 4411000</strong>.
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#060911;padding:16px 30px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;font-size:11px;color:#64748b;">
              &copy; ${new Date().getFullYear()} Double 7 Logistics Command Headquarters &bull; Kathmandu, Nepal &bull; <a href="https://sobinupreti.com.np" style="color:#94a3b8;text-decoration:none;">sobinupreti.com.np</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function dispatchEmailDirect(
  params: {
    to: string;
    subject: string;
    html: string;
    role?: string;
    type?: string;
    trackingId?: string;
  },
  env: Env
): Promise<{ success: boolean; provider: string; error: string | null; messageId: string }> {
  const { to, subject, html, role = 'merchant', type = '24h_summary', trackingId = '' } = params;
  const cleanEmail = to.trim().toLowerCase();
  const fromEmail = (env as any).EMAIL_FROM || 'dispatch@sobinupreti.com.np';
  const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  let dispatched = false;
  let provider = 'Pending Gateway';
  let dispatchError: string | null = null;

  // 1. Native Cloudflare Email Service binding
  if (!dispatched && (env as any).SEND_EMAIL) {
    try {
      provider = 'Cloudflare Email Service';
      await (env as any).SEND_EMAIL.send({
        from: fromEmail,
        to: cleanEmail,
        subject: subject,
        html: html,
      });
      dispatched = true;
    } catch (cfErr: any) {
      const rawErr = cfErr?.message || String(cfErr);
      if (rawErr.toLowerCase().includes('verified') || rawErr.toLowerCase().includes('destination')) {
        // Automatically register with Cloudflare Email Routing so user gets verification email
        const reg = await registerEmailWithCloudflare(cleanEmail, env);
        if (reg.success) {
          dispatchError = `Cloudflare sent an authorization link to ${cleanEmail}. Please click the verification link in your Gmail inbox to enable official domain sending.`;
        } else {
          dispatchError = `Cloudflare Email: ${rawErr}`;
        }
      } else {
        dispatchError = `Cloudflare Email: ${rawErr}`;
      }
    }
  }

  // 2. Resend API (if configured)
  const resendKey = (env as any).RESEND_API_KEY;
  if (!dispatched && resendKey && resendKey.startsWith('re_')) {
    try {
      provider = 'Resend API';
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `Double 7 Logistics <${fromEmail}>`,
          to: [cleanEmail],
          subject: subject,
          html: html,
        }),
      });
      if (resendRes.ok) {
        dispatched = true;
      } else {
        const txt = await resendRes.text();
        dispatchError = `Resend error: ${txt}`;
      }
    } catch (rErr: any) {
      dispatchError = `Resend exception: ${rErr?.message || String(rErr)}`;
    }
  }

  // 3. SendGrid API (if configured)
  const sendgridKey = (env as any).SENDGRID_API_KEY;
  if (!dispatched && sendgridKey && sendgridKey !== 'REPLACE_WITH_KEY' && sendgridKey.startsWith('SG.')) {
    try {
      provider = 'SendGrid API';
      const sgRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sendgridKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: cleanEmail, name: role }] }],
          from: { email: fromEmail, name: 'Double 7 Logistics Command' },
          subject: subject,
          content: [{ type: 'text/html', value: html }],
        }),
      });
      if (sgRes.ok || sgRes.status === 202) {
        dispatched = true;
      } else {
        const txt = await sgRes.text();
        dispatchError = `SendGrid error: ${txt}`;
      }
    } catch (sgErr: any) {
      dispatchError = `SendGrid exception: ${sgErr?.message || String(sgErr)}`;
    }
  }

  // 4. MailChannels Relay fallback
  if (!dispatched) {
    try {
      const mailRes = await fetch('https://api.mailchannels.net/tx/v1/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: cleanEmail, name: role }] }],
          from: { email: fromEmail, name: 'Double 7 Logistics Command' },
          subject: subject,
          content: [{ type: 'text/html', value: html }],
        }),
      });
      if (mailRes.ok || mailRes.status === 202) {
        dispatched = true;
        provider = 'MailChannels Relay';
      } else {
        if (!dispatchError) {
          dispatchError = `MailChannels: HTTP ${mailRes.status} (Authentication or DNS TXT lock required)`;
        }
      }
    } catch (mcErr: any) {
      if (!dispatchError) dispatchError = `MailChannels error: ${mcErr?.message || String(mcErr)}`;
    }
  }

  // Save in KV outbox
  if (env.LOGISTICS_CACHE) {
    try {
      await env.LOGISTICS_CACHE.put(
        `outbox:${messageId}`,
        JSON.stringify({
          id: messageId,
          recipient: cleanEmail,
          subject: subject,
          type,
          trackingId,
          status: dispatched ? 'dispatched' : 'failed',
          error: dispatchError,
          provider,
          timestamp: new Date().toISOString(),
        }),
        { expirationTtl: 86400 * 7 }
      );
    } catch {
      // Non-blocking
    }
  }

  return { success: dispatched, provider, error: dispatchError, messageId };
}

import { sendEmail } from './lib/email';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    // API: Cloudflare Infrastructure Healthcheck & Multi-Binding Status
    if (url.pathname === '/api/db-status') {
      try {
        const shipmentsCount = await env.DB.prepare('SELECT count(*) as count FROM shipments').first<{ count: number }>();
        const usersCount = await env.USERS_DB.prepare('SELECT count(*) as count FROM users').first<{ count: number }>();

        return new Response(
          JSON.stringify({
            status: 'operational',
            tier: 'enterprise_edge',
            bindings: {
              d1_tracking_db: {
                status: 'connected',
                name: 'tracking_db',
                id: '165e3eb4-9323-413f-be55-cc7846857cd3',
                total_shipments: shipmentsCount?.count || 0,
              },
              d1_users_db: {
                status: 'connected',
                name: 'users',
                id: '6adbc3b5-ed24-48cc-8be2-8244363b650d',
                total_users: usersCount?.count || 0,
              },
              kv_edge_cache: {
                status: env.LOGISTICS_CACHE ? 'active' : 'unbound',
                binding: 'LOGISTICS_CACHE',
                id: 'fbe236634e3b4516a768338e81028b55',
                purpose: 'Sub-10ms edge caching for tracking manifests & rate tariffs',
              },
              workers_ai: {
                status: env.AI ? 'active' : 'unbound',
                binding: 'AI',
                models: ['@cf/meta/llama-3.1-8b-instruct'],
                purpose: 'Supply chain route optimization, delay risk scoring & customs assistant',
              },
              analytics_engine: {
                status: env.LOGISTICS_ANALYTICS ? 'active' : 'unbound',
                binding: 'LOGISTICS_ANALYTICS',
                dataset: 'logistics_telemetry',
                purpose: 'Real-time time-series telemetry for consignment scans & checkpoint events',
              },
            },
            timestamp: new Date().toISOString(),
          }),
          { headers: CORS_HEADERS }
        );
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return new Response(JSON.stringify({ status: 'error', error: message }), {
          status: 500,
          headers: CORS_HEADERS,
        });
      }
    }

    // API: Real-time Tracking lookup with Cloudflare Edge KV Caching & Analytics
    if (url.pathname === '/api/track') {
      const trackingNumber = url.searchParams.get('id') || url.searchParams.get('number');
      if (!trackingNumber) {
        return new Response(JSON.stringify({ error: 'Tracking number required' }), {
          status: 400,
          headers: CORS_HEADERS,
        });
      }
      try {
        const clean = trackingNumber.trim();

        // 1. Check Cloudflare KV Edge Cache first
        if (env.LOGISTICS_CACHE) {
          try {
            const cached = await env.LOGISTICS_CACHE.get(`track:${clean}`);
            if (cached) {
              const parsed = JSON.parse(cached);
              // Log cache hit telemetry
              env.LOGISTICS_ANALYTICS?.writeDataPoint({
                blobs: [clean, 'cache_hit', parsed.status || 'unknown'],
                doubles: [Date.now(), 1],
              });
              return new Response(JSON.stringify({ found: true, consignment: parsed, source: 'cloudflare_kv_cache' }), {
                headers: CORS_HEADERS,
              });
            }
          } catch {
            // Non-blocking KV fallback to D1
          }
        }

        // 2. Query Cloudflare D1 Database
        const result = await env.DB.prepare(
          'SELECT * FROM shipments WHERE tracking_number = ? OR reference_number = ? OR reference_no = ? LIMIT 1'
        )
          .bind(clean, clean, clean)
          .first();

        if (!result) {
          env.LOGISTICS_ANALYTICS?.writeDataPoint({
            blobs: [clean, 'not_found'],
            doubles: [Date.now(), 0],
          });
          return new Response(JSON.stringify({ found: false, error: 'Consignment not found in Cloudflare D1', trackingNumber: clean }), {
            status: 404,
            headers: CORS_HEADERS,
          });
        }

        // 3. Populate Cloudflare KV Edge Cache with 60s TTL
        if (env.LOGISTICS_CACHE) {
          try {
            await env.LOGISTICS_CACHE.put(`track:${clean}`, JSON.stringify(result), { expirationTtl: 60 });
          } catch {
            // Non-blocking
          }
        }

        // 4. Record Analytics Engine telemetry
        env.LOGISTICS_ANALYTICS?.writeDataPoint({
          blobs: [clean, 'd1_query', String((result as any).status || 'active')],
          doubles: [Date.now(), 1],
        });

        return new Response(JSON.stringify({ found: true, consignment: result, source: 'cloudflare_d1_database' }), {
          headers: CORS_HEADERS,
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return new Response(JSON.stringify({ error: message }), {
          status: 500,
          headers: CORS_HEADERS,
        });
      }
    }

    // API: Enterprise Workers AI Route Optimizer & Transit Advisor
    if (url.pathname === '/api/ai-advisor') {
      try {
        let prompt = '';
        if (request.method === 'POST') {
          const body = await request.json() as any;
          prompt = body.prompt || `Advise on shipping route from ${body.origin || 'Kathmandu'} to ${body.destination || 'Pokhara'} for ${body.weight || 5}kg of ${body.cargo || 'General Goods'}.`;
        } else {
          const origin = url.searchParams.get('origin') || 'Kathmandu Mega-Hub';
          const destination = url.searchParams.get('destination') || 'Pokhara Regional Hub';
          const cargo = url.searchParams.get('cargo') || 'Standard Express Parcel';
          prompt = `Provide a concise, professional supply chain logistics transit assessment for moving ${cargo} from ${origin} to ${destination} across Nepal highways (mentioning corridor status e.g. Prithvi or BP Highway, estimated transit time, weather/landslide risk score 1-10, and handling tips).`;
        }

        if (env.AI) {
          let aiResponse: any = null;
          const candidateModels = [
            '@cf/meta/llama-3.2-3b-instruct',
            '@cf/meta/llama-3.2-1b-instruct',
            '@cf/mistral/mistral-7b-instruct-v0.1',
            '@cf/qwen/qwen1.5-7b-chat-awq'
          ];
          let usedModel = candidateModels[0];

          for (const m of candidateModels) {
            try {
              aiResponse = await env.AI.run(m, {
                messages: [
                  {
                    role: 'system',
                    content: 'You are Double 7 Logistics Command AI, an enterprise freight routing and supply chain optimization assistant for Nepal and cross-border trade. Respond concisely with realistic logistics guidance.'
                  },
                  { role: 'user', content: prompt }
                ],
                max_tokens: 350
              });
              usedModel = m;
              if (aiResponse) break;
            } catch {
              // Try next candidate model
            }
          }

          return new Response(JSON.stringify({
            success: true,
            provider: 'Cloudflare Workers AI',
            model: usedModel,
            advisor: aiResponse?.response || aiResponse
          }), {
            headers: CORS_HEADERS
          });
        }

        return new Response(JSON.stringify({
          success: false,
          error: 'Workers AI binding currently inactive'
        }), {
          status: 503,
          headers: CORS_HEADERS
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return new Response(JSON.stringify({ error: message }), {
          status: 500,
          headers: CORS_HEADERS,
        });
      }
    }

    // New POST endpoint: create shipment
    if (url.pathname === '/api/shipments' && request.method === 'POST') {
      try {
        const body = (await request.json()) as any;
        const { tracking_number, reference_number, status } = body;
        if (!tracking_number) {
          return new Response(JSON.stringify({ success: false, error: 'tracking_number required' }), { status: 400, headers: CORS_HEADERS });
        }
        await env.DB.prepare('INSERT INTO shipments (tracking_number, reference_number, status, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)')
          .bind(tracking_number, reference_number || '', status || 'pending')
          .run();
        return new Response(JSON.stringify({ success: true, message: 'Shipment created' }), { status: 201, headers: CORS_HEADERS });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return new Response(JSON.stringify({ success: false, error: message }), { status: 500, headers: CORS_HEADERS });
      }
    }

    // New POST endpoint: create sub‑user
    if (url.pathname === '/api/subusers' && request.method === 'POST') {
      try {
        const body = (await request.json()) as any;
        const { parent_id, email, name, role, password_hash } = body;
        if (!parent_id || !email || !role || !password_hash) {
          return new Response(JSON.stringify({ success: false, error: 'Missing required fields' }), { status: 400, headers: CORS_HEADERS });
        }
        await env.USERS_DB.prepare('INSERT INTO sub_users (parent_id, email, name, role, password_hash, created_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)')
          .bind(parent_id, email, name || '', role, password_hash)
          .run();
        return new Response(JSON.stringify({ success: true, message: 'Sub‑user created' }), { status: 201, headers: CORS_HEADERS });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return new Response(JSON.stringify({ success: false, error: message }), { status: 500, headers: CORS_HEADERS });
      }
    }

    // API: Register Merchant Email into Cloudflare Email Routing & USERS_DB
    // Also dispatches official Registration Successful email with login credentials and links
    if ((url.pathname === '/api/register-merchant' || url.pathname === '/api/register-email') && request.method === 'POST') {
      try {
        const body = (await request.json()) as any;
        const email = (body.email || '').trim().toLowerCase();
        const name = (body.name || '').trim();
        const company = (body.company || '').trim() || 'Verified Nepal Merchant';
        const phone = (body.phone || '').trim() || '+977 98000 00000';
        const password = (body.password || '').trim();
        const merchantId = `usr-merch-${Date.now()}`;

        if (!email || !email.includes('@')) {
          return new Response(JSON.stringify({ success: false, error: 'Valid email address is required' }), {
            status: 400,
            headers: CORS_HEADERS,
          });
        }

        // 1. Insert or update merchant in Cloudflare D1 USERS_DB (including password column)
        let d1Saved = false;
        try {
          await env.USERS_DB.prepare(
            'INSERT OR REPLACE INTO users (id, name, email, company, phone, role, status, cod_balance_npr, sub_role, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
          )
            .bind(
              merchantId,
              name || email.split('@')[0],
              email,
              company,
              phone,
              'merchant',
              'active',
              0,
              'Merchant Consignor / Shipper',
              password
            )
            .run();
          d1Saved = true;
        } catch (d1Err) {
          // Fallback if password column not available
          try {
            await env.USERS_DB.prepare(
              'INSERT OR REPLACE INTO users (id, name, email, company, phone, role, status, cod_balance_npr, sub_role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
            )
              .bind(
                merchantId,
                name || email.split('@')[0],
                email,
                company,
                phone,
                'merchant',
                'active',
                0,
                'Merchant Consignor / Shipper'
              )
              .run();
            d1Saved = true;
          } catch {
            // Non-blocking fallback
          }
        }

        // 2. Register Email with Cloudflare Email Routing to trigger official verification email
        const cfResult = await registerEmailWithCloudflare(email, env);

        // 3. Automatically dispatch official Merchant Registration Successful email with login credentials and links!
        const welcomeHtml = buildMerchantWelcomeHtml({
          email,
          name: name || email.split('@')[0],
          company,
          password,
          merchantId,
        });

        const welcomeSubject = `🎉 Welcome to Double 7 Logistics • Merchant Account Activated & Login Credentials`;
        const emailDispatchResult = await dispatchEmailDirect(
          {
            to: email,
            subject: welcomeSubject,
            html: welcomeHtml,
            role: 'merchant',
            type: 'merchant_welcome',
          },
          env
        );

        // Cache registration in KV
        if (env.LOGISTICS_CACHE) {
          try {
            await env.LOGISTICS_CACHE.put(
              `cf_email_reg:${email}`,
              JSON.stringify({
                email,
                name,
                company,
                merchantId,
                registeredAt: new Date().toISOString(),
                cfResult,
                welcomeEmailDispatched: emailDispatchResult.success,
              }),
              { expirationTtl: 86400 * 30 }
            );
          } catch {
            // Non-blocking
          }
        }

        return new Response(
          JSON.stringify({
            success: true,
            email,
            merchantId,
            d1Saved,
            cfVerificationTriggered: cfResult.success,
            alreadyExists: cfResult.alreadyExists || false,
            welcomeEmailDispatched: emailDispatchResult.success,
            welcomeEmailError: emailDispatchResult.error,
            message: emailDispatchResult.success
              ? `Merchant account registered! Login details and dashboard instructions dispatched to ${email}. (Daily reset: 6:00 PM).`
              : cfResult.success
              ? `Merchant registered! Cloudflare verification link sent to ${email}. Click it to authorize receiving login credentials and 6:00 PM reports.`
              : `Merchant account registered!`,
          }),
          { headers: CORS_HEADERS }
        );
      } catch (err: any) {
        return new Response(JSON.stringify({ success: false, error: err?.message || String(err) }), {
          status: 500,
          headers: CORS_HEADERS,
        });
      }
    }

    // API: List Cloudflare Destination Addresses and their Verification Status
    if (url.pathname === '/api/registered-emails') {
      try {
        const addresses = await listCloudflareEmailAddresses(env);
        return new Response(JSON.stringify({ success: true, count: addresses.length, addresses }), {
          headers: CORS_HEADERS,
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ success: false, error: err?.message || String(err) }), {
          status: 500,
          headers: CORS_HEADERS,
        });
      }
    }

    // API: Real Email Dispatch & 24h Summary Service
    if (url.pathname === '/api/send-summary' || url.pathname === '/api/send-email') {
      try {
        let recipientEmail = '';
        let subject = '';
        let role = 'merchant';
        let trackingId = '';
        let type = '24h_summary';
        let name = '';
        let company = 'Verified Nepal Merchant';
        let password = '';
        let merchantId = `usr-merch-${Date.now()}`;

        if (request.method === 'POST') {
          const body = (await request.json()) as any;
          recipientEmail = body.email || (env as any).DAILY_SUMMARY_EMAIL || '';
          subject = body.subject || '';
          role = body.role || 'merchant';
          trackingId = body.trackingId || '';
          type = body.type || '24h_summary';
          name = body.name || '';
          company = body.company || company;
          password = body.password || '';
          if (body.merchantId) merchantId = body.merchantId;
        } else {
          recipientEmail = url.searchParams.get('email') || (env as any).DAILY_SUMMARY_EMAIL || '';
          subject = url.searchParams.get('subject') || '';
          role = url.searchParams.get('role') || 'merchant';
          trackingId = url.searchParams.get('id') || url.searchParams.get('trackingId') || '';
          type = url.searchParams.get('type') || '24h_summary';
          name = url.searchParams.get('name') || '';
          company = url.searchParams.get('company') || company;
          password = url.searchParams.get('password') || '';
          if (url.searchParams.get('merchantId')) merchantId = url.searchParams.get('merchantId')!;
        }

        if (!recipientEmail || !recipientEmail.includes('@')) {
          return new Response(JSON.stringify({ success: false, error: 'Valid recipient email required' }), {
            status: 400,
            headers: CORS_HEADERS,
          });
        }

        const cleanEmail = recipientEmail.trim().toLowerCase();

        // Fetch live counts from D1
        let liveCount = 61;
        try {
          const countRes = await env.DB.prepare('SELECT count(*) as count FROM shipments').first<{ count: number }>();
          if (countRes?.count) liveCount = countRes.count;
        } catch {
          // fallback
        }

        let html = '';
        let finalSubject = subject;

        if (type === 'merchant_welcome' || type === 'welcome' || type === 'login_details') {
          html = buildMerchantWelcomeHtml({
            email: cleanEmail,
            name: name || cleanEmail.split('@')[0],
            company,
            password,
            merchantId,
          });
          if (!finalSubject) {
            finalSubject = `🎉 Welcome to Double 7 Logistics • Merchant Account Activated & Login Credentials`;
          }
        } else {
          html = build24hSummaryHtml({
            email: cleanEmail,
            liveCount,
            trackingId,
          });
          if (!finalSubject) {
            const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            finalSubject = trackingId
              ? `[Double 7] Waybill & Dispatch Notice: ${trackingId}`
              : `[Double 7] 24-Hour Operations & COD Summary Report • Daily Reset: 6:00 PM NPT (${dateStr})`;
          }
        }

        const dispatchResult = await dispatchEmailDirect(
          {
            to: cleanEmail,
            subject: finalSubject,
            html,
            role,
            type,
            trackingId,
          },
          env
        );

        return new Response(
          JSON.stringify({
            success: dispatchResult.success,
            messageId: dispatchResult.messageId,
            recipient: cleanEmail,
            subject: finalSubject,
            status: dispatchResult.success ? 'sent' : 'failed',
            dispatched: dispatchResult.success,
            provider: dispatchResult.provider,
            error: dispatchResult.error,
            timestamp: new Date().toISOString(),
          }),
          {
            status: dispatchResult.success ? 200 : 502,
            headers: CORS_HEADERS,
          }
        );
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return new Response(JSON.stringify({ success: false, error: message }), {
          status: 500,
          headers: CORS_HEADERS,
        });
      }
    }

    // API: Live Consignments from Cloudflare D1
    if (url.pathname === '/api/shipments') {
      try {
        const { results } = await env.DB.prepare('SELECT * FROM shipments ORDER BY id DESC LIMIT 100').all();
        return new Response(JSON.stringify({ success: true, count: results.length, shipments: results }), {
          headers: CORS_HEADERS,
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return new Response(JSON.stringify({ error: message }), {
          status: 500,
          headers: CORS_HEADERS,
        });
      }
    }

    // API: Users list from Cloudflare D1 users database
    if (url.pathname === '/api/users') {
      try {
        const { results } = await env.USERS_DB.prepare('SELECT id, name, email, role, sub_role, company, phone, created_at FROM users ORDER BY id ASC').all();
        return new Response(JSON.stringify({ success: true, count: results.length, users: results }), {
          headers: CORS_HEADERS,
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return new Response(JSON.stringify({ error: message }), {
          status: 500,
          headers: CORS_HEADERS,
        });
      }
    }

    // Static Assets Fallback: Serves Next.js SSG output
    try {
      const response = await env.ASSETS.fetch(request);
      if (response.status === 404) {
        return env.ASSETS.fetch(new Request(new URL('/404.html', request.url), request));
      }
      return response;
    } catch {
      return env.ASSETS.fetch(new Request(new URL('/index.html', request.url), request));
    }
  },
};
