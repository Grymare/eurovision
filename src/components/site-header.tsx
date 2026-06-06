import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { auth } from "@/lib/auth";
import { isSiteAdmin } from "@/lib/auth/admin";

export async function SiteHeader() {
  const session = await auth();
  const isAdmin = isSiteAdmin(session?.user?.email);

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link href="/" className="site-logo">
          Grymare Eurovision
        </Link>
        <nav aria-label="Main" className="site-nav">
          {session?.user ?
            <>
              {isAdmin ?
                <>
                  <Link href="/admin/datasets" className="nav-link">
                    Datasets
                  </Link>
                  <Link href="/admin/legacy-import" className="nav-link">
                    Import
                  </Link>
                </>
              : null}
              <Link href="/history" className="nav-link">
                History
              </Link>
              <Link href="/stats" className="nav-link">
                Stats
              </Link>
              <span className="hidden text-[0.62rem] uppercase tracking-[0.18em] text-muted sm:inline">
                {session.user.name ?? session.user.email}
              </span>
              <SignOutButton />
            </>
          : <>
              <Link href="/auth/login" className="nav-link">
                Sign in
              </Link>
              <Link href="/auth/register" className="nav-link">
                Register
              </Link>
            </>
          }
        </nav>
      </div>
    </header>
  );
}
