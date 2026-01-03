"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, Trash2, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ApiKeysPage() {
    const { data: session, isPending } = authClient.useSession();
    const router = useRouter();
    const [keys, setKeys] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newName, setNewName] = useState("");
    const [creating, setCreating] = useState(false);

    // Just created key display
    const [newKey, setNewKey] = useState<string | null>(null);

    useEffect(() => {
        if (!isPending) {
            if (!session || session.user.role !== 'admin') {
                router.push("/dashboard");
                return;
            }
            fetchKeys();
        }
    }, [session, isPending, router]);

    const fetchKeys = async () => {
        try {
            const res = await fetch("/api/admin/api-keys");
            const data = await res.json();
            if (res.ok) setKeys(data.keys);
        } catch (error) {
            console.error("Failed to fetch keys", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateKey = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName) return;
        setCreating(true);
        setNewKey(null);
        try {
            const res = await fetch("/api/admin/api-keys", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newName })
            });
            const data = await res.json();
            if (res.ok) {
                setNewKey(data.key); // Raw key from response
                setNewName("");
                fetchKeys();
                toast.success("API Key created successfully");
            } else {
                toast.error(data.error || "Failed to create key");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteKey = async (id: string) => {
        if (!confirm("Are you sure? This action cannot be undone and will immediately revoke access.")) return;
        try {
            const res = await fetch(`/api/admin/api-keys?id=${id}`, {
                method: "DELETE"
            });
            if (res.ok) {
                setKeys(keys.filter(k => k.id !== id));
                toast.success("Key revoked");
            } else {
                toast.error("Failed to revoke key");
            }
        } catch (error) {
            toast.error("An error occurred");
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-6 max-w-5xl mx-auto p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">API Keys</h1>
                    <p className="text-muted-foreground mt-1">Manage access tokens for external integrations.</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Active Keys</CardTitle>
                        <CardDescription>
                            These keys have full access to send SMS messages via the API.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Prefix</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead>Last Used</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {keys.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                            No API keys found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    keys.map((key) => (
                                        <TableRow key={key.id}>
                                            <TableCell className="font-medium">{key.name}</TableCell>
                                            <TableCell className="font-mono text-xs text-muted-foreground">
                                                sk_live_...
                                            </TableCell>
                                            <TableCell className="text-xs">
                                                {new Date(key.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-xs">
                                                {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleString() : 'Never'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => handleDeleteKey(key.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Generate New Key</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleCreateKey} className="space-y-4">
                                <div className="space-y-2">
                                    <Input
                                        placeholder="Key Name (e.g. Test System)"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        required
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={creating || !newName}>
                                    {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                                    Generate Key
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {newKey && (
                        <Alert className="border-green-500 bg-green-50">
                            <Check className="h-4 w-4 text-green-600" />
                            <AlertTitle className="text-green-800">Key Generated Successfully</AlertTitle>
                            <AlertDescription className="mt-2">
                                <p className="text-sm text-green-700 mb-2">
                                    This is the <strong>only time</strong> your API key will be visible. Please copy it immediately.
                                </p>
                                <div className="flex items-center gap-2">
                                    <code className="bg-white px-3 py-2 rounded border border-green-200 font-mono text-sm flex-1 break-all text-gray-800">
                                        {newKey}
                                    </code>
                                    <Button size="sm" variant="outline" className="border-green-200 hover:bg-green-100 text-green-700" onClick={() => copyToClipboard(newKey)}>
                                        <Copy className="h-3 w-3 mr-1" /> Copy
                                    </Button>
                                </div>
                            </AlertDescription>
                        </Alert>
                    )}
                </div>
            </div>
        </div>
    );
}
