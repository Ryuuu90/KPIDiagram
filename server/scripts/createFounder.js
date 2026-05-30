/**
 * createFounder.js
 * ─────────────────────────────────────────────────────────────────────────────
 * One-time seed script to create the first "founder" user in MongoDB.
 *
 * USAGE:
 *   node scripts/createFounder.js <keycloak_sub_id> [username] [email]
 *
 * EXAMPLE:
 *   node scripts/createFounder.js daf9501e-bb3d-44a2-a25e-386275806b64 khalid khalid@company.com
 *
 * You can find the Keycloak sub (UUID) from:
 *   - The JWT token payload logged in the server console (field "sub")
 *   - Keycloak Admin Console → Users → click user → copy "ID"
 *
 * If the user already exists in MongoDB, their role will be updated to include "founder".
 * ─────────────────────────────────────────────────────────────────────────────
 */

"use strict";

const mongoose = require("mongoose");
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const Client = require("../models/Client");

const [, , keycloakId, username = "founder", email = null] = process.argv;

if (!keycloakId) {
  console.error("\n❌  Usage: node scripts/createFounder.js <keycloak_sub_id> [username] [email]\n");
  process.exit(1);
}

async function run() {
  const MONGODB_URL = process.env.MONGODB_URL;
  if (!MONGODB_URL) {
    console.error("❌  MONGODB_URL not set in .env");
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URL);
  console.log("✅  Connected to MongoDB");

  // Try to find existing user by keycloakId or username
  let user = await Client.findOne({ keycloakId });

  if (user) {
    // Update roles to include "founder"
    const roles = Array.from(new Set([...(user.roles || []), "founder"]));
    user.roles = roles;
    user.isActive = true;
    await user.save();
    console.log(`✅  Updated existing user "${user.username}" — roles: ${roles.join(", ")}`);
  } else {
    // Create fresh founder record
    user = await Client.create({
      keycloakId,
      username: username.toLowerCase().trim(),
      email: email || null,
      roles: ["founder"],
      isActive: true,
    });
    console.log(`✅  Created new founder user "${user.username}" with keycloakId: ${keycloakId}`);
  }

  console.log("\n📋  Founder document:");
  console.log(JSON.stringify(user.toObject(), null, 2));
  console.log("\n🎉  Done! The user can now log in and access the Founder Dashboard at /founder\n");

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("❌  Script failed:", err.message);
  process.exit(1);
});
