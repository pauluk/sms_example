import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { redirect } from "next/navigation";

export default async function Layout({ children }: { children: React.ReactNode }) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        redirect("/");
    }

    return (
        <DashboardLayout user={{
            ...session.user,
            role: session.user.role || undefined
        }}>
            {children}
        </DashboardLayout>
    );
}
