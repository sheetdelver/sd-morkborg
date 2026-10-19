import assert from 'node:assert/strict';
import { apiRoutes } from '../server/server';
import { nativeActor } from './native-alignment.test';
// Native attack/defend dialog callbacks persist base DR and selected formula.
// Actual 14.367 browser: baseDR14/target1d2 -> flags.attackDR14/targetArmor1d2.
for (const kind of ['attack', 'defend']) {
    const actor: any = nativeActor();
    actor.system.abilities.strength.value = -3;
    actor.flags = { morkborg: { existing: true } };
    actor.items = [{ _id: 'pLzhbrwoC6FIt9c5', name: 'The Blade of your Ancestors', type: 'weapon', system: { weaponType: 'melee', damageDie: '1d6+1', quantity: 1, carryWeight: 1 } }];
    const runtime: any = {
        world: { snapshot: () => ({ identity: { contextRevision: 1 }, settings: Object.fromEntries(['trackCarryingCapacity','trackAmmo','hitAutomation'].map(k => ['morkborg.' + k, { status: 'world', value: true }])) }), assertRevision() {} },
        documents: { get: async () => structuredClone(actor), patch: async (_t: string, _id: string, patch: any) => {
            for (const [path, value] of Object.entries(patch)) {
                const keys = path.split('.'); let node = actor;
                for (const k of keys.slice(0,-1)) node = node[k] ??= {};
                node[keys.at(-1)!] = value;
            }
            return structuredClone(actor);
        } },
        rolls: { roll: async (formula: string) => {
            const totals: Record<string, number> = { '20-3': 17, '(4+1) * 2': 10, '1+2': 3, '1d2': 1 };
            assert.ok(formula in totals, 'Expected native formula with explicit raw inputs');
            return { formula, total: totals[formula], terms: [] };
        } },
        chat: { send: async () => ({ _id: 'chat' }) },
    };
    const response = await apiRoutes['actors/[id]/roll']({ runtime, json: async () => kind === 'attack'
        ? { type:'item', key:actor.items[0]._id, options:{rollType:'attack',baseDR:14,targetArmor:'1d2',manualHitDie:20,manualDamageDie:4} }
        : { type:'defend', key:'', options:{baseDR:10,incomingAttack:'1d6+1',manualDefendDie:1,manualIncomingDamage:4} } } as any,
        { params: Promise.resolve({systemId:'morkborg',route:['actors',actor._id,'roll']}) });
    assert.equal(response.status,200,JSON.stringify(await response.json()));
    assert.equal(actor.flags.morkborg.existing,true);
    if (kind==='attack') { assert.equal(actor.flags.morkborg.attackDR,14); assert.equal(actor.flags.morkborg.targetArmor,'1d2'); }
    else { assert.equal(actor.flags.morkborg.defendDR,10); assert.equal(actor.flags.morkborg.incomingAttack,'1d6+1'); }
    assert.equal(actor.system.hp.value,5);
}
console.log('morkborg native remembered combat choices: PASS');
