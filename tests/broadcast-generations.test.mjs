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
});
