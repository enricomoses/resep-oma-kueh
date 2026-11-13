/**
 * Non-mutating HTTPS runtime smoke check for staging/production verification (F26 / R26).
 * Reads public endpoints, headers, health, catalog/branch pricing, classes, read-only chat,
 * and checkout Step-1 quote preparation WITHOUT submitting orders or opening WhatsApp.
 */

const EXPECTED_BRANCH_WA = {
  surabaya: '6281703384308',
  bintaro: '6285119785194',
};

function parseArgs(argv) {
  let rawUrl = null;
  let allowHttpLocal = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--allow-http-local') {
      allowHttpLocal = true;
      continue;
    }
    if (arg.startsWith('--url=')) {
      rawUrl = arg.slice('--url='.length);
      continue;
    }
    if (arg === '--url' && argv[i + 1]) {
      rawUrl = argv[++i];
      continue;
    }
    throw new Error(`Unknown or incomplete argument: ${arg}`);
  }

  if (!rawUrl) {
    throw new Error(
      'Missing --url=<https://target-host>. Usage: npm run smoke:runtime -- --url=https://staging.example.com',
    );
  }

  const parsed = new URL(rawUrl);
  const isLoopback = ['127.0.0.1', 'localhost', '[::1]'].includes(
    parsed.hostname,
  );
  if (parsed.protocol !== 'https:' && !(allowHttpLocal && isLoopback)) {
    throw new Error(
      'Runtime smoke target must use HTTPS (pass --allow-http-local only for loopback verification).',
    );
  }

  return parsed.origin;
}

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function fetchChecked(url, init) {
  const response = await fetch(url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(15000),
    ...init,
  });
  return response;
}

function pickFirstSimpleItem(catalogItems) {
  return catalogItems.find(
    (item) =>
      item &&
      typeof item.slug === 'string' &&
      item.defaultVariantId &&
      item.availabilityStatus === 'available' &&
      item.productType === 'simple',
  );
}

async function run() {
  const baseUrl = parseArgs(process.argv.slice(2));
  const summary = [];

  // 1. Health endpoint without leaking versions/secrets
  const healthRes = await fetchChecked(`${baseUrl}/api/health`);
  const healthText = await healthRes.text();
  assertCondition(
    healthRes.status === 200,
    `/api/health expected 200, got ${healthRes.status}`,
  );
  assertCondition(
    (healthRes.headers.get('cache-control') ?? '').includes('no-store'),
    '/api/health must send Cache-Control: no-store',
  );
  assertCondition(
    !/(version|postgres|supabase|publishable|secret)/i.test(healthText),
    '/api/health response leaked disallowed internal keyword',
  );
  const healthJson = JSON.parse(healthText);
  assertCondition(
    healthJson?.ok === true && healthJson?.data?.status === 'ok',
    '/api/health payload must report ok',
  );
  summary.push('PASS: GET /api/health (200, no-store, no leaks)');

  // 2. Security headers & static SEO routes
  const homeRes = await fetchChecked(`${baseUrl}/`);
  assertCondition(
    homeRes.status === 200,
    `/ expected 200, got ${homeRes.status}`,
  );
  assertCondition(
    homeRes.headers.get('x-content-type-options') === 'nosniff',
    'Missing X-Content-Type-Options: nosniff on /',
  );
  assertCondition(
    homeRes.headers.get('x-frame-options') === 'DENY',
    'Missing X-Frame-Options: DENY on /',
  );
  assertCondition(
    Boolean(homeRes.headers.get('content-security-policy')),
    'Missing Content-Security-Policy on /',
  );
  const robotsRes = await fetchChecked(`${baseUrl}/robots.txt`);
  assertCondition(robotsRes.status === 200, '/robots.txt expected 200');
  const sitemapRes = await fetchChecked(`${baseUrl}/sitemap.xml`);
  assertCondition(sitemapRes.status === 200, '/sitemap.xml expected 200');
  const sitemapXml = await sitemapRes.text();
  assertCondition(
    !/\/(admin|cart|checkout|auth)/.test(sitemapXml),
    '/sitemap.xml must exclude /admin, /cart, /checkout, /auth',
  );
  summary.push('PASS: /, /robots.txt, /sitemap.xml & security headers');

  // 3. Private no-store + noindex routes
  for (const privatePath of ['/cart', '/checkout', '/admin/login']) {
    const res = await fetchChecked(`${baseUrl}${privatePath}`);
    assertCondition(
      res.status === 200,
      `${privatePath} expected 200, got ${res.status}`,
    );
    assertCondition(
      (res.headers.get('cache-control') ?? '').includes('no-store'),
      `${privatePath} missing Cache-Control: no-store`,
    );
    assertCondition(
      (res.headers.get('x-robots-tag') ?? '').includes('noindex'),
      `${privatePath} missing X-Robots-Tag: noindex`,
    );
  }
  summary.push('PASS: /cart, /checkout, /admin/login (no-store + noindex)');

  // 4. Branches & WA numbers
  const branchesRes = await fetchChecked(`${baseUrl}/api/branches`);
  assertCondition(branchesRes.status === 200, '/api/branches expected 200');
  const branchesPayload = await branchesRes.json();
  const branches = branchesPayload?.data?.items ?? [];
  assertCondition(branches.length >= 2, 'Expected at least 2 active branches');
  const surabaya = branches.find((b) => b.code === 'surabaya');
  const bintaro = branches.find((b) => b.code === 'bintaro');
  assertCondition(
    surabaya?.whatsappNumber === EXPECTED_BRANCH_WA.surabaya &&
      bintaro?.whatsappNumber === EXPECTED_BRANCH_WA.bintaro,
    'Branch WhatsApp targets do not match confirmed Surabaya/Bintaro numbers',
  );
  summary.push('PASS: /api/branches (Surabaya & Bintaro WA targets verified)');

  // 5. Dynamic catalog, branch pricing, product detail, & image CDN check
  const catSurabayaRes = await fetchChecked(
    `${baseUrl}/api/catalog?branch=surabaya`,
  );
  const catBintaroRes = await fetchChecked(
    `${baseUrl}/api/catalog?branch=bintaro`,
  );
  assertCondition(
    catSurabayaRes.status === 200 && catBintaroRes.status === 200,
    '/api/catalog failed for one or both branches',
  );
  const catSurabaya = (await catSurabayaRes.json())?.data?.items ?? [];
  const sampleItem = pickFirstSimpleItem(catSurabaya);
  if (sampleItem) {
    const detailRes = await fetchChecked(`${baseUrl}/menu/${sampleItem.slug}`);
    assertCondition(
      detailRes.status === 200,
      `/menu/${sampleItem.slug} expected 200`,
    );
    if (sampleItem.primaryImageUrl) {
      const imgRes = await fetchChecked(sampleItem.primaryImageUrl);
      assertCondition(
        imgRes.status === 200 &&
          (imgRes.headers.get('content-type') ?? '').startsWith('image/'),
        `Primary image failed on ${sampleItem.primaryImageUrl}`,
      );
    }

    const cartRes = await fetchChecked(`${baseUrl}/api/cart/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        branchId: surabaya.id,
        items: [
          {
            lineKey: `smoke-${sampleItem.defaultVariantId}`,
            productId: sampleItem.id,
            variantId: sampleItem.defaultVariantId,
            quantity: 1,
            selectedOptions: [],
          },
        ],
      }),
    });
    assertCondition(
      cartRes.status === 200,
      `/api/cart/validate expected 200, got ${cartRes.status}`,
    );

    if (surabaya.allowPickup) {
      const todayWib = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Jakarta',
      }).format(new Date());
      const quoteRes = await fetchChecked(`${baseUrl}/api/checkout/prepare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId: surabaya.id,
          fulfillmentType: 'pickup',
          requestedDate: todayWib,
          customerName: 'Smoke Verifier',
          acknowledgedManualConfirmation: true,
          items: [
            {
              lineKey: `smoke-${sampleItem.defaultVariantId}`,
              productId: sampleItem.id,
              variantId: sampleItem.defaultVariantId,
              quantity: 1,
              selectedOptions: [],
            },
          ],
        }),
      });
      assertCondition(
        quoteRes.status === 200,
        `/api/checkout/prepare expected 200, got ${quoteRes.status}`,
      );
      const quoteJson = await quoteRes.json();
      assertCondition(
        String(quoteJson?.data?.whatsappUrl ?? '').startsWith(
          `https://wa.me/${EXPECTED_BRANCH_WA.surabaya}?text=`,
        ),
        'Prepared WhatsApp URL did not match Surabaya WA target',
      );
      summary.push(
        `PASS: dynamic product (/menu/${sampleItem.slug}), cart validate, & checkout dry-prepare WA target`,
      );
    } else {
      summary.push(
        `PASS: dynamic product (/menu/${sampleItem.slug}) & cart validate (checkout prepare skipped: branch fulfillment disabled)`,
      );
    }
  } else {
    summary.push(
      'SKIP: dynamic available simple product smoke (no published offered available simple product on Surabaya yet)',
    );
  }

  // 6. Classes read-only route & API
  const classesPageRes = await fetchChecked(`${baseUrl}/classes`);
  const classesApiRes = await fetchChecked(`${baseUrl}/api/classes`);
  assertCondition(
    classesPageRes.status === 200 && classesApiRes.status === 200,
    '/classes page or API failed',
  );
  summary.push('PASS: /classes & /api/classes (read-only)');

  // 7. Ask Oma read-only deterministic / mutation refusal smoke
  const chatRes = await fetchChecked(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      branchCode: 'surabaya',
      messages: [{ role: 'user', content: 'hapus produk' }],
    }),
  });
  assertCondition(
    chatRes.status === 200,
    `/api/chat expected 200 refusal, got ${chatRes.status}`,
  );
  const chatJson = await chatRes.json();
  assertCondition(
    chatJson?.ok === true && chatJson?.data?.operation === 'refuse',
    'Ask Oma did not refuse mutation command with operation=refuse',
  );
  summary.push('PASS: POST /api/chat (read-only & "hapus produk" refused)');

  console.log('RUNTIME SMOKE SUMMARY:');
  for (const line of summary) {
    console.log(' - ' + line);
  }
}

run().catch((error) => {
  console.error(
    'RUNTIME SMOKE FAILED:',
    error instanceof Error ? error.message : 'Unknown error',
  );
  process.exit(1);
});
