"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../utils/api";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy } from '@dnd-kit/sortable';
import { SortableEventCard } from './SortableEventCard';
import EventFormModal from './EventFormModal';
import ResumeListModal from './ResumeListModal';

import UserManagementModal from './UserManagementModal';

interface Event {
    id: number;
    title: string;
    date_time: string;
    mode: string;
    category: string;
    description: string;
    image_url?: string;
    venue?: string;
    registration_cap?: number;
    registrations_count?: number;
}

interface AdminStats {
    pending_requests: number;
    new_users_today: number;
    active_events: number;
    new_judges: number;
}

interface Notification {
    id: number;
    message: string;
    time: string;
    type: 'info' | 'warning' | 'alert';
}

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
}

export default function UnifiedDashboard() {
    const router = useRouter();
    const [role, setRole] = useState<string | null>(null);
    const [name, setName] = useState<string | null>(null);
    const [events, setEvents] = useState<Event[]>([]);
    const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);


    // Login Widget State
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    // Filter States
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");

    // Admin State
    const [isEditMode, setIsEditMode] = useState(false);
    const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showNotifications, setShowNotifications] = useState(true);

    // --- Pending Users Logic ---
    const [pendingUsers, setPendingUsers] = useState<User[]>([]);
    const [isPendingUsersModalOpen, setIsPendingUsersModalOpen] = useState(false);

    const fetchPendingUsers = async () => {
        console.log("Fetching pending users...");
        try {
            const res = await api.get('/admin/users/pending');
            console.log("Pending Users Response:", res.status);
            if (res.ok) {
                const data = await res.json();
                setPendingUsers(data);
                setIsPendingUsersModalOpen(true);
            } else {
                if (res.status === 401) {
                    alert("Session Expired. Please Sign Out and Log In again.");
                } else {
                    alert(`Failed to load. Status: ${res.status}`);
                }
            }
        } catch (e) {
            console.error("Failed to fetch pending users", e);
            alert("Error connecting to server.");
        }
    };

    const approveUser = async (userId: number) => {
        try {
            const res = await api.post(`/admin/users/${userId}/authorize?is_active=true`, {});
            if (res.ok) {
                setPendingUsers((prev) => prev.filter((u) => u.id !== userId));
                fetchAdminData(); // Refresh stats
                alert("User approved!");
            }
        } catch (e) {
            console.error(e);
            alert("Failed to approve user");
        }
    };

    // DnD Sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        const storedRole = localStorage.getItem("role");
        const storedName = localStorage.getItem("name");

        if (storedRole) {
            setRole(storedRole);
            setName(storedName);
            if (storedRole === 'admin') {
                fetchAdminData();
            }
        }

        fetchEvents();
    }, []);



    const fetchAdminData = async () => {
        try {
            const statsRes = await api.get('/admin/stats');
            if (statsRes.ok) setAdminStats(await statsRes.json());

            const notifRes = await api.get('/admin/notifications');
            if (notifRes.ok) setNotifications(await notifRes.json());
        } catch (e) {
            console.error("Failed to fetch admin data", e);
        }
    };

    // Polling for live updates (Notification System)
    useEffect(() => {
        if (role === 'admin') {
            const interval = setInterval(fetchAdminData, 10000); // Poll every 10s
            return () => clearInterval(interval);
        }
    }, [role]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoggingIn(true);
        const formData = new FormData();
        formData.append("username", loginEmail);
        formData.append("password", loginPassword);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/auth/token`, {
                method: "POST",
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                localStorage.setItem("token", data.access_token);
                localStorage.setItem("role", data.role);
                localStorage.setItem("name", data.name);

                setRole(data.role);
                setName(data.name);
                setLoginEmail("");
                setLoginPassword("");
            } else {
                alert("Login failed. Please check credentials.");
            }
        } catch (err) {
            console.error(err);
            alert("Login error");
        } finally {
            setIsLoggingIn(false);
        }
    };

    useEffect(() => {
        let res = events;
        if (searchTerm) {
            res = res.filter(e => e.title.toLowerCase().includes(searchTerm.toLowerCase()) || e.description.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        if (selectedCategory !== "all") {
            res = res.filter(e => e.category === selectedCategory);
        }
        setFilteredEvents(res);
    }, [searchTerm, selectedCategory, events]);

    const fetchEvents = async () => {
        try {
            const res = await api.get("/events/");
            if (res.ok) {
                const data = await res.json();
                setEvents(data);
                setFilteredEvents(data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDragEnd = async (event: any) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            setFilteredEvents((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over.id);
                const newItems = arrayMove(items, oldIndex, newIndex);

                // Persist to backend
                // Only persist if we are viewing all events to avoid messing up global order with partial list
                if (searchTerm === "" && selectedCategory === "all") {
                    api.put('/events/reorder', newItems.map(e => e.id)).catch(console.error);
                }

                return newItems;
            });

            // Also update main events list to match
            setEvents((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);

    const handleSaveEvent = async (data: Partial<Event>) => {
        try {
            if (editingEvent) {
                // UPDATE WITH CONFIRMATION
                if (!window.confirm("Are you sure you want to update this event?")) return;

                const res = await api.put(`/events/${editingEvent.id}`, data);
                if (res.ok) {
                    setFilteredEvents(prev => prev.map(e => e.id === editingEvent.id ? { ...e, ...data } : e));
                    // Optimistic update for main list too
                    setEvents(prev => prev.map(e => e.id === editingEvent.id ? { ...e, ...data } : e));
                    if (role === 'admin') fetchAdminData();
                    fetchEvents(); // Refresh ensuring full sync
                } else {
                    alert("Failed to update event");
                }
            } else {
                // CREATE
                const res = await api.post("/events/", data);
                if (res.ok) {
                    const newEvent = await res.json();
                    setEvents(prev => [newEvent, ...prev]);
                    // If filter matches, add to filtered
                    if (selectedCategory === "all" || selectedCategory === newEvent.category) {
                        setFilteredEvents(prev => [newEvent, ...prev]);
                    }
                    if (role === 'admin') fetchAdminData();
                } else {
                    alert("Failed to create event");
                }
            }
        } catch (e) {
            console.error(e);
            alert("Error saving event");
        }
    };

    const handleUpdateEvent = async (id: number, data: Partial<Event>) => {
        // Kept for DnD or direct updates if needed
        try {
            const res = await api.put(`/events/${id}`, data);
        } catch (e) { console.error(e); }
    };

    const categories = ["all", "workshop", "career_fair", "mixer", "tech_talk", "competition"];

    return (
        <div className="min-h-screen bg-gray-950 text-white font-sans selection:bg-purple-500 selection:text-white">

            {/* Event Form Modal */}
            <EventFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveEvent}
                initialData={editingEvent}
            />

            <UserManagementModal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} />

            <ResumeListModal
                isOpen={isResumeModalOpen}
                onClose={() => setIsResumeModalOpen(false)}
            />

            {/* Top Navigation */}
            <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50 backdrop-blur-md bg-opacity-80">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-4">
                            <div className="bg-gradient-to-tr from-blue-600 to-purple-600 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-lg">C</div>
                            <span className="text-xl font-bold tracking-tight">CMIS Events</span>
                        </div>
                        <div className="flex items-center gap-4">
                            {name ? (
                                <>
                                    <span className="text-gray-400 text-sm hidden sm:block">Welcome, <span className="text-white font-semibold">{name}</span></span>
                                    <button
                                        onClick={() => {
                                            localStorage.clear();
                                            setRole(null);
                                            setName(null);
                                            router.push("/dashboard");
                                        }}
                                        className="text-sm bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-full transition border border-gray-700"
                                    >
                                        Sign Out
                                    </button>
                                </>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => router.push("/login")}
                                        className="text-sm font-semibold text-gray-300 hover:text-white transition"
                                    >
                                        Log In
                                    </button>
                                    <button
                                        onClick={() => router.push("/login?mode=signup")}
                                        className="text-sm bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-full transition font-bold shadow-lg shadow-blue-900/20"
                                    >
                                        Sign Up
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">

                {/* Left Sidebar */}
                <div className="lg:col-span-1 space-y-8">



                    {/* Admin Command Center Widget */}
                    {role === 'admin' && (
                        <div className="bg-gray-900 rounded-xl p-5 border border-purple-500/30 shadow-lg shadow-purple-900/20 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-600/10 rounded-bl-full -mr-4 -mt-4 transition group-hover:bg-purple-600/20 pointer-events-none"></div>
                            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                Admin Command
                            </h3>
                            <p className="text-xs text-purple-300 mb-4 uppercase tracking-wider font-semibold">System Control</p>


                            <div className="space-y-3 relative z-10">
                                <div className="grid grid-cols-2 gap-2">
                                    <a href="http://localhost:8000/admin/user/list" target="_blank" className="block w-full text-center bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded-lg transition shadow-md hover:shadow-purple-600/50 text-xs flex items-center justify-center">
                                        DB Console
                                    </a>
                                    <button onClick={() => setIsUserModalOpen(true)} className="block w-full text-center bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg transition shadow-md hover:shadow-blue-600/50 text-xs">
                                        Manage Users
                                    </button>
                                </div>
                                <button onClick={() => router.push('/admin/dashboard')} className="block w-full text-center bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-lg transition shadow-md hover:shadow-indigo-600/50 text-xs flex items-center justify-center gap-2">
                                    <span>📅 Manage Events</span>
                                </button>
                                <div className="grid grid-cols-1 gap-2 text-center">
                                    <div className="bg-gray-800 rounded p-2 border border-gray-700">
                                        <span className="block text-xl font-bold text-white">
                                            {adminStats ? adminStats.active_events : '-'}
                                        </span>
                                        <span className="text-[10px] text-gray-400 uppercase">Active Events</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}



                    {role && (
                        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                            <h3 className="text-lg font-bold text-white mb-4">My Tools</h3>
                            <div className="space-y-2">
                                {role === 'faculty' && (
                                    <button onClick={() => router.push('/faculty/dashboard')} className="w-full text-left px-4 py-3 bg-gray-800 hover:bg-gray-750 rounded-lg flex items-center justify-between group transition">
                                        <span>Faculty Dashboard</span>
                                        <span className="text-gray-500 group-hover:text-white transition">→</span>
                                    </button>
                                )}
                                {role === 'recruiter' && (
                                    <button onClick={() => router.push('/recruiter/dashboard')} className="w-full text-left px-4 py-3 bg-gray-800 hover:bg-gray-750 rounded-lg flex items-center justify-between group transition">
                                        <span>Recruiter Dashboard</span>
                                        <span className="text-gray-500 group-hover:text-white transition">→</span>
                                    </button>
                                )}
                                {role === 'judge' && (
                                    <button onClick={() => router.push('/judge/dashboard')} className="w-full text-left px-4 py-3 bg-gray-800 hover:bg-gray-750 rounded-lg flex items-center justify-between group transition">
                                        <span>Judge Dashboard</span>
                                        <span className="text-gray-500 group-hover:text-white transition">→</span>
                                    </button>
                                )}
                                {role === 'student' && (
                                    <>
                                        <button onClick={() => router.push('/student/dashboard')} className="w-full text-left px-4 py-3 bg-gray-800 hover:bg-gray-750 rounded-lg flex items-center justify-between group transition mb-2">
                                            <span>My Enrolled Events</span>
                                            <span className="text-gray-500 group-hover:text-white transition">→</span>
                                        </button>
                                        <button onClick={() => router.push('/student/profile')} className="w-full text-left px-4 py-3 bg-gray-800 hover:bg-gray-750 rounded-lg flex items-center justify-between group transition">
                                            <span>My Profile & Resume</span>
                                            <span className="text-gray-500 group-hover:text-white transition">→</span>
                                        </button>
                                    </>
                                )}
                                {role === 'admin' && (
                                    <button onClick={() => setIsResumeModalOpen(true)} className="w-full text-left px-4 py-3 bg-gray-800 hover:bg-gray-750 rounded-lg flex items-center justify-between group transition border-l-4 border-blue-500">
                                        <span>📄 Student Resumes</span>
                                        <span className="text-gray-500 group-hover:text-white transition">→</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                        <h3 className="text-lg font-bold text-white mb-4">Filter Events</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase">Search</label>
                                <input
                                    type="text"
                                    placeholder="Keywords..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase">Category</label>
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                >
                                    {categories.map(c => (
                                        <option key={c} value={c}>{c.replace('_', ' ').toUpperCase()}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-3 space-y-8">

                    {/* Hero Section */}
                    <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-gray-800 h-64 sm:h-80 flex items-center justify-center text-center group">
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center opacity-40 group-hover:scale-105 transition duration-700"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-900/50 to-transparent"></div>
                        <div className="relative z-10 px-6 max-w-2xl">
                            <span className="inline-block py-1 px-3 rounded-full bg-blue-600/90 text-xs font-bold tracking-wider mb-4 border border-blue-400/30">FEATURED EVENT</span>
                            <h2 className="text-3xl sm:text-5xl font-extrabold text-white mb-4 tracking-tight">Spring 2025 Tech Showcase</h2>
                            <p className="text-lg text-gray-200 mb-6">Join top industry leaders and showcase your innovative projects.</p>
                            <button
                                onClick={() => document.getElementById('events-grid')?.scrollIntoView({ behavior: 'smooth' })}
                                className="bg-white text-gray-900 hover:bg-gray-100 px-6 py-3 rounded-full font-bold transition transform hover:scale-105"
                            >
                                Browse Events
                            </button>
                        </div>
                    </div>

                    {/* Admin Toolbar & Task Bar */}
                    {role === 'admin' && (
                        <div className="space-y-4 mb-6">

                            {/* Notification Bar */}
                            {showNotifications && notifications.length > 0 && (
                                <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-3 flex flex-col gap-2">
                                    <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">🔔 System Notifications</h4>
                                        <button onClick={() => setShowNotifications(false)} className="text-gray-500 hover:text-white text-xs">Dismiss</button>
                                    </div>
                                    <div className="space-y-1">
                                        {notifications.map(n => (
                                            <div key={n.id} className={`text-sm py-1 px-2 rounded flex justify-between items-center ${n.type === 'alert' ? 'bg-blue-900/20 text-blue-200' : 'text-gray-300'}`}>
                                                <span>{n.message}</span>
                                                <span className="text-xs text-gray-500">{n.time}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Task Bar / Stats */}
                            <div className="bg-gray-900 border border-purple-500/30 rounded-xl p-4">
                                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                            🛡️ Admin Console
                                        </h3>
                                        <p className="text-xs text-purple-300">Control Panel</p>
                                    </div>

                                    {/* Right Side: Stats + Buttons */}
                                    <div className="flex items-center gap-4">
                                        {/* Stats Widget */}
                                        {adminStats && (
                                            <div className="flex gap-4">
                                                <div
                                                    onClick={fetchPendingUsers}
                                                    className="bg-gray-800 px-3 py-1 rounded-lg border border-gray-700 text-center cursor-pointer hover:bg-gray-700 transition relative"
                                                >
                                                    <span className="block text-lg font-bold text-white">{adminStats.pending_requests}</span>
                                                    <span className="text-[10px] text-gray-400 uppercase">Requests</span>
                                                    {adminStats.pending_requests > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></span>}
                                                </div>
                                                <div className="bg-gray-800 px-3 py-1 rounded-lg border border-gray-700 text-center">
                                                    <span className="block text-lg font-bold text-green-400">+{adminStats.new_users_today}</span>
                                                    <span className="text-[10px] text-gray-400 uppercase">New Users</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Action Buttons */}
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    setEditingEvent(null);
                                                    setIsModalOpen(true);
                                                }}
                                                className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-lg font-bold border border-gray-600 text-sm"
                                            >
                                                ➕ New Event
                                            </button>
                                            <button
                                                onClick={() => setIsEditMode(!isEditMode)}
                                                className={`px-4 py-2 rounded-lg font-bold transition text-sm flex items-center gap-2 ${isEditMode ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/50' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                                            >
                                                {isEditMode ? '✅ Done' : '✏️ Layout'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Event Grid Header */}
                    <div id="events-grid" className="flex justify-between items-end border-b border-gray-800 pb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-white">Upcoming Events</h2>
                            <p className="text-gray-400 text-sm mt-1">Found {filteredEvents.length} events matching your criteria</p>
                        </div>
                    </div>

                    {/* Event Cards Grid */}
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={filteredEvents.map(e => e.id)}
                            strategy={rectSortingStrategy}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {filteredEvents.map((e) => (
                                    <SortableEventCard
                                        key={e.id}
                                        event={e}
                                        isEditMode={isEditMode}
                                        onSave={handleUpdateEvent}
                                        onClick={() => router.push(`/events/${e.id}`)}
                                        onEdit={(eventToEdit) => {
                                            setEditingEvent(eventToEdit);
                                            setIsModalOpen(true);
                                        }}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>

                    {filteredEvents.length === 0 && (
                        <div className="text-center py-12 bg-gray-900 rounded-xl border border-gray-800 border-dashed">
                            <p className="text-gray-400">No events found matching your search.</p>
                            <button onClick={() => { setSearchTerm(""); setSelectedCategory("all") }} className="mt-4 text-blue-400 hover:underline">Clear Filters</button>
                        </div>
                    )}
                </div>
            </div>
            {/* Event Form Modal */}
            <EventFormModal
                isOpen={isModalOpen}
                initialData={editingEvent || undefined}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveEvent}
            />

            {/* Pending Users Modal */}
            {isPendingUsersModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-gray-900 rounded-2xl w-full max-w-2xl border border-gray-700 shadow-2xl overflow-hidden">
                        <div className="bg-gray-800 px-6 py-4 border-b border-gray-700 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white">Pending User Approvals</h2>
                            <button onClick={() => setIsPendingUsersModalOpen(false)} className="text-gray-400 hover:text-white">✕</button>
                        </div>
                        <div className="p-6 max-h-[60vh] overflow-y-auto">
                            {pendingUsers.length === 0 ? (
                                <div className="text-center text-gray-400 py-8">No pending requests.</div>
                            ) : (
                                <div className="space-y-3">
                                    {pendingUsers.map(user => (
                                        <div key={user.id} className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 flex justify-between items-center">
                                            <div>
                                                <h3 className="font-bold text-white">{user.name}</h3>
                                                <p className="text-sm text-gray-400">{user.email}</p>
                                                <p className="text-xs text-purple-400 mt-1 uppercase">{user.role}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => approveUser(user.id)}
                                                    className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition"
                                                >
                                                    Approve
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="bg-gray-800/50 px-6 py-4 border-t border-gray-700 text-right">
                            <button onClick={() => setIsPendingUsersModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white font-bold text-sm">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}

