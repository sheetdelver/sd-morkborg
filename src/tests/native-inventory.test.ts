import assert from 'node:assert/strict';
import { MorkBorgAdapter } from '../server/MorkBorgAdapter';
import { nativeActor } from './native-alignment.test';

// Native getters round each stack before adding. Container contents count once;
// containerSpace is independent of carryWeight. Source zero quantity remains zero,
// while the native weight getter uses quantity || 1.
const actor = nativeActor();
actor.items = [
    { _id: 'pack', type: 'container', system: { carryWeight: 1, containerSpace: 0, quantity: 1, carried: true, items: ['ammo'] } },
    { _id: 'ammo', type: 'ammo', system: { carryWeight: 0.2, containerSpace: 0.5, quantity: 3 } },
    { _id: 'donkey', type: 'container', system: { carryWeight: 0, quantity: 1, carried: true, items: ['tool'] } },
    { _id: 'tool', type: 'misc', system: { carryWeight: 2, containerSpace: 1, quantity: 2 } },
    { _id: 'zero', type: 'misc', system: { carryWeight: 0.2, containerSpace: 0.1, quantity: 0 } },
    { _id: 'light', type: 'armor', system: { tier: { value: '1', max: '3' }, equipped: true } },
    { _id: 'heavy', type: 'armor', system: { tier: { value: 3, max: 3 }, equipped: true } },
    { _id: 'legacy', type: 'weapon', system: { handed: '2h', carryWeight: 0, quantity: 1 } },
];
const before = structuredClone(actor);
const adapter = new MorkBorgAdapter();
const prepare = (status: string, value?: unknown, revision = 1) => adapter.prepareActorData(actor as any, {
    worldEpoch: 1, sourceRevision: 1, systemId: 'morkborg',
    world: { identity: { contextRevision: revision } as any,
        settings: { 'morkborg.trackCarryingCapacity': { status, value } as any } },
});
const prepared = prepare('world', true);
assert.equal(prepared.derived.slotsUsed, 3, 'native carrying total');
const inv = prepared.derived.inventory as any;
assert.equal(inv.slotsUsed, 3, 'pack 1 + rounded ammo 1 + rounded zero stack 1; donkey contents excluded');
assert.equal(inv.items.find((i: any) => i.id === 'pack').totalContainerSpace, 2);
assert.equal(inv.items.find((i: any) => i.id === 'ammo').containerId, 'pack');
assert.equal(inv.items.find((i: any) => i.id === 'zero').quantity, 0);
assert.equal(inv.items.find((i: any) => i.id === 'legacy').handed, 2);
assert.equal(inv.armor.id, 'light', 'first equipped armor, not highest tier');
assert.equal(inv.reduction, '1d2');
assert.equal(inv.defenseModifier, 2, 'penalty uses maximum tier');
assert.equal(inv.agilityModifier, 4);
assert.equal(prepare('unavailable').derived.encumbered, null);
actor.items[0].system.carryWeight = 20;
assert.equal(prepare('world', true, 2).derived.encumbered, true);
assert.equal(prepare('world', false, 3).derived.encumbered, false);
assert.equal(prepare('registered-default', true, 4).derived.encumbered, true);
actor.items[0].system.carryWeight = 1;
assert.deepEqual(actor, before, 'preparation preserves all original source fields');
actor.items[0].system.items.push('missing');
assert.throws(() => prepare('world', true), /Missing.*Item/);
actor.items[0].system.items = ['donkey'];
assert.throws(() => prepare('world', true), /nested/);
console.log('morkborg native inventory/settings preparation: PASS');
