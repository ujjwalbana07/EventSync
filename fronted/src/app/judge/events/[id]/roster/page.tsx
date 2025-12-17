"use client";
import { useEffect, useState } from "react";
import { api } from "../../../../../utils/api";
import { useParams, useRouter } from "next/navigation";

export default function EventRoster() {
    const params = useParams();
    const router = useRouter();
    const eventId = params.id;
    const [registrations, setRegistrations] = useState<any[]>([]);
    const [skillFilter, setSkillFilter] = useState("");
    const [selectedStudent, setSelectedStudent] = useState<any>(null);

    useEffect(() => {
        if (eventId) fetchRoster();
    }, [eventId]);

    const fetchRoster = async (skill: string = "") => {
        let url = `/judge/events/${eventId}/roster`;
        if (skill) url += `?skill=${skill}`;

        const res = await api.get(url);
        if (res.ok) setRegistrations(await res.json());
    };

    const handleSearch = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            fetchRoster(skillFilter);
        }
    };

    const openProfile = async (studentId: number) => {
        const res = await api.get(`/judge/students/${studentId}/profile`);
        if (res.ok) {
            setSelectedStudent(await res.json());
        }
    };

    const downloadResume = async (studentId: number) => {
        // We use window.open for file download/stream
        const token = localStorage.getItem("token");
        const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/judge/students/${studentId}/resume`;

        // Fetch to check existence first or just open?
        // Opening directly with token is tricky because we need header.
        // Alternative: specialized endpoint using query param token (insecure) or blob download in JS.
        // Let's use blob download.

        try {
            const res = await fetch(url, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const blob = await res.blob();
                const downloadUrl = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = downloadUrl;
                a.download = `Resume_Student_${studentId}.pdf`;
                document.body.appendChild(a);
                a.click();
                a.remove();
            } else {
                alert("Resume not found or accessible.");
            }
        } catch (e) {
            alert("Error downloading resume.");
        }
    };

    return (
        <div className="p-10 bg-gray-900 min-h-screen text-white">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Event Roster</h1>
                <button onClick={() => router.back()} className="text-blue-400">Back</button>
            </div>

            {/* Scale Search */}
            <div className="mb-8 flex gap-4">
                <input
                    className="p-3 rounded bg-gray-800 border border-gray-700 w-full md:w-1/3"
                    placeholder="Search by Skill (e.g. Python)... press Enter"
                    value={skillFilter}
                    onChange={e => setSkillFilter(e.target.value)}
                    onKeyDown={handleSearch}
                />
                <button onClick={() => fetchRoster(skillFilter)} className="bg-blue-600 px-6 rounded">Search</button>
            </div>

            {/* Table */}
            <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
                <table className="w-full text-left">
                    <thead className="bg-gray-700 text-gray-300 uppercase text-xs">
                        <tr>
                            <th className="p-4">Name</th>
                            <th className="p-4">Major / Year</th>
                            <th className="p-4">Skills</th>
                            <th className="p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {registrations.map((r: any) => (
                            <tr key={r.id} className="hover:bg-gray-700/50">
                                <td className="p-4 font-bold">{r.student.name}</td>
                                <td className="p-4 text-gray-400">
                                    {r.student.major ? `${r.student.major} '${r.student.graduation_year}` : "N/A"}
                                </td>
                                <td className="p-4">
                                    <div className="flex flex-wrap gap-1">
                                        {r.student.skills?.slice(0, 3).map((s: any) => (
                                            <span key={s.id} className="bg-gray-900 px-2 py-0.5 rounded text-xs text-blue-300">{s.skill_name}</span>
                                        ))}
                                        {r.student.skills?.length > 3 && <span className="text-xs text-gray-500">+{r.student.skills.length - 3} more</span>}
                                    </div>
                                </td>
                                <td className="p-4 flex gap-2">
                                    <button onClick={() => openProfile(r.student.id)} className="text-sm bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded">View Profile</button>
                                    <button onClick={() => downloadResume(r.student.id)} className="text-sm bg-gray-600 hover:bg-gray-500 px-3 py-1 rounded">Resume</button>
                                </td>
                            </tr>
                        ))}
                        {registrations.length === 0 && (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-gray-500">No students found matching your criteria.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Profile Modal */}
            {selectedStudent && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
                    <div className="bg-gray-800 rounded-lg w-full max-w-lg p-6 relative shadow-2xl border border-gray-700">
                        <button onClick={() => setSelectedStudent(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>

                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold">{selectedStudent.name}</h2>
                            <p className="text-blue-400">{selectedStudent.headline}</p>
                        </div>

                        <div className="space-y-4 text-sm text-gray-300">
                            <div className="flex justify-between border-b border-gray-700 pb-2">
                                <span>Major</span>
                                <span className="text-white">{selectedStudent.major || "-"}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-700 pb-2">
                                <span>Graduation</span>
                                <span className="text-white">{selectedStudent.graduation_year || "-"}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-700 pb-2">
                                <span>Email</span>
                                <span className="text-white">{selectedStudent.email}</span>
                            </div>
                            {selectedStudent.linkedin_url && (
                                <div className="flex justify-between border-b border-gray-700 pb-2">
                                    <span>LinkedIn</span>
                                    <a href={selectedStudent.linkedin_url} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">View Profile</a>
                                </div>
                            )}
                            <div>
                                <span className="block mb-2 text-gray-400">Interests</span>
                                <p className="text-white bg-gray-900 p-2 rounded">{selectedStudent.interests || "None listed."}</p>
                            </div>
                            <div>
                                <span className="block mb-2 text-gray-400">Skills</span>
                                <div className="flex flex-wrap gap-2">
                                    {selectedStudent.skills?.map((s: any) => (
                                        <span key={s.id} className="bg-blue-900 text-blue-200 px-2 py-1 rounded text-xs">{s.skill_name}</span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex gap-2">
                            <button onClick={() => downloadResume(selectedStudent.id)} className="flex-1 bg-green-600 hover:bg-green-500 py-2 rounded font-bold text-white">Download Resume</button>
                            <button onClick={() => setSelectedStudent(null)} className="flex-1 bg-gray-700 hover:bg-gray-600 py-2 rounded font-bold text-white">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
