
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { systemConfig } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlert } from "lucide-react";
import UserStoriesManager from "@/components/user-stories-manager";

export default async function UserStoriesPage() {
    // Permission Check
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        return (
            <Alert variant="destructive">
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>Access Denied</AlertTitle>
                <AlertDescription>You must be logged in to view this page.</AlertDescription>
            </Alert>
        )
    }

    const visibilityConfig = await db.select().from(systemConfig).where(eq(systemConfig.key, 'show_user_stories_to_teams'));
    const showUserStoriesToTeams = visibilityConfig[0]?.value === 'true';

    const isAdmin = session.user.role === 'admin';
    const isGDPR = session.user.role === 'gdpr';

    if (isGDPR || (!isAdmin && !showUserStoriesToTeams)) {
        return (
            <div className="p-8">
                <Alert variant="destructive">
                    <ShieldAlert className="h-4 w-4" />
                    <AlertTitle>Access Denied</AlertTitle>
                    <AlertDescription>
                        You do not have permission to view the User Stories page.
                        Please contact an administrator if you believe this is an error.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="space-y-6 container mx-auto p-6 md:p-8 max-w-7xl">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">User Stories</h1>
                <p className="text-muted-foreground">
                    A list of user stories and requirements that define the current application functionality.
                </p>
            </div>

            <UserStoriesManager isAdmin={isAdmin} />
        </div>
    )
}
