import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Load route handler dynamically
import { GET } from '../app/uploads/[...path]/route.ts';

test('Dynamic Upload File Serving Verification Suite', async (t) => {
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'candidates');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const testFileName = `test-verify-${Date.now()}.webp`;
  const testFilePath = path.join(uploadsDir, testFileName);
  const dummyBuffer = Buffer.from('RIFF....WEBPVP8 ...test content...');
  fs.writeFileSync(testFilePath, dummyBuffer);

  t.after(() => {
    try {
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }
    } catch {
      // Ignore cleanup error
    }
  });

  await t.test('1. Successfully serves valid uploaded image with correct MIME and headers', async () => {
    const req = new Request(`http://localhost:3000/uploads/candidates/${testFileName}`);
    const res = await GET(req, { params: { path: ['candidates', testFileName] } });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.headers.get('content-type'), 'image/webp');
    assert.ok(res.headers.get('cache-control')?.includes('public'));
    assert.strictEqual(res.headers.get('x-content-type-options'), 'nosniff');

    const bodyBuffer = Buffer.from(await res.arrayBuffer());
    assert.strictEqual(bodyBuffer.toString(), dummyBuffer.toString());
  });

  await t.test('2. Returns 404 for non-existent file', async () => {
    const req = new Request('http://localhost:3000/uploads/candidates/non-existent-image-404.webp');
    const res = await GET(req, { params: { path: ['candidates', 'non-existent-image-404.webp'] } });

    assert.strictEqual(res.status, 404);
  });

  await t.test('3. Strictly blocks directory traversal attacks', async () => {
    const maliciousPaths = [
      ['..', '.env.local'],
      ['candidates', '..', '..', 'package.json'],
      ['..', '..', 'etc', 'passwd'],
    ];

    for (const p of maliciousPaths) {
      const req = new Request(`http://localhost:3000/uploads/${p.join('/')}`);
      const res = await GET(req, { params: { path: p } });
      assert.strictEqual(res.status, 404, `Traversal path ${p.join('/')} must be rejected with 404`);
    }
  });

  await t.test('4. Correctly maps known file extensions to proper MIME types', async () => {
    const cvDir = path.join(process.cwd(), 'public', 'uploads', 'cv');
    if (!fs.existsSync(cvDir)) {
      fs.mkdirSync(cvDir, { recursive: true });
    }

    const testPdfName = `test-doc-${Date.now()}.pdf`;
    const testPdfPath = path.join(cvDir, testPdfName);
    fs.writeFileSync(testPdfPath, Buffer.from('%PDF-1.4 test'));

    try {
      const req = new Request(`http://localhost:3000/uploads/cv/${testPdfName}`);
      const res = await GET(req, { params: { path: ['cv', testPdfName] } });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers.get('content-type'), 'application/pdf');
    } finally {
      if (fs.existsSync(testPdfPath)) {
        fs.unlinkSync(testPdfPath);
      }
    }
  });
});
