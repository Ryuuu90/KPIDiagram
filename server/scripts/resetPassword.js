require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const KEYCLOAK_URL = process.env.KEYCLOAK_URL || "http://localhost:8080";
const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM || "nhancit";

async function getAdminToken() {
  if (!process.env.KEYCLOAK_BACKEND_SECRET) {
    throw new Error("KEYCLOAK_BACKEND_SECRET is not set in .env");
  }

  const params = new URLSearchParams();
  params.append("grant_type", "client_credentials");
  params.append("client_id", "finanzia-backend");
  params.append("client_secret", process.env.KEYCLOAK_BACKEND_SECRET);

  const response = await fetch(
    `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Keycloak Admin Token error: ${err}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function resetPassword(userId, newPassword) {
  const token = await getAdminToken();
  const url = `${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/users/${userId}/reset-password`;

  const payload = {
    type: "password",
    value: newPassword,
    temporary: false,
  };

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Failed to reset password: ${err}`);
  }

  console.log(`✅ Password reset successfully for user ID: ${userId}`);
  console.log(`🔑 New Password: ${newPassword}`);
}

const [, , userId, newPassword = "Welcome123!"] = process.argv;

if (!userId) {
  console.error("Usage: node scripts/resetPassword.js <keycloak_user_id> [new_password]");
  process.exit(1);
}

resetPassword(userId, newPassword).catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
