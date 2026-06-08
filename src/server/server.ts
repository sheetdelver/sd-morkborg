/**
 * Mörk Borg Module — Server Routes (ADR-0027 conformed).
 *
 * Generic actor ops (read / field-update / item CRUD) are handled by the PLATFORM actor
 * surface (`/api/actors/...`), now centralized in primary documents + compendia — so this
 * module only exposes the SYSTEM-SPECIFIC routes that have no core equivalent: the roll
 * sequence engine (which also drives brew-decoctions, get-better, etc.), scvm generation,
 * and the compendium item-picker. All
 * run over `req.runtime` (documents/items/rolls/chat/compendium); the old
 * `getModuleFoundryClient` + `dispatchDocumentSocket` reach-ins are gone.
 */

import type { ModuleServerRequest, ModuleServerParams, ModuleRequestRuntime } from '@sheet-delver/sdk/server';
import { json, error } from '@sheet-delver/sdk/server';
import { getErrorMessage } from '@sheet-delver/sdk';
import { MorkBorgAdapter } from './MorkBorgAdapter';
import { getRollData } from '../logic/rules';
import { createMorkBorgData } from '../data/DataManager';

const adapter = new MorkBorgAdapter();

/**
 * Drives the (preserved) mechanics engine over `req.runtime`. The engine calls
 * `roll` / `updateActor` / `createActorItem` / `sendMessage` / `useItem` — this shim maps
 * each onto the runtime (document store / rolls / chat) so the engine body is unchanged.
 * These are document-store operations now; the old Foundry-socket vocabulary is gone.
 */
function engineClient(runtime: ModuleRequestRuntime) {
    return {
        roll: (formula: string, label?: string, opts?: Record<string, unknown>) => runtime.rolls.roll(formula, label, opts),
        // Patch an actor's document via the document store (was a Foundry socket dispatch).
        updateActor: (actorId: string, updates: Record<string, unknown>) => {
            const patch = { ...updates };
            delete patch._id;
            return runtime.documents.patch('Actor', actorId, patch);
        },
        createActorItem: (actorId: string, item: Record<string, unknown>) =>
            runtime.documents.items.create({ type: 'Actor', id: actorId }, item),
        // The engine calls sendMessage both as (data, options) and (data, undefined, options);
        // accept either and forward rollMode/speaker so chat visibility (public/gm/blind/self)
        // is honored.
        sendMessage: (data: Record<string, unknown>, arg2?: any, arg3?: any) => {
            const opts = (arg3 && typeof arg3 === 'object') ? arg3 : (arg2 && typeof arg2 === 'object' ? arg2 : {});
            return runtime.chat.send(data, { rollMode: opts.rollMode, speaker: opts.speaker });
        },
        useItem: (actorId: string, itemId: string) => runtime.chat.useItem(actorId, itemId),
    };
}

async function routeParts(params: ModuleServerParams['params']): Promise<string[]> {
    const { route } = await params;
    return route;
}

/** Normalize the engine's return (HTML card string OR posted-message object) for the client. */
function sequenceResponse(result: unknown) {
    if (typeof result === 'string') return json({ success: true, html: result });
    if (result && typeof result === 'object') return json({ success: true, result });
    return json({ success: true });
}

export const apiRoutes = {
    'actors/[id]/roll': async (req: ModuleServerRequest, { params }: ModuleServerParams) => {
        try {
            const actorId = (await routeParts(params))[1];
            const body = await req.json<any>().catch(() => ({}));
            const { type, key, options } = body;
            const actor = await req.runtime.documents.get('Actor', actorId);
            if (!actor) return error('not_found', 'Actor not found');

            const rollData = getRollData(actor, type, key, options ?? {});
            if (!rollData) return error('validation', `Unknown roll: ${type}/${key}`);

            const data = await createMorkBorgData(req.runtime.compendium);
            const result = await adapter.performAutomatedSequence(engineClient(req.runtime), actor, rollData, options ?? {}, data);
            return sequenceResponse(result);
        } catch (e) {
            return error('internal', getErrorMessage(e));
        }
    },

    'generate-character': async (req: ModuleServerRequest) => {
        try {
            const body = await req.json<any>().catch(() => ({}));
            const data = await createMorkBorgData(req.runtime.compendium);
            const character = data.generateRandomCharacter(body.classInclusion ?? {}, body.previousClassId);
            return json({ success: true, character });
        } catch (e) {
            return error('internal', getErrorMessage(e));
        }
    },

    'items': async (req: ModuleServerRequest) => {
        try {
            const url = new URL(req.url, 'http://local');
            const types = (url.searchParams.get('types') ?? '').split(',').map((s) => s.trim()).filter(Boolean);
            const data = await createMorkBorgData(req.runtime.compendium);
            const items = types.length ? data.getItemsByType(types) : [];
            return json({ items });
        } catch (e) {
            return error('internal', getErrorMessage(e));
        }
    },
};
