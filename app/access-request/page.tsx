"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ShieldAlert, Mail } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AccessRequestPage() {
    const { data: session } = authClient.useSession();
    const router = useRouter();
    const [reason, setReason] = useState("");
    const [info, setInfo] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch("/api/support/request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reason, info })
            });

            if (res.ok) {
                setSubmitted(true);
                toast.success("Request sent successfully");
            } else {
                toast.error("Failed to send request");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <Card className="max-w-md w-full text-center">
                    <CardHeader>
                        <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <Mail className="w-6 h-6 text-green-600" />
                        </div>
                        <CardTitle>Request Sent</CardTitle>
                        <CardDescription>
                            Your request has been submitted to the support team. They will review your case and get back to you via email.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button variant="outline" onClick={() => router.push("/")}>
                            Return Home
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Card className="max-w-md w-full">
                <CardHeader>
                    <div className="flex items-center gap-2 text-red-600 mb-2">
                        <ShieldAlert className="w-5 h-5" />
                        <span className="font-semibold">Access Restricted</span>
                    </div>
                    <CardTitle>Request Access</CardTitle>
                    <CardDescription>
                        Your account currently has restricted access. Please complete the form below to request a review.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Email Address</Label>
                            <div className="p-2 bg-gray-100 rounded text-sm text-gray-600">
                                {session?.user?.email || "Loading..."}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Request Type</Label>
                            <Select value={reason} onValueChange={setReason} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a reason" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Enable Access">Enable Access</SelectItem>
                                    <SelectItem value="Report Issue">Report Issue</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Additional Information</Label>
                            <Textarea
                                value={info}
                                onChange={(e) => setInfo(e.target.value)}
                                placeholder="Please explain why you need access or describe the issue..."
                                required
                                className="min-h-[100px]"
                            />
                        </div>

                        <Button type="submit" className="w-full" disabled={loading || !session}>
                            {loading ? "Sending..." : "Submit Request"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
