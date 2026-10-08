import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import Shell from "@/components/Layout";

const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin"], weight: ["400", "600", "700", "800", "900"] });

export const metadata: Metadata = {
  title: "Duolingo Clone",
  description: "Learn Spanish for free",
};

// Applies the saved theme (system / light / dark) and animation setting before the page paints
const themeScript = `try{var t=localStorage.getItem("theme"),c=document.documentElement.classList;
if(t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches))c.add("dark");
if(localStorage.getItem("pref_animations")==="off")c.add("no-anim")}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${nunito.variable} font-sans antialiased`}>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
