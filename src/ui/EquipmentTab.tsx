import React, { useState } from 'react';
import paperTexture from './assets/paper-texture.png';
import RollModal from './components/RollModal';
import ItemModal from './components/ItemModal';
import ItemInfoModal from './components/ItemInfoModal';
import MorkBorgConfirmModal from './components/MorkBorgConfirmModal';
import { type MorkBorgConfirmConfig, type MorkBorgRollType, type MorkBorgRollOptions } from './types';
import MorkBorgAddItemModal from './components/MorkBorgAddItemModal';
import { Swords, Shield, Pencil, Trash2, User, PackageCheck } from 'lucide-react';

interface EquipmentTabProps {
    actor: any;
    onRoll: (type: MorkBorgRollType, key: string, options?: MorkBorgRollOptions) => void;
    onUpdate: (path: string, value: any) => void;
    onDeleteItem: (itemId: string) => void;
    onUpdateItem?: (itemData: any) => void;
    onCreateItem?: (itemData: any) => void;
}

export default function EquipmentTab({ actor, onRoll, onUpdate, onDeleteItem, onCreateItem }: EquipmentTabProps) {
    const [rollModalConfig, setRollModalConfig] = useState<{ isOpen: boolean; title: string; item: any; type: 'attack' | 'defend' }>({
        isOpen: false,
        title: '',
        item: null,
        type: 'attack'
    });

    const [itemModalConfig, setItemModalConfig] = useState<{ isOpen: boolean; item: any }>({
        isOpen: false,
        item: null
    });

    const [infoModalConfig, setInfoModalConfig] = useState<{ isOpen: boolean; item: any }>({
        isOpen: false,
        item: null
    });

    const [confirmModal, setConfirmModal] = useState<{ config: MorkBorgConfirmConfig; onConfirm: () => void } | null>(null);
    const [addModal, setAddModal] = useState(false);

    const openRollModal = (item: any, type: 'attack' | 'defend') => {
        setRollModalConfig({
            isOpen: true,
            title: type === 'attack' ? 'Attack' : 'Defend',
            item,
            type
        });
    };

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

        // This usually goes to the server/foundry
        // For now we use onUpdate which might need to be item-specific
        // But the user prompt says "hook up later" for Add, so we just pass to onUpdate
        // Actually onUpdate in MorkBorgSheet is for actor properties.
        // We might need a separate onUpdateItem prop.
        onUpdate(`items.${itemModalConfig.item._id || itemModalConfig.item.id}.${path}`, value);
    };

    const handleQuantityChange = (item: any, delta: number) => {
        const currentQty = Number(item.quantity || item.system?.quantity || 1);
        const newQty = Math.max(0, currentQty + delta);
        onUpdate(`items.${item._id || item.id}.system.quantity`, newQty);
    };

    const handleToggleCarry = (item: any) => {
        const newStatus = !(item.system?.carried || item.carried);
        onUpdate(`items.${item._id || item.id}.system.carried`, newStatus);
    };

    const handleToggleEquipped = (item: any) => {
        const newStatus = !(item.system?.equipped || item.equipped);
        onUpdate(`items.${item._id || item.id}.system.equipped`, newStatus);
    };

    // Find duplicates and prompt to combine them
    const handleOrganizeClick = () => {
        const allItems = [
            ...(actor.items.weapons || []),
            ...(actor.items.armor || []),
            ...(actor.items.shields || []),
            ...(actor.items.equipment || []),
            ...(actor.items.misc || []),
            ...(actor.items.ammo || []),
            ...(actor.items.uncategorized || [])
        ];

        // Group by lowercase name
        const groups: Record<string, any[]> = {};
        for (const item of allItems) {
            const key = item.name.toLowerCase().trim();
            if (!groups[key]) groups[key] = [];
            groups[key].push(item);
        }

        const duplicateGroups = Object.values(groups).filter(g => g.length > 1);
        const totalDupes = duplicateGroups.reduce((acc, g) => acc + g.length - 1, 0);

        if (duplicateGroups.length === 0) {
            setConfirmModal({
                config: {
                    title: 'Already Organized',
                    body: 'No duplicate items found. Your inventory is already tidy.',
                    confirmLabel: 'OK',
                },
                onConfirm: () => setConfirmModal(null),
            });
            return;
        }

        const preview = duplicateGroups.slice(0, 3).map(g => `• ${g[0].name} (×${g.length})`).join('\n');
        const more = duplicateGroups.length > 3 ? `\n…and ${duplicateGroups.length - 3} more.` : '';

        setConfirmModal({
            config: {
                title: 'Organize Inventory',
                body: [
                    `Found ${totalDupes} duplicate entr${totalDupes === 1 ? 'y' : 'ies'} across ${duplicateGroups.length} item${duplicateGroups.length === 1 ? '' : 's'}:`,
                    preview + more,
                    'Quantities will be combined and duplicates removed.',
                ],
                confirmLabel: 'Combine Duplicates',
            },
            onConfirm: () => {
                for (const group of duplicateGroups) {
                    // Sort so we keep the one with the highest existing quantity as the base
                    group.sort((a, b) => (b.system?.quantity || b.quantity || 1) - (a.system?.quantity || a.quantity || 1));
                    const keeper = group[0];
                    const totalQty = group.reduce((sum, i) => sum + (Number(i.system?.quantity || i.quantity) || 1), 0);

                    // Update keeper quantity
                    onUpdate(`items.${keeper._id || keeper.id}.system.quantity`, totalQty);

                    // Delete the rest
                    for (let i = 1; i < group.length; i++) {
                        onDeleteItem(group[i]._id || group[i].id);
                    }
                }
                setConfirmModal(null);
            },
        });
    };

    // Consolidate and sort items
    const allItems = [
        ...(actor.items.weapons || []),
        ...(actor.items.armor || []),
        ...(actor.items.shields || []),
        ...(actor.items.equipment || []),
        ...(actor.items.misc || []),
        ...(actor.items.ammo || []),
        ...(actor.items.uncategorized || [])
    ];

    const allEquipment = allItems.sort((a, b) => a.name.localeCompare(b.name));

    // Identify nested items (those whose IDs exist in ANY container's system.items array)
    const containers = allEquipment.filter(i => i.type === 'container');
    const nestedItemIds = new Set<string>();

    for (const c of containers) {
        if (c.system?.items && Array.isArray(c.system.items)) {
            c.system.items.forEach((id: string) => nestedItemIds.add(id));
        }
    }

    const topLevelItems = allEquipment.filter(i => !nestedItemIds.has(i._id || i.id) && i.type !== 'feat' && i.type !== 'scroll');

    const handleDragStart = (e: React.DragEvent, itemId: string) => {
        e.dataTransfer.setData('text/plain', itemId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        e.currentTarget.classList.add('bg-pink-900/40', 'outline', 'outline-2', 'outline-pink-500');
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.currentTarget.classList.remove('bg-pink-900/40', 'outline', 'outline-2', 'outline-pink-500');
    };

    const handleDrop = (e: React.DragEvent, targetContainerId: string | null) => {
        e.preventDefault();
        e.currentTarget.classList.remove('bg-pink-900/40', 'outline', 'outline-2', 'outline-pink-500');

        const draggedItemId = e.dataTransfer.getData('text/plain');
        if (!draggedItemId || draggedItemId === targetContainerId) return;

        // 1. Find where the item currently lives and remove it
        for (const c of containers) {
            const itemsArray = c.system?.items || [];
            if (itemsArray.includes(draggedItemId)) {
                onUpdate(`items.${c._id || c.id}.system.items`, itemsArray.filter((id: string) => id !== draggedItemId));
            }
        }

        // 2. If dropping into a new container, add it
        if (targetContainerId) {
            const targetContainer = containers.find(c => (c._id || c.id) === targetContainerId);
            if (targetContainer) {
                // Prevent infinite nesting by not allowing containers inside containers for now, or just allow it if sys allows
                const currentItems = targetContainer.system?.items || [];
                if (!currentItems.includes(draggedItemId)) {
                    onUpdate(`items.${targetContainerId}.system.items`, [...currentItems, draggedItemId]);
                }
            }
        }
    };

    const renderItemRow = (item: any, isNested: boolean = false, index: number) => {
        const isContainer = item.type === 'container';
        const quantity = Number(item.quantity || item.system?.quantity || 1);
        const slots = item.system?.carryWeight || item.weight || 0;
        const isEquipped = item.system?.equipped || item.equipped;
        const isCarried = item.system?.carried || item.carried;

        const toggleTitle = item.type === 'container'
            ? (isCarried ? 'Uncarry' : 'Carry')
            : (isEquipped ? 'Unequip' : 'Equip');

        // Calculate slots used vs capacity if this is a container
        let calculatedSlotsUsed = 0;
        if (isContainer && item.system?.items) {
            calculatedSlotsUsed = item.system.items.reduce((acc: number, id: string) => {
                const child = allEquipment.find(i => (i._id || i.id) === id);
                if (child) {
                    return acc + (child.system?.carryWeight || child.weight || 1) * (child.system?.quantity || 1);
                }
                return acc;
            }, 0);
        }

        return (
            <div
                key={(item._id || item.id) + index}
                draggable
                onDragStart={(e) => handleDragStart(e, item._id || item.id)}
                onDragOver={isContainer ? handleDragOver : undefined}
                onDragLeave={isContainer ? handleDragLeave : undefined}
                onDrop={isContainer ? (e) => handleDrop(e, item._id || item.id) : undefined}
                className={`flex flex-col lg:flex-row lg:items-center justify-between bg-black border-b border-white/20 group hover:bg-neutral-900 transition-colors my-2 py-4 cursor-grab active:cursor-grabbing ${index % 2 === 0 ? 'rotate-1' : '-rotate-1'} ${isNested ? 'ml-8 lg:ml-12 bg-neutral-900/40 border-l-4 border-l-pink-900/50 pl-4' : 'p-3'}`}
            >
                <div className="flex items-center gap-4 flex-1">
                    <img
                        src={item.img}
                        alt={item.name}
                        className="w-10 h-10 object-contain"
                    />
                    <div className="flex-1">
                        <div className="flex items-baseline gap-2">
                            <button
                                onClick={(e) => { e.stopPropagation(); openInfoModal(item); }}
                                className="font-morkborg text-xl tracking-tight text-neutral-200 uppercase text-left hover:text-pink-500 transition-colors focus:outline-none"
                            >
                                {item.name}
                                {quantity > 1 && <span className="text-white ml-2 opacity-100">({quantity})</span>}
                                {isContainer && (
                                    <span className="text-yellow-500 ml-2">
                                        ({calculatedSlotsUsed} / {item.system?.capacity || 7})
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 mt-4 lg:mt-0 lg:ml-auto flex-wrap justify-end">
                    {/* Quantity Controls */}
                    {(item.type === 'misc' || item.type === 'ammo') && (
                        <div className="flex items-center mr-2">
                            <button
                                onClick={() => handleQuantityChange(item, -1)}
                                className="w-12 h-12 lg:w-14 lg:h-14 flex items-center justify-center text-4xl text-white hover:text-pink-500 transition-colors font-bold"
                            >
                                −
                            </button>
                            <button
                                onClick={() => handleQuantityChange(item, 1)}
                                className="w-12 h-12 lg:w-14 lg:h-14 flex items-center justify-center text-4xl text-white hover:text-pink-500 transition-colors font-bold"
                            >
                                +
                            </button>
                        </div>
                    )}

                    {/* container */}
                    {(item.type === 'container') && (
                        <button
                            onClick={(e) => { e.stopPropagation(); handleToggleCarry(item); }}
                            className={`w-12 h-12 flex items-center justify-center transition-all bg-transparent border-none outline-none ${isCarried ? 'text-yellow-500 drop-shadow-[0_0_8px_#ea7108]' : 'text-white'}`}
                            title={toggleTitle}
                        >
                            <User className="w-8 h-8" />
                        </button>
                    )}

                    {/* Equip/Carry Toggle - Clear White/Yellow SVG icons */}
                    {(item.type === 'weapon' || item.type === 'armor') && (
                        <button
                            onClick={(e) => { e.stopPropagation(); handleToggleEquipped(item); }}
                            className={`w-12 h-12 flex items-center justify-center transition-all bg-transparent border-none outline-none ${isEquipped ? 'text-yellow-500 drop-shadow-[0_0_8px_#ea7108]' : 'text-white'}`}
                            title={toggleTitle}
                        >
                            {item.type === 'weapon' ? (
                                <Swords className="w-8 h-8" />
                            ) : (
                                <Shield className="w-8 h-8" />
                            )}
                        </button>
                    )}

                    {/* Edit Button - Simple Monochrome SVG */}
                    <button
                        onClick={() => openItemModal(item)}
                        className="w-12 h-12 flex items-center justify-center text-white hover:text-yellow-500 transition-colors"
                    >
                        <Pencil className="w-7 h-7" />
                    </button>

                    {/* Delete Button - Simple Monochrome SVG */}
                    <button
                        onClick={() => onDeleteItem(item._id || item.id)}
                        className="w-12 h-12 flex items-center justify-center text-white hover:text-red-500 transition-colors"
                    >
                        <Trash2 className="w-7 h-7" />
                    </button>
                </div>
            </div >
        );
    };

    return (
        <div className="p-1 min-h-[500px]">
            {/* Header / Carrying Capacity */}
            <div
                className="bg-black text-neutral-300 p-4 mb-8 border-2 border-pink-900/30 flex flex-col sm:flex-row justify-between items-center transform -rotate-1 shadow-lg gap-4"
                style={{ backgroundImage: `url(${paperTexture.src})`, backgroundSize: 'cover', backgroundBlendMode: 'overlay' }}
            >
                <div className="w-full sm:w-auto flex justify-center sm:justify-start">
                    <div className="flex items-baseline gap-2">
                        <span className="font-morkborg text-2xl uppercase text-pink-500 leading-none mb-1">Carrying</span>
                        <div className={`text-2xl font-bold font-mono tracking-tighter ${actor.derived?.encumbered ? 'text-red-500 animate-pulse' : 'text-neutral-200'}`}>
                            {actor.derived?.slotsUsed} <span className="text-white/20">/</span> {actor.derived?.maxSlots}
                        </div>
                    </div>
                </div>
                <div className="w-full sm:w-auto flex flex-col items-center sm:items-end">
                    <div className="font-morkborg text-xl uppercase text-pink-500 mb-0.5 leading-none">Silver</div>
                    <div className="font-bold text-2xl text-neutral-200 font-mono tracking-tight">{actor.derived?.silver}<span className="text-sm ml-1 text-white/40 uppercase font-bold tracking-widest">s</span></div>
                </div>
            </div>

            {/* Equipment Header */}
            <div className="flex items-center justify-between mb-4 pb-2 rotate-1">
                <h3 className="font-morkborg text-4xl uppercase text-black border-b-4 border-pink-500 tracking-widest transform rotate-1">
                    Equipment
                </h3>
                <button
                    className="font-morkborg text-3xl text-neutral-900 bg-pink-500 px-4 h-10 flex items-center justify-center hover:bg-white transition-all transform rotate-2 hover:rotate-0"
                    onClick={() => setAddModal(true)}
                    title="Add Item"
                >
                    Add
                </button>
            </div>

            {/* Combined List with Top Level Drop Zone */}
            <div
                className="flex flex-col mb-10 min-h-[100px]"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, null)}
            >
                {(() => {
                    const flatList: { item: any; isNested: boolean }[] = [];
                    topLevelItems.forEach(item => {
                        flatList.push({ item, isNested: false });
                        if (item.type === 'container' && item.system?.items) {
                            const nested = allEquipment
                                .filter(i => item.system.items.includes(i._id || i.id))
                                .sort((a, b) => a.name.localeCompare(b.name));
                            nested.forEach(n => flatList.push({ item: n, isNested: true }));
                        }
                    });

                    if (flatList.length === 0) {
                        return (
                            <div className="text-center py-20 text-white/20 font-morkborg text-2xl uppercase tracking-[0.2em]">
                                Your pockets are empty as your soul.
                            </div>
                        );
                    }

                    return flatList.map((entry, index) => renderItemRow(entry.item, entry.isNested, index));
                })()}
            </div>

            {/* Uncategorized Items */}
            {actor.items.uncategorized && actor.items.uncategorized.length > 0 && (
                <div className="mt-8 mb-4">
                    <div className="flex items-center justify-between mb-4 border-b-2 border-dashed border-pink-900/50 pb-2 opacity-70">
                        <h3 className="font-morkborg text-2xl uppercase text-black tracking-widest transform rotate-1">
                            Uncategorized (Legacy/Module)
                        </h3>
                    </div>
                    <div className="flex flex-col opacity-80">
                        {actor.items.uncategorized.map((item: any, index: number) => renderItemRow(item, false, index))}
                    </div>
                </div>
            )}

            {/* Info text */}
            {actor.derived?.equipmentHelpText && (
                <div className="bg-black p-2 text-lg text-pink-500 font-mono mt-0.5 leading-none rotate-1">
                    {actor.derived.equipmentHelpText}
                </div>
            )}

            {/* Organize Inventory Button */}
            <div className="flex justify-center mt-6 mb-20">
                <button
                    onClick={handleOrganizeClick}
                    className="flex items-center gap-3 font-morkborg text-lg uppercase tracking-widest font-bold text-white bg-pink-700 border-2 border-pink-500 px-6 py-3 hover:bg-black hover:border-neutral-700 transition-all -rotate-1 shadow-[4px_4px_0_0_#000] cursor-pointer"
                >
                    <PackageCheck className="w-5 h-5" />
                    Organize Inventory
                </button>
            </div>

            {/* Modals */}
            {rollModalConfig.isOpen && (
                <RollModal
                    isOpen={rollModalConfig.isOpen}
                    onClose={() => setRollModalConfig({ ...rollModalConfig, isOpen: false })}
                    onRoll={onRoll}
                    title={rollModalConfig.title}
                    item={rollModalConfig.item}
                    actor={actor}
                    type={rollModalConfig.type}
                />
            )}

            {itemModalConfig.isOpen && (
                <ItemModal
                    isOpen={itemModalConfig.isOpen}
                    onClose={() => setItemModalConfig({ ...itemModalConfig, isOpen: false })}
                    onUpdate={handleUpdateItem}
                    item={allItems.find(i => (i._id || i.id) === (itemModalConfig.item?._id || itemModalConfig.item?.id))}
                    actor={actor}
                />
            )}

            {infoModalConfig.isOpen && (
                <ItemInfoModal
                    isOpen={infoModalConfig.isOpen}
                    onClose={() => setInfoModalConfig({ ...infoModalConfig, isOpen: false })}
                    item={allItems.find(i => (i._id || i.id) === (infoModalConfig.item?._id || infoModalConfig.item?.id))}
                />
            )}

            {confirmModal && (
                <MorkBorgConfirmModal
                    config={confirmModal.config}
                    onConfirm={confirmModal.onConfirm}
                    onClose={() => setConfirmModal(null)}
                />
            )}
            {addModal && (
                <MorkBorgAddItemModal
                    allowedTypes={['armor', 'container', 'misc', 'scroll', 'shield', 'weapon']}
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
