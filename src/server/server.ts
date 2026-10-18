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
import { isSdkError, SdkError } from '@sheet-delver/sdk';
import { MorkBorgAdapter } from './MorkBorgAdapter';
import { getRollData } from '../logic/rules';
import { createMorkBorgData } from '../data/DataManager';

const adapter = new MorkBorgAdapter();

function routeError(cause: unknown) {
    return isSdkError(cause) ? error(cause.code, cause.message, cause.status)
        : error('internal', 'Mörk Borg operation failed. Refresh before retrying.');
}

function validateBody(body: any) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new SdkError('validation', 'Expected a command object');
    if (typeof body.type !== 'string' || typeof body.key !== 'string') throw new SdkError('validation', 'Command type and key are required');
    const options = body.options ?? {};
    if (!options || typeof options !== 'object' || Array.isArray(options)) throw new SdkError('validation', 'Invalid options');
    if (options.rollMode !== undefined && !['publicroll', 'gmroll', 'blindroll', 'selfroll'].includes(options.rollMode)) throw new SdkError('validation', 'Invalid roll visibility');
    if (options.rollAdvantageMode && options.rollAdvantageMode !== 'normal') throw new SdkError('validation', 'Advantage is unsupported');
    for (const key of ['manualHitDie', 'manualDefendDie', 'manualDamageDie', 'manualIncomingDamage']) {
        if (options[key] !== undefined && (!Number.isSafeInteger(options[key]) || options[key] < 0)) throw new SdkError('validation', `Invalid ${key}`);
    }
    if (options.manualData?.dieResult !== undefined && !Number.isSafeInteger(options.manualData.dieResult)) throw new SdkError('validation', 'Invalid manual die');
    return options;
}

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
            const body = await req.json<any>();
            const options = validateBody(body);
            const { type, key } = body;
            const actor = await req.runtime.documents.get('Actor', actorId, { minOwnership: 'owner' });
            if (!actor) return error('not_found', 'Actor not found');
            if (actor.type !== 'character') return error('validation', 'Character actions are unsupported for this Actor type');
            if (options.speaker?.actor && options.speaker.actor !== actorId) return error('validation', 'Speaker must be the selected Actor');
            options.speaker = { actor: actorId, alias: actor.name };

            const rollData = getRollData(actor, type, key, options ?? {});
            if (!rollData) return error('validation', `Unknown roll: ${type}/${key}`);

            const needsContent = ['broken', 'getBetter', 'decoctions', 'power'].includes(rollData.type);
            const data = needsContent ? await createMorkBorgData(req.runtime.compendium) : undefined;
            const result = await adapter.performAutomatedSequence(engineClient(req.runtime), actor, rollData, options ?? {}, data!);
            return sequenceResponse(result);
        } catch (e) {
            return routeError(e);
        }
    },

    'generate-character': async (req: ModuleServerRequest) => {
        try {
            const body = await req.json<any>().catch(() => ({}));
            const data = await createMorkBorgData(req.runtime.compendium);
            const character = await data.generateRandomCharacter(body.classInclusion ?? {}, body.previousClassId);
            return json({ success: true, character });
        } catch (e) {
            return routeError(e);
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
            return routeError(e);
        }
    },
};
