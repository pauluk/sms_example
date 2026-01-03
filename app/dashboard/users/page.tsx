"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Shield, User, Mail, Calendar, Ban } from "lucide-react";
import { TEAMS } from "@/config/teams";
import { format } from "date-fns";
import { Switch } from "@/components/ui/switch";

export default function UsersPage() {
    const { data: session, isPending } = authClient.useSession();
    const router = useRouter();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState<any>(null); // For modal

    useEffect(() => {
        if (!isPending) {
            if (!session) {
                router.push("/");
                return;
            }
            if (session.user.role !== 'admin') {
                alert("Unauthorized: Admins only.");
                router.push("/dashboard");
                return;
            }
            fetchUsers();
        }
    }, [session, isPending, router]);

    const fetchUsers = async () => {
        try {
            const res = await fetch("/api/users");
            const data = await res.json();
            if (res.ok) setUsers(data.users);
        } catch (e) {
            console.error("Error fetching users", e);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch("/api/users", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: editingUser.id,
                    role: editingUser.role,
                    teamId: editingUser.teamId,
                    banned: editingUser.banned
                })
            });
            if (res.ok) {
                alert("User updated successfully");
                setEditingUser(null);
                fetchUsers();
            } else {
                alert("Failed to update user");
            }
        } catch (error) {
            alert("Error updating user");
        }
    };

    if (isPending || loading) return <div className="flex min-h-screen items-center justify-center">Loading...</div>;

    return (
        <main className="flex min-h-screen flex-col items-center p-8 bg-gray-50 text-gray-900 font-sans">
            <div className="w-full max-w-6xl bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gray-900 text-white p-6 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.push("/dashboard")} className="text-gray-400 hover:text-white transition-colors">
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Shield className="w-6 h-6 text-yellow-500" />
                            Admin: User Management
                        </h1>
                    </div>
                </div>

                <div className="p-8">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead className="bg-gray-50 text-gray-700 uppercase font-semibold">
                                <tr>
                                    <th className="px-6 py-4 border-b">Name</th>
                                    <th className="px-6 py-4 border-b">Email</th>
                                    <th className="px-6 py-4 border-b">Role</th>
                                    <th className="px-6 py-4 border-b">Team</th>
                                    <th className="px-6 py-4 border-b">Joined</th>
                                    <th className="px-6 py-4 border-b">Last Login</th>
                                    <th className="px-6 py-4 border-b">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u) => (
                                    <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs uppercase">
                                                {u.name.substring(0, 2)}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    {u.name}
                                                    {u.banned && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                                            <Ban className="w-3 h-3 mr-1" />
                                                            Banned
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            <div className="flex items-center gap-2"><Mail className="w-3 h-3" />{u.email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                                                {u.role === 'admin' ? <Shield className="w-3 h-3 mr-1" /> : <User className="w-3 h-3 mr-1" />}
                                                {u.role?.toUpperCase() || 'USER'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {u.teamId ? TEAMS[u.teamId]?.label || u.teamId : <span className="text-gray-400 italic">No Team</span>}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 font-mono text-xs">
                                            {u.createdAt ? format(new Date(u.createdAt), 'dd/MM/yyyy') : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 font-mono text-xs">
                                            {u.lastLogin ? format(new Date(u.lastLogin), 'dd/MM/yyyy HH:mm') : <span className="text-gray-400 italic">Never</span>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => setEditingUser(u)}
                                                className="text-blue-600 hover:underline font-medium"
                                            >
                                                Edit
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-8 w-full max-w-md shadow-2xl">
                        <h2 className="text-xl font-bold mb-4">Edit User: {editingUser.name}</h2>
                        <form onSubmit={handleUpdateUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Role</label>
                                <select
                                    className="w-full border p-2 rounded"
                                    value={editingUser.role}
                                    onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}
                                >
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                    <option value="gdpr">GDPR</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Team Assignment</label>
                                <select
                                    className="w-full border p-2 rounded"
                                    value={editingUser.teamId || ""}
                                    onChange={e => setEditingUser({ ...editingUser, teamId: e.target.value || null })}
                                >
                                    <option value="">-- No Specific Team --</option>
                                    {Object.entries(TEAMS).map(([key, team]) => (
                                        <option key={key} value={key}>{team.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                                <div>
                                    <label className="block text-sm font-medium text-gray-900">Ban User</label>
                                    <p className="text-xs text-gray-500">Prevent this user from accessing the system.</p>
                                </div>
                                <Switch
                                    checked={editingUser.banned || false}
                                    onCheckedChange={(checked) => setEditingUser({ ...editingUser, banned: checked })}
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setEditingUser(null)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}
