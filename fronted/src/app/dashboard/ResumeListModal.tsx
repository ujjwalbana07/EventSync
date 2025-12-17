import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';

interface Student {
    name: string;
    email: string;
    major?: string;
}

interface ResumeDetail {
    id: number;
    user_id: number;
    file_path: string;
    file_name_original: string;
    uploaded_at: string;
    student: Student;
    is_active: boolean;
}

interface ResumeListModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ResumeListModal({ isOpen, onClose }: ResumeListModalProps) {
    const [resumes, setResumes] = useState<ResumeDetail[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchResumes();
        }
    }, [isOpen]);

    const fetchResumes = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/resumes');
            if (res.ok) {
                const data = await res.json();
                setResumes(data);
            }
        } catch (e) {
            console.error("Failed to fetch resumes", e);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this resume? This cannot be undone.")) return;

        try {
            const res = await api.delete(`/admin/resumes/${id}`);
            if (res.ok) {
                // Refresh list
                fetchResumes();
            } else {
                alert("Failed to delete resume");
            }
        } catch (e) {
            console.error("Delete failed", e);
            alert("Error deleting resume");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-fadeIn flex flex-col max-h-[90vh]">
                <div className="bg-gray-800 px-6 py-4 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        📄 Student Resumes
                        <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">{resumes.length}</span>
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition">
                        ✖
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {loading ? (
                        <div className="text-center text-gray-400 py-10">Loading resumes...</div>
                    ) : resumes.length === 0 ? (
                        <div className="text-center text-gray-500 py-10">No resumes uploaded yet.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider">
                                        <th className="py-3 px-4 font-semibold">Student Name</th>
                                        <th className="py-3 px-4 font-semibold">Major</th>
                                        <th className="py-3 px-4 font-semibold">File Name</th>
                                        <th className="py-3 px-4 font-semibold text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {resumes.map((resume) => (
                                        <tr key={resume.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition">
                                            <td className="py-3 px-4 text-white font-medium">{resume.student.name}</td>
                                            <td className="py-3 px-4 text-gray-400">{resume.student.major || 'N/A'}</td>
                                            <td className="py-3 px-4 text-gray-400 truncate max-w-[200px]">{resume.file_name_original}</td>
                                            <td className="py-3 px-4 text-right">
                                                <button
                                                    onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/recruiter/resume/${resume.user_id}`, '_blank')}
                                                    className="text-blue-400 hover:text-blue-300 font-semibold hover:underline mr-4"
                                                >
                                                    Download
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(resume.id)}
                                                    className="text-red-400 hover:text-red-300 font-semibold hover:underline"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="bg-gray-800 px-6 py-4 border-t border-gray-700 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition font-semibold"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
