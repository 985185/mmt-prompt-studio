import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Prompt Studio — MarkMyPrompt",
  description: "Test and iterate on prompts before integrating with MarkMyPrompt.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-mmp-bg text-gray-900 font-sans">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 min-h-screen overflow-hidden">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
