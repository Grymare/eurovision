import { LegacyImportEditor } from "@/components/admin/legacy-import-editor";
import { auth } from "@/lib/auth";
import { isSiteAdmin } from "@/lib/auth/admin";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminLegacyImportPage() {
  const session = await auth();

  if (!isSiteAdmin(session?.user?.email)) {
    notFound();
  }

  return (
    <main id="main-content" className="page-main section-stack max-w-5xl">
      <header className="section-block space-y-3">
        <p className="eyebrow">Admin</p>
        <h1 className="section-heading">Legacy party import</h1>
        <p className="max-w-2xl text-sm text-muted">
          Import finished Eurovision nights from spreadsheet matrices. Jurors start unclaimed so
          users can attach them after sign-up.
        </p>
        <p className="text-sm text-muted">
          <Link href="/admin/datasets" className="text-foreground underline-offset-4 hover:underline">
            Year datasets
          </Link>
          {" · "}
          <Link href="/" className="text-foreground underline-offset-4 hover:underline">
            Back to home
          </Link>
        </p>
      </header>

      <LegacyImportEditor />
    </main>
  );
}
