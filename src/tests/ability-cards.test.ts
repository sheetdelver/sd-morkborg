import assert from 'node:assert/strict';
import { parseRollResult } from '@sheet-delver/sdk';
import { MorkBorgAdapter } from '../server/MorkBorgAdapter';
import { getRollData } from '../logic/rules';

const adapter = new MorkBorgAdapter();
const actor = adapter.prepareActorData({ _id: 'a1', type: 'character', name: 'Card fixture',
    system: { abilities: Object.fromEntries(['strength', 'agility', 'presence', 'toughness'].map(k => [k, { value: 1 }])) },
    items: [],
} as any, { world: { identity: { contextRevision: 1 }, settings: { 'morkborg.trackCarryingCapacity': { status: 'world', value: true } } } } as any);
let failures = 0;
for (const key of ['strength', 'agility', 'presence', 'toughness']) {
    try {
        for (const mode of ['publicroll', 'gmroll', 'blindroll', 'selfroll']) {
            const plan = getRollData(actor, 'ability', key)!;
            const sends: any[] = [];
            const client = {
                async roll(formula: string, _label: string, options: any) {
                    assert.equal(formula, '1d20+1', 'equal formulas must retain distinct validated identities');
                    assert.equal(options.displayChat, false);
                    return parseRollResult({ _synthetic: true, rolls: [JSON.stringify({ class: 'Roll', formula, total: 13, evaluated: true,
                        terms: [{ class: 'Die', number: 1, faces: 20, results: [{ result: 12, active: true }], options: {} }] })] }, formula);
                },
                async sendMessage(message: any, options: any) { sends.push({ message, options }); return { _id: 'chat' }; },
                async updateActor() { assert.fail('ability tests do not write resources'); },
                async updateActorItem() { assert.fail('ability tests do not write inventory'); },
            };
            const before = JSON.stringify(actor);
            await adapter.performAutomatedSequence(client, actor, plan, { rollMode: mode }, undefined as never);
            assert.equal(sends.length, 1);
            assert.deepEqual(sends[0].options, { rollMode: mode, speaker: { actor: 'a1', alias: 'Card fixture' } });
            assert.equal(sends[0].message.rolls.length, 1);
            assert.match(sends[0].message.content, new RegExp(`Test ${key[0].toUpperCase() + key.slice(1)}`), 'actual rendered card names its ability');
            assert.equal(JSON.stringify(actor), before);
        }
        console.log(`ability cards ${key}: PASS`);
    } catch (error) { failures++; console.error(`ability cards ${key}: FAIL`, error); }
}
assert.throws(() => getRollData(actor, 'ability', 'unknown'), /Unknown ability/);
assert.equal(failures, 0, 'all four actual ability cards must identify their shared-plan ability');
