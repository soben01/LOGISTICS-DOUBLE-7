const BASE_URL = 'https://logistics-double-7.nex-it.workers.dev';

interface TestResult {
  name: string;
  url: string;
  status: number;
  success: boolean;
  details?: any;
}

async function runTests() {
  console.log('🚀 Starting Double 7 Logistics End-to-End Verification Audit...\n');

  const results: TestResult[] = [];

  // 1. Healthcheck & Multi-Binding Status
  try {
    const res = await fetch(`${BASE_URL}/api/db-status`);
    const data = await res.json();
    results.push({
      name: 'API: Infrastructure Healthcheck & Bindings',
      url: `${BASE_URL}/api/db-status`,
      status: res.status,
      success: res.ok && data.status === 'operational' && data.bindings?.kv_edge_cache?.status === 'active',
      details: {
        tier: data.tier,
        d1_shipments: data.bindings?.d1_tracking_db?.total_shipments,
        kv_cache: data.bindings?.kv_edge_cache?.status,
        workers_ai: data.bindings?.workers_ai?.status,
      }
    });
  } catch (err: any) {
    results.push({ name: 'API: Infrastructure Healthcheck', url: `${BASE_URL}/api/db-status`, status: 500, success: false, details: err.message });
  }

  // 2. Tracking Lookup & KV Edge Caching
  try {
    const trackingId = 'CPCDHEZ80002818001';
    // 1st request (populates cache)
    const res1 = await fetch(`${BASE_URL}/api/track?id=${trackingId}`);
    const data1 = await res1.json();
    // 2nd request (reads from KV edge cache)
    const res2 = await fetch(`${BASE_URL}/api/track?id=${trackingId}`);
    const data2 = await res2.json();

    results.push({
      name: 'API: Real-time Tracking & KV Edge Cache Hit',
      url: `${BASE_URL}/api/track?id=${trackingId}`,
      status: res2.status,
      success: res2.ok && data2.found === true && data2.source === 'cloudflare_kv_cache',
      details: {
        found: data2.found,
        trackingNumber: data2.consignment?.tracking_number,
        source: data2.source,
      }
    });
  } catch (err: any) {
    results.push({ name: 'API: Tracking Lookup', url: `${BASE_URL}/api/track`, status: 500, success: false, details: err.message });
  }

  // 3. Workers AI Logistics Advisor
  try {
    const res = await fetch(`${BASE_URL}/api/ai-advisor?origin=Kathmandu&destination=Pokhara&cargo=General+Freight`);
    const data = await res.json();
    results.push({
      name: 'API: Workers AI Route Advisor',
      url: `${BASE_URL}/api/ai-advisor`,
      status: res.status,
      success: res.ok && data.success === true && typeof data.advisor === 'string' && data.advisor.length > 50,
      details: {
        provider: data.provider,
        model: data.model,
        sampleOutput: data.advisor?.substring(0, 100) + '...',
      }
    });
  } catch (err: any) {
    results.push({ name: 'API: Workers AI Route Advisor', url: `${BASE_URL}/api/ai-advisor`, status: 500, success: false, details: err.message });
  }

  // 4. Real Email Dispatch & 24h Summary Service
  try {
    const res = await fetch(`${BASE_URL}/api/send-summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'upreti.soben@gmail.com',
        role: 'admin',
        type: '24h_summary',
        subject: '[Test Audit] Double 7 24h Logistics Digest',
      })
    });
    const data = await res.json();
    results.push({
      name: 'API: Email Dispatch & 24h Summary Gateway',
      url: `${BASE_URL}/api/send-summary`,
      status: res.status,
      success: res.ok && data.success === true && data.status === 'sent',
      details: {
        recipient: data.recipient,
        messageId: data.messageId,
        provider: data.provider,
        dispatched: data.dispatched,
      }
    });
  } catch (err: any) {
    results.push({ name: 'API: Email Dispatch', url: `${BASE_URL}/api/send-summary`, status: 500, success: false, details: err.message });
  }

  // 5. Frontend Pages Healthcheck
  const routes = ['/', '/dashboard', '/bookings', '/book', '/track', '/rates', '/support', '/about', '/login'];
  for (const route of routes) {
    try {
      const res = await fetch(`${BASE_URL}${route}`);
      const text = await res.text();
      const hasDouble7 = text.includes('DOUBLE') || text.includes('Double 7') || text.includes('Logistics');
      results.push({
        name: `Page: ${route}`,
        url: `${BASE_URL}${route}`,
        status: res.status,
        success: res.ok && hasDouble7,
        details: { length: text.length }
      });
    } catch (err: any) {
      results.push({ name: `Page: ${route}`, url: `${BASE_URL}${route}`, status: 500, success: false, details: err.message });
    }
  }

  console.log('================ AUDIT RESULTS ================');
  let allPassed = true;
  for (const r of results) {
    const icon = r.success ? '✅ PASS' : '❌ FAIL';
    console.log(`${icon} | [${r.status}] ${r.name}`);
    if (r.details) {
      console.log('       ', JSON.stringify(r.details));
    }
    if (!r.success) allPassed = false;
  }
  console.log('===============================================\n');

  if (allPassed) {
    console.log('🎉 ALL 13 END-TO-END VERIFICATION CHECKS PASSED WITH ZERO ERRORS!');
  } else {
    console.error('⚠️ Some verification checks encountered failures.');
    process.exit(1);
  }
}

runTests();
