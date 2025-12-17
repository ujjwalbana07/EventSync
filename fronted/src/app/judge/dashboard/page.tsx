"use client";
import { useEffect, useState } from "react";
import { api } from "../../../utils/api";

import { useRouter } from "next/navigation";

export default function JudgeDashboard() {
    const [events, setEvents] = useState<any[]>([]);
    const router = useRouter();

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        const res = await api.get("/judge/events");
        if (res.ok) setEvents(await res.json());
    };

    return (
        <div className="p-10">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Judge Dashboard</h1>
                <button
                    onClick={() => router.push('/')}
                    className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-full font-bold border border-gray-600 transition-all transform hover:-translate-y-1"
                >
                    <span>🏠 Home</span>
                </button>
            </div>
            {events.map((e) => (
                <div key={e.id} className="border p-4 mb-4 rounded">
                    <h2 className="font-bold text-xl">{e.title}</h2>
                    <p>{e.description}</p>
                    <div className="mt-2">
                        <button onClick={() => router.push(`/judge/events/${e.id}/roster`)} className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded mr-2">View Roster</button>
                        <button className="bg-yellow-600 text-white px-3 py-1 rounded">Rate Students</button>
                    </div>
                </div>
            ))}
        </div>
    );
}
