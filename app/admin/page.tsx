
"use client";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AdminPage() {
    const { data: session, isPending } = authClient.useSession();
    const router = useRouter();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Edit User Form State
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [editName, setEditName] = useState("");
    const [editRole, setEditRole] = useState("user");

    // Create User Form State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newName, setNewName] = useState("");
    const [newEmail, setNewEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [newRole, setNewRole] = useState("user");

    useEffect(() => {
        if (!isPending) {
            // @ts-ignore
            if (!session || session.user.role !== 'admin') {
                router.push("/dashboard");
            } else {
                fetchUsers();
            }
        }
    }, [session, isPending, router]);

    const fetchUsers = async () => {
        try {
            const res = await fetch("/api/admin/users");
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await authClient.admin.createUser({
                name: newName,
                email: newEmail,
                password: newPassword,
                role: newRole as "user" | "admin"
            });
            alert("User created successfully!");
            // ... reset state ...
            setShowCreateModal(false);
            setNewName("");
            setNewEmail("");
            setNewPassword("");
            fetchUsers();
        } catch (error: any) {
            alert(error.message || "Failed to create user");
        }
    };

    const handleEditClick = (user: any) => {
        setEditingUser(user);
        setEditName(user.name);
        setEditRole(user.role);
        setShowEditModal(true);
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await authClient.admin.updateUser({
                userId: editingUser.id,
                // @ts-ignore - Role is valid at runtime
                role: editRole as "user" | "admin",
                data: {
                    name: editName
                }
            });
            alert("User updated successfully!");
            setShowEditModal(false);
            setEditingUser(null);
            fetchUsers();
        } catch (error: any) {
            alert(error.message || "Failed to update user");
        }
    };

    if (isPending || loading) return <div className="flex min-h-screen items-center justify-center">Loading...</div>;

    return (
        <main className="flex min-h-screen flex-col items-center p-24">
            <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>
            <div className="w-full max-w-4xl p-8 bg-white rounded-xl shadow-lg border border-gray-200 text-gray-900">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">User Management</h2>
                    <div className="space-x-4">
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium"
                        >
                            Create User
                        </button>
                        <button onClick={() => router.push("/dashboard")} className="text-blue-600 hover:underline">
                            Back to Dashboard
                        </button>
                    </div>
                </div>

                {/* Create User Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                            <h3 className="text-xl font-bold mb-4">Create New User</h3>
                            <form onSubmit={handleCreateUser} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium">Name</label>
                                    <input type="text" value={newName} onChange={e => setNewName(e.target.value)} className="w-full border p-2 rounded" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">Email</label>
                                    <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} className="w-full border p-2 rounded" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">Password</label>
                                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full border p-2 rounded" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">Role</label>
                                    <select value={newRole} onChange={e => setNewRole(e.target.value)} className="w-full border p-2 rounded">
                                        <option value="user">User</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div className="flex justify-end space-x-2 mt-4">
                                    <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Create</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Edit User Modal */}
                {showEditModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                            <h3 className="text-xl font-bold mb-4">Edit User</h3>
                            <form onSubmit={handleUpdateUser} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium">Name</label>
                                    <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full border p-2 rounded" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">Role</label>
                                    <select value={editRole} onChange={e => setEditRole(e.target.value)} className="w-full border p-2 rounded">
                                        <option value="user">User</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div className="flex justify-end space-x-2 mt-4">
                                    <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {users.map((u) => (
                                <tr key={u.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">{u.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{u.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{u.role}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{new Date(u.createdAt).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => handleEditClick(u)} className="text-indigo-600 hover:text-indigo-900">
                                            Edit
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    );
}
