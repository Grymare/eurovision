import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { auth } from "@/lib/auth";

export async function SiteHeader() {
  const session = await auth();

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link href="/" className="site-logo">
          Grymare Eurovision
        </Link>
        <nav aria-label="Main" className="site-nav">
          {session?.user ?
            <>
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
