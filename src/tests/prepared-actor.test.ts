import { strict as assert } from 'node:assert';
import type { ActorPreparationContext, FoundryActor } from '@sheet-delver/sdk';
import { MorkBorgAdapter } from '../server/MorkBorgAdapter';

const context: Readonly<ActorPreparationContext> = Object.freeze({
    worldEpoch: 1,
    sourceRevision: 3,
    systemId: 'morkborg',
    moduleId: 'morkborg',
    moduleVersion: '0.5',
});

export function run(): void {
    const source = {
        _id: 'scvm',
        name: 'Prepared Scvm',
        type: 'character',
        img: 'icons/scvm.webp',
        systemId: 'morkborg',
        system: {
            hp: { value: 5, max: 7 },
            omens: { value: 1, max: 2 },
            powerUses: { value: 2, max: 4 },
            abilities: {
                strength: { value: 2 },
                agility: { value: 1 },
                presence: { value: 0 },
                toughness: { value: -1 },
            },
            silver: 13,
        },
        items: [
            { _id: 'class', name: 'Fanged Deserter', type: 'class', system: {} },
            { _id: 'weapon', name: 'Femur', type: 'weapon', system: { weight: 2, quantity: 2 } },
        ],
        effects: [],
    } as unknown as FoundryActor;

    const adapter = new MorkBorgAdapter();
    const prepared = adapter.prepareActorData(source, context);

    assert.equal(prepared._id, 'scvm');
    assert.equal(prepared.id, 'scvm');
    assert.equal(prepared.derived.currentHp, 5);
    assert.equal(prepared.derived.maxSlots, 10);
    assert.equal(prepared.derived.slotsUsed, 4);
    assert.deepEqual(prepared.categorizedItems?.weapons.map(item => item.name), ['Femur']);
    assert.equal(adapter.getActorCardData(prepared).blocks?.[0]?.value, 5);
    assert.equal(source.items[1].system.weight, 2);

    console.log('morkborg prepared Actor parity: PASS');
}

if (import.meta.url === `file://${process.argv[1]}`) run();
