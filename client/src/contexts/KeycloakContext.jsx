import { createContext, useContext, useState, useEffect } from "react";

const KeycloakContext = createContext(null);

/**
 * Wrap your app with this provider AFTER keycloak has been successfully
 * initialised and authenticated.
 */
export function KeycloakProvider({ children, keycloak }) {
  const [token, setToken] = useState(keycloak.token);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    // Parse user info from the JWT payload
    if (keycloak.tokenParsed) {
      setUserInfo({
        sub: keycloak.tokenParsed.sub,
        username: keycloak.tokenParsed.preferred_username,
        email: keycloak.tokenParsed.email,
        firstName: keycloak.tokenParsed.given_name,
        lastName: keycloak.tokenParsed.family_name,
        roles: keycloak.tokenParsed.realm_access?.roles || [],
      });
    }

    // Keep the token state in sync whenever Keycloak silently refreshes it
    keycloak.onTokenRefreshed = () => {
      setToken(keycloak.token);
    };

    return () => {
      keycloak.onTokenRefreshed = undefined;
    };
  }, [keycloak]);

  const logout = () =>
    keycloak.logout({ redirectUri: window.location.origin });

  return (
    <KeycloakContext.Provider value={{ keycloak, token, userInfo, logout }}>
      {children}
    </KeycloakContext.Provider>
  );
}

/**
 * Hook for consuming Keycloak context inside any component.
 * @returns {{ keycloak, token, userInfo, logout }}
 */
export function useKeycloak() {
  const ctx = useContext(KeycloakContext);
  if (!ctx) {
    throw new Error("useKeycloak must be used inside <KeycloakProvider>");
  }
  return ctx;
}

export default KeycloakContext;
