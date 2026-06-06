import { DatasetEditor } from "@/components/admin/dataset-editor";
import { auth } from "@/lib/auth";
import { isSiteAdmin } from "@/lib/auth/admin";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminDatasetsPage() {
  const session = await auth();

  if (!isSiteAdmin(session?.user?.email)) {
    notFound();
  }

  return (
    <main id="main-content" className="page-main section-stack max-w-5xl">
      <header className="section-block space-y-3">
        <p className="eyebrow">Admin</p>
        <h1 className="section-heading">Eurovision year datasets</h1>
        <p className="max-w-2xl text-sm text-muted">
          Sync Grand Final countries from the EurovisionAPI dataset, edit manually, and publish to
          the party import catalog. Changes persist on the server without rebuilding Docker.
        </p>
        <p className="text-sm text-muted">
          <Link href="/" className="text-foreground underline-offset-4 hover:underline">
            Back to home
          </Link>
        </p>
      </header>

      <DatasetEditor />
    </main>
  );
}
