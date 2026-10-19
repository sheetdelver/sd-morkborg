import { SdkError } from '@sheet-delver/sdk';
import { containerItemTypes, prepareInventory } from './inventory';

export type InventoryOperation =
    | { op: 'equip' | 'carry'; itemId: string; value: boolean }
    | { op: 'tier'; itemId: string; value: number }
    | { op: 'move'; itemId: string; targetId: string | null }
    | { op: 'delete'; itemId: string };
export type InventoryStep = { kind: 'update'; itemId: string; patch: Record<string, unknown> } | { kind: 'delete'; itemId: string };
export function planInventoryOperation(actor: any, command: InventoryOperation): InventoryStep[] {
    const inv = prepareInventory(actor.items ?? []);
    const item = inv.items.find(i => i.id === command.itemId);
    if (!item) throw new SdkError('not_found', 'Owned Item not found');
    const updates: InventoryStep[] = [];
    const update = (itemId: string, patch: Record<string, unknown>) => updates.push({ kind: 'update', itemId, patch });
    if (command.op === 'equip') {
        if (!['weapon', 'armor', 'shield'].includes(item.type) || typeof command.value !== 'boolean') throw new SdkError('validation', 'Invalid equipment selection');
        if (command.value && ['armor', 'shield'].includes(item.type)) {
            for (const other of inv.items.filter(i => i.type === item.type && i.equipped && i.id !== item.id)) update(other.id, { 'system.equipped': false });
        }
        update(item.id, { 'system.equipped': command.value });
    } else if (command.op === 'carry') {
        if (item.type !== 'container' || item.carryWeight === 0 || typeof command.value !== 'boolean') throw new SdkError('validation', 'This container cannot be carried');
        update(item.id, { 'system.carried': command.value });
    } else if (command.op === 'tier') {
        if (item.type !== 'armor' || !Number.isInteger(command.value) || command.value < 0 || command.value > Number(item.tier.max)) throw new SdkError('validation', 'Tier exceeds this armor maximum');
        update(item.id, { 'system.tier.value': command.value });
    } else if (command.op === 'move' || command.op === 'delete') {
        if (command.op === 'move') {
            const target = command.targetId === null ? null : inv.items.find(i => i.id === command.targetId && i.type === 'container');
            if (!containerItemTypes.includes(item.type) || command.targetId !== null && !target) throw new SdkError('validation', 'Invalid container destination or Item type');
            if (item.containerId === command.targetId) return [];
        }
        for (const container of inv.items.filter(i => i.type === 'container' && i.system.items?.includes(item.id))) update(container.id, { 'system.items': container.system.items.filter((id: string) => id !== item.id) });
        if (command.op === 'delete') updates.push({ kind: 'delete', itemId: item.id });
        else if (command.targetId) {
            const target = inv.items.find(i => i.id === command.targetId)!;
            update(target.id, { 'system.items': [...(target.system.items ?? []), item.id] });
        }
    } else throw new SdkError('validation', 'Unsupported inventory operation');
    return updates;
}
