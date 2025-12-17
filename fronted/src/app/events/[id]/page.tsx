"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "../../../utils/api";

interface Event {
    id: number;
    title: string;
    description: string;
    date_time: string;
    mode: string;
    venue?: string;
    room?: string;
    capacity: number;
    image_url?: string;
    category: string;
    registrations_count?: number;
}

export default function EventDetailsPage() {
    const { id } = useParams();
    const router = useRouter();
    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [registering, setRegistering] = useState(false);
    const [role, setRole] = useState<string | null>(null); // Added role state

    const [isRegistered, setIsRegistered] = useState(false);

    useEffect(() => {
        const storedRole = localStorage.getItem("role"); // Get role
        if (storedRole) setRole(storedRole);

        if (id) {
            // Load Event
            api.get(`/events/${id}`)
                .then(res => {
                    if (res.ok) return res.json();
                    throw new Error("Failed to load event");
                })
                .then(data => {
                    setEvent(data);
                    setLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    alert("Event not found");
                    router.push("/dashboard");
                });

            // Check Registration Status
            const token = localStorage.getItem("token");
            if (token) {
                api.get("/registrations/me")
                    .then(res => {
                        if (res.ok) return res.json();
                        return [];
                    })
                    .then((regs: any[]) => {
                        const reg = regs.find((r: any) => r.event_id === Number(id));
                        if (reg) setIsRegistered(true);
                    })
                    .catch(console.error);
            }
        }
    }, [id, router]);

    const handleRegister = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            alert("Please login to register.");
            router.push("/login");
            return;
        }

        setRegistering(true);
        try {
            const res = await api.post(`/events/${id}/register`, {});
            if (res.ok) {
                alert("Successfully registered!");
                setIsRegistered(true);
                // router.push("/student/dashboard"); // Optional navigation
            } else {
                const err = await res.json();
                alert(`Registration failed: ${err.detail || 'Unknown error'}`);
            }
        } catch (e) {
            alert("Error registering.");
        } finally {
            setRegistering(false);
        }
    };

    if (loading) return <div className="p-8 text-white">Loading...</div>;
    if (!event) return null;

    return (
        <div className="min-h-screen bg-gray-950 text-white p-8">
            <button onClick={() => router.back()} className="text-gray-400 hover:text-white mb-4">← Back</button>

            <div className="max-w-4xl mx-auto bg-gray-900 rounded-xl overflow-hidden shadow-2xl border border-gray-800">
                <div className="h-64 bg-gradient-to-r from-blue-900 to-purple-900 relative">
                    {/* Placeholder for actual image if available */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <h1 className="text-4xl font-bold text-white shadow-lg">{event.title}</h1>
                    </div>
                </div>

                <div className="p-8">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <span className="inline-block px-3 py-1 rounded-full bg-blue-600/20 text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">
                                {event.category.replace('_', ' ')}
                            </span>
                            <p className="text-gray-400 text-sm">
                                {new Date(event.date_time).toLocaleString()} • {event.mode}
                            </p>
                            {event.venue && <p className="text-gray-500 text-sm mt-1">📍 {event.venue} {event.room ? `(${event.room})` : ''}</p>}
                        </div>
                        <div className="flex gap-2">
                            {(!role || role.toLowerCase() !== 'admin') && (
                                <button
                                    onClick={() => {
                                        if (!event) return;
                                        const startDate = new Date(event.date_time);
                                        const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
                                        const formatDate = (date: Date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");
                                        const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${formatDate(startDate)}/${formatDate(endDate)}&details=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.venue || "")}`;
                                        window.open(url, '_blank');
                                    }}
                                    className="bg-gray-800 hover:bg-gray-700 text-white font-bold p-3 rounded-lg shadow-lg transition transform hover:scale-105 border border-gray-700"
                                    title="Add to Google Calendar"
                                >
                                    📅
                                </button>
                            )}
                            {(!role || role.toLowerCase() !== 'admin') && (
                                <button
                                    onClick={handleRegister}
                                    disabled={registering || isRegistered}
                                    className={`font-bold px-6 py-3 rounded-lg shadow-lg transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${isRegistered ? 'bg-green-600 hover:bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
                                >
                                    {registering ? "Registering..." : isRegistered ? "Registered" : "Register Now"}
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="prose prose-invert max-w-none">
                        <h3 className="text-xl font-bold mb-4">About this Event</h3>
                        <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                            {event.description}
                        </p>

                        <div className="mt-8 pt-8 border-t border-gray-800">
                            <h4 className="font-bold mb-2">Capacity</h4>
                            {(() => {
                                const cap = event.capacity; // or registration_cap if preferred/available
                                const count = event.registrations_count || 0;
                                const available = Math.max(0, cap - count);
                                const isFull = available === 0;
                                return (
                                    <div>
                                        <p className="text-gray-400 mb-1">Limit: {cap} attendees</p>
                                        <p className={`font-bold ${isFull ? 'text-red-400' : 'text-green-400'}`}>
                                            {isFull ? 'Full (Waitlist Available)' : `${available} spots remaining`}
                                        </p>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
