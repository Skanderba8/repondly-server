import Providers from "@/components/Providers";
import AdminSidebar from "@/components/AdminSidebar";
import { auth } from "@/lib/auth";

export const metadata = {
  title: "Repondly Admin",
  description: "Internal admin dashboard for Repondly",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch the current session
  const session = await auth();

  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="flex h-screen overflow-hidden bg-gray-100">
            {/* Pass the session user to the sidebar. Using 'as any' temporarily to bypass strict type checking if the session type isn't perfectly mapped */}
            <AdminSidebar adminUser={session?.user as any} />
            <main className="flex-1 overflow-y-auto p-8">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}