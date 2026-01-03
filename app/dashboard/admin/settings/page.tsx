"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Save, ShieldAlert, ArrowLeft, MessageSquare, AlertTriangle, ShieldCheck } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function AdminSettingsPage() {
    const router = useRouter();
    const { data: session } = authClient.useSession();
    const [allowedDomains, setAllowedDomains] = useState("");
    const [enableLiveSms, setEnableLiveSms] = useState(false);
    const [smsQuota, setSmsQuota] = useState(30000);
    const [showUsageToTeams, setShowUsageToTeams] = useState(false);
    const [showUserStoriesToTeams, setShowUserStoriesToTeams] = useState(false);
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [showGdprToAdmin, setShowGdprToAdmin] = useState(true);
    const [showGdprToTeams, setShowGdprToTeams] = useState(false);
    const [supportEmail, setSupportEmail] = useState("");
    const [rateLimitPerHour, setRateLimitPerHour] = useState(100);
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
                if (data) {
                    if (data.allowedDomains) setAllowedDomains(data.allowedDomains);
                    if (data.enableLiveSms !== undefined) setEnableLiveSms(data.enableLiveSms);
                    if (data.smsQuota !== undefined) setSmsQuota(data.smsQuota);
                    if (data.showUsageToTeams !== undefined) setShowUsageToTeams(data.showUsageToTeams);
                    if (data.showUserStoriesToTeams !== undefined) setShowUserStoriesToTeams(data.showUserStoriesToTeams);
                    if (data.maintenanceMode !== undefined) setMaintenanceMode(data.maintenanceMode);
                    if (data.showGdprToAdmin !== undefined) setShowGdprToAdmin(data.showGdprToAdmin);
                    if (data.showGdprToAdmin !== undefined) setShowGdprToAdmin(data.showGdprToAdmin);
                    if (data.showGdprToTeams !== undefined) setShowGdprToTeams(data.showGdprToTeams);
                    if (data.supportEmail) setSupportEmail(data.supportEmail);
                    if (data.rateLimitPerHour !== undefined) setRateLimitPerHour(data.rateLimitPerHour);
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
                body: JSON.stringify({
                    allowedDomains,
                    enableLiveSms,
                    smsQuota,
                    showUsageToTeams,
                    showUserStoriesToTeams,
                    maintenanceMode,
                    showGdprToAdmin,
                    showGdprToTeams,
                    supportEmail,
                    rateLimitPerHour
                }),
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
                            <div className="bg-white p-6 rounded-lg border shadow-sm">
                                <h2 className="text-lg font-semibold mb-4 text-gray-900">Security</h2>
                                <p className="text-sm text-gray-500 mb-4">
                                    Audit system dependencies and check for vulnerabilities.
                                </p>
                                <Link href="/dashboard/admin/security">
                                    <Button variant="outline" className="w-full justify-start">
                                        <ShieldCheck className="mr-2 h-4 w-4" />
                                        Run Security Audit
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-start gap-4 mb-6">
                        <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">API Integration</h2>
                            <p className="text-gray-500">Manage external access and developer tools.</p>
                            <div className="bg-white p-6 rounded-lg border shadow-sm mt-4 grid gap-4 grid-cols-1 md:grid-cols-2">

                                <Link href="/dashboard/admin/api-keys" className="block">
                                    <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                                        <h3 className="font-semibold text-gray-900 mb-1">Manage API Keys</h3>
                                        <p className="text-sm text-gray-500">Create and revoke secure Bearer tokens for external systems.</p>
                                    </div>
                                </Link>
                                <Link href="/api-playground" className="block">
                                    <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                                        <h3 className="font-semibold text-gray-900 mb-1">API Playground</h3>
                                        <p className="text-sm text-gray-500">Interactive testing console for the Send SMS endpoint.</p>
                                    </div>
                                </Link>
                                <Link href="/gdpr-playground" className="block">
                                    <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                                        <h3 className="font-semibold text-gray-900 mb-1">GDPR Playground</h3>
                                        <p className="text-sm text-gray-500">Test GDPR Search & Compliance tools.</p>
                                    </div>
                                </Link>
                            </div>
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

                    <div className="space-y-4 mt-6">
                        <label className="block text-sm font-medium text-gray-700">
                            Global Support Email
                        </label>
                        <p className="text-xs text-gray-500 mb-2">
                            Email address where support requests (including ban appeals) will be sent.
                        </p>
                        <input
                            type="email"
                            value={supportEmail}
                            onChange={(e) => setSupportEmail(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="support@example.com"
                        />
                    </div>


                    <div className="mt-8 pt-6 border-t">
                        <div className="flex items-start gap-4 mb-6">
                            <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
                                <MessageSquare className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">SMS Configuration</h2>
                                <p className="text-gray-500">Manage SMS sending behavior.</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div>
                                <h3 className="font-medium text-gray-900">Enable Live SMS</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    When enabled, real SMS messages will be sent via GOV.UK Notify.
                                    <br />
                                    When disabled, messages are only logged (Simulation Mode).
                                </p>
                            </div>
                            <Switch
                                checked={enableLiveSms}
                                onCheckedChange={setEnableLiveSms}
                            />
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 mt-4">
                            <div>
                                <h3 className="font-medium text-gray-900">Annual Usage Quota</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Set the annual limit for SMS messages (resets April 1st).
                                </p>
                            </div>
                            <input
                                type="number"
                                value={smsQuota}
                                onChange={(e) => setSmsQuota(parseInt(e.target.value) || 0)}
                                className="w-32 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 mt-4">
                            <div>
                                <h3 className="font-medium text-gray-900">API Rate Limit (Per Hour)</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Max messages an external API key can send per hour.
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    value={rateLimitPerHour}
                                    onChange={(e) => setRateLimitPerHour(parseInt(e.target.value) || 0)}
                                    className="w-24 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                                <span className="text-sm text-gray-500">/hr</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 mt-4">
                            <div>
                                <h3 className="font-medium text-gray-900">Show Usage to Teams</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    If enabled, non-admin users can see the Usage page.
                                </p>
                            </div>
                            <Switch
                                checked={showUsageToTeams}
                                onCheckedChange={setShowUsageToTeams}
                            />
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 mt-4">
                            <div>
                                <h3 className="font-medium text-gray-900">Show User Stories to Teams</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    If enabled, non-admin users can see the User Stories page.
                                </p>
                            </div>
                            <Switch
                                checked={showUserStoriesToTeams}
                                onCheckedChange={setShowUserStoriesToTeams}
                            />
                        </div>

                        <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200 mt-4">
                            <div>
                                <h3 className="font-medium text-red-900 flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4" />
                                    Maintenance Mode
                                </h3>
                                <p className="text-sm text-red-700 mt-1">
                                    If enabled, ALL non-admin users will be blocked from logging in.
                                </p>
                            </div>
                            <Switch
                                checked={maintenanceMode}
                                onCheckedChange={setMaintenanceMode}
                                className="data-[state=checked]:bg-red-600"
                            />
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 mt-4">
                            <div>
                                <h3 className="font-medium text-gray-900">Show GDPR Search to Admin</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    If enabled, Admins can access GDPR Mobile Search.
                                </p>
                            </div>
                            <Switch
                                checked={showGdprToAdmin}
                                onCheckedChange={setShowGdprToAdmin}
                            />
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 mt-4">
                            <div>
                                <h3 className="font-medium text-gray-900">Show GDPR Search to Teams</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    If enabled, Regular Team users can access GDPR Mobile Search.
                                </p>
                            </div>
                            <Switch
                                checked={showGdprToTeams}
                                onCheckedChange={setShowGdprToTeams}
                            />
                        </div>
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
