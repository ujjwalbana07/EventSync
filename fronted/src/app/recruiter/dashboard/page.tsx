"use client";
import { useEffect, useState } from "react";
import { api } from "../../../utils/api";
import { useRouter } from "next/navigation";

interface Event {
    id: number;
    title: string;
    date_time: string;
    mode: string;
}

export default function RecruiterDashboard() {
    const [events, setEvents] = useState<Event[]>([]);
    const router = useRouter();

    useEffect(() => {
        // Static Mock Data for Demo
        const STATIC_EVENTS: Event[] = [
            {
                id: 101,
                title: "CMIS AI Summit",
                date_time: "2025-10-25T10:00:00",
                mode: "Hybrid"
            },
            {
                id: 102,
                title: "Tech Career Fair 2025",
                date_time: "2025-11-15T09:00:00",
                mode: "In-Person"
            },
            {
                id: 103,
                title: "CyberSecurity Workshop",
                date_time: "2025-09-10T14:00:00",
                mode: "Virtual"
            },
            {
                id: 104,
                title: "Data Science Hackathon",
                date_time: "2025-12-05T08:00:00",
                mode: "In-Person"
            }
        ];
        setEvents(STATIC_EVENTS);
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-8 md:p-12 font-sans">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 drop-shadow-sm">
                            Recruiter Dashboard
                        </h1>
                        <p className="text-gray-400 mt-2 text-lg">Manage your sponsored events and discover top talent</p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={() => router.push('/')}
                            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-full font-bold border border-gray-600 transition-all transform hover:-translate-y-1"
                        >
                            <span>🏠 Home</span>
                        </button>
                        <button
                            onClick={() => router.push('/recruiter/profile')}
                            className="group flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-full font-bold shadow-lg shadow-purple-900/40 transition-all transform hover:-translate-y-1"
                        >
                            <span>My Profile</span>
                            <span className="group-hover:translate-x-1 transition-transform">→</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {events.length === 0 ? (
                        <div className="col-span-full bg-gray-800/20 border border-dashed border-gray-700 rounded-2xl p-12 text-center">
                            <div className="text-6xl mb-4">🏢</div>
                            <h3 className="text-xl font-bold text-white mb-2">No Sponsored Events</h3>
                            <p className="text-gray-500">You haven't sponsored any events yet. Contact the admin to get started.</p>
                        </div>
                    ) : (
                        events.map((event) => (
                            <div
                                key={event.id}
                                onClick={() => router.push(`/recruiter/events/${event.id}/roster`)}
                                className="relative bg-gray-800/40 border border-gray-700/50 rounded-2xl overflow-hidden hover:bg-gray-800/60 transition-all group shadow-xl cursor-pointer"
                            >
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
                                <div className="p-8">
                                    <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">{event.title}</h3>
                                    <div className="flex flex-col gap-2 text-sm text-gray-400 mb-6">
                                        <span className="flex items-center gap-2">
                                            📅 {new Date(event.date_time).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                                        </span>
                                        <span className="flex items-center gap-2 uppercase tracking-wide text-xs font-bold text-gray-500">
                                            📍 {event.mode}
                                        </span>
                                    </div>


                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
