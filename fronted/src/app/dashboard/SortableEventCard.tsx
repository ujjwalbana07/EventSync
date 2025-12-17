import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Event {
    id: number;
    title: string;
    description: string;
    date_time: string;
    mode: string;
    category: string;
    venue?: string;
    registration_cap?: number;
    registrations_count?: number;
}

interface SortableEventCardProps {
    event: Event;
    isEditMode: boolean;
    onSave: (id: number, data: Partial<Event>) => Promise<void>;
    onClick: () => void;
    onEdit: (event: Event) => void;
}

export function SortableEventCard({ event, isEditMode, onSave, onClick, onEdit }: SortableEventCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: event.id, disabled: !isEditMode });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`bg-gray-900 rounded-xl overflow-hidden border border-gray-800 hover:border-gray-600 transition group flex flex-col ${isEditMode ? 'cursor-move ring-2 ring-purple-500/30' : ''}`}
            onClick={(e) => {
                if (isEditMode) {
                    e.preventDefault();
                    onEdit(event);
                }
            }}
        >
            <div className="h-40 bg-gray-800 relative">
                {/* Visuals similar to main dashboard */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-700 flex items-center justify-center">
                    <span className="text-4xl opacity-20">📅</span>
                </div>
                <div className="absolute top-4 left-4 bg-gray-950/80 backdrop-blur rounded-lg px-3 py-1 text-center border border-gray-800">
                    <span className="block text-xs text-gray-400 uppercase font-bold">{new Date(event.date_time).toLocaleString('default', { month: 'short' })}</span>
                    <span className="block text-xl font-bold text-white leading-none">{new Date(event.date_time).getDate()}</span>
                </div>
            </div>
            <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-xl font-bold text-white mb-2">{event.title}</h3>
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">{event.description}</p>

                {/* Capacity Badge */}
                <div className="mb-4">
                    {(() => {
                        const cap = event.registration_cap || 100;
                        const count = event.registrations_count || 0;
                        const available = Math.max(0, cap - count);
                        const isFull = available === 0;
                        return (
                            <span className={`text-xs font-bold px-2 py-1 rounded ${isFull ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                                {isFull ? 'Waitlist' : `${available} Seats Left`}
                            </span>
                        );
                    })()}
                </div>

                {!isEditMode && (
                    <div className="mt-auto pt-4 border-t border-gray-800 flex justify-between items-center">
                        <span className="text-sm text-gray-500 truncate max-w-[40%]">{event.venue || 'TBA'}</span>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onClick && onClick();
                            }}
                            className="text-sm font-bold text-white bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition border border-gray-700"
                        >
                            Details
                        </button>
                    </div>
                )}
            </div>
            {isEditMode && (
                <div className="bg-purple-900/50 p-2 text-center text-xs text-purple-200 font-bold uppercase tracking-wider">
                    Drag to Reorder • Click to Edit
                </div>
            )}
        </div>
    );
}
