
"use client";
import { authClient } from "@/lib/auth-client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function ResetPasswordForm() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token"); // or handle error if missing

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            alert("Passwords do not match");
            return;
        }
        if (!token) {
            alert("Missing token");
            return;
        }

        await authClient.resetPassword({
            newPassword: password,
            token: token,
        }, {
            onSuccess: () => {
                alert("Password reset successfully!");
                router.push("/");
            },
            onError: (ctx) => {
                alert(ctx.error.message);
            }
        });
    };

    if (!token) return <div>Invalid or missing token.</div>;

    return (
        <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg border border-gray-200 text-gray-900">
            <h2 className="text-2xl font-bold text-center mb-6">Set New Password</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium">New Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full mt-1 p-2 border rounded-md"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium">Confirm Password</label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full mt-1 p-2 border rounded-md"
                        required
                    />
                </div>
                <button
                    type="submit"
                    className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
                >
                    Reset Password
                </button>
            </form>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-24">
            <Suspense fallback={<div>Loading...</div>}>
                <ResetPasswordForm />
            </Suspense>
        </main>
    );
}
