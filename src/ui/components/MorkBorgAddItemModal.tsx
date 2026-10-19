'use client';
import React, { useMemo, useState } from 'react';
import { useSDK } from '@sheet-delver/sdk/react';
import { useScopedCatalog } from '../hooks/useScopedCatalog';
import MorkBorgRollFrame from './MorkBorgRollFrame';
export interface MorkBorgAddItemModalProps { allowedTypes: string[]; groupBy?: 'type' | 'letter'; onConfirm: (item: any) => void; onClose: () => void }
export default function MorkBorgAddItemModal({ allowedTypes, onConfirm, onClose }: MorkBorgAddItemModalProps) {
    const { resolveImageUrl, isConnected } = useSDK();
    const catalog = useScopedCatalog<{ items: any[] }>(`/api/modules/morkborg/items?types=${encodeURIComponent(allowedTypes.join(','))}`);
    const [search, setSearch] = useState(''), [tab, setTab] = useState('browse');
    const [name, setName] = useState(''), [type, setType] = useState(allowedTypes[0]);
    const items = useMemo(() => (catalog.data?.items ?? []).filter(i => i.name.toLowerCase().includes(search.trim().toLowerCase())).slice().sort((a, b) => a.name.localeCompare(b.name)), [catalog.data, search]);
    return <MorkBorgRollFrame title="Add Item" onClose={onClose} wide>
        <div className="flex gap-4 my-4"><button onClick={() => setTab('browse')}>Browse pack</button><button onClick={() => setTab('custom')}>Custom Item</button></div>
        {tab === 'browse' ? <>
            <label className="text-neutral-300">Search<input aria-label="Search Items" value={search} onChange={e => setSearch(e.target.value)} className="block w-full bg-black border border-pink-700 p-3 my-3" /></label>
            {catalog.status === 'loading' && <p role="status">Loading current Items…</p>}
            {catalog.status === 'failed' && <div role="alert"><p>{catalog.error}</p><button className="bg-pink-700 p-3 my-3" onClick={catalog.retry}>Retry Items</button></div>}
            {catalog.status === 'ready' && <>
                {!items.length && <p>No matching Items in the current visible selection.</p>}
                <ul className="space-y-3">{items.map(item => <li key={item.uuid}>
                    <button className="flex items-center gap-4 border border-pink-900 p-3 w-full text-left" onClick={() => { if (catalog.isCurrent(catalog.generation)) onConfirm({ sourceUuid: item.uuid }); }}>
                        <img src={resolveImageUrl(item.img ?? '')} alt="" className="w-10 h-10 object-contain" /><span>{item.name} <small className="text-pink-400">{item.type}</small></span>
                    </button>
                </li>)}</ul>
            </>}
        </> : <>
            <label className="block my-4">Item name<input aria-label="Custom Item name" value={name} onChange={e => setName(e.target.value)} className="block bg-black border border-pink-700 p-2 w-full mt-1" /></label>
            <label className="block my-4">Type<select aria-label="Custom Item type" value={type} onChange={e => setType(e.target.value)} className="block bg-black border border-pink-700 p-2 w-full mt-1">{allowedTypes.map(t => <option key={t} value={t}>{t}</option>)}</select></label>
            <p className="text-neutral-300 text-sm">Native document creation supplies schema defaults. Configure the Item before using it.</p>
            <button disabled={!name.trim() || !isConnected} onClick={() => onConfirm({ name: name.trim(), type, system: {}, effects: [], flags: {} })} className="w-full bg-pink-700 p-3 my-4 disabled:opacity-40">Create custom Item</button>
        </>}
    </MorkBorgRollFrame>;
}
