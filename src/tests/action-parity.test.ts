import assert from 'node:assert/strict';
import { MorkBorgAdapter } from '../server/MorkBorgAdapter';
import { getRollData, withManualDie } from '../logic/rules';
import { nativeActor } from './native-alignment.test';

const adapter = new MorkBorgAdapter();
const context = { worldEpoch: 1, sourceRevision: 1, systemId: 'morkborg',
    world: { identity: { contextRevision: 1 } as any, settings: Object.fromEntries(
        ['trackCarryingCapacity', 'trackAmmo', 'hitAutomation'].map(k => [`morkborg.${k}`, { status: 'world', value: true }])) as any } };
async function combat(kind: 'attack' | 'defend', raw: number, ability: number, damage = '1d6+1', automated = true) {
    const source = nativeActor();
    source.system.abilities.strength.value = ability;
    source.items = [{ _id: 'w', type: 'weapon', name: 'Weapon', system: { damageDie: damage, weaponType: 'melee' } }];
    const actor = adapter.prepareActorData(source as any, context);
    (actor.derived.rules as any)['morkborg.hitAutomation'].value = automated;
    const plan = getRollData(actor, kind === 'attack' ? 'item' : 'defend', kind === 'attack' ? 'w' : '', { rollType: kind });
    const formulas: string[] = []; let result: any;
    adapter.generateRollCard = (_, r) => { result = r; return 'card'; };
    await adapter.performAutomatedSequence({
        async roll(formula: string) {
            formulas.push(formula);
            const total = formulas.length === 1 ? raw + (kind === 'attack' ? ability : 2) : 10;
            return { total, formula, rolls: [JSON.stringify({ formula, total, terms: [] })] };
        }, async updateActor(_id: string, patch: any) { assert.ok(Object.keys(patch).every(k => k.startsWith('flags.morkborg.')), 'combat remembers choices without applying HP'); },
        async sendMessage(m: any) { return m; },
    }, actor, plan, { manualHitDie: raw, manualDefendDie: raw, manualDamageDie: 4,
        manualIncomingDamage: 4, incomingAttack: '1d6+1', baseDR: 12 }, undefined as any);
    return { formulas, result };
}
// RAW p31: natural results, independent of the modified total. Native attack.js
// instead compares modified total 1/20; this is a documented correction.
const crit = await combat('attack', 20, -3);
assert.deepEqual(crit.formulas, ['20-3', '(4+1) * 2']);
assert.match(crit.result.outcomes[0], /CRITICAL/);
const fumble = await combat('attack', 1, 20);
assert.deepEqual(fumble.formulas, ['1+20']);
assert.match(fumble.result.outcomes[0], /FUMBLE/);
const defense = await combat('defend', 1, 0);
assert.deepEqual(defense.formulas, ['1+2', '(4+1) * 2']);
assert.match(defense.result.outcomes[0], /FUMBLE/);
const unautomated = await combat('attack', 12, 2, '1d6+1', false);
assert.equal(unautomated.formulas.length, 1);
assert.match(unautomated.result.outcomes[0], /manually/);
assert.throws(() => withManualDie('2d6+1', 4), /Auto/);
assert.throws(() => withManualDie('1d6+1', 7), /1–6/);
assert.equal(withManualDie('1d6+1', 4), '4+1');

const a = nativeActor();
a.items = [{ _id: 'w', type: 'weapon', system: { damageDie: '1d6', weaponType: 'ranged', carryWeight: 20 } },
    { _id: 'armor', type: 'armor', system: { tier: { value: 1, max: 3 }, equipped: true } }];
const p = adapter.prepareActorData(a as any, context);
assert.equal(getRollData(p, 'item', 'w', { rollType: 'attack' })?.drModifier, 0, 'ranged uses Presence and no carrying DR');
assert.equal(getRollData(p, 'defend', '')?.drModifier, 4, 'armor max penalty + carrying');
assert.equal(getRollData(p, 'ability', 'agility')?.drModifier, 6, 'heavy max Agility + carrying');
assert.equal(getRollData(p, 'item', 'w', { rollType: 'attack' })?.resolvedFormula, '1d20+2');
assert.equal(getRollData(p, 'initiative', 'party')?.resolvedFormula, '1d6');
const remembered = { ...p, flags: { morkborg: { attackDR: 14, defendDR: 10, incomingAttack: '1d8+2', targetArmor: '1d4' } } };
const attackPlan: any = getRollData(remembered, 'item', 'w', { rollType: 'attack' });
const defensePlan: any = getRollData(remembered, 'defend', '');
assert.equal(attackPlan.dr, 14);
assert.equal(attackPlan.targetArmorDefault, '1d4');
assert.equal(defensePlan.dr, 10);
assert.equal(defensePlan.incomingAttackDefault, '1d8+2');
console.log('morkborg native/RAW action parity: PASS');
