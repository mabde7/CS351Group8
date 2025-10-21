import { useAuth0 } from "@auth0/auth0-react";

export function useApi(baseUrl = "http://localhost:5000") {
  const { getAccessTokenSilently } = useAuth0();

  return async (path, options = {}) => {
    const token = await getAccessTokenSilently();
    const res = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  };
}
