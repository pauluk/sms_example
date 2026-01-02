"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Save, Globe, Code2, CheckCircle2, AlertCircle, Mail, MessageSquare } from "lucide-react";

export default function AssessmentPage() {
    const { data: session, isPending } = authClient.useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form State
    const [form, setForm] = useState({
        serviceName: "",
        volumeEmail: 0,
        volumeSms: 0,
        volumeLetter: 0,
        isUnique: false,
        hasMinTeam: false,
        hasTemplates: true, // Auto-checked as we have templates
        fromName: "",
        replyToEmail: "",
        senderId: "GOVUK"
    });

    useEffect(() => {
        if (!isPending) {
            if (!session) {
                router.push("/");
                return;
            }
            if (session.user.role !== 'admin') {
                router.push("/dashboard");
                return;
            }

            // Fetch saved data
            fetch("/api/assessment").then(res => res.json()).then(data => {
                if (data.data && data.data.id) {
                    setForm(prev => ({ ...prev, ...data.data }));
                }
                setLoading(false);
            });
        }
    }, [session, isPending, router]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await fetch("/api/assessment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form)
            });
            alert("Progress saved!");
        } catch (e) {
            alert("Failed to save.");
        } finally {
            setSaving(false);
        }
    };

    // Calculate Email Address Preview
    const emailPreview = form.fromName.toLowerCase().replace(/[^a-z0-9]/g, "") + "@notifications.service.gov.uk";

    // Mermaid Diagrams
    const stackDiagram = `
graph TD
    Client[Web Browser] -->|HTTPS| Next[Next.js App Router]
    Next -->|API| Notify[GOV.UK Notify]
    Next -->|Auth| BetterAuth[Auth Service]
    BetterAuth -.-> DB[(PostgreSQL)]
`;

    useEffect(() => {
        // Initialize mermaid - re-run when form updates or on load
        import("mermaid").then(m => {
            m.default.initialize({ startOnLoad: false, theme: 'default' });
            // Small timeout to ensure DOM is ready
            setTimeout(() => {
                m.default.run({
                    querySelector: '.mermaid'
                });
            }, 100);
        });
    }, [loading]);

    if (isPending || loading) return <div className="flex min-h-screen items-center justify-center">Loading...</div>;

    return (
        <main className="flex min-h-screen flex-col items-center p-8 bg-gray-50 text-gray-900 font-sans">
            <div className="w-full max-w-5xl bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="bg-gray-900 text-white p-6 flex justify-between items-center sticky top-0 z-20">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.push("/dashboard")} className="text-gray-400 hover:text-white"><ArrowLeft className="w-6 h-6" /></button>
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                <Globe className="w-6 h-6 text-green-400" />
                                Make Your Service Live
                            </h1>
                            <p className="text-gray-400 text-sm">Service Assessment & Configuration</p>
                        </div>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors"
                    >
                        <Save className="w-4 h-4" />
                        {saving ? "Saving..." : "Save Progress"}
                    </button>
                </div>

                <div className="p-8 space-y-12">

                    {/* 1. Service Name & Uniqueness */}
                    <section className="space-y-4">
                        <h2 className="text-xl font-bold border-b pb-2 text-gray-800">1. Your Service</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-1">Service Name</label>
                                    <input
                                        value={form.serviceName}
                                        onChange={e => setForm({ ...form, serviceName: e.target.value })}
                                        className="w-full border p-2 rounded"
                                        placeholder="e.g. Financial Operations Hub"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Must be unique within your organisation. No acronyms.</p>
                                </div>
                                <div className="bg-blue-50 p-4 rounded border border-blue-100 flex items-start gap-3">
                                    <input
                                        type="checkbox"
                                        checked={form.isUnique}
                                        onChange={e => setForm({ ...form, isUnique: e.target.checked })}
                                        className="mt-1 w-4 h-4"
                                    />
                                    <div>
                                        <p className="text-sm font-semibold text-blue-900">Confirm service is unique</p>
                                        <p className="text-xs text-blue-800">My service is the only one of its kind in my organisation.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 p-6 rounded border border-gray-200">
                                <h3 className="flex items-center gap-2 font-bold mb-4 text-sm uppercase text-gray-500">
                                    <Code2 className="w-4 h-4" /> Component Architecture
                                </h3>
                                <pre className="mermaid bg-white p-4 rounded border text-xs overflow-hidden">
                                    {stackDiagram}
                                </pre>
                            </div>
                        </div>
                    </section>

                    {/* 2. Message Volumes */}
                    <section className="space-y-4">
                        <h2 className="text-xl font-bold border-b pb-2 text-gray-800">2. Usage Estimates (Annual)</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-semibold mb-1 flex items-center gap-2"><Mail className="w-4 h-4" /> Emails</label>
                                <input
                                    type="number"
                                    value={form.volumeEmail}
                                    onChange={e => setForm({ ...form, volumeEmail: parseInt(e.target.value) || 0 })}
                                    className="w-full border p-2 rounded"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-1 flex items-center gap-2"><MessageSquare className="w-4 h-4" /> SMS</label>
                                <input
                                    type="number"
                                    value={form.volumeSms}
                                    onChange={e => setForm({ ...form, volumeSms: parseInt(e.target.value) || 0 })}
                                    className="w-full border p-2 rounded"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-1">Letters</label>
                                <input
                                    type="number"
                                    value={form.volumeLetter}
                                    onChange={e => setForm({ ...form, volumeLetter: parseInt(e.target.value) || 0 })}
                                    className="w-full border p-2 rounded"
                                />
                            </div>
                        </div>
                    </section>

                    {/* 3. Configuration */}
                    <section className="space-y-4">
                        <h2 className="text-xl font-bold border-b pb-2 text-gray-800">3. Configuration & Permissions</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div className="border p-4 rounded-lg">
                                    <h4 className="font-bold text-sm mb-3">Email Settings</h4>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">From Name</label>
                                            <input
                                                value={form.fromName}
                                                onChange={e => setForm({ ...form, fromName: e.target.value })}
                                                className="w-full border p-2 rounded"
                                                placeholder="e.g. Finance Hub"
                                            />
                                        </div>
                                        {form.fromName && (
                                            <div className="bg-gray-100 p-3 rounded text-sm">
                                                <span className="text-xs text-gray-500 db block mb-1">Preview Sender Address:</span>
                                                <div className="font-mono text-gray-800 break-all">{emailPreview}</div>
                                            </div>
                                        )}
                                        <div>
                                            <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Reply-To Address</label>
                                            <input
                                                value={form.replyToEmail}
                                                onChange={e => setForm({ ...form, replyToEmail: e.target.value })}
                                                className="w-full border p-2 rounded"
                                                placeholder="support@example.com"
                                            />
                                            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                                <CheckCircle2 className="w-3 h-3" /> improves delivery rates
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="border p-4 rounded-lg">
                                    <h4 className="font-bold text-sm mb-3">SMS Settings</h4>
                                    <div>
                                        <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Sender ID</label>
                                        <input
                                            value={form.senderId}
                                            onChange={e => setForm({ ...form, senderId: e.target.value })}
                                            className="w-full border p-2 rounded"
                                            maxLength={11}
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Max 11 chars. No spaces.</p>
                                    </div>
                                </div>

                                <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
                                    <h4 className="font-bold text-sm text-yellow-800 mb-2 flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4" /> Checklist
                                    </h4>
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-sm text-yellow-900 cursor-pointer">
                                            <input type="checkbox" checked={form.hasMinTeam} onChange={e => setForm({ ...form, hasMinTeam: e.target.checked })} />
                                            2+ Team Members with permissions
                                        </label>
                                        <label className="flex items-center gap-2 text-sm text-yellow-900 cursor-pointer">
                                            <input type="checkbox" checked={form.hasTemplates} onChange={e => setForm({ ...form, hasTemplates: e.target.checked })} />
                                            Templates & Examples added
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}
