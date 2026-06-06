import { syncGrandFinalYear } from "@/lib/eurovision/sync/sync-grand-final";

const year = Number(process.argv[2] ?? 2025);

syncGrandFinalYear(year)
  .then((result) => {
    console.log(
      JSON.stringify(
        {
          year: result.year,
          count: result.entries.length,
          unmapped: result.unmapped,
          names: result.entries.map((entry) => entry.name),
        },
        null,
        2,
      ),
    );
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
