'use client';

import React, { useId, useState } from 'react';
import type { InitiativeRollModalProps } from '@sheet-delver/sdk/react';
import MorkBorgRollFrame, { RollEntryMode } from './MorkBorgRollFrame';
import { morkborgTheme } from '../themes/morkborg';

/** Presentation only: no sheet rules, raw-die math, formula edits or transports. */
export default function MorkBorgInitiativeModal(props: InitiativeRollModalProps) {
    const [manual, setManual] = useState(!props.rollAvailable);
    const [total, setTotal] = useState('');
    const inputId = useId();
    if (!props.isOpen) return null;
    const value = total.trim() ? Number(total) : Number.NaN;
    const t = morkborgTheme.rollDialog;
    return <MorkBorgRollFrame title={props.title} subtitle={props.combatantName} onClose={props.onClose}>
        <RollEntryMode manual={manual} onChange={setManual} canAuto={props.rollAvailable} canManual={props.manualAvailable} />
        <div className={t.section}>
            <span className={t.label}>Formula</span>
            <code className={`${t.formulaResult} break-words`}>{props.formula || 'Unavailable'}</code>
            <p className={t.formulaBreakdown}>Source: {props.source === 'module' ? 'System module' : props.source === 'gm' ? 'GM setting' : 'Core fallback'}</p>
        </div>
        <div className="mb-5">
            <span className={t.label}>Roll Mode</span>
            <span className="text-white font-mono text-sm">{props.audience === 'gm' ? 'Private GM Roll' : 'Public Roll'}</span>
        </div>
        {manual && props.manualAvailable && <div className="mb-4">
            <label className={t.label} htmlFor={inputId}>Final initiative total</label>
            <input id={inputId} type="number" step="any" value={total} onChange={event => setTotal(event.target.value)}
                className="w-full bg-neutral-900 border border-pink-900/60 focus:border-pink-500 text-white text-2xl font-mono text-center py-3 focus:outline-none" />
        </div>}
        <div className="flex gap-3">
            {manual && props.manualAvailable ? <button type="button" aria-label="Submit total" disabled={!Number.isFinite(value)}
                className={`${t.confirmBtn} disabled:opacity-50`} onClick={() => props.onConfirm({ kind: 'manual', total: value })}>Submit</button>
                : props.rollAvailable && <button type="button" aria-label="Roll initiative" className={t.confirmBtn}
                    onClick={() => props.onConfirm({ kind: 'roll' })}>Roll</button>}
            <button type="button" className={t.cancelBtn} onClick={props.onClose}>Cancel</button>
        </div>
        {!manual && props.rollAvailable && props.advantageAvailable && <div className={`${t.advantageGroup} mt-4`}>
            <button type="button" className={`${t.advantageBtn} ${t.advantageBtnInactive}`}
                onClick={() => props.onConfirm({ kind: 'roll', advantageMode: 'advantage' })}>Advantage</button>
            <button type="button" className={`${t.advantageBtn} ${t.advantageBtnInactive}`}
                onClick={() => props.onConfirm({ kind: 'roll', advantageMode: 'disadvantage' })}>Disadvantage</button>
        </div>}
    </MorkBorgRollFrame>;
}
