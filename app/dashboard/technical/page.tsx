
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Server, Database, Lock, Globe, Code2, Layout } from "lucide-react";

export default function TechnicalPage() {
    return (
        <div className="space-y-8 container mx-auto max-w-5xl">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Technical Documentation</h1>
                <p className="text-muted-foreground mt-2">
                    Overview of the application architecture, technology stack, and security implementation.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Code2 className="h-5 w-5 text-blue-600" />
                            Frontend Framework
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                            <Badge>Next.js 14 App Router</Badge>
                            <Badge>React</Badge>
                            <Badge>TypeScript</Badge>
                            <Badge>Tailwind CSS</Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                            Built using the Next.js App Router for server-side rendering and optimal performance.
                            Styling is handled via Tailwind CSS with Shadcn UI components for a consistent design system.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Server className="h-5 w-5 text-green-600" />
                            Backend & API
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                            <Badge>Next.js Server Actions</Badge>
                            <Badge>GOV.UK Notify API</Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                            Serverless API routes handle business logic. SMS and Email delivery is orchestrated via the
                            GOV.UK Notify API, ensuring reliable communication.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Lock className="h-5 w-5 text-red-600" />
                            Authentication & Security
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                            <Badge>Better Auth</Badge>
                            <Badge>Role Based Access (RBAC)</Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                            Authentication is managed by Better Auth, supporting Magic Links and Passkeys.
                            Strict RBAC ensures only authorized personnel can access sensitive Admin dashboards.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Database className="h-5 w-5 text-purple-600" />
                            Data Persistence
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                            <Badge variant="outline">Drizzle ORM</Badge>
                            <Badge variant="outline">PostgreSQL</Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                            Data is modeled using Drizzle ORM and stored in a PostgreSQL database.
                            Migrations are handled automatically during deployment.
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-slate-900 text-white border-slate-800">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <Layout className="h-5 w-5" />
                        System Architecture
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <pre className="text-xs md:text-sm font-mono bg-black/50 p-4 rounded-lg overflow-x-auto text-green-400">
                        {`graph TD
    User[Web Browser] -->|HTTPS| CDN[Vercel Edge Network]
    CDN --> Next[Next.js Application]
    
    subgraph "Application Layer"
        Next -->|Auth| Auth[Better Auth]
        Next -->|Data| DB[(PostgreSQL)]
        Next -->|External| Notify[GOV.UK Notify API]
    end
    
    subgraph "Design System"
        UI[Shadcn UI] --> Tailwind[Tailwind CSS]
    end`}
                    </pre>
                </CardContent>
            </Card>
        </div>
    );
}
