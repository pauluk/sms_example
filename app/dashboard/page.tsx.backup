"use client";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { TEAMS } from "@/config/teams";
import Papa from "papaparse";
import {
    LayoutTemplate,
    FileText,
    Plus,
    Pencil,
    Save,
    Send,
    ArrowLeft,
    CheckCircle2,
    Users,
    UploadCloud,
    FileSpreadsheet
} from "lucide-react";

export default function Dashboard() {
    const { data: session, isPending } = authClient.useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    // SMS Hub State
    const [activeTeamKey, setActiveTeamKey] = useState<string>("AP");

    // View Mode: 'SELECTION' | 'EDITOR' | 'HISTORY' | 'BULK_SEND'
    const [viewMode, setViewMode] = useState<'SELECTION' | 'EDITOR' | 'HISTORY' | 'BULK_SEND'>('SELECTION');

    const [formValues, setFormValues] = useState<Record<string, string>>({});
    const [manualOverride, setManualOverride] = useState(false);
    const [manualMessage, setManualMessage] = useState("");
    const [sending, setSending] = useState(false);
    const [scheduleDate, setScheduleDate] = useState(""); // YYYY-MM-DDTHH:mm

    // Bulk SMS State
    const [bulkData, setBulkData] = useState<any[]>([]);
    const [isBulkSending, setIsBulkSending] = useState(false);
    const [validationErrors, setValidationErrors] = useState<number[]>([]);
    const [bulkTemplate, setBulkTemplate] = useState("");

    // Template & Logs State
    const [savedTemplates, setSavedTemplates] = useState<any[]>([]);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [isSavingTemplate, setIsSavingTemplate] = useState(false);
    // Team Data State
    const [teamData, setTeamData] = useState<Record<string, any>>({});
    const [isEditingTeam, setIsEditingTeam] = useState(false);
    const [teamEditForm, setTeamEditForm] = useState({ manager: "", email: "" });


    useEffect(() => {
        if (!isPending) {
            if (!session) {
                router.push("/");
            } else {
                setLoading(false);
                // Auto-select team
                const user = session.user as any;
                if (user.teamId && user.role !== 'admin') {
                    setActiveTeamKey(user.teamId);
                }
            }
        }
    }, [session, isPending, router]);

    // Validate Bulk Data
    useEffect(() => {
        const errors: number[] = [];

        // Extract variables from template
        const templateVars = (bulkTemplate.match(/{(\w+)}/g) || []).map(v => v.slice(1, -1));
        const requiredFields = new Set(['phoneNumber', ...templateVars]);

        bulkData.forEach((row, idx) => {
            // Check for missing required fields
            const hasError = Array.from(requiredFields).some(field => {
                const val = row[field];
                return !val || (typeof val === 'string' && val.trim() === '');
            });

            if (hasError) errors.push(idx);
        });
        setValidationErrors(errors);
    }, [bulkData, bulkTemplate]);


    const handleLogout = async () => {
        await authClient.signOut({
            fetchOptions: {
                onSuccess: () => {
                    router.push("/");
                }
            }
        });
    };

    // Calculate generated message or use manual
    const activeTeam = TEAMS[activeTeamKey];

    // Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            // Fetch All Teams Data
            try {
                const resTeams = await fetch('/api/teams');
                const dataTeams = await resTeams.json();
                if (dataTeams.teams) {
                    const map: Record<string, any> = {};
                    dataTeams.teams.forEach((t: any) => {
                        map[t.id] = t;
                    });
                    setTeamData(map);
                }
            } catch (e) {
                console.error("Failed to fetch teams", e);
            }

            if (!activeTeam?.id) return;
            try {
                // Templates
                const res = await fetch(`/api/templates?teamId=${activeTeam.id}`);
                const data = await res.json();
                if (data.templates) setSavedTemplates(data.templates);

                // Logs
                const resLog = await fetch(`/api/audit-logs?teamId=${activeTeam.id}`);
                const dataLog = await resLog.json();
                if (dataLog.logs) setAuditLogs(dataLog.logs);

            } catch (e) {
                console.error("Failed to fetch data", e);
            }
        };
        fetchData();

        // Reset state on team change
        setViewMode('SELECTION');
        setFormValues({});
        setManualOverride(false);
        setManualMessage("");
        setScheduleDate("");
        setScheduleDate("");
        setBulkData([]); // Reset bulk

        // precise default template if available, otherwise generic
        setBulkTemplate(activeTeam?.generateMessage ? activeTeam.generateMessage(activeTeam.examples?.[0]?.data || {}) : "");
    }, [activeTeamKey, activeTeam?.id]);

    // Merge static config with DB data
    const currentTeamDB = teamData[activeTeam.id];
    const displayManager = currentTeamDB?.manager || activeTeam.manager;
    const displayEmail = currentTeamDB?.email || activeTeam.email;

    const handleSaveTeamInfo = async () => {
        try {
            const res = await fetch("/api/teams", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: activeTeam.id,
                    manager: teamEditForm.manager,
                    email: teamEditForm.email
                })
            });
            if (res.ok) {
                const data = await res.json();
                setTeamData(prev => ({ ...prev, [activeTeam.id]: data.team }));
                setIsEditingTeam(false);
                alert("Team information updated!");
            } else {
                alert("Failed to update team info");
            }
        } catch (e) {
            alert("Error updating team info");
        }
    };

    // Bulk SMS Handlers
    const generateCSVTemplate = () => {
        const headers = ["phoneNumber", ...activeTeam.inputs.map(i => i.name)];

        // Add example rows
        const exampleRows = activeTeam.examples?.map(ex => {
            return ["07700900000", ...activeTeam.inputs.map(i => ex.data[i.name] || "")].join(",");
        }) || [];

        const csvContent = [headers.join(","), ...exampleRows].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `${activeTeam.id}_template.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                setBulkData(results.data);
            }
        });
    };

    const handleBulkSend = async () => {
        if (!confirm(`Are you sure you want to send ${bulkData.length} messages?`)) return;

        setIsBulkSending(true);
        let successCount = 0;
        let failCount = 0;

        for (const row of bulkData) {
            // Interpolate message
            let message = bulkTemplate;
            Object.keys(row).forEach(key => {
                message = message.replace(new RegExp(`{${key}}`, 'g'), row[key] || '');
            });

            // Clean up any unused tags
            // message = message.replace(/{(\w+)}/g, '');
            try {
                const res = await fetch("/api/send-sms", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        message: message,
                        teamId: activeTeam.id,
                    })
                });
                if (res.ok) successCount++;
                else failCount++;
            } catch (e) {
                failCount++;
            }
        }

        alert(`Bulk Send Complete!\nSuccessful: ${successCount}\nFailed: ${failCount}`);
        setIsBulkSending(false);
        setBulkData([]);
        setViewMode('HISTORY');

        // Refresh logs
        const resLog = await fetch(`/api/audit-logs?teamId=${activeTeam.id}`);
        const dataLog = await resLog.json();
        if (dataLog.logs) setAuditLogs(dataLog.logs);
    };


    const generatedMessage = activeTeam?.generateMessage(formValues) || "";
    const finalMessage = manualOverride ? manualMessage : generatedMessage;
    const charCount = finalMessage.length;
    const isOverLimit = charCount > 160;

    const handleSaveTemplate = async () => {
        const name = prompt("Enter a name for this template:");
        if (!name) return;

        setIsSavingTemplate(true);
        try {
            const res = await fetch("/api/templates", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    content: finalMessage,
                    teamId: activeTeam.id
                })
            });
            if (res.ok) {
                alert("Template saved!");
                // Refresh list
                const res2 = await fetch(`/api/templates?teamId=${activeTeam.id}`);
                const data2 = await res2.json();
                if (data2.templates) setSavedTemplates(data2.templates);
            } else {
                alert("Failed to save template");
            }
        } catch (e) {
            alert("Error saving template");
        } finally {
            setIsSavingTemplate(false);
        }
    };

    const handleSendSMS = async () => {
        if (!finalMessage) {
            alert("Message cannot be empty.");
            return;
        }

        setSending(true);
        try {
            const res = await fetch("/api/send-sms", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: finalMessage,
                    teamId: activeTeam.id,
                    scheduledFor: scheduleDate || null
                })
            });
            const data = await res.json();
            if (res.ok) {
                const action = scheduleDate ? "Scheduled" : "Sent";
                alert(`SMS ${action} Successfully!`);
                setFormValues({});
                setManualMessage("");
                setScheduleDate("");
                setViewMode('HISTORY'); // Go to history to see the new log
            } else {
                throw new Error(data.error);
            }
        } catch (error: any) {
            alert(error.message || "Failed to send SMS");
        } finally {
            setSending(false);
        }
    };

    if (isPending || loading) return <div className="flex min-h-screen items-center justify-center">Loading...</div>;

    return (
        <main className="flex min-h-screen flex-col items-center p-8 bg-gray-50 text-gray-900 font-sans">
            <div className="w-full max-w-7xl bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden min-h-[800px]">
                {/* Header */}
                <div className="bg-gray-900 text-white p-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Users className="w-6 h-6" />
                            Financial Operations SMS Hub
                        </h1>
                        <p className="text-gray-400 text-sm mt-1">Logged in as {session?.user?.name}</p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={() => router.push("/dashboard/settings")}
                            className="text-sm bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded transition-colors"
                        >
                            Settings
                        </button>
                        {session?.user?.role === 'admin' && (
                            <>
                                <button
                                    onClick={() => router.push("/dashboard/users")}
                                    className="text-sm bg-indigo-600 hover:bg-indigo-500 px-3 py-2 rounded transition-colors flex items-center gap-1"
                                    title="Manage Users"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /></svg>
                                    Users
                                </button>
                                <button
                                    onClick={() => router.push("/dashboard/admin/design")}
                                    className="text-sm bg-indigo-600 hover:bg-indigo-500 px-3 py-2 rounded transition-colors flex items-center gap-1"
                                    title="Service Design Package"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-layers"><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" /><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65" /><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65" /></svg>
                                    Design
                                </button>
                                <button
                                    onClick={() => router.push("/dashboard/admin/go-live")}
                                    className="text-sm bg-green-600 hover:bg-green-500 px-3 py-2 rounded transition-colors flex items-center gap-1"
                                    title="Go Live Checklist"
                                >
                                    Go Live
                                </button>
                                <button
                                    onClick={() => router.push("/dashboard/admin/settings")}
                                    className="text-sm bg-gray-600 hover:bg-gray-500 px-3 py-2 rounded transition-colors flex items-center gap-1"
                                    title="System Configuration"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-settings-2"><path d="M20 7h-9" /><path d="M14 17H5" /><circle cx="17" cy="17" r="3" /><circle cx="7" cy="7" r="3" /></svg>
                                    Config
                                </button>
                            </>
                        )}
                        <button
                            onClick={handleLogout}
                            className="text-sm bg-red-600 hover:bg-red-700 px-4 py-2 rounded transition-colors"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>

                {/* Team Tabs */}
                <div className="flex border-b border-gray-200 bg-gray-50">
                    {Object.keys(TEAMS)
                        .filter(key => {
                            // If Admin, show all.
                            if (session?.user?.role === 'admin') return true;
                            // If User has a teamId, show only that team.
                            const user = session?.user as any;
                            if (user?.teamId && user.teamId !== key) return false;
                            return true;
                        })
                        .map((key) => (
                            <button
                                key={key}
                                onClick={() => setActiveTeamKey(key)}
                                className={`flex-1 py-4 text-center font-medium transition-all relative ${activeTeamKey === key
                                    ? "text-blue-600 bg-white border-t-4 border-t-blue-600 shadow-sm z-10"
                                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                                    }`}
                            >
                                {TEAMS[key].label}
                            </button>
                        ))}
                </div>

                {/* Main Content Area */}
                <div className="p-8">
                    {/* View Mode: SELECTION (Grid of Cards) */}
                    {viewMode === 'SELECTION' && (
                        <div className="space-y-8 animate-in fade-in duration-300">
                            {/* Team Metadata Banner */}
                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-6 flex justify-between items-center relative">
                                <div>
                                    <h2 className="text-xl font-bold text-blue-900 mb-1">{activeTeam.label}</h2>
                                    <p className="text-blue-700">Select a template below to start composing a message.</p>
                                    <button
                                        onClick={() => setViewMode('HISTORY')}
                                        className="mt-3 text-sm font-medium text-blue-800 hover:text-blue-900 underline flex items-center"
                                    >
                                        View Sent History & Scheduled
                                    </button>
                                    <button
                                        onClick={() => setViewMode('BULK_SEND')}
                                        className="mt-3 text-sm font-medium text-blue-800 hover:text-blue-900 underline flex items-center gap-1"
                                    >
                                        <UploadCloud className="w-4 h-4" />
                                        Bulk Send via CSV
                                    </button>
                                </div>
                                <div className="text-right text-sm">
                                    <p className="text-gray-600">Manager: <span className="font-semibold text-gray-900">{displayManager}</span></p>
                                    <p className="text-gray-600">Email: <span className="font-semibold text-gray-900">{displayEmail}</span></p>
                                    {session?.user?.role === 'admin' && (
                                        <button
                                            onClick={() => {
                                                setTeamEditForm({ manager: displayManager, email: displayEmail });
                                                setIsEditingTeam(true);
                                            }}
                                            className="text-xs text-blue-600 hover:text-blue-800 underline mt-2"
                                        >
                                            Edit Details
                                        </button>
                                    )}
                                </div>

                                {/* Edit Team Modal (Simple Overlay) */}
                                {isEditingTeam && (
                                    <div className="absolute top-0 right-0 w-80 bg-white shadow-xl p-4 rounded-lg border border-blue-200 z-20">
                                        <h3 className="font-bold text-sm mb-3 text-gray-900">Edit Team Details</h3>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-xs text-gray-500 mb-1 block">Manager Name</label>
                                                <input
                                                    value={teamEditForm.manager}
                                                    onChange={(e) => setTeamEditForm({ ...teamEditForm, manager: e.target.value })}
                                                    placeholder="Manager Name"
                                                    className="w-full border border-gray-300 p-2 rounded text-sm focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500 mb-1 block">Team Email</label>
                                                <input
                                                    value={teamEditForm.email}
                                                    onChange={(e) => setTeamEditForm({ ...teamEditForm, email: e.target.value })}
                                                    placeholder="Team Email"
                                                    className="w-full border border-gray-300 p-2 rounded text-sm focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                            <div className="flex gap-2 pt-2">
                                                <button onClick={handleSaveTeamInfo} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 rounded font-medium transition-colors">Save Changes</button>
                                                <button onClick={() => setIsEditingTeam(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs py-2 rounded font-medium transition-colors">Cancel</button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Create New / Custom Card */}
                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                <button
                                    onClick={() => {
                                        setFormValues({});
                                        setManualOverride(false);
                                        setViewMode('EDITOR');
                                    }}
                                    className="group flex flex-col items-center justify-center p-8 bg-white border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all h-64 text-center"
                                >
                                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <Plus className="w-6 h-6" />
                                    </div>
                                    <h3 className="font-bold text-lg text-gray-900 mb-2">Create Custom</h3>
                                    <p className="text-sm text-gray-500">Start with a blank form</p>
                                </button>

                                {/* Pre-set Examples */}
                                {activeTeam.examples?.map((ex, idx) => (
                                    <button
                                        key={`ex-${idx}`}
                                        onClick={() => {
                                            setFormValues(ex.data);
                                            setManualOverride(false);
                                            setViewMode('EDITOR');
                                        }}
                                        className="group relative flex flex-col text-left p-6 bg-white border border-gray-200 rounded-xl hover:shadow-lg hover:border-blue-300 transition-all h-64 overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                            <LayoutTemplate className="w-24 h-24 text-blue-900" />
                                        </div>
                                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center mb-4">
                                            <LayoutTemplate className="w-5 h-5" />
                                        </div>
                                        <h3 className="font-bold text-lg text-gray-900 mb-2">{ex.label}</h3>
                                        {/* Preview generated text roughly */}
                                        <p className="text-sm text-gray-500 line-clamp-4">
                                            {activeTeam.generateMessage(ex.data)}
                                        </p>
                                    </button>
                                ))}

                                {/* Saved DB Templates */}
                                {savedTemplates.map((tmpl) => (
                                    <button
                                        key={tmpl.id}
                                        onClick={() => {
                                            setManualMessage(tmpl.content);
                                            setManualOverride(true);
                                            setViewMode('EDITOR');
                                        }}
                                        className="group relative flex flex-col text-left p-6 bg-white border border-gray-200 rounded-xl hover:shadow-lg hover:border-purple-300 transition-all h-64 overflow-hidden"
                                    >
                                        <div className=" absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                            <FileText className="w-24 h-24 text-purple-900" />
                                        </div>
                                        <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center mb-4">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <h3 className="font-bold text-lg text-gray-900 mb-2">{tmpl.name}</h3>
                                        <p className="text-sm text-gray-500 line-clamp-4 font-mono bg-gray-50 p-2 rounded text-xs">
                                            {tmpl.content}
                                        </p>
                                        <span className="absolute bottom-4 right-4 text-xs text-purple-600 font-medium bg-purple-100 px-2 py-1 rounded">
                                            Saved Template
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* View Mode: EDITOR (Form & Preview) */}
                    {viewMode === 'EDITOR' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-right-8 duration-300">
                            {/* Back Button */}
                            <div className="lg:col-span-2">
                                <button
                                    onClick={() => setViewMode('SELECTION')}
                                    className="flex items-center text-gray-500 hover:text-gray-900 transition-colors"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Back to Templates
                                </button>
                            </div>

                            {/* Left: Inputs */}
                            <div className="space-y-6">
                                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                                    <h3 className="font-bold text-lg border-b pb-4 mb-4 flex items-center">
                                        <Pencil className="w-5 h-5 mr-2 text-blue-600" />
                                        Edit Variables
                                    </h3>
                                    <div className="space-y-4">
                                        {activeTeam.inputs.map((input) => (
                                            <div key={input.name}>
                                                <label className="block text-sm font-medium mb-1 text-gray-700">{input.label}</label>
                                                <input
                                                    type={input.type || "text"}
                                                    placeholder={input.placeholder}
                                                    value={formValues[input.name] || ""}
                                                    onChange={(e) => setFormValues({ ...formValues, [input.name]: e.target.value })}
                                                    className="w-full border border-gray-300 rounded-md p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                                                    disabled={manualOverride}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Right: Preview & Actions */}
                            <div className="space-y-6">
                                <div className="bg-gray-100 p-8 rounded-lg border border-gray-200 h-full flex flex-col shadow-inner">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="font-bold text-lg text-gray-800">Message Preview</h3>
                                        <div className={`text-xs font-mono px-3 py-1 rounded-full ${isOverLimit ? 'bg-red-100 text-red-700 font-bold border border-red-200' : 'bg-white text-gray-600 border border-gray-300'}`}>
                                            {charCount} / 160 chars
                                        </div>
                                    </div>

                                    {/* Manual Override */}
                                    <div className="mb-4 flex justify-between items-center bg-white p-3 rounded-lg border border-gray-200">
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id="manualOverride"
                                                checked={manualOverride}
                                                onChange={(e) => {
                                                    setManualOverride(e.target.checked);
                                                    if (e.target.checked) setManualMessage(generatedMessage);
                                                }}
                                                className="mr-3 h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                                            />
                                            <label htmlFor="manualOverride" className="text-sm font-medium cursor-pointer select-none">Manual Edit Mode</label>
                                        </div>
                                        <button
                                            onClick={handleSaveTemplate}
                                            disabled={!finalMessage}
                                            className="text-xs flex items-center gap-1 bg-purple-50 text-purple-700 hover:bg-purple-100 px-3 py-1.5 rounded transition-colors"
                                            title="Save current message as a reusable template"
                                        >
                                            <Save className="w-3 h-3" />
                                            Save Template
                                        </button>
                                    </div>

                                    {/* Editor Area */}
                                    <div className="flex-grow mb-6">
                                        {manualOverride ? (
                                            <textarea
                                                value={manualMessage}
                                                onChange={(e) => setManualMessage(e.target.value)}
                                                className="w-full h-48 p-4 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="Type your custom message here..."
                                            />
                                        ) : (
                                            <div className="w-full h-48 p-4 bg-white border border-gray-300 rounded-lg font-mono text-sm whitespace-pre-wrap text-gray-700 shadow-sm overflow-y-auto">
                                                {generatedMessage || <span className="text-gray-400 italic">Fill in variables to see preview...</span>}
                                            </div>
                                        )}
                                    </div>

                                    {/* Send Section */}
                                    <div className="pt-6 border-t border-gray-300 space-y-4">
                                        <div className="flex items-center gap-2 text-sm bg-yellow-50 text-yellow-800 p-3 rounded-lg border border-yellow-200">
                                            <CheckCircle2 className="w-4 h-4 text-yellow-600" />
                                            <span><strong>Test Mode:</strong> Sending to {process.env.TEST_PHONE_NUMBER || "Test Number"}</span>
                                        </div>

                                        {/* Scheduling */}
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Schedule (Optional)</label>
                                            <input
                                                type="datetime-local"
                                                value={scheduleDate}
                                                onChange={(e) => setScheduleDate(e.target.value)}
                                                className="w-full text-sm border border-gray-300 rounded p-2"
                                            />
                                            {scheduleDate && <p className="text-xs text-blue-600 mt-1">Message will be scheduled for {new Date(scheduleDate).toLocaleString()}</p>}
                                        </div>

                                        <button
                                            onClick={handleSendSMS}
                                            disabled={sending}
                                            className={`w-full py-4 rounded-lg font-bold text-white text-lg shadow-md transition-all flex items-center justify-center gap-2 ${sending
                                                ? "bg-gray-400 cursor-not-allowed"
                                                : "bg-green-600 hover:bg-green-700 hover:shadow-xl hover:scale-[1.02]"
                                                }`}
                                        >
                                            {sending ? (
                                                <>Processing...</>
                                            ) : (
                                                <>
                                                    <Send className="w-5 h-5" />
                                                    {scheduleDate ? "Schedule SMS" : "Send SMS Now"}
                                                </>
                                            )}
                                        </button>

                                        {isOverLimit && (
                                            <p className="text-red-600 text-xs text-center font-medium">
                                                Warning: Message exceeds 1 credit limit (160 chars).
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {/* View Mode: HISTORY */}
                    {viewMode === 'HISTORY' && (
                        <div className="animate-in slide-in-from-right-8 duration-300">
                            <div className="mb-6">
                                <button
                                    onClick={() => setViewMode('SELECTION')}
                                    className="flex items-center text-gray-500 hover:text-gray-900 transition-colors"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Back to Templates
                                </button>
                            </div>

                            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                                <div className="p-6 border-b border-gray-200">
                                    <h2 className="text-xl font-bold">Audit Log: {activeTeam.label}</h2>
                                    <p className="text-sm text-gray-500">History of all scheduled and sent messages.</p>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 text-gray-700 uppercase font-semibold">
                                            <tr>
                                                <th className="px-6 py-3">Status</th>
                                                <th className="px-6 py-3">Date</th>
                                                <th className="px-6 py-3">Message</th>
                                                <th className="px-6 py-3">Recipient</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {auditLogs.length === 0 ? (
                                                <tr>
                                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">No messages found.</td>
                                                </tr>
                                            ) : (
                                                auditLogs.map((log) => (
                                                    <tr key={log.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${log.status === 'sent' ? 'bg-green-100 text-green-800' :
                                                                log.status === 'scheduled' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                                                }`}>
                                                                {log.status.toUpperCase()}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            {log.scheduledFor ? (
                                                                <div>
                                                                    <div className="font-semibold">{new Date(log.scheduledFor).toLocaleDateString('en-GB')}</div>
                                                                    <div className="text-gray-500">{new Date(log.scheduledFor).toLocaleTimeString('en-GB')}</div>
                                                                </div>
                                                            ) : (
                                                                <div>
                                                                    <div className="font-semibold">{new Date(log.createdAt).toLocaleDateString('en-GB')}</div>
                                                                    <div className="text-gray-500">{new Date(log.createdAt).toLocaleTimeString('en-GB')}</div>
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 max-w-md truncate" title={log.message}>
                                                            {log.message}
                                                        </td>
                                                        <td className="px-6 py-4 text-gray-500">
                                                            {log.recipient}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* View Mode: BULK_SEND */}
                    {viewMode === 'BULK_SEND' && (
                        <div className="animate-in slide-in-from-right-8 duration-300">
                            <div className="mb-6 flex justify-between items-center">
                                <button
                                    onClick={() => setViewMode('SELECTION')}
                                    className="flex items-center text-gray-500 hover:text-gray-900 transition-colors"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Back to Templates
                                </button>
                                <button
                                    onClick={generateCSVTemplate}
                                    className="text-sm flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg transition-all"
                                >
                                    <FileSpreadsheet className="w-4 h-4" />
                                    Download CSV Template
                                </button>
                            </div>

                            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                                <div className="p-8 border-b border-gray-200 bg-gray-50">
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Bulk SMS Upload</h2>
                                    <p className="text-gray-600 mb-6">Upload a CSV file to send messages to multiple recipients at once. Rows with missing data will be highlighted.</p>

                                    <div className="flex items-center justify-center w-full">
                                        <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-white hover:bg-gray-50 hover:border-blue-500 transition-colors">
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <UploadCloud className="w-8 h-8 mb-3 text-gray-400" />
                                                <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                                <p className="text-xs text-gray-500">CSV files only</p>
                                            </div>
                                            <input id="dropzone-file" type="file" className="hidden" accept=".csv" onChange={handleFileUpload} />
                                        </label>
                                    </div>
                                </div>


                                {/* Template Editor */}
                                <div className="p-6 bg-blue-50 border-b border-gray-200">
                                    <h3 className="font-bold text-sm text-blue-900 mb-2">Message Template</h3>
                                    <p className="text-xs text-blue-800 mb-3">Edit the message that will be sent to all recipients. Use the buttons to insert variables from your CSV.</p>

                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {bulkData.length > 0 && Object.keys(bulkData[0]).map(header => (
                                            <button
                                                key={header}
                                                onClick={() => setBulkTemplate(prev => prev + `{${header}}`)}
                                                className="px-2 py-1 bg-white border border-blue-200 text-blue-700 text-xs rounded hover:bg-blue-100 transition-colors"
                                            >
                                                +{header}
                                            </button>
                                        ))}
                                    </div>

                                    <textarea
                                        value={bulkTemplate}
                                        onChange={(e) => setBulkTemplate(e.target.value)}
                                        className="w-full h-24 p-3 border border-blue-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500"
                                        placeholder="Type your message here..."
                                    />
                                    <div className="text-right text-xs text-blue-600 mt-1">
                                        Use <strong>{'{headerName}'}</strong> to insert data dynamically.
                                    </div>
                                </div>

                                {bulkData.length > 0 && (
                                    <div className="p-0">
                                        <div className="bg-blue-50 p-4 border-y border-blue-100 flex justify-between items-center">
                                            <div className="text-sm text-blue-800">
                                                <strong>{bulkData.length} records found.</strong>
                                                {validationErrors.length > 0 && <span className="text-red-600 ml-2 font-bold">({validationErrors.length} issues found)</span>}
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setBulkData([])}
                                                    className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800 font-medium"
                                                >
                                                    Clear List
                                                </button>
                                            </div>
                                        </div>

                                        <div className="max-h-[500px] overflow-y-auto">
                                            <table className="w-full text-sm text-left border-collapse">
                                                <thead className="bg-gray-100 text-gray-700 font-semibold sticky top-0 z-10 shadow-sm">
                                                    <tr>
                                                        <th className="px-4 py-3 border-b">Row</th>
                                                        {Object.keys(bulkData[0]).map((header) => (
                                                            <th key={header} className="px-4 py-3 border-b capitalize">{header}</th>
                                                        ))}
                                                        <th className="px-4 py-3 border-b">Preview</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {bulkData.map((row, idx) => {
                                                        const isEmpty = Object.values(row).some(v => !v);
                                                        return (
                                                            <tr key={idx} className={`border-b border-gray-100 hover:bg-gray-50 group transition-colors ${isEmpty ? 'bg-red-50 hover:bg-red-100' : ''}`}>
                                                                <td className="px-4 py-2 font-mono text-xs text-gray-400">{idx + 1}</td>
                                                                {Object.entries(row).map(([key, val]: any) => (
                                                                    <td key={key} className="px-4 py-2">
                                                                        <input
                                                                            value={val}
                                                                            onChange={(e) => {
                                                                                const newData = [...bulkData];
                                                                                newData[idx][key] = e.target.value;
                                                                                setBulkData(newData);
                                                                            }}
                                                                            className={`w-full bg-transparent border-b border-transparent focus:border-blue-500 focus:ring-0 text-sm ${!val ? 'border-red-300 bg-red-50 placeholder-red-300' : ''}`}
                                                                            placeholder="Required"
                                                                        />
                                                                    </td>
                                                                ))}
                                                                <td className="px-4 py-2 text-gray-500 italic max-w-xs truncate text-xs">
                                                                    {(() => {
                                                                        let msg = bulkTemplate;
                                                                        Object.keys(row).forEach(k => {
                                                                            msg = msg.replace(new RegExp(`{${k}}`, 'g'), row[k] || '');
                                                                        });
                                                                        return msg;
                                                                    })()}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end">
                                            <button
                                                onClick={handleBulkSend}
                                                disabled={isBulkSending || validationErrors.length > 0}
                                                className={`px-8 py-3 rounded-lg font-bold text-white shadow-md flex items-center gap-2 ${isBulkSending || validationErrors.length > 0
                                                    ? "bg-gray-400 cursor-not-allowed"
                                                    : "bg-green-600 hover:bg-green-700 hover:scale-105 transition-transform"
                                                    }`}
                                            >
                                                {isBulkSending ? (
                                                    <>Processing...</>
                                                ) : validationErrors.length > 0 ? (
                                                    <>Fix Errors to Send</>
                                                ) : (
                                                    <>
                                                        <Send className="w-5 h-5" />
                                                        Send All ({bulkData.length})
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </main >
    );
}
