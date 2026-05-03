'use client';

import { useState, useMemo, useEffect } from 'react';

import { Search, Plus, Package, ChevronDown, ChevronRight } from 'lucide-react';
import { mbDataManager } from '../../data/DataManager';
import { useConfig } from '@client/ui/context/ConfigContext';



export interface MorkBorgAddItemModalProps {
    /** The item types allowed, e.g. ['armor','weapon','misc'] or ['feat'] */
    allowedTypes: string[];
    groupBy?: 'type' | 'letter';
    onConfirm: (item: any) => void;
    onClose: () => void;
}

const TYPE_LABELS: Record<string, string> = {
    armor: 'Armor',
    container: 'Container',
    feat: 'Feat',
    misc: 'Misc',
    scroll: 'Scroll',
    shield: 'Shield',
    weapon: 'Weapon',
};

const TYPE_COLORS: Record<string, string> = {
    armor: 'bg-blue-900/60 text-blue-300 border-blue-700',
    container: 'bg-amber-900/60 text-amber-300 border-amber-700',
    feat: 'bg-purple-900/60 text-purple-300 border-purple-700',
    misc: 'bg-neutral-700/60 text-neutral-300 border-neutral-600',
    scroll: 'bg-green-900/60 text-green-300 border-green-700',
    shield: 'bg-cyan-900/60 text-cyan-300 border-cyan-700',
    weapon: 'bg-red-900/60 text-red-300 border-red-700',
};

type TabId = 'browse' | 'custom';

export default function MorkBorgAddItemModal({
    allowedTypes,
    groupBy = 'type',
    onConfirm,
    onClose,
}: MorkBorgAddItemModalProps) {
    const { resolveImageUrl } = useConfig();
    const [tab, setTab] = useState<TabId>('browse');
    const [search, setSearch] = useState('');
    const [customName, setCustomName] = useState('');
    const [customType, setCustomType] = useState(allowedTypes[0] || 'misc');
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

    // Pack items filtered to allowed types
    const packItems = useMemo(
        () => mbDataManager.getItemsByType(allowedTypes).sort((a, b) => a.name.localeCompare(b.name)),
        [allowedTypes]
    );

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        if (!q) return packItems;
        return packItems.filter(item => item.name.toLowerCase().includes(q));
    }, [packItems, search]);

    const groupedItems = useMemo(() => {
        const groups: Record<string, any[]> = {};
        for (const item of filtered) {
            let groupKey = item.type;
            if (groupBy === 'letter') {
                const firstChar = item.name.charAt(0).toUpperCase();
                if (/[A-E]/.test(firstChar)) groupKey = 'A-E';
                else if (/[F-J]/.test(firstChar)) groupKey = 'F-J';
                else if (/[K-O]/.test(firstChar)) groupKey = 'K-O';
                else if (/[P-T]/.test(firstChar)) groupKey = 'P-T';
                else if (/[U-Z]/.test(firstChar)) groupKey = 'U-Z';
                else groupKey = '#';
            }
            if (!groups[groupKey]) groups[groupKey] = [];
            groups[groupKey].push(item);
        }
        return groups;
    }, [filtered, groupBy]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const handleBrowsePick = (item: any) => {
        onConfirm(item);
    };

    const handleCustomCreate = () => {
        if (!customName.trim()) return;
        onConfirm({
            name: customName.trim(),
            type: customType,
            img: '',
            system: {},
            effects: [],
            flags: {},
        });
    };

    return (
        <div
            className="fixed inset-0 z-[200] overflow-y-auto"
            onClick={onClose}
        >
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" aria-hidden="true" />
                <div
                    className="bg-neutral-950 border-2 border-pink-900 shadow-[8px_8px_0_0_#831843] max-w-lg w-full relative -rotate-1 flex flex-col max-h-[90vh] my-8"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-pink-900/50 shrink-0">
                        <h2 className={`$"font-imfell" text-2xl text-yellow-400 uppercase tracking-widest leading-tight`}>
                            Add Item
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-neutral-500 hover:text-white transition-colors text-sm font-mono uppercase tracking-widest cursor-pointer"
                        >
                            ✕ Close
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-pink-900/30 shrink-0">
                        {(['browse', 'custom'] as TabId[]).map(t => (
                            <button
                                key={t}
                                onClick={() => setTab(t)}
                                className={`$"font-imfell" flex-1 py-2 text-lg uppercase tracking-widest transition-colors cursor-pointer ${tab === t
                                    ? 'bg-pink-950 text-yellow-400 border-b-2 border-pink-500'
                                    : 'text-neutral-400 hover:text-neutral-200'
                                    }`}
                            >
                                {t === 'browse' ? (
                                    <span className="flex items-center justify-center gap-2"><Package className="w-4 h-4" /> Browse Pack</span>
                                ) : (
                                    <span className="flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Create Custom</span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    {tab === 'browse' ? (
                        <div className="flex flex-col flex-1 min-h-0">
                            {/* Search */}
                            <div className="px-4 py-3 shrink-0">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                                    <input
                                        autoFocus
                                        type="text"
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        placeholder="Search items…"
                                        className="w-full bg-neutral-900 border border-neutral-700 text-white pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-pink-600 placeholder:text-neutral-500"
                                    />
                                </div>
                                <p className="text-neutral-600 text-xs mt-1">{filtered.length} item{filtered.length !== 1 ? 's' : ''}</p>
                            </div>

                            {/* Item List */}
                            <div className="flex-1 overflow-y-auto min-h-0 px-4 pb-4 space-y-3">
                                {filtered.length === 0 ? (
                                    <p className="text-neutral-500 text-sm text-center py-8 italic">No items found.</p>
                                ) : search.trim() !== '' ? (
                                    <div className="space-y-1">
                                        {filtered.map(item => (
                                            <button
                                                key={item._id}
                                                onClick={() => handleBrowsePick(item)}
                                                className="w-full flex items-center gap-3 p-2 bg-black border border-neutral-800 hover:border-pink-700 hover:bg-neutral-900 transition-all text-left cursor-pointer group"
                                            >
                                                {item.img ? (
                                                    <img
                                                        src={resolveImageUrl(item.img)}
                                                        alt={item.name}
                                                        width={32}
                                                        height={32}
                                                        className="w-8 h-8 object-cover shrink-0 opacity-80 group-hover:opacity-100"
                                                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 bg-neutral-800 shrink-0" />
                                                )}
                                                <div className="flex-1 flex flex-col justify-center">
                                                    <span className="text-neutral-100 text-sm group-hover:text-white">{item.name}</span>
                                                    <span className="text-neutral-500 text-xs uppercase tracking-widest">{item.type}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    Object.entries(groupedItems).sort(([a], [b]) => a.localeCompare(b)).map(([type, items]) => {
                                        const isExpanded = expandedGroups[type];
                                        return (
                                            <div key={type} className="border border-neutral-800">
                                                {/* Group Header */}
                                                <button
                                                    onClick={() => setExpandedGroups(prev => ({ ...prev, [type]: !prev[type] }))}
                                                    className="w-full flex items-center justify-between p-2 bg-black hover:bg-neutral-900 border-b border-pink-900/40 cursor-pointer"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        {isExpanded ? <ChevronDown className="w-4 h-4 text-pink-500" /> : <ChevronRight className="w-4 h-4 text-neutral-500" />}
                                                        <span className={`$"font-imfell" text-xl uppercase tracking-widest text-yellow-400`}>
                                                            {groupBy === 'letter' ? type : (TYPE_LABELS[type] || type)}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs font-mono text-neutral-500">
                                                        {items.length}
                                                    </span>
                                                </button>

                                                {/* Group Items */}
                                                {isExpanded && (
                                                    <div className="p-1 space-y-1 bg-neutral-950">
                                                        {items.map(item => (
                                                            <button
                                                                key={item._id}
                                                                onClick={() => handleBrowsePick(item)}
                                                                className="w-full flex items-center gap-3 p-2 bg-neutral-900/50 hover:bg-pink-950/50 border border-neutral-800 hover:border-pink-700 transition-all text-left cursor-pointer group"
                                                            >
                                                                {item.img ? (
                                                                    <img
                                                                        src={resolveImageUrl(item.img)}
                                                                        alt={item.name}
                                                                        width={32}
                                                                        height={32}
                                                                        className="w-8 h-8 object-cover shrink-0 opacity-80 group-hover:opacity-100"
                                                                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                                    />
                                                                ) : (
                                                                    <div className="w-8 h-8 bg-neutral-800 shrink-0" />
                                                                )}
                                                                <span className="flex-1 text-neutral-100 text-sm group-hover:text-white">{item.name}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    ) : (
                        /* Create Custom */
                        <div className="px-6 py-5 space-y-5 flex-1">
                            {/* Name */}
                            <div>
                                <label className={`$"font-imfell" text-yellow-400 uppercase tracking-widest text-base block mb-2`}>
                                    Name
                                </label>
                                <input
                                    autoFocus
                                    type="text"
                                    value={customName}
                                    onChange={e => setCustomName(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleCustomCreate()}
                                    placeholder="Item name…"
                                    className="w-full bg-neutral-900 border border-neutral-700 text-white px-3 py-2 text-sm focus:outline-none focus:border-pink-600 placeholder:text-neutral-500"
                                />
                            </div>

                            {/* Type */}
                            <div>
                                <label className={`$"font-imfell" text-yellow-400 uppercase tracking-widest text-base block mb-2`}>
                                    Type
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {allowedTypes.map(t => (
                                        <button
                                            key={t}
                                            onClick={() => setCustomType(t)}
                                            className={`$"font-imfell" px-3 py-1 text-base uppercase tracking-widest border transition-all cursor-pointer ${customType === t
                                                ? 'bg-pink-900 border-pink-500 text-white'
                                                : 'bg-neutral-900 border-neutral-700 text-neutral-400 hover:border-neutral-500'
                                                }`}
                                        >
                                            {TYPE_LABELS[t] || t}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Create Button */}
                            <button
                                onClick={handleCustomCreate}
                                disabled={!customName.trim()}
                                className={`$"font-imfell" w-full py-3 text-xl uppercase tracking-widest border-2 transition-all shadow-[4px_4px_0_0_#000] cursor-pointer ${customName.trim()
                                    ? 'bg-pink-900 hover:bg-pink-700 border-pink-500 text-white'
                                    : 'bg-neutral-800 border-neutral-700 text-neutral-600 cursor-not-allowed'
                                    }`}
                            >
                                <Plus className="inline w-5 h-5 mr-2" />
                                Create Item
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
