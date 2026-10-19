import { createHash } from 'node:crypto';
import { SdkError } from '@sheet-delver/sdk';
import type { ModuleRequestRuntime } from '@sheet-delver/sdk/server';
import { native } from './native';

export interface NativeEntry {
    kind: 'text' | 'Item' | 'Actor'; name: string; description: string;
    uuid?: string; document?: any; tableUuid: string; rowId: string; roll: number;
}
export const contentHash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function documentUuid(document: any, type: string): string {
    if (document.uuid) return document.uuid;
    if (document.pack && document._id) return `Compendium.${document.pack}.${type}.${document._id}`;
    throw new SdkError('not_ready', 'Document has no canonical identity');
}
function projectIdentity(source: any, uuid: string) {
    const projection = structuredClone(source);
    // A hydrated source has no persisted UUID. The successful exact request
    // supplies canonical context without changing the stored document.
    if ((projection._id ?? projection.id) !== uuid.split('.').at(-1)) throw new SdkError('conflict', 'Resolved document identity does not match the requested UUID');
    const canonical = (value: string) => value.replace(/\.(Item|Actor|RollTable|Macro)\.([^.]+)$/, '.$2');
    if (projection.uuid && canonical(projection.uuid) !== canonical(uuid)) throw new SdkError('conflict', 'Resolved document UUID changed');
    if (!projection.uuid) projection.uuid = uuid;
    return projection;
}
/** Request-local orchestration. The SDK owns dice, pack privacy and exact reads. */
export class NativeContent {
    readonly dependencies = new Map<string, string>();
    private evaluated: string[] = [];
    private usedRows = new Map<string, Set<string>>();
    constructor(readonly runtime: ModuleRequestRuntime, private guard: () => Promise<void> = async () => {}) {}
    takeRolls() { return this.evaluated.splice(0); }
    async document(uuid: string): Promise<any> {
        await this.guard();
        const doc = await this.runtime.documents.fetchByUuid(uuid);
        await this.guard();
        if (!doc) throw new SdkError('not_ready', `Required content is unavailable: ${uuid}`);
        const projection = projectIdentity(doc, uuid);
        const hash = contentHash(projection);
        if (this.dependencies.has(uuid) && this.dependencies.get(uuid) !== hash) throw new SdkError('conflict', 'Required content changed during the request');
        this.dependencies.set(uuid, hash);
        return projection;
    }
    async legacy(type: 'Item' | 'RollTable' | 'Macro', reference: string): Promise<any> {
        if (/^(Compendium\.|Item\.|RollTable\.|Macro\.)/.test(reference)) return this.document(reference);
        const parts = reference.split(',').map(s => s.trim());
        if (parts.length !== 2 || !parts.every(Boolean)) throw new SdkError('validation', 'A pack-qualified content reference is required');
        const [pack, name] = parts;
        if (this.runtime.access && !this.runtime.access.canReadPack(pack)) throw new SdkError('permission_denied', 'Required pack is not visible');
        const matches = (await this.runtime.compendium.findAll(type, { name })).filter(d => d.pack === pack && d.name === name);
        if (!matches.length) throw new SdkError('not_ready', `Required ${type} is unavailable in ${pack}`);
        if (matches.length !== 1) throw new SdkError('conflict', `Ambiguous ${type} reference in ${pack}`);
        return this.document(documentUuid(matches[0], type));
    }
    async total(formula: unknown, label: string): Promise<number> {
        if (typeof formula !== 'string' || !formula.trim() || formula.includes('@')) throw new SdkError('not_ready', `Required formula is unavailable: ${label}`);
        await this.guard();
        const result = await this.runtime.rolls.roll(formula, label, { displayChat: false });
        await this.guard();
        if (!Number.isFinite(result.total)) throw new SdkError('not_ready', 'Dice evaluation returned no result');
        this.evaluated.push(...(result.rolls ?? []));
        return result.total;
    }
    async table(uuid: string) {
        const table = await this.document(uuid);
        if (typeof table.formula !== 'string' || !table.formula.trim() || !Array.isArray(table.results) || !table.results.length) throw new SdkError('not_ready', `Invalid or empty table: ${uuid}`);
        for (const row of table.results) if (!Array.isArray(row.range) || row.range.length !== 2 || !row.range.every(Number.isSafeInteger) || row.range[0] > row.range[1]) throw new SdkError('validation', 'Invalid table result range');
        return table;
    }
    async drawFromTable(key: string, override?: number): Promise<NativeEntry[]> {
        const uuid = (native as Record<string, any>)[key] ?? key;
        if (typeof uuid !== 'string') throw new SdkError('validation', 'Unknown table identity');
        return this.draw(uuid, { override });
    }
    async draw(uuid: string, options: { formula?: string; override?: number; path?: string[]; uniqueTotals?: Set<number> } = {}): Promise<NativeEntry[]> {
        const path = options.path ?? [];
        if (path.includes(uuid)) throw new SdkError('conflict', 'Nested table cycle detected');
        const table = await this.table(uuid);
        const used = this.usedRows.get(uuid) ?? new Set<string>();
        const eligible = table.results.filter((row: any) => table.replacement !== false || !row.drawn && !used.has(row._id));
        if (!eligible.length) throw new SdkError('conflict', 'Table results are exhausted');
        if (options.uniqueTotals) {
            const single = (options.formula ?? table.formula).match(/^1?d(\d+)$/i);
            if (!single) throw new SdkError('not_ready', 'Unique-total draws require a supported single-die source formula');
            const faces = Number(single[1]);
            if (!Number.isSafeInteger(faces) || faces < 1 || faces > 100000) throw new SdkError('not_ready', 'Unique-total source die domain is unsupported');
            // This checks exhaustion, not a replacement dice evaluator. The SDK
            // still evaluates the original formula for every attempted total.
            const covered = new Set<number>();
            for (const row of eligible) {
                for (let n = Math.max(1, row.range[0]); n <= Math.min(faces, row.range[1]); n++) covered.add(n);
            }
            if (!covered.size) throw new SdkError('not_ready', 'Unique table has no attainable source-die totals');
            if ([...covered].every(n => options.uniqueTotals!.has(n))) throw new SdkError('conflict', 'Unique table totals exhausted');
        }
        let total: number;
        let matched: any[];
        for (;;) {
            total = options.override ?? await this.total(options.formula ?? table.formula, table.name);
            if (!Number.isFinite(total)) throw new SdkError('validation', 'Invalid manual table total');
            if (options.uniqueTotals?.has(total)) {
                if (options.override !== undefined) throw new SdkError('conflict', 'Manual table total was already selected');
                continue;
            }
            matched = table.results.filter((row: any) => total >= row.range[0] && total <= row.range[1]);
            if (!matched.length) throw new SdkError('not_ready', 'Table formula produced an uncovered result');
            if (matched.some(row => !eligible.includes(row))) {
                if (options.override !== undefined) throw new SdkError('conflict', 'Selected table result is exhausted');
                continue;
            }
            break;
        }
        if (uuid === native.brokenForlornOwl.tableUuid && matched.some(row => row._id === native.brokenForlornOwl.rowId && row.documentUuid === native.brokenForlornOwl.documentUuid)) throw new SdkError('not_ready', 'Native Forlorn Philosopher result references a missing Actor identity. Review the table reference before generation; no substitute was selected.');
        await this.guard();
        const drawn = await this.runtime.tables.draw(uuid, { rollOverride: total });
        await this.guard();
        if (contentHash(projectIdentity(drawn.table, uuid)) !== contentHash(table) || contentHash(drawn.results) !== contentHash(matched)) throw new SdkError('conflict', 'Table content changed while drawing');
        options.uniqueTotals?.add(total);
        const output: NativeEntry[] = [];
        for (const [index, row] of drawn.results.entries()) {
            const rowId = String(row._id ?? index);
            if (table.replacement === false) used.add(rowId);
            const legacy = row.documentCollection && row.documentId ? `${row.documentCollection.startsWith('Compendium.') || ['Item', 'Actor', 'RollTable', 'Macro'].includes(row.documentCollection) ? '' : 'Compendium.'}${row.documentCollection}.${row.documentId}` : undefined;
            const ref = row.documentUuid ?? legacy;
            if (ref) {
                const doc = await this.document(ref);
                if (Array.isArray(doc.results) && typeof doc.formula === 'string') output.push(...await this.draw(ref, { path: [...path, uuid] }));
                else {
                    const kind = ['character', 'creature', 'follower', 'container', 'misery-tracker'].includes(doc.type) && (doc.system?.hp || doc.items || ref.includes('.Actor.')) || /^(Actor\.)/.test(ref) || ref.includes('.Actor.') ? 'Actor' : 'Item';
                    if (doc.type === 'script' || doc.type === 'chat') throw new SdkError('validation', 'Executable table results are unsupported');
                    output.push({ kind, uuid: ref, document: doc, name: doc.name ?? '', description: doc.system?.description ?? '', tableUuid: uuid, rowId, roll: total });
                }
            } else {
                if (row.type === 'document' || row.type === 1 || row.type === 2) throw new SdkError('not_ready', 'Document table result has no exact reference');
                output.push({ kind: 'text', name: row.name ?? '', description: String(row.description ?? row.text ?? row.name ?? ''), tableUuid: uuid, rowId, roll: total });
            }
        }
        this.usedRows.set(uuid, used);
        return output;
    }
    async isReviewedDecoctionFeat(item: any): Promise<boolean> {
        if (!item || item.type !== 'feat' || !item.system?.rollLabel || !item.system?.rollMacro) return false;
        const macro = await this.legacy('Macro', item.system.rollMacro);
        return documentUuid(macro, 'Macro') === native.decoctionMacro
            && createHash('sha256').update(macro.command ?? '').digest('hex') === 'a6d10961ae7aece8592a9ce30a94eace6e7a4a374d592b1826f4e776941abdd7';
    }
}
