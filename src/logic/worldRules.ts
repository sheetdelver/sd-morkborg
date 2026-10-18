import { SdkError } from '@sheet-delver/sdk';
import type { ModuleWorldSnapshot, WorldSettingResult } from '@sheet-delver/sdk';

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
