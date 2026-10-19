import assert from 'node:assert/strict';
import { MorkBorgAdapter } from '../server/MorkBorgAdapter';
import { nativeActor } from './native-alignment.test';

async function run() {
    const actor = nativeActor(); actor.system.abilities.strength.value = -3;
    actor.items = [{ _id: 'w', name: 'Composite', type: 'weapon', system: { weaponType: 'melee', damageDie: '1d6+1', critOn: 20, fumbleOn: 1 } }];
    const formulas: string[] = [];
    const adapter = new MorkBorgAdapter(); adapter.generateRollCard = () => 'card';
    await adapter.performAutomatedSequence({
        async roll(formula: string) { formulas.push(formula); return { _synthetic: true,
            rolls: [JSON.stringify({ formula, total: formulas.length === 1 ? 17 : 10, terms: [] })] }; },
        async sendMessage(data: any) { return data; },
    }, actor, { type: 'attack', itemId: 'w', resolvedFormula: '1d20-3', damageDie: '1d6+1', drModifier: 0, automation: true },
    { manualHitDie: 20, manualDamageDie: 4, baseDR: 12 }, undefined as any);
    // RAW p31: natural 20; preserve +1, then double damage. Not a final-total input.
    assert.deepEqual(formulas, ['20-3', '(4+1) * 2']);
    console.log('morkborg manual natural/composite damage: PASS');
}
run().catch(e => { console.error(e); process.exitCode = 1; });
