import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    is_active: boolean;
    verification_token?: string | null;
}

interface UserManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function UserManagementModal({ isOpen, onClose }: UserManagementModalProps) {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);

    // Fetch users when modal opens
    useEffect(() => {
        if (isOpen) {
            fetchUsers();
        }
    }, [isOpen]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/users');
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            } else {
                alert("Failed to load users");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId: number, newRole: string) => {
        if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;

        try {
            // Re-using authorize endpoint which supports role updates
            const res = await api.post(`/admin/users/${userId}/authorize?role=${newRole}&is_active=true`, {});
            if (res.ok) {
                alert("Role updated successfully");
                fetchUsers(); // Refresh list
            } else {
                alert("Failed to update role");
            }
        } catch (e) {
            console.error(e);
            alert("Error updating role");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] flex flex-col">
                <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white">User Management</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="text-center text-gray-400">Loading users...</div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-xs text-gray-400 uppercase border-b border-gray-800">
                                    <th className="py-3 px-4">Name</th>
                                    <th className="py-3 px-4">Email</th>
                                    <th className="py-3 px-4">Role</th>
                                    <th className="py-3 px-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {users.map(user => (
                                    <tr key={user.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                                        <td className="py-3 px-4 text-white font-medium">{user.name}</td>
                                        <td className="py-3 px-4 text-gray-400">{user.email}</td>
                                        <td className="py-3 px-4">
                                            <select
                                                value={user.role}
                                                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                className="bg-gray-800 text-white border border-gray-700 rounded px-2 py-1 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                                            >
                                                <option value="student">Student</option>
                                                <option value="faculty">Faculty</option>
                                                <option value="recruiter">Recruiter</option>
                                                <option value="judge">Judge</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold ${user.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                {user.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="p-4 border-t border-gray-800 flex justify-end">
                    <button onClick={onClose} className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition text-sm">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
