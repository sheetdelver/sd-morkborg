import { SdkError, isSdkError } from '@sheet-delver/sdk';
import type { ModuleWorldSnapshot, ModuleWorldContext, WorldSettingResult } from '@sheet-delver/sdk';

/** Compatibility bridge for plain errors observed from the public world context
 * through released Core 0.19.3's request services (installed reproduction in ADR).
 * Exact known failures only: arbitrary backend errors remain sanitized 500s. */
export function normalizeWorldFailure(cause: unknown): unknown {
    if (isSdkError(cause) || !(cause instanceof Error)) return cause;
    if (cause.message === 'World context changed; refresh this action')
        return new SdkError('conflict', 'World rules or access changed. Refresh this action.');
    if (cause.message === 'World context retired' || cause.message === 'World context unavailable')
        return new SdkError('not_ready', 'World context is unavailable. Reconnect and refresh.');
    return cause;
}

export function currentWorld(world: ModuleWorldContext): Readonly<ModuleWorldSnapshot> {
    try { return world.snapshot(); }
    catch (e) { if (isSdkError(e)) throw e; throw new SdkError('not_ready', 'World context is unavailable'); }
}
export function assertWorldRevision(world: ModuleWorldContext, revision: number): void {
    if (currentWorld(world).identity.contextRevision !== revision) throw new SdkError('conflict', 'World rules or access changed. Refresh this action.');
    try { world.assertRevision(revision); }
    catch (e) { if (isSdkError(e)) throw e; throw new SdkError('conflict', 'World rules or access changed. Refresh this action.'); }
}

export type NativeRuleKey = 'trackCarryingCapacity' | 'trackAmmo' | 'hitAutomation' | 'allowedScvmClasses';
export function ruleResult(world: Readonly<ModuleWorldSnapshot> | undefined, key: NativeRuleKey): WorldSettingResult {
    const result = world?.settings[`morkborg.${key}`];
    if (!result) return { status: 'unavailable', reason: 'not-ready' };
    if (result.status !== 'unavailable' && key !== 'allowedScvmClasses' && typeof result.value !== 'boolean') return { status: 'unavailable', reason: 'invalid-value' };
    return result;
}
export function requireRule(world: Readonly<ModuleWorldSnapshot> | undefined, key: NativeRuleKey): any {
    const result = ruleResult(world, key);
    if (result.status === 'unavailable') throw new SdkError('not_ready', `Native setting ${key} is unavailable (${result.reason})`);
    if (key === 'allowedScvmClasses') {
        if (!result.value || typeof result.value !== 'object' || Array.isArray(result.value)
            || Object.values(result.value).some(v => typeof v !== 'boolean')) throw new SdkError('not_ready', 'Invalid class policy');
    } else if (typeof result.value !== 'boolean') throw new SdkError('not_ready', `Invalid setting ${key}`);
    return result.value;
}
