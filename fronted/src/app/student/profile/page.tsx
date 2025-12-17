"use client";
import { useEffect, useState } from "react";
import { api } from "../../../utils/api";
import { useRouter } from "next/navigation";

export default function StudentProfile() {
    const router = useRouter();
    const [profile, setProfile] = useState<any>(null);
    const [skills, setSkills] = useState<any[]>([]);
    const [resume, setResume] = useState<any>(null);

    // Form States
    const [formData, setFormData] = useState({
        major: "",
        graduation_year: 2026,
        headline: "",
        interests: "",
        linkedin_url: ""
    });
    const [newSkill, setNewSkill] = useState("");
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        const res = await api.get("/student/profile/");
        if (res.ok) {
            const data = await res.json();
            setProfile(data);
            setSkills(data.skills || []);
            setResume(data.resumes?.find((r: any) => r.is_active) || null);
            setFormData({
                major: data.major || "",
                graduation_year: data.graduation_year || 2026,
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
        if (res.ok) alert("Profile updated successfully!");
    };

    const addSkill = async () => {
        if (!newSkill) return;
        const res = await api.post("/student/profile/skills", { skill_name: newSkill });
        if (res.ok) {
            fetchProfile();
            setNewSkill("");
        }
    };

    const removeSkill = async (id: number) => {
        const res = await api.delete(`/student/profile/skills/${id}`);
        if (res.ok) fetchProfile();
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        const file = e.target.files[0];

        if (file.size > 5 * 1024 * 1024) {
            alert("File size must be less than 5MB");
            return;
        }
        if (file.type !== "application/pdf") {
            alert("Only PDF files are allowed");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        setUploading(true);
        // Custom fetch for multipart
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/student/profile/resume`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: formData
            });
            if (res.ok) {
                alert("Resume uploaded!");
                fetchProfile();
            } else {
                alert("Upload failed");
            }
        } catch (err) {
            alert("Error uploading file");
        } finally {
            setUploading(false);
        }
    };

    if (!profile) return <div className="p-10 text-white">Loading...</div>;

    return (
        <div className="p-10 bg-gray-900 min-h-screen text-white">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">My Profile</h1>
                    <button onClick={() => router.push("/student/dashboard")} className="text-blue-400 hover:text-blue-300">Back to Dashboard</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Basic Info */}
                    <div className="md:col-span-2 space-y-6">
                        <section className="bg-gray-800 p-6 rounded-lg shadow-lg">
                            <h2 className="text-xl font-bold mb-4 border-b border-gray-700 pb-2">Basic Information</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-400 text-sm mb-1">Name</label>
                                    <input className="w-full p-2 bg-gray-700 rounded border border-gray-600 cursor-not-allowed text-gray-400" value={profile.name} disabled />
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-sm mb-1">Email</label>
                                    <input className="w-full p-2 bg-gray-700 rounded border border-gray-600 cursor-not-allowed text-gray-400" value={profile.email} disabled />
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-sm mb-1">Major</label>
                                    <input className="w-full p-2 bg-gray-700 rounded border border-gray-600" value={formData.major} onChange={e => setFormData({ ...formData, major: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-sm mb-1">Graduation Year</label>
                                    <input type="number" className="w-full p-2 bg-gray-700 rounded border border-gray-600" value={formData.graduation_year} onChange={e => setFormData({ ...formData, graduation_year: parseInt(e.target.value) })} />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-gray-400 text-sm mb-1">Headline</label>
                                    <input className="w-full p-2 bg-gray-700 rounded border border-gray-600" placeholder="e.g. MS MIS student focused on data engineering" value={formData.headline} onChange={e => setFormData({ ...formData, headline: e.target.value })} />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-gray-400 text-sm mb-1">LinkedIn URL</label>
                                    <input className="w-full p-2 bg-gray-700 rounded border border-gray-600" value={formData.linkedin_url} onChange={e => setFormData({ ...formData, linkedin_url: e.target.value })} />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-gray-400 text-sm mb-1">Interests</label>
                                    <textarea className="w-full p-2 bg-gray-700 rounded border border-gray-600" rows={3} value={formData.interests} onChange={e => setFormData({ ...formData, interests: e.target.value })} />
                                </div>
                            </div>
                            <button onClick={updateProfile} className="mt-4 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded font-bold transition">Save Changes</button>
                        </section>

                        <section className="bg-gray-800 p-6 rounded-lg shadow-lg">
                            <h2 className="text-xl font-bold mb-4 border-b border-gray-700 pb-2">Skills</h2>
                            <div className="flex gap-2 mb-4">
                                <input
                                    className="flex-1 p-2 bg-gray-700 rounded border border-gray-600"
                                    placeholder="Add a skill (e.g. Python)"
                                    value={newSkill}
                                    onChange={e => setNewSkill(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && addSkill()}
                                />
                                <button onClick={addSkill} className="bg-green-600 hover:bg-green-500 text-white px-4 rounded">Add</button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {skills.map((skill: any) => (
                                    <span key={skill.id} className="bg-blue-900 text-blue-200 px-3 py-1 rounded-full flex items-center gap-2">
                                        {skill.skill_name}
                                        <button onClick={() => removeSkill(skill.id)} className="text-blue-400 hover:text-white font-bold">×</button>
                                    </span>
                                ))}
                                {skills.length === 0 && <p className="text-gray-500 italic">No skills added yet.</p>}
                            </div>
                        </section>
                    </div>

                    {/* Resume Section */}
                    <div className="md:col-span-1">
                        <section className="bg-gray-800 p-6 rounded-lg shadow-lg sticky top-8">
                            <h2 className="text-xl font-bold mb-4 border-b border-gray-700 pb-2">Resume</h2>

                            {resume ? (
                                <div className="mb-6 p-4 bg-gray-700 rounded border border-gray-600">
                                    <p className="font-bold text-green-400 mb-1">Active Resume uploaded</p>
                                    <p className="text-sm truncate mb-2">{resume.file_name_original}</p>
                                    <p className="text-xs text-gray-400 mb-4">{new Date(resume.uploaded_at).toLocaleDateString()}</p>
                                    <a
                                        href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/student/profile/resume/download`}
                                        target="_blank"
                                        rel="noreferrer" // Add security best practice
                                        className="block w-full text-center bg-gray-600 hover:bg-gray-500 py-2 rounded mb-2 transition"
                                    >
                                        Download Current
                                    </a>
                                </div>
                            ) : (
                                <div className="mb-6 p-4 bg-gray-700/50 rounded border border-gray-600 border-dashed text-center">
                                    <p className="text-gray-400 mb-2">No active resume</p>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-bold mb-2">Upload New Resume</label>
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept="application/pdf"
                                        onChange={handleFileUpload}
                                        className="block w-full text-sm text-gray-400
                                          file:mr-4 file:py-2 file:px-4
                                          file:rounded-full file:border-0
                                          file:text-sm file:font-semibold
                                          file:bg-blue-600 file:text-white
                                          file:cursor-pointer hover:file:bg-blue-500
                                        "
                                        disabled={uploading}
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-2">Max 5 MB, PDF only.</p>
                                {uploading && <p className="text-blue-400 mt-2 animate-pulse">Uploading...</p>}
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
