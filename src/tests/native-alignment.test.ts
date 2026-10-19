import assert from 'node:assert/strict';
import { SdkError } from '@sheet-delver/sdk';
import { calculateSlotsUsed, categorizeItems, getRollData } from '../logic/rules';
import { MorkBorgAdapter } from '../server/MorkBorgAdapter';
import { apiRoutes } from '../server/server';

// Oracle: native d850c094, actor/rest.js, get-better.js, powers.js,
// item/item.js, actor/actor.js and schema. Minimal data, no copied pack prose.
export const nativeActor = () => ({
    _id: 'scvm', name: 'Fixture', type: 'character',
    system: { hp: { value: 5, max: 10 }, powerUses: { value: 1, max: 4 },
        omens: { value: 1, max: 2 }, silver: 0,
        abilities: Object.fromEntries(['strength', 'agility', 'presence', 'toughness'].map(k => [k, { value: 2 }])) },
    items: [] as any[],
});

export async function sequence(actor: any, type: string, options: any, totals: number[], extra: any = {}) {
    const patches: any[] = [], formulas: string[] = [], created: any[] = [];
    const adapter = new MorkBorgAdapter();
    adapter.generateRollCard = (_, results) => JSON.stringify(results);
    const client = {
        async roll(formula: string) {
            formulas.push(formula);
            const total = totals.shift();
            assert.notEqual(total, undefined, `Unexpected roll: ${formula}`);
            return { total, formula, rolls: [JSON.stringify({ class: 'Roll', formula, total,
                terms: [{ class: 'Die', faces: 20, results: [{ result: total, active: true }] }] })] };
        },
        async updateActor(_: string, patch: any) { patches.push(patch); },
        async createActorItem(_: string, item: any) { created.push(item); },
        async sendMessage(message: any) { return message; },
    };
    const result = await adapter.performAutomatedSequence(client, actor, { type, ...extra }, options, undefined as any);
    return { patches, formulas, created, result };
}

export async function run() {
    const cases: [string, () => unknown | Promise<unknown>][] = [];
    const test = (name: string, fn: () => unknown | Promise<unknown>) => cases.push([name, fn]);
    test('MB-N01 native carryWeight', () => assert.equal(calculateSlotsUsed([
        { _id: 'w', type: 'weapon', system: { carryWeight: 2, quantity: 2, carried: true } },
    ]), 4));
    test('MB-N02 one canonical ammo ID across equipment groups', () => {
        const g = categorizeItems({ items: [{ _id: 'a', type: 'ammo', name: 'Arrows', system: { quantity: 3 } }] });
        assert.deepEqual([...g.weapons, ...g.armor, ...g.shields, ...g.equipment, ...g.ammo, ...g.uncategorized].map(i => i.id), ['a']);
    });
    test('MB-N04 missing weapon die unavailable', () => {
        const a = nativeActor(); a.items.push({ _id: 'w', type: 'weapon', system: {} });
        assert.throws(() => getRollData(a, 'item', 'w', { rollType: 'attack' }), /damage/i);
    });
    test('MB-N04 unknown action rejected', () => assert.throws(() => getRollData(nativeActor(), 'unknown' as any, ''), /unsupported|unknown/i));
    for (const length of ['short', 'long']) for (const food of ['eat', 'donteat', 'starve']) for (const infected of [false, true]) {
        test(`MB-N05 ${length}/${food}/infected=${infected}`, async () => {
            const heal = food === 'eat' && !infected;
            const totals = length === 'short' ? (heal ? [2] : [])
                : [...(food === 'starve' ? [4] : []), ...(infected ? [6] : []), ...(heal ? [2, 3] : [])];
            const r = await sequence(nativeActor(), 'rest', { restLength: length, foodAndDrink: food, infected }, totals);
            const merged = Object.assign({}, ...r.patches);
            assert.equal(merged['system.hp.value'], heal ? 7 : length === 'long' && (infected || food === 'starve') ? 5 - (food === 'starve' ? 4 : 0) - (infected ? 6 : 0) : undefined);
            if (length !== 'long' || !heal) {
                assert.equal(merged['system.powerUses.value'], undefined);
                assert.equal(merged['system.powerUses.max'], undefined);
            }
            assert.equal(totals.length, 0, 'consume precisely the native rolls');
        });
    }
    test('MB-N06 advancement equality preserves current HP', async () => {
        const r = await sequence(nativeActor(), 'getBetter', {}, [10, 2, 2, 2, 2, 2, 1]);
        const p = Object.assign({}, ...r.patches);
        assert.equal(p['system.hp.max'], 12);
        assert.equal(p['system.hp.value'], undefined);
        for (const k of ['strength', 'agility', 'presence', 'toughness']) assert.equal(p[`system.abilities.${k}.value`], 3);
        assert.equal(r.created.length, 0);
    });
    test('MB-N07 medium armor does not consume a power without a roll', async () => {
        const a = nativeActor(); a.items.push({ _id: 'armor', type: 'armor', system: { equipped: true, tier: { value: 2, max: 2 } } });
        const r = await sequence(a, 'power', {}, [15]);
        assert.deepEqual(r.formulas, ['1d20+2']);
    });
    test('MB-N07 failed power gives instructions, no HP patch', async () => {
        const r = await sequence(nativeActor(), 'power', {}, [5, 2]);
        assert.equal(Object.assign({}, ...r.patches)['system.hp.value'], undefined);
    });
    test('MB-C01 typed route errors', async () => {
        for (const [code, status] of [['permission_denied', 403], ['not_found', 404], ['conflict', 409], ['not_ready', 503]] as const) {
            const response = await apiRoutes['actors/[id]/roll']({ json: async () => ({ type: 'ability', key: 'strength' }),
                runtime: { documents: { get: async () => { throw new SdkError(code, 'Fixture'); } } } } as any,
            { params: Promise.resolve({ systemId: 'morkborg', route: ['actors', 'scvm', 'roll'] }) });
            assert.equal(response.status, status);
        }
    });
    test('MB-C02 empty catalogs cannot generate a character', async () => {
        const response = await apiRoutes['generate-character']({ json: async () => ({}),
            runtime: { compendium: { findAll: async () => [] } } } as any);
        assert.equal(response.status, 503);
    });
    let failures = 0;
    for (const [name, fn] of cases) {
        try { await fn(); console.log(`PASS ${name}`); }
        catch (e) { failures++; console.error(`FAIL ${name}: ${e instanceof Error ? e.message : e}`); }
    }
    assert.equal(failures, 0, `${failures}/${cases.length} native alignment regressions failed`);
}
if (import.meta.url === `file://${process.argv[1]}`) run().catch(e => { console.error(e.message); process.exitCode = 1; });
