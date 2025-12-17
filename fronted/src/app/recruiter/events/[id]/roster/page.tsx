"use client";
import { useEffect, useState } from "react";
import { api } from "../../../../../utils/api";
import { useParams, useRouter } from "next/navigation";

interface Student {
    id: number;
    name: string;
    email: string;
    major: string;
    graduation_year: number;
    skills: { skill_name: string }[];
}

interface RegistrationDetail {
    id: number;
    status: string;
    student: Student;
}

export default function RecruiterRosterPage() {
    const router = useRouter();
    const params = useParams();
    const eventId = params.id;
    const [registrations, setRegistrations] = useState<RegistrationDetail[]>([]);
    const [searchQuery, setSearchQuery] = useState("");

    // Static Mock Data for Demo
    const STATIC_ROSTER: Record<string, RegistrationDetail[]> = {
        "101": [ // AI Summit
            { id: 1, status: "confirmed", student: { id: 1, name: "Alex Nguyen", email: "alex.n@cmis.edu", major: "Computer Science", graduation_year: 2025, skills: [{ skill_name: "Python" }, { skill_name: "TensorFlow" }, { skill_name: "Data Analysis" }] } },
            { id: 2, status: "confirmed", student: { id: 2, name: "Sarah Jenkins", email: "sarah.j@cmis.edu", major: "MIS", graduation_year: 2026, skills: [{ skill_name: "SQL" }, { skill_name: "Tableau" }, { skill_name: "Business Intelligence" }] } },
            { id: 3, status: "confirmed", student: { id: 3, name: "Michael Chen", email: "m.chen@cmis.edu", major: "Computer Science", graduation_year: 2025, skills: [{ skill_name: "Java" }, { skill_name: "Spring Boot" }, { skill_name: "AWS" }] } },
            { id: 4, status: "confirmed", student: { id: 4, name: "Jessica Wong", email: "j.wong@cmis.edu", major: "Data Science", graduation_year: 2027, skills: [{ skill_name: "R" }, { skill_name: "Python" }, { skill_name: "Machine Learning" }] } },
            { id: 5, status: "confirmed", student: { id: 5, name: "David Miller", email: "d.miller@cmis.edu", major: "Computer Science", graduation_year: 2026, skills: [{ skill_name: "C++" }, { skill_name: "Unreal Engine" }] } },
            { id: 6, status: "confirmed", student: { id: 6, name: "Emily Davis", email: "e.davis@cmis.edu", major: "MIS", graduation_year: 2025, skills: [{ skill_name: "Project Management" }, { skill_name: "Agile" }] } },
        ],
        "102": [ // Career Fair
            { id: 7, status: "confirmed", student: { id: 7, name: "Kevin Hart", email: "k.hart@cmis.edu", major: "Cyber Security", graduation_year: 2025, skills: [{ skill_name: "Network Security" }, { skill_name: "Linux" }, { skill_name: "Python" }] } },
            { id: 8, status: "confirmed", student: { id: 8, name: "Laura Croft", email: "l.croft@cmis.edu", major: "MIS", graduation_year: 2026, skills: [{ skill_name: "SQL" }, { skill_name: "React" }] } },
            { id: 9, status: "confirmed", student: { id: 9, name: "Bruce Wayne", email: "b.wayne@cmis.edu", major: "Computer Science", graduation_year: 2025, skills: [{ skill_name: "Cryptography" }, { skill_name: "Java" }, { skill_name: "System Design" }] } },
            { id: 10, status: "confirmed", student: { id: 10, name: "Diana Prince", email: "d.prince@cmis.edu", major: "MIS", graduation_year: 2027, skills: [{ skill_name: "Data Visualization" }, { skill_name: "Python" }] } },
            { id: 11, status: "confirmed", student: { id: 11, name: "Clark Kent", email: "c.kent@cmis.edu", major: "Computer Science", graduation_year: 2026, skills: [{ skill_name: "JavaScript" }, { skill_name: "Next.js" }, { skill_name: "Tailwind" }] } },
            { id: 12, status: "confirmed", student: { id: 12, name: "Barry Allen", email: "b.allen@cmis.edu", major: "Cyber Security", graduation_year: 2025, skills: [{ skill_name: "Forensics" }, { skill_name: "Python" }] } },
            { id: 13, status: "confirmed", student: { id: 13, name: "Hal Jordan", email: "h.jordan@cmis.edu", major: "Computer Science", graduation_year: 2027, skills: [{ skill_name: "Java" }, { skill_name: "Cloud Computing" }] } },
        ],
        "103": [ // Cyber Workshop
            { id: 14, status: "confirmed", student: { id: 14, name: "Elliot Alderson", email: "e.alderson@cmis.edu", major: "Cyber Security", graduation_year: 2025, skills: [{ skill_name: "Penetration Testing" }, { skill_name: "Python" }, { skill_name: "Bash" }] } },
            { id: 15, status: "confirmed", student: { id: 15, name: "Angela Moss", email: "a.moss@cmis.edu", major: "MIS", graduation_year: 2026, skills: [{ skill_name: "Risk Management" }, { skill_name: "Compliance" }] } },
            { id: 16, status: "confirmed", student: { id: 16, name: "Tyrell Wellick", email: "t.wellick@cmis.edu", major: "Computer Science", graduation_year: 2025, skills: [{ skill_name: "Linux" }, { skill_name: "C" }] } },
            { id: 17, status: "confirmed", student: { id: 17, name: "Darlene Alderson", email: "d.alderson@cmis.edu", major: "Cyber Security", graduation_year: 2027, skills: [{ skill_name: "Malware Analysis" }, { skill_name: "Go" }] } },
            { id: 18, status: "confirmed", student: { id: 18, name: "Dominique DiPierro", email: "d.dipierro@cmis.edu", major: "MIS", graduation_year: 2025, skills: [{ skill_name: "SQL" }, { skill_name: "Python" }] } },
        ],
        "104": [ // Hackathon
            { id: 19, status: "confirmed", student: { id: 19, name: "Richard Hendricks", email: "r.hendricks@cmis.edu", major: "Computer Science", graduation_year: 2025, skills: [{ skill_name: "Compression" }, { skill_name: "C++" }, { skill_name: "Java" }] } },
            { id: 20, status: "confirmed", student: { id: 20, name: "Dinesh Chugtai", email: "d.chugtai@cmis.edu", major: "Computer Science", graduation_year: 2026, skills: [{ skill_name: "Java" }, { skill_name: "Scala" }] } },
            { id: 21, status: "confirmed", student: { id: 21, name: "Bertram Gilfoyle", email: "b.gilfoyle@cmis.edu", major: "Cyber Security", graduation_year: 2025, skills: [{ skill_name: "System Admin" }, { skill_name: "Networking" }, { skill_name: "Security" }] } },
            { id: 22, status: "confirmed", student: { id: 22, name: "Jared Dunn", email: "j.dunn@cmis.edu", major: "MIS", graduation_year: 2027, skills: [{ skill_name: "Business Analysis" }, { skill_name: "Support" }] } },
            { id: 23, status: "confirmed", student: { id: 23, name: "Monica Hall", email: "m.hall@cmis.edu", major: "MIS", graduation_year: 2025, skills: [{ skill_name: "Venture Capital" }, { skill_name: "Finance" }] } },
            { id: 24, status: "confirmed", student: { id: 24, name: "Jian Yang", email: "j.yang@cmis.edu", major: "Computer Science", graduation_year: 2026, skills: [{ skill_name: "Python" }, { skill_name: "App Development" }] } },
        ]
    };

    const fetchRoster = async (query = "") => {
        if (!eventId) return;
        // Use static data
        let data = STATIC_ROSTER[eventId as string] || [];

        // Filter by query if present
        if (query) {
            const lowerQ = query.toLowerCase();
            data = data.filter(r =>
                r.student.name.toLowerCase().includes(lowerQ) ||
                r.student.major.toLowerCase().includes(lowerQ) ||
                r.student.skills.some(s => s.skill_name.toLowerCase().includes(lowerQ))
            );
        }
        setRegistrations(data);
    };

    useEffect(() => {
        fetchRoster();
    }, [eventId]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchRoster(searchQuery);
    };

    const handleDownloadResume = async (studentId: number) => {
        // Static Mock Download for Demo
        try {
            const dummyContent = "This is a mock resume content for demo purposes.\nStudent ID: " + studentId;
            const blob = new Blob([dummyContent], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `resume_${studentId}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error(err);
            alert("Error downloading resume");
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-8 md:p-12 font-sans">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
                    <div>
                        <button
                            onClick={() => router.push('/recruiter/dashboard')}
                            className="group flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
                        >
                            <span className="group-hover:-translate-x-1 transition-transform">←</span>
                            <span className="font-semibold">Back to Dashboard</span>
                        </button>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 drop-shadow-sm">
                            Candidate Roster
                        </h1>
                        <p className="text-gray-400 mt-2 text-lg">Review and connect with top talent for your event</p>
                    </div>
                </div>

                <div className="bg-gray-800/40 border border-gray-700/50 backdrop-blur-md rounded-2xl overflow-hidden shadow-2xl p-8">
                    <form onSubmit={handleSearch} className="mb-8 flex gap-4">
                        <input
                            type="text"
                            placeholder="Search resumes (e.g., 'React', 'Python')..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 p-4 rounded-xl bg-gray-900/50 border border-gray-600 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder-gray-500"
                        />
                        <button
                            type="submit"
                            className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-purple-900/40 transition-all transform hover:-translate-y-0.5"
                        >
                            Search
                        </button>
                    </form>

                    <div className="overflow-x-auto rounded-xl border border-gray-700/50">
                        <table className="min-w-full bg-gray-900/40 text-white">
                            <thead>
                                <tr className="bg-gray-800/80 text-gray-300 uppercase text-xs tracking-wider font-bold">
                                    <th className="p-6 text-left">ID</th>
                                    <th className="p-6 text-left">Name</th>
                                    <th className="p-6 text-left">Major</th>
                                    <th className="p-6 text-left">Grad Year</th>
                                    <th className="p-6 text-left">Skills</th>
                                    <th className="p-6 text-left">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700/50">
                                {registrations.map((reg) => (
                                    <tr key={reg.id} className="hover:bg-gray-700/30 transition-colors">
                                        <td className="p-6 text-gray-400 font-mono text-sm">{reg.student.id}</td>
                                        <td className="p-6 font-semibold">{reg.student.name}</td>
                                        <td className="p-6 text-gray-300">{reg.student.major}</td>
                                        <td className="p-6 text-gray-300">{reg.student.graduation_year}</td>
                                        <td className="p-6">
                                            <div className="flex flex-wrap gap-2">
                                                {reg.student.skills.map(s => (
                                                    <span key={s.skill_name} className="px-3 py-1 bg-purple-900/30 border border-purple-500/30 rounded-full text-xs text-purple-200">
                                                        {s.skill_name}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <button
                                                onClick={() => handleDownloadResume(reg.student.id)}
                                                className="text-cyan-400 hover:text-cyan-300 font-medium text-sm flex items-center gap-1 hover:underline decoration-cyan-400/50 underline-offset-4"
                                            >
                                                Download PDF
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {registrations.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-12 text-center text-gray-500">
                                            No candidates found matching your criteria.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
