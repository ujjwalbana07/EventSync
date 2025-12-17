"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../../../utils/api";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function CreateEventPage() {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        date_time: "",
        mode: "in_person",
        venue: "",
        capacity: 100,
        category: "workshop",
        visibility: "public"
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        // Basic validation/transformation if needed
        const payload = {
            ...formData,
            // Ensure datetime is ISO string if input is local datetime
            date_time: formData.date_time ? new Date(formData.date_time).toISOString() : new Date().toISOString(),
            capacity: Number(formData.capacity)
        };

        try {
            const res = await api.post("/events/", payload);
            if (res.ok) {
                alert("Event created successfully!");
                router.push("/faculty/dashboard");
            } else {
                const err = await res.json();
                alert(`Failed to create event: ${err.detail || 'Unknown error'}`);
            }
        } catch (error) {
            console.error(error);
            alert("Error creating event");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white p-8">
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold">Create New Event</h1>
                    <button onClick={() => router.back()} className="text-gray-400 hover:text-white">Cancel</button>
                </div>

                <form onSubmit={handleSubmit} className="bg-gray-900 p-8 rounded-xl border border-gray-800 space-y-6">

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Event Title</label>
                        <input
                            type="text"
                            name="title"
                            required
                            className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                            value={formData.title}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                        <textarea
                            name="description"
                            required
                            rows={4}
                            className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                            value={formData.description}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Date & Time */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Date & Time</label>
                        <DatePicker
                            selected={formData.date_time ? new Date(formData.date_time) : null}
                            onChange={(date: Date | null) => setFormData(prev => ({ ...prev, date_time: date ? date.toISOString() : '' }))}
                            showTimeSelect
                            timeFormat="HH:mm"
                            timeIntervals={15}
                            dateFormat="MM/dd/yyyy h:mm aa"
                            className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                            placeholderText="Select Date & Time"
                            wrapperClassName="w-full"
                            required
                        />
                    </div>


                    {/* Logistics Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Mode</label>
                            <select
                                name="mode"
                                className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                value={formData.mode}
                                onChange={handleChange}
                            >
                                <option value="in_person">In Person</option>
                                <option value="virtual">Virtual</option>
                                <option value="hybrid">Hybrid</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Capacity</label>
                            <input
                                type="number"
                                name="capacity"
                                required
                                min="1"
                                className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                value={formData.capacity}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Venue */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Venue / Link</label>
                        <input
                            type="text"
                            name="venue"
                            className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                            placeholder="Room number or Zoom link"
                            value={formData.venue}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Category & Visibility */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Category</label>
                            <select
                                name="category"
                                className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                value={formData.category}
                                onChange={handleChange}
                            >
                                <option value="workshop">Workshop</option>
                                <option value="career_fair">Career Fair</option>
                                <option value="mixer">Mixer</option>
                                <option value="tech_talk">Tech Talk</option>
                                <option value="competition">Competition</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Visibility</label>
                            <select
                                name="visibility"
                                className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                value={formData.visibility}
                                onChange={handleChange}
                            >
                                <option value="public">Public</option>
                                <option value="ms_mis">MS-MIS Only</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-lg shadow-lg transition disabled:opacity-50"
                        >
                            {submitting ? "Creating..." : "Create Event"}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}
