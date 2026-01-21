import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "LiveBreach",
    description: "Security Learning Tool",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ja">
            <body className="antialiased text-slate-100 bg-slate-900">
                {children}
            </body>
        </html>
    );
}
