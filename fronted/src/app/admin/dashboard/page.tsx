"use client";
import { useEffect, useState, FormEvent } from "react";
import { api } from "../../../utils/api";
import { useRouter } from "next/navigation";

interface Event {
    id: number;
    title: string;
    description: string;
    date_time: string;
    end_date_time?: string;
    location: string;
    capacity: number;
    registration_cap: number;
    mode: string;
    average_rating?: number;
    feedback_count?: number;
    feedback_email_sent?: boolean;
}

interface User {
    id: number;
    name: string;
    email: string;
}

interface Registration {
    id: number;
    status: string;
    student: User;
    feedback_rating?: number;
    feedback_comments?: string;
}

export default function AdminDashboard() {
    const [events, setEvents] = useState<Event[]>([]);
    const router = useRouter();

    // Modal States
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
    const [showRegistrationsModal, setShowRegistrationsModal] = useState(false);
    const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
    const [registrations, setRegistrations] = useState<Registration[]>([]);

    // Form Data
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        date_time: new Date().toISOString().slice(0, 16),
        end_date_time: "",
        location: "TBD",
        capacity: 100,
        mode: "in_person"
    });

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const res = await api.get("/events/");
            if (res.ok) {
                const data = await res.json();
                setEvents(data);
            }
        } catch (err) {
            console.error("Failed to load events", err);
        }
    };

    const handleCreateClick = () => {
        setFormData({
            title: "",
            description: "",
            date_time: new Date().toISOString().slice(0, 16),
            end_date_time: "",
            location: "TBD",
            capacity: 100,
            mode: "in_person"
        });
        setShowCreateModal(true);
    };

    const handleEditClick = (event: Event) => {
        setSelectedEventId(event.id);
        setFormData({
            title: event.title,
            description: event.description || "",
            date_time: event.date_time ? new Date(event.date_time).toISOString().slice(0, 16) : "",
            end_date_time: event.end_date_time ? new Date(event.end_date_time).toISOString().slice(0, 16) : "",
            location: event.location || "TBD",
            capacity: event.capacity || 100,
            mode: event.mode || "in_person"
        });
        setShowEditModal(true);
    };

    const handleDeleteClick = async (eventId: number) => {
        if (!confirm("Are you sure you want to DELETE this event? This action cannot be undone.")) return;
        try {
            const res = await api.delete(`/events/${eventId}`);
            if (res.ok) {
                alert("Event Deleted Successfully!");
                fetchEvents();
            } else {
                alert("Failed to delete event.");
            }
        } catch (err) {
            console.error("Error deleting event", err);
            alert("Error deleting event.");
        }
    };

    const submitCreate = async (e: FormEvent) => {
        e.preventDefault();
        try {
            const res = await api.post("/events/", {
                ...formData,
                date_time: new Date(formData.date_time).toISOString(),
                end_date_time: formData.end_date_time ? new Date(formData.end_date_time).toISOString() : null,
                registration_cap: formData.capacity // Mapping capacity to registration_cap for simplified UI
            });
            if (res.ok) {
                alert("Event Created Successfully!");
                setShowCreateModal(false);
                fetchEvents();
            } else {
                const err = await res.json();
                alert(`Error: ${err.detail || "Failed to create"}`);
            }
        } catch (err) {
            alert("Failed to create event");
        }
    };

    const submitEdit = async (e: FormEvent) => {
        e.preventDefault();
        if (!selectedEventId) return;
        try {
            const res = await api.put(`/events/${selectedEventId}`, {
                ...formData,
                date_time: new Date(formData.date_time).toISOString(),
                end_date_time: formData.end_date_time ? new Date(formData.end_date_time).toISOString() : null,
                registration_cap: formData.capacity
            });
            if (res.ok) {
                alert("Event Updated Successfully!");
                setShowEditModal(false);
                fetchEvents();
            } else {
                const err = await res.json();
                alert(`Error: ${err.detail || "Failed to update"}`);
            }
        } catch (err) {
            alert("Failed to update event");
        }
    };

    const handleViewAnalytics = async (eventId: number) => {
        try {
            const res = await api.get(`/events/${eventId}/registrations`);
            if (res.ok) {
                const data = await res.json();
                setRegistrations(data);
                setSelectedEventId(eventId);
                setShowAnalyticsModal(true);
            } else {
                alert("Failed to fetch analytics data");
            }
        } catch (err) {
            console.error(err);
            alert("Error fetching analytics");
        }
    };

    const handleViewRegistrations = async (eventId: number) => {
        try {
            const res = await api.get(`/events/${eventId}/registrations`);
            if (res.ok) {
                const data = await res.json();
                setRegistrations(data);
                setSelectedEventId(eventId);
                setShowRegistrationsModal(true);
            } else {
                alert("Failed to fetch registrations");
            }
        } catch (err) {
            console.error(err);
            alert("Error fetching registrations");
        }
    };

    const handleDownloadRegistrations = async (eventId: number) => {
        try {
            const res = await api.get(`/events/${eventId}/registrations`);
            if (res.ok) {
                const data: Registration[] = await res.json();
                if (data.length === 0) {
                    alert("No registrations to download.");
                    return;
                }

                // Convert to CSV
                const headers = ["ID", "Name", "Email", "Status"];
                const rows = data.map(r => [
                    r.id,
                    r.student?.name || "Unknown",
                    r.student?.email || "Unknown",
                    r.status
                ]);

                const csvContent = [
                    headers.join(","),
                    ...rows.map(row => row.join(","))
                ].join("\n");

                const blob = new Blob([csvContent], { type: "text/csv" });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `registrations_event_${eventId}.csv`;
                document.body.appendChild(a);
                a.click();
                a.remove();
            } else {
                alert("Failed to fetch registrations");
            }
        } catch (err) {
            console.error(err);
            alert("Error downloading registrations");
        }
    };

    const handleSendFeedback = async (eventId: number) => {
        if (!confirm("Are you sure you want to send feedback requests to all confirmed attendees?")) return;
        try {
            const res = await api.post(`/events/${eventId}/feedback-request`, {});
            if (res.ok) {
                const data = await res.json();
                alert(data.message);
                fetchEvents(); // Refresh to update button state if needed
            } else {
                alert("Failed to send feedback requests");
            }
        } catch (err) {
            console.error(err);
            alert("Error sending feedback requests");
        }
    };

    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmails, setInviteEmails] = useState("");

    const handleSendInvites = async () => {
        if (!selectedEventId) return;
        const emails = inviteEmails.split(",").map(e => e.trim()).filter(e => e);
        if (emails.length === 0) {
            alert("Please enter at least one email.");
            return;
        }

        try {
            const res = await api.post(`/events/${selectedEventId}/invite`, { emails });
            if (res.ok) {
                alert("Invitations sent successfully!");
                setShowInviteModal(false);
                setInviteEmails("");
            } else {
                alert("Failed to send invitations.");
            }
        } catch (err) {
            console.error(err);
            alert("Error sending invitations");
        }
    };

    return (
        <div className="flex min-h-screen flex-col p-10 bg-gray-900 text-white">
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                    <h1 className="text-4xl font-bold text-blue-400">Admin Dashboard</h1>
                    <button
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded font-semibold transition shadow-lg flex items-center gap-2"
                        onClick={() => {
                            setShowInviteModal(true);
                            // Default to first event if none selected
                            if (!selectedEventId && events.length > 0) {
                                setSelectedEventId(events[0].id);
                            }
                        }}
                    >
                        <span>✉️ Invite Guests</span>
                    </button>
                </div>
                <button
                    onClick={() => router.push('/')}
                    className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-full font-bold border border-gray-600 transition-all transform hover:-translate-y-1"
                >
                    <span>🏠 Home</span>
                </button>
            </div>

            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl">All Events</h2>
                <button
                    onClick={handleCreateClick}
                    className="p-3 bg-green-600 text-white rounded font-bold hover:bg-green-700 transition"
                >
                    + Create Event
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
                    <div key={event.id} className="border border-gray-700 p-6 rounded-lg shadow-lg bg-gray-800 transition hover:shadow-xl">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-xl font-bold text-balmm-blue-100">{event.title}</h3>
                            <div className="flex gap-2">
                                <button onClick={() => handleEditClick(event)} className="text-sm text-blue-400 hover:underline">Edit</button>
                                <button onClick={() => handleDeleteClick(event.id)} className="text-sm text-red-500 hover:underline">Delete</button>
                            </div>
                        </div>
                        <p className="text-gray-400 mb-1">📅 {new Date(event.date_time).toLocaleDateString()} {new Date(event.date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {event.end_date_time && ` - ${new Date(event.end_date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                        </p>
                        <p className="text-gray-400 mb-4">📍 {event.location || event.mode}</p>

                        <div className="flex items-center gap-3 mb-4 bg-gray-900/50 p-3 rounded border border-gray-700">
                            <div className="text-center">
                                <span className="block text-2xl font-bold text-yellow-400">{event.average_rating ? event.average_rating.toFixed(1) : "0.0"}</span>
                                <span className="text-xs text-gray-400">Avg Rating</span>
                            </div>
                            <div className="h-8 w-px bg-gray-700"></div>
                            <div className="text-center">
                                <span className="block text-xl font-bold text-white">{event.feedback_count || 0}</span>
                                <span className="text-xs text-gray-400">Reviews</span>
                            </div>
                            <div className="h-8 w-px bg-gray-700"></div>
                            <div className="text-center">
                                <span className="block text-xl font-bold text-white">{event.registration_cap}</span>
                                <span className="text-xs text-gray-400">Capacity</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <button
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded font-semibold transition"
                                onClick={() => handleViewRegistrations(event.id)}
                            >
                                View Registrations
                            </button>
                            <button
                                className="w-full bg-purple-600 hover:bg-purple-500 text-white py-2 rounded font-semibold transition"
                                onClick={() => handleDownloadRegistrations(event.id)}
                            >
                                Download CSV
                            </button>
                            <button
                                className="w-full bg-teal-600 hover:bg-teal-500 text-white py-2 rounded font-semibold transition"
                                onClick={() => handleViewAnalytics(event.id)}
                            >
                                View Analytics Results
                            </button>

                            <button
                                className="w-full bg-yellow-600 hover:bg-yellow-500 text-white py-2 rounded font-semibold transition"
                                onClick={() => handleSendFeedback(event.id)}
                                disabled={event.feedback_email_sent}
                            >
                                {event.feedback_email_sent ? "Feedback Sent" : "Send Feedback Request"}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Invite Guests Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
                    <div className="bg-gray-800 p-8 rounded-lg max-w-lg w-full border border-gray-700 shadow-2xl relative">
                        <button
                            onClick={() => setShowInviteModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white"
                        >
                            ✖
                        </button>
                        <h2 className="text-2xl font-bold mb-4 text-white">Invite Guests</h2>

                        <div className="mb-4">
                            <label className="block text-gray-400 text-sm font-bold mb-2">Select Event</label>
                            <select
                                className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-indigo-500 outline-none"
                                value={selectedEventId || ""}
                                onChange={(e) => setSelectedEventId(Number(e.target.value))}
                            >
                                {events.map(event => (
                                    <option key={event.id} value={event.id}>
                                        {event.title}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="mb-4">
                            <label className="block text-gray-400 text-sm font-bold mb-2">Guest Emails</label>
                            <p className="text-gray-500 text-xs mb-2">Enter email addresses separated by commas.</p>
                            <textarea
                                className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:border-indigo-500 outline-none h-32"
                                placeholder="guest1@example.com, guest2@example.com"
                                value={inviteEmails}
                                onChange={(e) => setInviteEmails(e.target.value)}
                            />
                        </div>

                        <div className="flex justify-end mt-6 gap-3">
                            <button
                                onClick={() => setShowInviteModal(false)}
                                className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500 text-white font-semibold"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSendInvites}
                                className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                            >
                                Send Invitations
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create/Edit Modal */}
            {(showCreateModal || showEditModal) && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
                    <div className="bg-gray-800 p-8 rounded-lg max-w-lg w-full border border-gray-700 shadow-2xl">
                        <h2 className="text-2xl font-bold mb-6 text-white">{showCreateModal ? "Create New Event" : "Edit Event"}</h2>
                        <form onSubmit={showCreateModal ? submitCreate : submitEdit} className="space-y-4">
                            <div>
                                <label className="block text-gray-300 mb-1">Title</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 outline-none"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-gray-300 mb-1">Description</label>
                                <textarea
                                    className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 outline-none"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-300 mb-1">Date & Time</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 outline-none"
                                        value={formData.date_time}
                                        onChange={(e) => setFormData({ ...formData, date_time: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-300 mb-1">End Date & Time</label>
                                    <input
                                        type="datetime-local"
                                        className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 outline-none"
                                        value={formData.end_date_time}
                                        onChange={(e) => setFormData({ ...formData, end_date_time: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-300 mb-1">Capacity</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 outline-none"
                                        value={formData.capacity}
                                        onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-300 mb-1">Location</label>
                                    <input
                                        type="text"
                                        className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 outline-none"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-300 mb-1">Mode</label>
                                    <select
                                        className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 outline-none"
                                        value={formData.mode}
                                        onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                                    >
                                        <option value="in_person">In Person</option>
                                        <option value="virtual">Virtual</option>
                                        <option value="hybrid">Hybrid</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => { setShowCreateModal(false); setShowEditModal(false); }}
                                    className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500 text-white font-semibold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold"
                                >
                                    {showCreateModal ? "Create Event" : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Registrations Modal */}
            {showRegistrationsModal && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
                    <div className="bg-gray-800 p-8 rounded-lg max-w-4xl w-full border border-gray-700 shadow-2xl relative">
                        <button
                            onClick={() => setShowRegistrationsModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white"
                        >
                            ✖
                        </button>
                        <h2 className="text-2xl font-bold mb-6 text-white">Registrations</h2>

                        {registrations.length === 0 ? (
                            <p className="text-gray-400">No registrations found.</p>
                        ) : (
                            <div className="overflow-x-auto max-h-[60vh]">
                                <table className="w-full text-left text-sm text-gray-300">
                                    <thead className="text-gray-400 border-b border-gray-700 bg-gray-900/50">
                                        <tr>
                                            <th className="p-3">ID</th>
                                            <th className="p-3">Name</th>
                                            <th className="p-3">Email</th>
                                            <th className="p-3">Status</th>
                                            <th className="p-3">Rating</th>
                                            <th className="p-3">Comments</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {registrations.map((r) => (
                                            <tr key={r.id} className="border-b border-gray-700 hover:bg-gray-700/50 transition">
                                                <td className="p-3">{r.id}</td>
                                                <td className="p-3 font-medium text-white">{r.student?.name || "N/A"}</td>
                                                <td className="p-3">{r.student?.email || "N/A"}</td>
                                                <td className="p-3">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${r.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                                                        r.status === 'waitlisted' ? 'bg-orange-500/20 text-orange-400' :
                                                            'bg-gray-700 text-gray-300'
                                                        }`}>
                                                        {r.status.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-yellow-400 font-bold">
                                                    {r.feedback_rating ? `${r.feedback_rating} ★` : "-"}
                                                </td>
                                                <td className="p-3 text-gray-400 italic truncate max-w-xs">
                                                    {r.feedback_comments || "-"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <div className="flex justify-end mt-6 pt-4 border-t border-gray-700">
                            <button
                                onClick={() => handleDownloadRegistrations(selectedEventId!)}
                                className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded font-bold flex items-center gap-2"
                            >
                                📥 Download CSV
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Analytics Modal */}
            {showAnalyticsModal && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
                    <div className="bg-gray-800 p-8 rounded-lg max-w-2xl w-full border border-gray-700 shadow-2xl relative">
                        <button
                            onClick={() => setShowAnalyticsModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white"
                        >
                            ✖
                        </button>
                        <h2 className="text-2xl font-bold mb-6 text-white">Feedback Analytics</h2>

                        {selectedEventId && (
                            <div className="mb-8 p-6 bg-gray-900 rounded-lg text-center border border-gray-700">
                                <h3 className="text-gray-400 mb-2">Overall Rating</h3>
                                <div className="text-5xl font-bold text-yellow-400 mb-2">
                                    {events.find(e => e.id === selectedEventId)?.average_rating?.toFixed(1) || "0.0"}
                                </div>
                                <div className="text-sm text-gray-500">
                                    Based on {events.find(e => e.id === selectedEventId)?.feedback_count || 0} reviews
                                </div>
                            </div>
                        )}

                        <h3 className="text-xl font-bold mb-4 text-white">Student Feedback</h3>
                        {registrations.filter(r => r.feedback_rating || r.feedback_comments).length === 0 ? (
                            <p className="text-gray-400 italic">No feedback submitted yet.</p>
                        ) : (
                            <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2">
                                {registrations.filter(r => r.feedback_rating || r.feedback_comments).map((r) => (
                                    <div key={r.id} className="bg-gray-700/50 p-4 rounded border border-gray-600">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-bold text-white">{r.student?.name || "Student"}</span>
                                            <span className="text-yellow-400 font-bold">{r.feedback_rating} ★</span>
                                        </div>
                                        <p className="text-gray-300 text-sm">"{r.feedback_comments}"</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex justify-end mt-6 pt-4 border-t border-gray-700">
                            <button
                                onClick={() => setShowAnalyticsModal(false)}
                                className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500 text-white font-semibold"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Force HMR Update
