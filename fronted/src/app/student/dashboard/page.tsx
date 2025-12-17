"use client";
import { useEffect, useState } from "react";
import { api } from "../../../utils/api";


interface Event {
    id: number;
    title: string;
    description: string;
    date_time: string;
    location: string;
    mode: string;
    registration_cap?: number;
    registrations_count?: number;
    [key: string]: any;
}

export default function StudentDashboard() {
    const [events, setEvents] = useState<Event[]>([]);
    const [myRegs, setMyRegs] = useState<any[]>([]);
    const [profileIncomplete, setProfileIncomplete] = useState(false);

    useEffect(() => {
        fetchEvents();
        fetchMyRegs();
        checkProfile();
    }, []);

    const fetchEvents = async () => {
        const res = await api.get("/events/");
        if (res.ok) setEvents(await res.json());
    };

    const fetchMyRegs = async () => {
        const res = await api.get("/registrations/me");
        if (res.ok) setMyRegs(await res.json());
    };

    const checkProfile = async () => {
        const res = await api.get("/student/profile/");
        if (res.ok) {
            const p = await res.json();
            if (!p.major || !p.headline || !p.skills || p.skills.length === 0) {
                setProfileIncomplete(true);
            }
        }
    };

    const deregister = async (eventId: number) => {
        if (!confirm("Are you sure you want to cancel your registration?")) return;

        const res = await api.delete(`/events/${eventId}/register`);
        if (res.ok || res.status === 204) {
            fetchMyRegs(); // Trigger refresh
            fetchEvents();
        } else {
            console.error("Failed to cancel registration.");
        }
    };

    const registerForEvent = async (eventId: number) => {
        try {
            const res = await api.post(`/events/${eventId}/register`, {});
            if (res.ok) {
                alert("Successfully registered!");
                fetchMyRegs();
                fetchEvents();
            } else {
                const err = await res.json();
                alert(`Registration failed: ${err.title || "Unknown error"}`);
            }
        } catch (e) {
            alert("Registration failed");
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-gray-100 p-8 md:p-12 font-sans">
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-indigo-500 drop-shadow-sm">
                            Student Dashboard
                        </h1>
                        <p className="text-gray-400 mt-2 text-lg">Manage your active event schedule</p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={() => window.location.href = '/'}
                            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-full font-bold border border-gray-600 transition-all transform hover:-translate-y-1"
                        >
                            <span>🏠 Home</span>
                        </button>
                        <button
                            onClick={() => document.getElementById('my-registrations')?.scrollIntoView({ behavior: 'smooth' })} // Simple scroll for now
                            className="group flex items-center gap-2 bg-purple-600/80 hover:bg-purple-500/80 backdrop-blur-sm border border-purple-500 text-white px-6 py-3 rounded-full font-semibold transition-all shadow-lg hover:shadow-purple-900/20"
                        >
                            <span>Enrolled Events</span>
                            <span className="group-hover:translate-y-1 transition-transform">↓</span>
                        </button>
                        <a
                            href="/student/profile"
                            className="group flex items-center gap-2 bg-gray-800/80 hover:bg-gray-700/80 backdrop-blur-sm border border-gray-700 text-blue-400 px-6 py-3 rounded-full font-semibold transition-all shadow-lg hover:shadow-blue-900/20"
                        >
                            <span>My Profile</span>
                            <span className="group-hover:translate-x-1 transition-transform">→</span>
                        </a>
                    </div>
                </div>

                {/* Profile Alert */}
                {profileIncomplete && (
                    <div className="mb-12 bg-yellow-900/20 border-l-4 border-yellow-500 text-yellow-200 p-6 rounded-r-lg backdrop-blur-sm shadow-md flex items-start gap-4" role="alert">
                        <div className="text-2xl">⚠️</div>
                        <div>
                            <p className="font-bold text-lg mb-1">Action Required: Incomplete Profile</p>
                            <p className="text-yellow-100/80">
                                Complete your <a href="/student/profile" className="underline font-bold hover:text-white transition">profile details and skills</a> so judges can see your full potential!
                            </p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-8">
                    {/* My Registrations Column */}
                    <div id="my-registrations">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4 border-b border-gray-800 pb-4">
                            <h2 className="text-2xl font-bold text-white tracking-wide">My Registrations</h2>

                            <a href="/dashboard" className="text-sm font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-2 transition-colors border border-blue-500/30 px-4 py-2 rounded-full hover:bg-blue-500/10">
                                <span>Browse All Events</span>
                                <span>→</span>
                            </a>
                        </div>

                        <div className="space-y-4">
                            {myRegs.length === 0 ? (
                                <div className="bg-gray-800/20 border border-dashed border-gray-700 rounded-xl p-12 text-center">
                                    <div className="text-6xl mb-4">🎫</div>
                                    <h3 className="text-xl font-bold text-white mb-2">No Active Registrations</h3>
                                    <p className="text-gray-500 mb-6">You haven't signed up for any events yet.</p>
                                    <a href="/dashboard" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-full font-bold transition shadow-lg shadow-blue-900/20">
                                        Find an Event
                                    </a>
                                </div>
                            ) : (
                                myRegs.map((r) => {
                                    const event = events.find(e => e.id === r.event_id);
                                    if (!event) return null;

                                    return (
                                        <div key={r.id} className="relative bg-gray-800/40 border border-gray-700/50 rounded-xl overflow-hidden hover:border-gray-600 transition-all group">
                                            {/* Status Stripe */}
                                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${r.status === 'confirmed' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>

                                            <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">

                                                {/* Main Info */}
                                                <div className="md:col-span-6">
                                                    <h4 className="text-xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">{event.title}</h4>
                                                    <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                                                        <div className="flex items-center gap-1.5">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                                            <span>{new Date(event.date_time).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                                            <span>{event.mode?.replace('_', ' ')}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Status Badge */}
                                                <div className="md:col-span-3">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${r.status === 'confirmed' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>
                                                        <span className={`w-2 h-2 rounded-full mr-2 ${r.status === 'confirmed' ? 'bg-green-400' : 'bg-yellow-400'}`}></span>
                                                        {r.status}
                                                    </span>
                                                </div>

                                                {/* Action Button */}
                                                <div className="md:col-span-3 flex md:justify-end">
                                                    <button
                                                        onClick={() => deregister(r.event_id)}
                                                        className="w-full md:w-auto flex items-center justify-center gap-2 text-sm font-semibold text-red-400 hover:text-white border border-red-500/20 hover:bg-red-600 hover:border-red-600 px-4 py-2 rounded-lg transition-all"
                                                        title="Cancel Registration"
                                                    >
                                                        <span>Cancel</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
