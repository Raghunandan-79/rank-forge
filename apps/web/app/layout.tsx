import "@repo/ui/styles.css";
import "./globals.css";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { AuthProvider } from "../components/auth/auth-context";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "RankForge | Competitive Programming & Coding Contests",
  description: "Join competitive programming coding contests on RankForge, submit solutions in C, C++, Java, Python, or JavaScript, and track your live standings real-time.",
  keywords: "competitive programming, coding contest, leetcode, codeforces, rankforge, algorithm, data structures",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${GeistSans.className} antialiased min-h-screen flex flex-col bg-background text-foreground`}>
        <AuthProvider>
          {children}
          <Toaster richColors position="top-right" theme="dark" />
        </AuthProvider>
      </body>
    </html>
  );
}
