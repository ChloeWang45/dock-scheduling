import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { db } from "./index";
import { users, berths, vessels } from "./schema";

async function seedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "wangyuesu13572@gmail.com";
  const password = randomBytes(9).toString("base64url");
  const passwordHash = await bcrypt.hash(password, 12);

  await db
    .insert(users)
    .values({
      name: "Admin",
      firstName: "Admin",
      email,
      passwordHash,
      role: "admin",
      status: "approved",
    })
    .onConflictDoUpdate({
      target: users.email,
      set: { passwordHash, role: "admin", status: "approved" },
    });

  console.log("\nSeeded admin user:");
  console.log(`  email:    ${email}`);
  console.log(`  password: ${password}`);
  console.log("(store this now — it will not be shown again)\n");
}

async function seedBerths() {
  const rows = [
    { name: "North Pier West", lengthFt: 410 },
    { name: "North Pier East", lengthFt: 240 },
    { name: "North Pier Face", lengthFt: 75 },
    { name: "South Float West", lengthFt: 90 },
    { name: "South Float East", lengthFt: 90 },
    { name: "Inner Channel", lengthFt: 55 },
    // Source spreadsheet never specified dimensions for these group labels.
    { name: "North Finger Piers", lengthFt: null },
    { name: "Small craft slips (institution boats)", lengthFt: null },
  ];

  for (const row of rows) {
    await db.insert(berths).values(row).onConflictDoNothing();
  }
  console.log(`Seeded ${rows.length} berths.`);
}

async function seedVessels() {
  const rows = [
    {
      name: "R/V Blue Heron",
      type: "R/V" as const,
      loaFt: 86,
      beamFt: 23,
      draftFt: 12,
    },
    {
      name: "R/V Hugh R. Sharp",
      type: "R/V" as const,
      loaFt: 150,
      beamFt: 32,
      draftFt: 9.5,
    },
    {
      name: "R/V Sikuliaq",
      type: "R/V" as const,
      loaFt: 261,
      beamFt: 52,
      draftFt: 18.75,
    },
    {
      name: "R/V Atlantis",
      type: "R/V" as const,
      loaFt: 274,
      beamFt: 52.5,
      draftFt: 19,
    },
  ];

  for (const row of rows) {
    await db.insert(vessels).values(row).onConflictDoNothing();
  }
  console.log(`Seeded ${rows.length} vessels.`);
}

async function main() {
  await seedAdmin();
  await seedBerths();
  await seedVessels();
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
