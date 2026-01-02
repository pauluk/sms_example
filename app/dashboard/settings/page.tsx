
"use client";
import { authClient } from "@/lib/auth-client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
    const { data: session } = authClient.useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleAddPasskey = async () => {
        setLoading(true);
        try {
            await authClient.passkey.addPasskey();
            alert("Passkey added successfully!");
        } catch (error: any) {
            alert(error.message || "Failed to add passkey");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="flex min-h-screen flex-col items-center p-24">
            <h1 className="text-4xl font-bold mb-8">Settings</h1>
            <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg border border-gray-200 text-gray-900">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold">Security</h2>
                    <p className="text-sm text-gray-500">Manage your account security.</p>
                </div>

                <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                        <h3 className="font-semibold mb-2">Passkeys</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Enable passwordless sign-in using FaceID, TouchID, or Security Keys.
                        </p>
                        <button
                            onClick={handleAddPasskey}
                            disabled={loading}
                            className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium disabled:opacity-50"
                        >
                            {loading ? "Registering..." : "Register New Passkey"}
                        </button>
                    </div>

                    <button onClick={() => router.push("/dashboard")} className="w-full py-2 text-gray-600 hover:bg-gray-100 rounded">
                        Back to Dashboard
                    </button>
                </div>
            </div>
        </main>
    );
}
