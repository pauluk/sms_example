"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Code2, Database, Key, Server, Layers } from "lucide-react";

export default function ServiceDesignPage() {
    const { data: session, isPending } = authClient.useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [zoomedDiagram, setZoomedDiagram] = useState<string | null>(null);

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
            setLoading(false);
        }
    }, [session, isPending, router]);

    useEffect(() => {
        // Initialize mermaid
        import("mermaid").then(m => {
            m.default.initialize({ startOnLoad: false, theme: 'default' });
            m.default.run({
                querySelector: '.mermaid'
            });
        });
    }, [loading]);

    // Re-run mermaid when zoom modal opens
    useEffect(() => {
        if (zoomedDiagram) {
            import("mermaid").then(m => {
                setTimeout(() => {
                    m.default.run({
                        querySelector: '.mermaid-zoom'
                    });
                }, 100);
            });
        }
    }, [zoomedDiagram]);

    if (isPending || loading) return <div className="flex min-h-screen items-center justify-center">Loading...</div>;

    const schemaDiagram = `
erDiagram
    USER ||--o{ SESSION : has
    USER ||--o{ ACCOUNT : has
    USER ||--o{ PASSKEY : has
    USER ||--o{ TEMPLATE : creates
    USER ||--o{ SMS_LOG : sends
    USER {
        string id PK
        string name
        string email
        string role
        boolean emailVerified
    }
    SESSION {
        string id PK
        string userId FK
        timestamp expiresAt
    }
    TEAM {
        string id PK
        string name
        string manager
        string email
    }
    TEMPLATE {
        string id PK
        string teamId
        string createdBy FK
        string content
    }
    SMS_LOG {
        string id PK
        string teamId
        string userId FK
        string status
        string recipient
    }
`;

    const stackDiagram = `
graph TD
    Client[Web Browser] -->|HTTPS| Next[Next.js App Router]
    Next -->|ORM| DB[(PostgreSQL Database)]
    Next -->|REST API| Notify[GOV.UK Notify API]
    Next -->|Auth| BetterAuth[BetterAuth Engine]
    BetterAuth -.-> DB
    Client -.->|Static Assets| CDN
`;

    return (
        <main className="flex min-h-screen flex-col items-center p-8 bg-gray-50 text-gray-900 font-sans">
            <div className="w-full max-w-6xl space-y-8">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="bg-gray-900 text-white p-6 flex items-center gap-4">
                        <button
                            onClick={() => router.push("/dashboard")}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                <Layers className="w-6 h-6 text-blue-400" />
                                Service Design Package
                            </h1>
                            <p className="text-gray-400 text-sm mt-1">Technical documentation for service assessment and submission.</p>
                        </div>
                    </div>

                    <div className="p-8 space-y-12">

                        {/* Tech Stack */}
                        <section>
                            <h2 className="text-xl font-bold border-b pb-2 mb-4 flex items-center gap-2">
                                <Code2 className="w-5 h-5 text-blue-600" />
                                Technology Stack
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                    <h3 className="font-semibold text-blue-900 mb-2">Frontend</h3>
                                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                                        <li><strong>Framework</strong>: Next.js 14 (App Router)</li>
                                        <li><strong>Language</strong>: TypeScript</li>
                                        <li><strong>Styling</strong>: Tailwind CSS</li>
                                        <li><strong>UI Components</strong>: Lucide React Icons</li>
                                    </ul>
                                </div>
                                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                                    <h3 className="font-semibold text-green-900 mb-2">Backend & Data</h3>
                                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                                        <li><strong>Database</strong>: PostgreSQL</li>
                                        <li><strong>ORM</strong>: Drizzle ORM</li>
                                        <li><strong>API</strong>: Next.js Server Actions & API Routes</li>
                                        <li><strong>Infrastructure</strong>: Node.js Environment</li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        {/* Authentication */}
                        <section>
                            <h2 className="text-xl font-bold border-b pb-2 mb-4 flex items-center gap-2">
                                <Key className="w-5 h-5 text-purple-600" />
                                Authentication & Security
                            </h2>
                            <div className="bg-white border p-6 rounded-lg shadow-sm">
                                <p className="mb-4 text-gray-700">Authentication is managed via <strong>BetterAuth</strong>, providing a secure, compliant, and flexible identity layer.</p>
                                <div className="flex gap-8 flex-wrap">
                                    <div className="flex-1 min-w-[200px]">
                                        <h4 className="font-bold text-sm text-purple-900 mb-2 uppercase">Methods Supported</h4>
                                        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                                            <li>Email & Password (with Magic Link option)</li>
                                            <li>Passkeys (WebAuthn / FIDO2)</li>
                                        </ul>
                                    </div>
                                    <div className="flex-1 min-w-[200px]">
                                        <h4 className="font-bold text-sm text-purple-900 mb-2 uppercase">Authorisation</h4>
                                        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                                            <li>Role-Based Access Control (RBAC)</li>
                                            <li>Roles: <code>User</code>, <code>Admin</code></li>
                                            <li>Protected API Routes & Middleware</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Architecture Diagram */}
                        <section>
                            <h2 className="text-xl font-bold border-b pb-2 mb-4 flex items-center gap-2">
                                <Server className="w-5 h-5 text-orange-600" />
                                Component Architecture
                            </h2>
                            <div
                                className="bg-gray-50 border p-4 rounded-lg overflow-x-auto flex justify-center cursor-zoom-in group relative"
                                onClick={() => setZoomedDiagram(stackDiagram)}
                            >
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 p-1.5 rounded shadow text-xs flex items-center gap-1 font-semibold text-gray-600">
                                    <Layers className="w-3 h-3" /> Expand
                                </div>
                                <pre className="mermaid bg-white p-4 rounded shadow-sm">
                                    {stackDiagram}
                                </pre>
                            </div>
                            <p className="text-xs text-center text-gray-500 mt-2">Diagram rendered using Mermaid syntax via Markdown support.</p>
                        </section>

                        {/* Schema Diagram */}
                        <section>
                            <h2 className="text-xl font-bold border-b pb-2 mb-4 flex items-center gap-2">
                                <Database className="w-5 h-5 text-indigo-600" />
                                Database Schema
                            </h2>
                            <div
                                className="bg-gray-50 border p-4 rounded-lg overflow-x-auto flex justify-center cursor-zoom-in group relative"
                                onClick={() => setZoomedDiagram(schemaDiagram)}
                            >
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 p-1.5 rounded shadow text-xs flex items-center gap-1 font-semibold text-gray-600">
                                    <Layers className="w-3 h-3" /> Expand
                                </div>
                                <pre className="mermaid bg-white p-4 rounded shadow-sm">
                                    {schemaDiagram}
                                </pre>
                            </div>
                        </section>

                    </div>

                    <div className="bg-gray-50 p-6 border-t border-gray-200 text-center text-sm text-gray-500">
                        Generated for GOV.UK Service Assessment • Financial Operations SMS Hub
                    </div>
                </div>
            </div>

            {/* Lightbox Modal */}
            {zoomedDiagram && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-8 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setZoomedDiagram(null)}
                >
                    <div
                        className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-auto relative flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50 sticky top-0 z-10">
                            <h3 className="font-bold text-lg text-gray-800">Diagram View</h3>
                            <button
                                onClick={() => setZoomedDiagram(null)}
                                className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
                            >
                                <ArrowLeft className="w-5 h-5 rotate-180" /> {/* Using Arrow as Close/Back */}
                            </button>
                        </div>
                        <div className="p-8 flex justify-center bg-white min-h-[400px]">
                            <pre className="mermaid-zoom text-center">
                                {zoomedDiagram}
                            </pre>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}

