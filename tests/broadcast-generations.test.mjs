import test from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';

test('Broadcast & DPT Generation Dynamic Extraction', async (t) => {
  await t.test('1. Extracts unique generations sorted ascending from DPT data', () => {
    const mockGenerationData = [
      { generation: 2023, totalVoters: 50 },
      { generation: 2019, totalVoters: 5 },
      { generation: 2025, totalVoters: 100 },
      { generation: 2020, totalVoters: 12 },
    ];
    const mockVoters = [
      { generation: 2026 },
      { generation: 2019 },
      { generation: 2024 },
    ];

    const gens = new Set();
    mockGenerationData.forEach((g) => {
      if (g.generation && g.generation > 2000) gens.add(g.generation);
    });
    mockVoters.forEach((v) => {
      if (v.generation && v.generation > 2000) gens.add(v.generation);
    });

    const result = Array.from(gens).sort((a, b) => a - b);
    assert.deepStrictEqual(result, [2019, 2020, 2023, 2024, 2025, 2026]);
  });

  await t.test('2. Falls back to 2019-2026 range when data is empty', () => {
    const mockGenerationData = [];
    const mockVoters = [];

    const gens = new Set();
    mockGenerationData.forEach((g) => {
      if (g.generation && g.generation > 2000) gens.add(g.generation);
    });
    mockVoters.forEach((v) => {
      if (v.generation && v.generation > 2000) gens.add(v.generation);
    });

    if (gens.size === 0) {
      [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026].forEach((g) => gens.add(g));
    }

    const result = Array.from(gens).sort((a, b) => a - b);
    assert.strictEqual(result.length, 8);
    assert.strictEqual(result[0], 2019);
    assert.strictEqual(result[result.length - 1], 2026);
  });

  await t.test('3. Quick add DPT schema accepts Angkatan 2019', () => {
    const quickAddSchema = z.object({
      nim: z.string().min(4).max(20),
      name: z.string().min(2).max(150),
      email: z.string().email(),
      generation: z.number().int().min(2015).max(2035).default(2023),
    });

    const valid2019 = quickAddSchema.safeParse({
      nim: '103011900001',
      name: 'Senior Angkatan 2019',
      email: 'senior@student.telkomuniversity.ac.id',
      generation: 2019,
    });
    assert.ok(valid2019.success);
    assert.strictEqual(valid2019.data.generation, 2019);
  });

  await t.test('4. Chunked broadcast request schema validates offset, limit, and accumulated stats', () => {
    const broadcastRequestSchema = z.object({
      targetGroup: z.enum(['all', 'not_voted', 'voted']),
      generation: z.string().default('all'),
      template: z.enum(['credentials', 'reminder', 'invitation', 'custom']).default('reminder'),
      includeCredentials: z.boolean().default(false),
      subject: z.string().min(5),
      headline: z.string().min(5),
      bodyText: z.string().min(10),
      ctaText: z.string().default('Masuk ke Bilik Suara Digital'),
      ctaUrl: z.string().default('/login'),
      offset: z.number().int().min(0).default(0),
      limit: z.number().int().min(0).default(0),
      isLastChunk: z.boolean().default(false),
      accumulatedStats: z
        .object({
          sent: z.number().default(0),
          failed: z.number().default(0),
        })
        .optional(),
    });

    const parsedChunk = broadcastRequestSchema.safeParse({
      targetGroup: 'not_voted',
      generation: '2024',
      template: 'credentials',
      includeCredentials: true,
      subject: '[Pemira HMIF] Pengingat Pemilihan Besok & Kata Sandi',
      headline: 'Waktunya Memilih Pemimpin HMIF',
      bodyText: 'Berikut merupakan kredensial bilik suara digital Anda.',
      offset: 40,
      limit: 20,
      isLastChunk: false,
      accumulatedStats: { sent: 40, failed: 0 },
    });

    assert.ok(parsedChunk.success);
    assert.strictEqual(parsedChunk.data.offset, 40);
    assert.strictEqual(parsedChunk.data.limit, 20);
    assert.strictEqual(parsedChunk.data.isLastChunk, false);
    assert.strictEqual(parsedChunk.data.accumulatedStats?.sent, 40);
  });

  await t.test('5. Chunk slicing simulator correctly divides 269 recipients across batches without overlap', () => {
    const TOTAL_RECIPIENTS = 269;
    const CHUNK_LIMIT = 20;
    const mockRecipients = Array.from({ length: TOTAL_RECIPIENTS }, (_, i) => ({
      nim: `103112400${String(i + 1).padStart(3, '0')}`,
      email: `student${i + 1}@student.telkomuniversity.ac.id`,
    }));

    let offset = 0;
    let iterations = 0;
    const processedNims = new Set();

    while (offset < TOTAL_RECIPIENTS) {
      iterations++;
      const slice = mockRecipients.slice(offset, offset + CHUNK_LIMIT);
      assert.ok(slice.length <= CHUNK_LIMIT);
      slice.forEach((r) => {
        assert.ok(!processedNims.has(r.nim), `Duplicate NIM processed: ${r.nim}`);
        processedNims.add(r.nim);
      });
      offset += slice.length;
    }

    assert.strictEqual(iterations, 14); // 269 / 20 = 13 full chunks + 1 chunk of 9
    assert.strictEqual(processedNims.size, 269);
  });
});
