'use client';
import React, { useMemo, useState } from 'react';
import { useSDK } from '@sheet-delver/sdk/react';
import { useScopedCatalog } from '../hooks/useScopedCatalog';
import MorkBorgRollFrame from './MorkBorgRollFrame';
export interface MorkBorgAddItemModalProps { allowedTypes: string[]; groupBy?: 'type' | 'letter'; onConfirm: (item: any) => void; onClose: () => void }
export default function MorkBorgAddItemModal({ allowedTypes, groupBy = 'type', onConfirm, onClose }: MorkBorgAddItemModalProps) {
    const { resolveImageUrl, isConnected } = useSDK();
    const catalog = useScopedCatalog<{ items: any[] }>(`/api/modules/morkborg/items?types=${encodeURIComponent(allowedTypes.join(','))}`);
    const [search, setSearch] = useState(''), [tab, setTab] = useState('browse');
    const [name, setName] = useState(''), [type, setType] = useState(allowedTypes[0]);
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const items = useMemo(() => (catalog.data?.items ?? []).filter(i => i.name.toLowerCase().includes(search.trim().toLowerCase())).slice().sort((a, b) => a.name.localeCompare(b.name)), [catalog.data, search]);
    const groups = useMemo(() => {
        const result: Record<string, any[]> = {};
        for (const item of items) {
            const letter = item.name.charAt(0).toUpperCase();
            const key = groupBy === 'letter'
                ? ['A-E', 'F-J', 'K-O', 'P-T', 'U-Z'].find(range => letter >= range[0] && letter <= range[2]) ?? '#'
                : item.type;
            (result[key] ??= []).push(item);
        }
        return Object.entries(result).sort(([a], [b]) => a.localeCompare(b));
    }, [items, groupBy]);
    const itemRows = (rows: any[]) => <ul className="space-y-1">{rows.map(item => <li key={item.uuid}>
        <button className="flex items-center gap-3 bg-black border border-neutral-800 hover:border-pink-700 p-2 w-full text-left" onClick={() => { if (catalog.isCurrent(catalog.generation)) onConfirm({ sourceUuid: item.uuid }); }}>
            <img src={resolveImageUrl(item.img ?? '')} alt="" className="w-8 h-8 object-contain shrink-0" /><span className="min-w-0 break-words">{item.name} <small className="text-pink-400">{item.type}</small></span>
        </button>
    </li>)}</ul>;
    return <MorkBorgRollFrame title="Add Item" onClose={onClose} wide>
        <div className="mb-form-tabs my-4"><button aria-pressed={tab === 'browse'} onClick={() => setTab('browse')}>Browse pack</button><button aria-pressed={tab === 'custom'} onClick={() => setTab('custom')}>Custom Item</button></div>
        {tab === 'browse' ? <>
            <label className="text-neutral-300">Search<input aria-label="Search Items" value={search} onChange={e => setSearch(e.target.value)} className="block w-full bg-black border border-pink-700 p-3 my-3" /></label>
            <div className="mb-catalog-results" aria-label="Available Items" aria-busy={catalog.status === 'loading'}>
            {catalog.status === 'loading' && <p role="status">Loading current Items…</p>}
            {catalog.status === 'failed' && <div role="alert"><p>{catalog.error}</p><button className="bg-pink-700 p-3 my-3" onClick={catalog.retry}>Retry Items</button></div>}
            {catalog.status === 'ready' && <>
                {!items.length && <p>No matching Items in the current visible selection.</p>}
                {search.trim() ? itemRows(items) : groups.map(([key, rows]) => <section key={key} className="border border-neutral-800 mb-3">
                    <button type="button" aria-label={`Toggle ${key} Items`} aria-expanded={!!expanded[key]} onClick={() => setExpanded(old => ({ ...old, [key]: !old[key] }))} className="flex items-center justify-between gap-3 p-2 w-full bg-black text-yellow-400">
                        <span className="font-imfell uppercase tracking-widest"><span aria-hidden="true">{expanded[key] ? '▾' : '▸'} </span>{key}</span><span className="text-neutral-400 text-xs font-mono">{rows.length}</span>
                    </button>
                    {expanded[key] && itemRows(rows)}
                </section>)}
            </>}
            </div>
        </> : <>
            <label className="block my-4">Item name<input aria-label="Custom Item name" value={name} onChange={e => setName(e.target.value)} className="block bg-black border border-pink-700 p-2 w-full mt-1" /></label>
            <label className="block my-4">Type<select aria-label="Custom Item type" value={type} onChange={e => setType(e.target.value)} className="block bg-black border border-pink-700 p-2 w-full mt-1">{allowedTypes.map(t => <option key={t} value={t}>{t}</option>)}</select></label>
            <p className="text-neutral-300 text-sm">Native document creation supplies schema defaults. Configure the Item before using it.</p>
            <button disabled={!name.trim() || !isConnected} onClick={() => onConfirm({ name: name.trim(), type, system: {}, effects: [], flags: {} })} className="mb-action-button w-full my-4">Create custom Item</button>
        </>}
    </MorkBorgRollFrame>;
}
