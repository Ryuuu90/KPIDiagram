const KEYCLOAK_URL = process.env.KEYCLOAK_URL || "http://localhost:8080";
const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM || "nhancit";

/**
 * Obtains a service-account token for the finanzia-backend client.
 * Requires: Client Authentication ON + Service Accounts Enabled in Keycloak,
 * with the 'manage-users' role from the realm-management client assigned to the service account.
 */
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
    console.error("Failed to get Keycloak admin token:", err);
    throw new Error(
      `Keycloak Admin Token error (${response.status}): ${err}. ` +
      "Make sure 'finanzia-backend' client has Client Authentication + Service Accounts enabled " +
      "and the service account has the 'manage-users' role from realm-management."
    );
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Creates a user in Keycloak and optionally assigns realm roles.
 * Returns the new user's Keycloak UUID.
 */
async function createKeycloakUser(userData) {
  const token = await getAdminToken();
  const url = `${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/users`;

  const payload = {
    username: userData.username,
    email: userData.email || `${userData.username}@placeholder.com`,
    firstName: userData.firstName || userData.username,
    lastName: userData.lastName || userData.username,
    emailVerified: true,
    enabled: userData.isActive !== false,
    credentials: [
      {
        type: "password",
        value: userData.password || "Welcome123!",
        temporary: false,
      },
    ],
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok && response.status !== 409) {
    const err = await response.text();
    console.error("Failed to create user in Keycloak:", err);
    throw new Error(`Keycloak User Creation error (${response.status}): ${err}`);
  }

  // Fetch the newly created user's ID
  const searchRes = await fetch(
    `${url}?username=${encodeURIComponent(userData.username)}&exact=true`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const users = await searchRes.json();
  if (!users || users.length === 0) {
    throw new Error("Could not find user in Keycloak after creation.");
  }
  const userId = users[0].id;

  // Assign realm roles
  if (userData.roles && userData.roles.length > 0) {
    for (const roleName of userData.roles) {
      const roleRes = await fetch(
        `${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/roles/${roleName}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (roleRes.ok) {
        const roleData = await roleRes.json();
        await fetch(`${url}/${userId}/role-mappings/realm`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify([roleData]),
        });
      } else {
        console.warn(`Role '${roleName}' not found in Keycloak – skipping.`);
      }
    }
  }

  return userId;
}

/**
 * Deletes a user from Keycloak by their UUID.
 */
async function deleteKeycloakUser(keycloakId) {
  if (!keycloakId || keycloakId.startsWith("temp_")) return;

  try {
    const token = await getAdminToken();
    const url = `${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/users/${keycloakId}`;

    const response = await fetch(url, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok && response.status !== 404) {
      console.error(
        `Failed to delete user ${keycloakId} from Keycloak:`,
        await response.text()
      );
    }
  } catch (err) {
    console.error("Keycloak deletion error:", err.message);
  }
}

/**
 * Looks up a Keycloak user by their UUID.
 * Returns the user object or null if not found.
 */
async function getUserByKeycloakId(keycloakId) {
  try {
    const token = await getAdminToken();
    const res = await fetch(
      `${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/users/${keycloakId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("Error fetching Keycloak user:", err.message);
    return null;
  }
}

module.exports = {
  createKeycloakUser,
  deleteKeycloakUser,
  getUserByKeycloakId,
};
