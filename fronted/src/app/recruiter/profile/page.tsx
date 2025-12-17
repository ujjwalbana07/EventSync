"use client";
import { useEffect, useState } from "react";
import { api } from "../../../utils/api";
import { useRouter } from "next/navigation";

export default function RecruiterProfile() {
    const router = useRouter();
    const [profile, setProfile] = useState<any>(null);

    // Form States
    const [formData, setFormData] = useState({
        name: "",
        headline: "",
        interests: "",
        linkedin_url: ""
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        const res = await api.get("/student/profile/"); // Reusing generic profile endpoint
        if (res.ok) {
            const data = await res.json();
            setProfile(data);
            setFormData({
                name: data.name || "",
                headline: data.headline || "",
                interests: data.interests || "",
                linkedin_url: data.linkedin_url || ""
            });
        } else {
            router.push("/login");
        }
    };

    const updateProfile = async () => {
        const res = await api.put("/student/profile/", formData);
        if (res.ok) {
            alert("Profile updated successfully!");
            fetchProfile(); // Refresh
        } else {
            alert("Failed to update profile.");
        }
    };

    if (!profile) return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
            <div className="animate-pulse flex items-center gap-2">
                <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                <div className="w-4 h-4 bg-indigo-500 rounded-full"></div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-gray-100 p-8 md:p-12 font-sans">
            <div className="max-w-4xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 drop-shadow-sm">
                            Recruiter Profile
                        </h1>
                        <p className="text-gray-400 mt-2 text-lg">Build your presence and attract top talent</p>
                    </div>
                    <button
                        onClick={() => router.back()}
                        className="group flex items-center gap-2 bg-gray-800/80 hover:bg-gray-700/80 backdrop-blur-sm border border-gray-700 text-gray-300 px-6 py-3 rounded-full font-semibold transition-all shadow-lg hover:shadow-gray-900/20"
                    >
                        <span>← Back to Dashboard</span>
                    </button>
                </div>

                <div className="bg-gray-800/30 border border-gray-700/50 backdrop-blur-md rounded-2xl overflow-hidden shadow-2xl">
                    <div className="p-8 md:p-10">
                        <h2 className="text-2xl font-bold text-white mb-8 border-b border-gray-700/50 pb-4 flex items-center gap-3">
                            <span className="text-3xl">👤</span> Professional Details
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="block text-gray-400 text-sm font-bold uppercase tracking-wider">Full Name</label>
                                <input
                                    className="w-full p-4 bg-gray-900/50 border border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-white placeholder-gray-600"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-gray-400 text-sm font-bold uppercase tracking-wider">Email Address</label>
                                <input
                                    className="w-full p-4 bg-gray-800/50 border border-gray-700 rounded-xl text-gray-500 cursor-not-allowed"
                                    value={profile.email}
                                    disabled
                                    title="Email cannot be changed"
                                />
                            </div>

                            <div className="md:col-span-2 space-y-2">
                                <label className="block text-gray-400 text-sm font-bold uppercase tracking-wider">Headline / Position</label>
                                <input
                                    className="w-full p-4 bg-gray-900/50 border border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-white placeholder-gray-600"
                                    placeholder="e.g. Senior Technical Recruiter at Global Tech Corp"
                                    value={formData.headline}
                                    onChange={e => setFormData({ ...formData, headline: e.target.value })}
                                />
                                <p className="text-xs text-gray-500">This will be visible to students and faculty.</p>
                            </div>

                            <div className="md:col-span-2 space-y-2">
                                <label className="block text-gray-400 text-sm font-bold uppercase tracking-wider">LinkedIn URL</label>
                                <input
                                    className="w-full p-4 bg-gray-900/50 border border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-white placeholder-gray-600"
                                    placeholder="https://linkedin.com/in/..."
                                    value={formData.linkedin_url}
                                    onChange={e => setFormData({ ...formData, linkedin_url: e.target.value })}
                                />
                            </div>

                            <div className="md:col-span-2 space-y-2">
                                <label className="block text-gray-400 text-sm font-bold uppercase tracking-wider">About / Recruiting Focus</label>
                                <textarea
                                    className="w-full p-4 bg-gray-900/50 border border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-white placeholder-gray-600 min-h-[120px]"
                                    placeholder="Describe your role, what you are looking for in candidates, or your company culture..."
                                    value={formData.interests}
                                    onChange={e => setFormData({ ...formData, interests: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="mt-10 flex justify-end">
                            <button
                                onClick={updateProfile}
                                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg shadow-purple-900/30 transition-all transform hover:-translate-y-1"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
