"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Database, Shield, Users, FileCode, CheckCircle2, Lock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function RLSProposalPage() {
    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/admin/settings">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-6 w-6" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Row Level Security (RLS) Proposal</h1>
                        <p className="text-gray-500 mt-1">Implementation strategy for multi-tenant data isolation in Neon Postgres.</p>
                    </div>
                </div>

                {/* Overview Card */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                <Shield className="h-5 w-5" />
                            </div>
                            <CardTitle>Security Architecture Overview</CardTitle>
                        </div>
                        <CardDescription>
                            RLS ensures that users can only access data belonging to their specific Team/Department.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="prose max-w-none text-gray-600">
                        <p>
                            We propose implementing Row Level Security (RLS) directly in the Postgres database.
                            This adds a defense-in-depth layer, ensuring that even if the application logic fails,
                            the database itself enforces isolation rules.
                        </p>
                    </CardContent>
                </Card>

                {/* Roles Section */}
                <div className="grid md:grid-cols-3 gap-6">
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">App Admin</CardTitle>
                                <Badge variant="default" className="bg-purple-600">Full Access</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="text-sm text-gray-600">
                            <ul className="space-y-2">
                                <li className="flex gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                                    <span>Bypass RLS policies</span>
                                </li>
                                <li className="flex gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                                    <span>Manage all users & teams</span>
                                </li>
                                <li className="flex gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                                    <span>System configuration</span>
                                </li>
                            </ul>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">App User</CardTitle>
                                <Badge variant="outline" className="border-blue-500 text-blue-600">Restricted</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="text-sm text-gray-600">
                            <ul className="space-y-2">
                                <li className="flex gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                                    <span>View own team's data only</span>
                                </li>
                                <li className="flex gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                                    <span>Create/Send logs for team</span>
                                </li>
                                <li className="flex gap-2">
                                    <Lock className="h-4 w-4 text-red-500 shrink-0" />
                                    <span>Cannot see other teams</span>
                                </li>
                            </ul>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">GDPR Officer</CardTitle>
                                <Badge variant="secondary" className="bg-amber-100 text-amber-700">Audit Only</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="text-sm text-gray-600">
                            <ul className="space-y-2">
                                <li className="flex gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                                    <span>Cross-team read access</span>
                                </li>
                                <li className="flex gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                                    <span>Search by mobile number</span>
                                </li>
                                <li className="flex gap-2">
                                    <Lock className="h-4 w-4 text-red-500 shrink-0" />
                                    <span>No write/send permissions</span>
                                </li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                {/* Implementation Steps */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                                <Database className="h-5 w-5" />
                            </div>
                            <CardTitle>Implementation Strategy</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Step 1 */}
                        <div className="space-y-2 border-l-2 border-gray-200 pl-4">
                            <h3 className="font-semibold text-gray-900">1. Enable Row Level Security</h3>
                            <p className="text-sm text-gray-600">Activate RLS on sensitive tables.</p>
                            <div className="bg-slate-950 text-slate-50 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                                <pre>{`ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;`}</pre>
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div className="space-y-2 border-l-2 border-gray-200 pl-4">
                            <h3 className="font-semibold text-gray-900">2. Define Policies</h3>
                            <p className="text-sm text-gray-600">Create policies that check the current user's team ID.</p>
                            <div className="bg-slate-950 text-slate-50 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                                <pre>{`-- View own team's data
CREATE POLICY team_isolation_policy ON sms_logs
    FOR ALL
    USING (team_id = current_setting('app.current_team_id')::text);

-- Admin Override
CREATE POLICY admin_override_policy ON sms_logs
    FOR ALL
    TO app_admin
    USING (true);`}</pre>
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="space-y-2 border-l-2 border-gray-200 pl-4">
                            <h3 className="font-semibold text-gray-900">3. Application Context</h3>
                            <p className="text-sm text-gray-600">
                                When connecting to Drizzle/Neon, set the session variable.
                            </p>
                            <div className="bg-slate-950 text-slate-50 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                                <pre>{`// In Drizzle middleware/context
await client.query(\`
    SET app.current_user_id = '\${userId}';
    SET app.current_team_id = '\${teamId}';
    SET ROLE '\${role}';
\`);`}</pre>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Additional Considerations */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="font-semibold text-yellow-900 flex items-center gap-2">
                        <FileCode className="h-4 w-4" />
                        Next Steps
                    </h3>
                    <ul className="list-disc list-inside mt-2 text-sm text-yellow-800 space-y-1">
                        <li>Create a database migration to enable RLS.</li>
                        <li>Update `db/index.ts` to support RLS session setting (using transaction or session pool).</li>
                        <li>Test with "GDPR" role to ensure they can see all records but not edit.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
