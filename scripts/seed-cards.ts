import { createClient } from "@supabase/supabase-js";
import { CARDS } from "../src/data/cards";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key);

async function main() {
  console.log(`Seeding ${CARDS.length} cards...`);

  const { error } = await supabase
    .from("cards")
    .upsert(CARDS, { onConflict: "id" });

  if (error) {
    console.error("Seed failed:", error.message);
    process.exit(1);
  }

  console.log("Done! 78 cards seeded.");
}

main();
