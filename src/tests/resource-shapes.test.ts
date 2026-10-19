import assert from 'node:assert/strict';
import { apiRoutes } from '../server/server';
import { nativeActor } from './native-alignment.test';

// Native template.json powerUses/omens include min:0. Actual Foundry 14.367
// merges object updates, retaining min. Live G8 returned a partial-write409
// because the module's expected object had replaced those original fields.
const failures: string[] = [];
for (const type of ['rollPowers', 'rollOmens', 'rest']) {
    const actor = nativeActor();
    actor.system.hp = { value: 5, max: 10 };
    actor.system.powerUses = { value: 1, max: 3, min: 0 };
    actor.system.omens = { value: 0, max: 2, min: 0 };
    actor.system.abilities.presence.value = 2;
    actor.items = [{ _id: 'p693pMIVYXMSRl8S', name: 'Adventurer', type: 'class', system: { omenDie: '1d2' } }];
    const messages: unknown[] = [];
    const merge = (target: any, patch: any) => {
        for (const [path, value] of Object.entries(patch)) {
            const parts = path.split('.'); let node = target;
            for (const key of parts.slice(0, -1)) node = node[key] ??= {};
            const key = parts.at(-1)!;
            if (value && typeof value === 'object' && !Array.isArray(value)) merge(node[key] ??= {}, value);
            else node[key] = structuredClone(value);
        }
    };
    const runtime: any = {
        world: { snapshot: () => ({ identity: { contextRevision: 1 }, settings: Object.fromEntries(['trackCarryingCapacity', 'trackAmmo', 'hitAutomation'].map(k => ['morkborg.' + k, { status: 'world', value: true }])) }), assertRevision() {} },
        documents: {
            get: async () => structuredClone(actor),
            patch: async (_type: string, _id: string, patch: any) => { merge(actor, patch); return structuredClone(actor); },
        },
        rolls: { roll: async (formula: string) => {
            const totals: Record<string, number> = { '1d4+2': 4, '1d2': 2, '1d6': 3 };
            assert.ok(formula in totals, 'Use actual native resource dice');
            return { formula, total: totals[formula], terms: [] };
        } },
        chat: { send: async (message: unknown) => { messages.push(message); return { _id: 'chat' }; } },
    };
    try {
        const response = await apiRoutes['actors/[id]/roll']({ runtime, json: async () => ({ type, key: '', options: type === 'rest' ? { restLength: 'long', foodAndDrink: 'eat', infected: false } : {} }) } as any,
            { params: Promise.resolve({ systemId: 'morkborg', route: ['actors', actor._id, 'roll'] }) });
        assert.equal(response.status, 200, JSON.stringify(await response.json()));
        assert.deepEqual(actor.system.powerUses, type === 'rollOmens' ? { value: 1, max: 3, min: 0 } : { value: 4, max: 4, min: 0 });
        assert.deepEqual(actor.system.omens, type === 'rollPowers' ? { value: 0, max: 2, min: 0 } : { value: 2, max: 2, min: 0 });
        assert.equal(actor.system.hp.value, type === 'rest' ? 8 : 5);
        assert.equal(messages.length, 1);
    } catch (e) { failures.push(`${type}: ${String(e)}`); }
}
assert.deepEqual(failures, []);
console.log('morkborg native resource minimum preservation: PASS');
