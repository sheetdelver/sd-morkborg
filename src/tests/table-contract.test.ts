import assert from 'node:assert/strict';
import { SdkError } from '@sheet-delver/sdk';
import { NativeContent } from '../data/NativeContent';

const uuid = 'RollTable.fixture';
let source: any = { _id: 'fixture', name: 'Fixture', formula: '2d6', replacement: true, results: [
    { _id: 'low', type: 'text', description: 'low', range: [2, 6] },
    { _id: 'high', type: 'text', description: 'high', range: [7, 12] },
] };
const docs = new Map<string, any>();
let totals = [12], formulas: string[] = [], overrides: number[] = [];
const runtime: any = {
    documents: { async fetchByUuid(ref: string) { if (ref === uuid) return structuredClone(source); return structuredClone(docs.get(ref) ?? null); } },
    rolls: { async roll(formula: string, _label: string, opts: any) { assert.equal(opts.displayChat, false); formulas.push(formula); const total = totals.shift(); assert.notEqual(total, undefined); return { total, rolls: [JSON.stringify({ formula, total })] }; } },
    tables: { async draw(ref: string, opts: any) { assert.equal(ref, uuid); overrides.push(opts.rollOverride); return { table: structuredClone(source), results: source.results.filter((r: any) => opts.rollOverride >= r.range[0] && opts.rollOverride <= r.range[1]), roll: opts.rollOverride, formula: source.formula, items: [] }; } },
};
let service = new NativeContent(runtime);
assert.deepEqual((await service.draw(uuid)).map(e => e.description), ['high']);
assert.deepEqual(formulas, ['2d6']); assert.deepEqual(overrides, [12]);
assert.equal(service.takeRolls().length, 1);
source = { ...source, formula: '1d1', results: [
    { _id: 'b', type: 'document', name: 'Twin', documentUuid: 'Item.b', range: [1, 1] },
    { _id: 'text', type: 'text', description: 'Additional text', range: [1, 1] },
    { _id: 'npc', type: 'document', documentUuid: 'Actor.donkey', range: [1, 1] },
] };
docs.set('Item.a', { _id: 'a', name: 'Twin', type: 'weapon', system: { damageDie: '1d4' } });
docs.set('Item.b', { _id: 'b', name: 'Twin', type: 'weapon', system: { damageDie: '1d12' } });
docs.set('Actor.donkey', { _id: 'donkey', name: 'Companion', type: 'container', items: [], system: {} });
service = new NativeContent(runtime);
const entries = await service.draw(uuid, { override: 1 });
assert.deepEqual(entries.map(e => e.kind), ['Item', 'text', 'Actor']);
assert.equal(entries[0].document._id, 'b', 'exact ID wins over identical name');
source.results = [{ _id: 'missing', type: 'document', documentUuid: 'Item.missing', range: [1, 1] }];
service = new NativeContent(runtime);
await assert.rejects(() => service.draw(uuid, { override: 1 }), /unavailable/);
source.results = [{ _id: 'cycle', type: 'document', documentUuid: uuid, range: [1, 1] }];
service = new NativeContent(runtime);
await assert.rejects(() => service.draw(uuid, { override: 1 }), /cycle/);
source = { ...source, formula: '1d2', results: [
    { _id: 'one', type: 'text', description: 'same name', range: [1, 1] },
    { _id: 'two', type: 'text', description: 'same name', range: [2, 2] },
] };
service = new NativeContent(runtime);
totals = [1, 1, 2]; const selected = new Set<number>();
assert.equal((await service.draw(uuid, { uniqueTotals: selected }))[0].roll, 1);
assert.equal((await service.draw(uuid, { uniqueTotals: selected }))[0].roll, 2);
await assert.rejects(() => service.draw(uuid, { uniqueTotals: selected }), /exhausted/);
source.replacement = false;
const depleted = new NativeContent(runtime);
await depleted.draw(uuid, { override: 1 });
await assert.rejects(() => depleted.draw(uuid, { override: 1 }), /exhausted/);
source.formula = '';
service = new NativeContent(runtime);
const before = formulas.length;
await assert.rejects(() => service.draw(uuid), /Invalid/);
assert.equal(formulas.length, before, 'no fallback dice for invalid table');
const denied = new NativeContent({ ...runtime, documents: { fetchByUuid: async () => { throw new SdkError('permission_denied', 'Denied'); } } });
await assert.rejects(() => denied.draw(uuid), (e: any) => e.code === 'permission_denied');
console.log('morkborg SDK table identity/selection contract: PASS');
// Single-die uniqueness is bounded by attainable totals, even when one native
// row covers a wider range. Never reroll forever for totals the die cannot reach.
source = { ...source, formula: '1d2', replacement: true, results: [
    { _id: 'wide', type: 'text', description: 'wide range', range: [1, 100] },
] };
const diceBeforeExhaustion = formulas.length;
await assert.rejects(() => new NativeContent(runtime).draw(uuid, { uniqueTotals: new Set([1, 2]) }), /exhausted/);
assert.equal(formulas.length, diceBeforeExhaustion, 'attainable domain exhausted before any retry');
