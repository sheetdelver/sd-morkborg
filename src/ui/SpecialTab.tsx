import React, { useState } from 'react';
import { type MorkBorgRollType, type MorkBorgRollOptions } from './types';
import { Sparkles, FlaskConical, Pencil, Trash2, ShieldPlus, ChevronRight, Info } from 'lucide-react';
import ItemModal from './components/ItemModal';
import ItemInfoModal from './components/ItemInfoModal';
import MorkBorgAddItemModal from './components/MorkBorgAddItemModal';

interface SpecialTabProps {
    actor: any;
    onRoll: (type: MorkBorgRollType, key: string, options?: MorkBorgRollOptions) => void;
    onUpdate: (path: string, value: any) => void;
    onDeleteItem: (itemId: string) => void;
    onCreateItem?: (itemData: any) => void;
}

export default function SpecialTab({ actor, onRoll, onUpdate, onDeleteItem, onCreateItem }: SpecialTabProps) {
    // Occult Herbmaster is a 'class' type item in Mörk Borg (not a 'feat')
    const allItems = [
        ...(actor.items?.feats || []),
        ...(actor.items?.classes || []),
        ...(actor.items?.uncategorized || [])
    ];
    const hasOccultHerbmaster = allItems.some((i: any) => i.name === 'Occult Herbmaster');

    const [itemModalConfig, setItemModalConfig] = useState<{ isOpen: boolean; item: any }>({
        isOpen: false,
        item: null
    });
    const [infoModalConfig, setInfoModalConfig] = useState<{ isOpen: boolean; item: any }>({
        isOpen: false,
        item: null
    });
    const [addModal, setAddModal] = useState(false);

    const openItemModal = (item: any) => {
        setItemModalConfig({
            isOpen: true,
            item
        });
    };

    const openInfoModal = (item: any) => {
        setInfoModalConfig({
            isOpen: true,
            item
        });
    };

    const handleUpdateItem = (path: string, value: any) => {
        if (!itemModalConfig.item) return;
        onUpdate(`items.${itemModalConfig.item._id || itemModalConfig.item.id}.${path}`, value);
    };

    const renderItemRow = (item: any, index: number, buttonLabel: string, actionType: 'feat' | 'item' = 'item') => {
        const handleAction = () => actionType === 'feat'
            ? onRoll('feat', item.name)
            : onRoll('item', item.uuid || item.id);

        return (
            <div
                key={(item._id || item.id) + index}
                className={`flex flex-col lg:flex-row lg:items-center justify-between bg-black border-b border-purple-900/50 group hover:bg-neutral-900 transition-colors my-2 py-4 px-3 ${index % 2 === 0 ? 'rotate-1' : '-rotate-1'}`}
            >
                <div className="flex items-center gap-4 flex-1">
                    <img
                        src={item.img}
                        alt={item.name}
                        className="w-10 h-10 object-contain shadow-lg border border-purple-500/30"
                    />
                    <div className="flex-1">
                        <button
                            onClick={() => openInfoModal(item)}
                            className="font-morkborg text-xl tracking-tight text-neutral-200 uppercase hover:text-yellow-500 transition-colors cursor-pointer text-left focus:outline-none"
                            title="View Details"
                        >
                            {item.name}
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2 mt-4 lg:mt-0 lg:ml-auto flex-wrap justify-end">
                    <button
                        onClick={handleAction}
                        className="px-6 py-2 bg-pink-900 hover:bg-purple-600 text-purple-100 font-morkborg text-lg border border-purple-500/30 transition-all uppercase tracking-widest cursor-pointer"
                    >
                        {buttonLabel}
                    </button>

                    <button
                        onClick={() => openItemModal(item)}
                        className="w-12 h-12 flex items-center justify-center text-purple-300 hover:text-yellow-500 transition-colors"
                        title="Edit Item"
                    >
                        <Pencil className="w-7 h-7" />
                    </button>

                    <button
                        onClick={() => onDeleteItem(item._id || item.id)}
                        className="w-12 h-12 flex items-center justify-center text-purple-300 hover:text-red-500 transition-colors"
                        title="Delete Item"
                    >
                        <Trash2 className="w-7 h-7" />
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="p-1 flex flex-col gap-6">
            {/* Feats */}
            <div className="relative">
                <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-900 to-transparent"></div>
                <div className="flex items-center justify-between mb-4 pr-6 transform -rotate-1">
                    <h3 className="font-morkborg text-3xl mb-4 text-purple-400 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] border-b-4 border-purple-900/50 inline-block pr-6 transform -rotate-1">
                        Feats
                    </h3>

                    <button
                        className="font-morkborg text-3xl text-neutral-900 bg-pink-500 px-4 h-10 flex items-center justify-center hover:bg-white transition-all transform -rotate-2 hover:rotate-0"
                        onClick={() => setAddModal(true)}
                        title="Add Item"
                    >
                        Add
                    </button>
                </div>

                <div className="flex flex-col">
                    {actor.items.feats.map((s: any, index: number) => renderItemRow(s, index, s.system?.rollLabel || s.rollLabel || 'Use', 'feat'))}
                    {!actor.items.feats.length && (
                        <div className="text-center py-10 border border-dashed border-purple-900/30 text-purple-900/50 font-morkborg text-xl">
                            No feats known.
                        </div>
                    )}
                </div>
            </div>

            {/* Powers (Scrolls & Tablets) */}
            <div className="relative">
                <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-900 to-transparent"></div>
                <div className="flex items-center justify-between mb-4 pr-6 transform -rotate-1">
                    <h3 className="font-morkborg text-3xl text-purple-400 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] border-b-4 border-purple-900/50 inline-block pr-6 transform -rotate-1">
                        Powers
                    </h3>
                    {hasOccultHerbmaster && (
                        <button
                            onClick={() => onRoll('feat', 'Create Decoctions', { rollMode: 'blindroll' })}
                            className="bg-purple-900 hover:bg-pink-700 text-white font-morkborg text-lg px-4 py-1 border border-purple-500/50 transition-colors uppercase tracking-widest shadow-lg -rotate-1"
                        >
                            Brew Decoctions
                        </button>
                    )}
                </div>

                <div className="flex flex-col">
                    {actor.items.scrolls.map((s: any, index: number) => renderItemRow(s, index + actor.items.feats.length, 'Wield', 'item'))}
                    {!actor.items.scrolls.length && (
                        <div className="text-center py-10 border border-dashed border-purple-900/30 text-purple-900/50 font-morkborg text-xl">
                            No obscure powers known.
                        </div>
                    )}
                </div>
            </div>

            {/* Item Edit Modal */}
            {itemModalConfig.isOpen && (
                <ItemModal
                    isOpen={itemModalConfig.isOpen}
                    onClose={() => setItemModalConfig({ ...itemModalConfig, isOpen: false })}
                    onUpdate={handleUpdateItem}
                    item={(() => {
                        const allItems = [...actor.items.feats, ...actor.items.scrolls];
                        return allItems.find(i => (i._id || i.id) === (itemModalConfig.item?._id || itemModalConfig.item?.id));
                    })()}
                    actor={actor}
                />
            )}

            {/* Item Info Modal (Read-Only) */}
            {infoModalConfig.isOpen && (
                <ItemInfoModal
                    isOpen={infoModalConfig.isOpen}
                    onClose={() => setInfoModalConfig({ ...infoModalConfig, isOpen: false })}
                    item={(() => {
                        const allItems = [...actor.items.feats, ...actor.items.scrolls];
                        return allItems.find(i => (i._id || i.id) === (infoModalConfig.item?._id || infoModalConfig.item?.id));
                    })()}
                />
            )}
            {addModal && (
                <MorkBorgAddItemModal
                    allowedTypes={['feat']}
                    groupBy="letter"
                    onConfirm={(item) => {
                        onCreateItem?.(item);
                        setAddModal(false);
                    }}
                    onClose={() => setAddModal(false)}
                />
            )}
        </div>
    );
}
