import { randomUUID } from 'node:crypto';
import { SdkError, isSdkError } from '@sheet-delver/sdk';
import { json } from '@sheet-delver/sdk/server';
import type { ModuleServerRequest } from '@sheet-delver/sdk/server';
import { NativeContent, contentHash } from '../data/NativeContent';
import { CharacterGeneration, sameIdentity } from '../data/Generation';
import { assertWorldRevision, currentWorld } from '../logic/worldRules';

const creating = new Set<string>();
function scope(req: ModuleServerRequest) {
    const world = req.runtime.world;
    if (!world) throw new SdkError('not_ready', 'World context is unavailable');
    const snapshot = currentWorld(world);
    const user = req.getAccessContext().userId;
    if (!user) throw new SdkError('permission_denied', 'Caller identity is unavailable');
    const guard = async () => { assertWorldRevision(world, snapshot.identity.contextRevision); };
    return { user, snapshot, guard, content: new NativeContent(req.runtime, guard) };
}
export async function classes(req: ModuleServerRequest) {
    const current = scope(req);
    const catalog = await new CharacterGeneration(current.content).catalog();
    await current.guard();
    return json({ classes: catalog.map(c => ({ uuid: c.uuid, name: c.name, img: c.img, description: (c.system as any)?.description ?? '' })), identity: current.snapshot.identity });
}
export async function generate(req: ModuleServerRequest) {
    const current = scope(req);
    const body = await req.json<any>();
    const generated = await new CharacterGeneration(current.content).generate(body?.classUuids, body?.previousClassUuid);
    await current.guard();
    const id = randomUUID();
    await req.runtime.dataStore.set(`candidate.${current.user}.${id}`, { status: 'preview', generated, identity: current.snapshot.identity, created: [] });
    await current.guard();
    return json({ success: true, candidate: { id, generated, identity: current.snapshot.identity } });
}
export async function createCharacter(req: ModuleServerRequest) {
    const current = scope(req);
    const body = await req.json<any>();
    if (typeof body?.candidateId !== 'string' || !/^[0-9a-f-]{36}$/.test(body.candidateId)) throw new SdkError('validation', 'Choose a current generated candidate');
    const key = `candidate.${current.user}.${body.candidateId}`;
    if (creating.has(key)) throw new SdkError('conflict', 'Creation is already running; wait and inspect its result');
    creating.add(key);
    try {
        const candidate: any = await req.runtime.dataStore.get(key);
        if (!candidate) throw new SdkError('not_found', 'Candidate is unavailable; generate a new preview');
        if (candidate.status !== 'preview') {
            const observed = await statusForCandidate(req, candidate, current);
            return json(await observed.json(), { status: candidate.status === 'complete' ? 200 : 409 });
        }
        if (contentHash(candidate.identity) !== contentHash(current.snapshot.identity)) throw new SdkError('conflict', 'Candidate context changed. Generate and review a new preview.');
        const catalog = await new CharacterGeneration(current.content).catalog();
        if (!catalog.some(c => sameIdentity(c.uuid, candidate.generated.classUuid))) throw new SdkError('permission_denied', 'Class is no longer available to this caller');
        for (const [uuid, hash] of Object.entries(candidate.generated.provenance.dependencies)) {
            if (contentHash(await current.content.document(uuid)) !== hash) throw new SdkError('conflict', 'Candidate content changed. Generate and review a new preview.');
        }
        // Public zero-op commit checks the bound write subject/store without creating
        // anything. Native Actor-create permission is enforced by the first create;
        // no broader preflight capability or atomic multi-Actor transaction is claimed.
        await req.runtime.documents.commit('Actor', []);
        await current.guard();
        candidate.status = 'creating';
        await req.runtime.dataStore.set(key, candidate);
        try {
            const documents = [candidate.generated.actor, ...candidate.generated.companions];
            for (const [index, data] of documents.entries()) {
                await current.guard();
                const created = await req.runtime.documents.create('Actor', { ...structuredClone(data), ownership: { default: 0, [current.user]: 3 } });
                const id = created._id ?? created.id;
                if (typeof id !== 'string') throw new SdkError('not_ready', 'Creation returned no document identity; inspect the world before retrying');
                candidate.created.push({ id, name: data.name, type: data.type, index });
                await req.runtime.dataStore.set(key, candidate);
            }
            candidate.status = 'complete';
            await req.runtime.dataStore.set(key, candidate);
            return statusForCandidate(req, candidate, current);
        } catch (cause) {
            candidate.status = 'needs-review';
            await req.runtime.dataStore.set(key, candidate);
            let outcome: any = { status: candidate.status, confirmedWriteCount: candidate.created.length };
            try { outcome = (await (await statusForCandidate(req, candidate, current)).json() as any).outcome; } catch { /* Current access/context no longer permits a cached identity disclosure. */ }
            const status = isSdkError(cause) ? cause.status : 500;
            return json({ success: false, code: isSdkError(cause) ? cause.code : 'internal', error: 'Creation did not finish. Inspect the world and confirmed IDs before recovery; no automatic retry or rollback was attempted.', outcome }, { status });
        }
    } finally { creating.delete(key); }
}

async function statusForCandidate(req: ModuleServerRequest, candidate: any, current: ReturnType<typeof scope>) {
    if (candidate.identity.worldId !== current.snapshot.identity.worldId || candidate.identity.instanceId !== current.snapshot.identity.instanceId) throw new SdkError('conflict', 'Creation belongs to another world');
    const created = [];
    for (const entry of candidate.created) {
        const actor = await req.runtime.documents.get('Actor', entry.id, { minOwnership: 'owner' });
        if (!actor) throw new SdkError('not_found', 'Created Actor is unavailable to this caller');
        created.push({ id: entry.id, name: actor.name, type: actor.type, index: entry.index });
    }
    await current.guard();
    return json({ success: candidate.status === 'complete', outcome: { status: candidate.status, created } });
}
export async function creationStatus(req: ModuleServerRequest) {
    const current = scope(req);
    const body = await req.json<any>();
    if (typeof body?.candidateId !== 'string' || !/^[0-9a-f-]{36}$/.test(body.candidateId)) throw new SdkError('validation', 'Invalid creation identity');
    const candidate = await req.runtime.dataStore.get<any>(`candidate.${current.user}.${body.candidateId}`);
    if (!candidate) throw new SdkError('not_found', 'Creation is unavailable');
    return statusForCandidate(req, candidate, current);
}
