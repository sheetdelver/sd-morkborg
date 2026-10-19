import { SdkError, isSdkError } from '@sheet-delver/sdk';
import type { ModuleRequestRuntime } from '@sheet-delver/sdk/server';
import { actorActionFingerprint } from '../logic/rules';
import { planInventoryOperation } from '../logic/inventoryActions';

/** No transaction is claimed. Recheck authority, source and context before each effect. */
export function actorEffects(runtime: ModuleRequestRuntime, source: any, expectedSource?: string, revision?: number) {
    const id = source._id ?? source.id;
    let expected = structuredClone(source);
    let completedWrites = 0;
    const initialRevision = runtime.world?.snapshot().identity.contextRevision;
    if (expectedSource !== undefined && expectedSource !== actorActionFingerprint(source)) throw new SdkError('conflict', 'Actor changed. Refresh and review the action.');
    if (revision !== undefined && initialRevision !== revision) throw new SdkError('conflict', 'World rules changed. Refresh and review the action.');
    async function guard() {
        if (initialRevision !== undefined) runtime.world!.assertRevision(initialRevision);
        const current = await runtime.documents.get('Actor', id, { minOwnership: 'owner' });
        if (!current) throw new SdkError('not_found', 'Actor unavailable');
        if (actorActionFingerprint(current) !== actorActionFingerprint(expected)) throw new SdkError('conflict', 'Actor changed during the action. Refresh before retrying.');
        if (initialRevision !== undefined) runtime.world!.assertRevision(initialRevision);
    }
    function apply(target: any, patch: Record<string, unknown>) {
        for (const [path, value] of Object.entries(patch)) {
            const parts = path.split('.'); let node = target;
            for (const key of parts.slice(0, -1)) node = node[key] ??= {};
            node[parts.at(-1)!] = structuredClone(value);
        }
    }
    async function updateActorItem(_: string, itemId: string, patch: Record<string, unknown>) {
        await guard();
        const result = await runtime.documents.items.update({ type: 'Actor', id }, itemId, patch);
        completedWrites++; apply(expected.items.find((i: any) => (i._id ?? i.id) === itemId), patch);
        return result;
    }
    async function inventory(command: any) {
        // All identities and references validate before any prerequisite updates.
        const steps = planInventoryOperation(expected, command);
        for (const step of steps) {
            if (step.kind === 'update') await updateActorItem(id, step.itemId, step.patch);
            else {
                await guard(); await runtime.documents.items.delete({ type: 'Actor', id }, step.itemId);
                completedWrites++; expected.items = expected.items.filter((i: any) => (i._id ?? i.id) !== step.itemId);
            }
        }
        return { completedWrites };
    }
    return {
        inventory,
        failure(cause: unknown): never {
            if (!completedWrites) throw cause;
            throw new SdkError(isSdkError(cause) ? cause.code : 'internal', `${completedWrites} document write(s) completed before failure. Refresh and inspect before retrying.`, isSdkError(cause) ? cause.status : 500);
        },
        async roll(formula: string, label: string, options: any) { await guard(); return runtime.rolls.roll(formula, label, options); },
        async updateActor(_: string, patch: Record<string, unknown>) {
            await guard(); const result = await runtime.documents.patch('Actor', id, patch);
            completedWrites++; apply(expected, patch); return result;
        },
        updateActorItem,
        async deleteActorItem(_: string, itemId: string) { return inventory({ op: 'delete', itemId }); },
        async sendMessage(message: any, options: any) { await guard(); return runtime.chat.send(message, options); },
    };
}
