import { getLatestUpdates } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { TopNav } from "./TopNav";
import { RightSidebar } from "./RightSidebar";
import { LeftSidebar } from "./LeftSidebar";
import { Footer } from "./Footer";

/**
 * Shared application chrome used by every route: sticky top nav, the
 * right (primary nav) and left (latest + genres) sidebars, and the footer.
 * Reading the session cookie here also opts the app into dynamic rendering,
 * which is what we want now that content is user-generated.
 */
export async function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarUpdates, user] = await Promise.all([
    getLatestUpdates(6),
    getCurrentUser(),
  ]);
  const admin = await isAdmin(user);

  return (
    <div className="flex min-h-screen flex-col">
      <TopNav user={user} isAdmin={admin} />

      <div className="mx-auto flex w-full max-w-[1600px] flex-1 items-start">
        <RightSidebar />

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>

        <LeftSidebar updates={sidebarUpdates} />
      </div>

      <Footer />
    </div>
  );
}
