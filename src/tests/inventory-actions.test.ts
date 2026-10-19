import assert from 'node:assert/strict';
import { SdkError } from '@sheet-delver/sdk';
import { actorEffects } from '../server/actorEffects';
import { actorActionFingerprint } from '../logic/rules';
import { planInventoryOperation } from '../logic/inventoryActions';
import { nativeActor } from './native-alignment.test';

const a = nativeActor();
a.items = [
    { _id: 'bag', type: 'container', system: { items: ['ammo'] } },
    { _id: 'ammo', type: 'ammo', name: 'Twin', system: { quantity: 3 } },
    { _id: 'other', type: 'ammo', name: 'Twin', system: { quantity: 4, flags: 'distinct' } },
    { _id: 'first', type: 'armor', system: { tier: { value: 1, max: 1 }, equipped: true } },
    { _id: 'second', type: 'armor', system: { tier: { value: 2, max: 2 } } },
];
assert.deepEqual(planInventoryOperation(a, { op: 'equip', itemId: 'second', value: true }).map(s => s.itemId), ['first', 'second']);
assert.throws(() => planInventoryOperation(a, { op: 'tier', itemId: 'first', value: 2 }), /maximum/);
assert.throws(() => planInventoryOperation(a, { op: 'move', itemId: 'bag', targetId: 'bag' }), /Invalid/);
const before = structuredClone(a);
let deletes = 0;
const runtime = { documents: {
    get: async () => structuredClone(a),
    items: { update: async () => { throw new SdkError('conflict', 'Update failed'); }, delete: async () => { deletes++; } },
} } as any;
const effects = actorEffects(runtime, a, actorActionFingerprint(a));
await assert.rejects(() => effects.inventory({ op: 'delete', itemId: 'ammo' }), /Update failed/);
assert.equal(deletes, 0, 'failed membership update prevents deletion');
assert.deepEqual(a, before, 'same-name distinct sources preserved');
assert.throws(() => actorEffects(runtime, a, 'stale'), /Actor changed/);
a.system.hp.value = 4;
await assert.rejects(() => effects.inventory({ op: 'delete', itemId: 'other' }), /Actor changed/);
assert.equal(deletes, 0);
console.log('morkborg inventory write safety: PASS');
