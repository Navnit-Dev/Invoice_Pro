import { Inter } from "next/font/google";
import "./globals.css";
import ThemeProvider from "./ThemeProvider";
import SessionProvider from "./SessionProvider";
import { Toaster } from "react-hot-toast";
import { getServerSession } from "next-auth";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "Invoice Generator - Billing Software",
  description: "Professional invoice generation and billing management SaaS",
  manifest: "/manifest.json",
};

export default async function RootLayout({ children }) {
  const session = await getServerSession();
  
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <SessionProvider session={session}>
          <ThemeProvider>
            {children}
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  borderRadius: '10px',
                },
              }}
            />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
