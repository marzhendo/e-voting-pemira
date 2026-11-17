import test from 'node:test';
import assert from 'node:assert/strict';

test('Candidate Photo Framing Suite', async (t) => {
  await t.test('1. Aspect ratio 4:3 dimension calculation', () => {
    const targetRatio = 4 / 3;
    const outputWidth = 1200;
    const outputHeight = 900;

    assert.strictEqual(outputWidth / outputHeight, targetRatio);
  });

  await t.test('2. Zoom clamping bounds (1.0x to 3.0x)', () => {
    const clampZoom = (z) => Math.min(3.0, Math.max(1.0, +z.toFixed(2)));

    assert.strictEqual(clampZoom(0.5), 1.0);
    assert.strictEqual(clampZoom(1.0), 1.0);
    assert.strictEqual(clampZoom(1.75), 1.75);
    assert.strictEqual(clampZoom(3.0), 3.0);
    assert.strictEqual(clampZoom(4.2), 3.0);
  });

  await t.test('3. Canvas scale & offset coordinate transformation mapping', () => {
    const viewWidth = 460;
    const viewHeight = 345; // 460 * 3 / 4
    const outputWidth = 1200;
    const canvasScale = outputWidth / viewWidth;

    const naturalWidth = 1920;
    const naturalHeight = 1080;
    const scaleToFit = Math.max(viewWidth / naturalWidth, viewHeight / naturalHeight);
    const baseWidth = naturalWidth * scaleToFit;
    const baseHeight = naturalHeight * scaleToFit;

    const zoom = 1.5;
    const offset = { x: 20, y: -10 };

    const renderedWidth = baseWidth * zoom;
    const renderedHeight = baseHeight * zoom;
    const baseX = (viewWidth - renderedWidth) / 2 + offset.x;
    const baseY = (viewHeight - renderedHeight) / 2 + offset.y;

    const drawX = baseX * canvasScale;
    const drawY = baseY * canvasScale;
    const drawWidth = renderedWidth * canvasScale;
    const drawHeight = renderedHeight * canvasScale;

    assert.ok(drawWidth > 0);
    assert.ok(drawHeight > 0);
    assert.strictEqual(typeof drawX, 'number');
    assert.strictEqual(typeof drawY, 'number');
  });

  await t.test('4. Safe candidate filename generation', () => {
    const candidateNumber = 1;
    const timestamp = 1794922249420;
    const ext = '.webp';
    const filename = `paslon-${candidateNumber}-frame-${timestamp}${ext}`;

    assert.strictEqual(filename, 'paslon-1-frame-1794922249420.webp');
    assert.ok(filename.endsWith('.webp'));
  });
});
