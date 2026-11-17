import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getSiteUrl,
  SEO_CONFIG,
  getOrganizationSchema,
  getWebSiteSchema,
  getElectionEventSchema,
} from '../lib/seo/constants.ts';
import robots from '../app/robots.ts';
import sitemap from '../app/sitemap.ts';
import manifest from '../app/manifest.ts';

test('SEO Verification Suite', async (t) => {
  await t.test('1. Domain and constants validation', () => {
    const url = getSiteUrl();
    assert.strictEqual(url, 'https://pemirahmif.com');
    assert.ok(SEO_CONFIG.siteName.includes('PEMIRA HMIF'));
    assert.ok(SEO_CONFIG.keywords.length >= 8);
    assert.ok(SEO_CONFIG.keywords.includes('Pemira HMIF'));
    assert.ok(SEO_CONFIG.keywords.includes('E-Voting HMIF'));
  });

  await t.test('2. robots.ts security boundaries', () => {
    const robotsConfig = robots();
    assert.ok(robotsConfig.rules);
    
    const rules = Array.isArray(robotsConfig.rules) ? robotsConfig.rules[0] : robotsConfig.rules;
    assert.strictEqual(rules.userAgent, '*');
    assert.deepStrictEqual(rules.allow, ['/', '/login']);
    
    // Invariant: Secret and sensitive routes must be strictly disallowed
    const disallowList = rules.disallow;
    assert.ok(disallowList.includes('/admin'));
    assert.ok(disallowList.includes('/vote'));
    assert.ok(disallowList.includes('/receipt'));
    assert.ok(disallowList.includes('/api'));
    assert.ok(disallowList.includes('/bast'));
    assert.strictEqual(robotsConfig.sitemap, 'https://pemirahmif.com/sitemap.xml');
  });

  await t.test('3. sitemap.ts entries', () => {
    const sitemapEntries = sitemap();
    assert.strictEqual(sitemapEntries.length, 2);
    
    const homeEntry = sitemapEntries.find((e) => e.url === 'https://pemirahmif.com');
    assert.ok(homeEntry);
    assert.strictEqual(homeEntry.priority, 1.0);

    const loginEntry = sitemapEntries.find((e) => e.url === 'https://pemirahmif.com/login');
    assert.ok(loginEntry);
    assert.strictEqual(loginEntry.priority, 0.9);
  });

  await t.test('4. manifest.ts Web App configuration', () => {
    const manifestConfig = manifest();
    assert.strictEqual(manifestConfig.name, SEO_CONFIG.siteName);
    assert.strictEqual(manifestConfig.start_url, '/');
    assert.strictEqual(manifestConfig.theme_color, '#121212');
    assert.strictEqual(manifestConfig.background_color, '#121212');
    assert.ok(manifestConfig.icons.length > 0);
  });

  await t.test('5. Schema.org JSON-LD structural integrity', () => {
    const org = getOrganizationSchema();
    assert.strictEqual(org['@context'], 'https://schema.org');
    assert.strictEqual(org['@type'], 'Organization');
    assert.strictEqual(org.name, 'HMIF Telkom University Purwokerto');
    assert.strictEqual(org.url, 'https://pemirahmif.com');
    assert.ok(org.logo.includes('hmif-logo.png'));

    const web = getWebSiteSchema();
    assert.strictEqual(web['@context'], 'https://schema.org');
    assert.strictEqual(web['@type'], 'WebSite');
    assert.strictEqual(web.inLanguage, 'id-ID');

    const event = getElectionEventSchema();
    assert.strictEqual(event['@context'], 'https://schema.org');
    assert.strictEqual(event['@type'], 'Event');
    assert.ok(event.name.includes('Pemilihan Raya HMIF'));
    assert.strictEqual(event.location.url, 'https://pemirahmif.com/login');
  });

  await t.test('6. Google Search Console verification metadata support', async () => {
    const fs = await import('node:fs');
    const layoutContent = fs.readFileSync('app/layout.tsx', 'utf-8');
    assert.ok(layoutContent.includes('verification: {'));
    assert.ok(layoutContent.includes('NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION'));
  });
});
