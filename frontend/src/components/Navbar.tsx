"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

export default function Navbar() {
    const { isAuthenticated, logout } = useAuth();

    return (
        <nav className="fixed top-0 w-full z-50 glass-strong border-b border-border">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 group">
                    <Logo width={32} height={32} />
                    <span className="font-display font-bold text-xl tracking-wider text-foreground">GANDARVA</span>
                </Link>

                <div className="flex items-center gap-4 text-sm font-medium">
                    {isAuthenticated ? (
                        <>
                            <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                                Dashboard
                            </Link>
                            <Link href="/library" className="text-muted-foreground hover:text-foreground transition-colors">
                                Library
                            </Link>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={logout}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Logout
                            </Button>
                        </>
                    ) : (
                        <>
                            <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">
                                Login
                            </Link>
                            <Link href="/register">
                                <Button variant="hero" size="sm" className="font-bold rounded-full px-6">
                                    Get Started
                                </Button>
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
