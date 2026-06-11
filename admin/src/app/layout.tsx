import Providers from "@/components/Providers";
import AdminSidebar from "@/components/AdminSidebar";
import { auth } from "@/lib/auth";
// @ts-ignore: CSS module type declarations are unavailable in this environment
import "./globals.css";

export const metadata = {
  title: "Répondly Admin",
  description: "Admin dashboard for Répondly",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="en">
      <body>
        <Providers>
          {session?.user ? (
            <div className="flex h-screen overflow-hidden bg-gray-100">
              <AdminSidebar adminUser={session.user as any} />
              <main className="flex-1 overflow-y-auto p-8">
                {children}
              </main>
            </div>
          ) : (
            children
          )}
        </Providers>
      </body>
    </html>
  );
}
