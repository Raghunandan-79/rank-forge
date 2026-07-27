"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "../auth/auth-context";
import { Button } from "../ui/button";
import { LogOut, User as UserIcon, Code2 } from "lucide-react";

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const isLinkActive = (path: string) => {
    return pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6 md:gap-8">
          <Link href="/contests" className="flex items-center gap-2 font-bold text-lg tracking-wide text-foreground hover:opacity-90">
            <Image
              src="/rank-forge-logo.png"
              alt="RankForge"
              width={28}
              height={28}
              className="rounded"
            />
            <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent font-extrabold">
              RankForge
            </span>
          </Link>

          <nav className="flex items-center gap-4 text-sm font-medium">
            <Link
              href="/contests"
              className={`transition-colors hover:text-foreground/80 ${
                isLinkActive("/contests") ? "text-foreground font-semibold border-b-2 border-primary py-4 -mb-[18px]" : "text-muted-foreground"
              }`}
            >
              Contests
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-sm font-semibold text-foreground">{user.username}</span>
                {user.role && (
                  <span className="text-xs text-muted-foreground capitalize">
                    {user.role.toLowerCase().replace("_", " ")}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 border-l border-border pl-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground"
                  title="Logout"
                  onClick={logout}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button variant="default" size="sm">
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
