"use client";

import Link from "next/link";
import { BookOpen } from "lucide-react";
import { useEffect, useState } from "react";

export function Footer({ user }: { user?: { role?: string } | null }) {
    const isAdmin = user?.role === 'admin';
    const [showLink, setShowLink] = useState(true);

    useEffect(() => {
        fetch("/api/system/config")
            .then(res => res.json())
            .then(data => {
                if (data.showSmsCompressorLink !== undefined) {
                    setShowLink(data.showSmsCompressorLink);
                }
            })
            .catch(err => console.error(err));
    }, []);

    return (
        <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-6 mt-auto">
            <div className="container flex flex-col md:flex-row justify-between items-center px-4 gap-4">
                <div className="text-sm text-muted-foreground">
                    &copy; {new Date().getFullYear()} FinOps SMS Service. All rights reserved.
                </div>
                <div className="flex items-center gap-6 text-sm font-medium">
                    <Link
                        href="/dashboard/user-stories"
                        className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                    >
                        <BookOpen className="h-4 w-4" />
                        User Stories
                    </Link>
                    <Link
                        href="/benefits"
                        className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                    >
                        Calculator
                    </Link>
                    <a
                        href="/how-to.html"
                        target="_blank"
                        className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                    >
                        How to use
                    </a>
                    {showLink && (
                        <Link
                            href="/sms-compressor"
                            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                        >
                            Compressor
                        </Link>
                    )}
                    {isAdmin && (
                        <>
                            <Link href="/dashboard/admin/go-live" className="text-muted-foreground hover:text-primary transition-colors">
                                Gov Submission
                            </Link>
                            <Link href="/dashboard/technical" className="text-muted-foreground hover:text-primary transition-colors">
                                Technical
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </footer >
    );
}
