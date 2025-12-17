import React, { useState, useEffect } from 'react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface Event {
    id: number;
    title: string;
    date_time: string;
    mode: string;
    category: string;
    description: string;
    image_url?: string;
    venue?: string;
}

interface EventFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Partial<Event>) => Promise<void>;
    initialData?: Event | null;
}

export default function EventFormModal({ isOpen, onClose, onSave, initialData }: EventFormModalProps) {
    const [formData, setFormData] = useState<Partial<Event>>({
        title: '',
        date_time: '',
        mode: 'in_person',
        category: 'workshop',
        description: '',
        image_url: '',
        venue: ''
    });

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        } else {
            setFormData({
                title: '',
                date_time: '',
                mode: 'in_person',
                category: 'workshop',
                description: '',
                image_url: '',
                venue: ''
            });
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Dynamic Date Validation
        if (formData.date_time && new Date(formData.date_time) < new Date()) {
            alert("Event date must be in the future.");
            return;
        }

        await onSave(formData);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fadeIn">
                <div className="bg-gray-800 px-6 py-4 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white">
                        {initialData ? 'Edit Event' : 'Create New Event'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition">
                        ✖
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">Event Title</label>
                        <input
                            type="text"
                            required
                            className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col">
                            <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">Date & Time</label>
                            <DatePicker
                                selected={formData.date_time ? new Date(formData.date_time) : null}
                                onChange={(date: Date | null) => setFormData({ ...formData, date_time: date ? date.toISOString() : '' })}
                                showTimeSelect
                                timeFormat="HH:mm"
                                timeIntervals={15}
                                dateFormat="MM/dd/yyyy h:mm aa"
                                className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                placeholderText="Select Date & Time"
                                wrapperClassName="w-full"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">Mode</label>
                            <select
                                className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                value={formData.mode}
                                onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                            >
                                <option value="in_person">In-Person</option>
                                <option value="virtual">Virtual</option>
                                <option value="hybrid">Hybrid</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">Category</label>
                            <select
                                className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            >
                                <option value="workshop">Workshop</option>
                                <option value="career_fair">Career Fair</option>
                                <option value="mixer">Mixer</option>
                                <option value="tech_talk">Tech Talk</option>
                                <option value="competition">Competition</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">Venue / Link</label>
                            <input
                                type="text"
                                className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                value={formData.venue || ''}
                                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">Description</label>
                        <textarea
                            rows={3}
                            className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">Image URL (Optional)</label>
                        <input
                            type="text"
                            placeholder="https://..."
                            className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                            value={formData.image_url || ''}
                            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                        />
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-800 transition text-sm font-semibold"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold shadow-lg shadow-purple-900/50 transition transform hover:scale-105"
                        >
                            {initialData ? 'Save Changes' : 'Create Event'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
