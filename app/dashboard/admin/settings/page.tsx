
"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Save, ShieldAlert, ArrowLeft } from "lucide-react";

export default function AdminSettingsPage() {
    const router = useRouter();
    const { data: session } = authClient.useSession();
    const [allowedDomains, setAllowedDomains] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetch("/api/admin/config")
            .then((res) => {
                if (res.status === 403) {
                    alert("Unauthorized");
                    router.push("/dashboard");
                    return null;
                }
                return res.json();
            })
            .then((data) => {
                if (data && data.allowedDomains) {
                    setAllowedDomains(data.allowedDomains);
                }
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setLoading(false);
            });
    }, [router]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/admin/config", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ allowedDomains }),
            });
            if (!res.ok) throw new Error("Failed to save");
            alert("Settings saved successfully");
        } catch (err) {
            alert("Error saving settings");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8">Loading settings...</div>;

    return (
        <main className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8 flex items-center gap-4">
                    <button onClick={() => router.push("/dashboard")} className="text-gray-500 hover:text-gray-900">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">System Configuration</h1>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                    <div className="flex items-start gap-4 mb-6">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                            <ShieldAlert className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Domain Restriction</h2>
                            <p className="text-gray-500">Control who can sign up to the platform.</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-gray-700">
                            Allowed Email Domains
                        </label>
                        <p className="text-xs text-gray-500 mb-2">
                            Enter comma-separated domains (e.g., <code>nhsbsa.nhs.uk, gov.uk</code>). Leave empty to allow all.
                        </p>
                        <input
                            type="text"
                            value={allowedDomains}
                            onChange={(e) => setAllowedDomains(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="nhsbsa.nhs.uk"
                        />
                    </div>

                    <div className="mt-8 pt-6 border-t flex justify-end">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            {saving ? "Saving..." : "Save Configuration"}
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}
