export function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  if (!headers.has("X-Requested-By")) {
    headers.set("X-Requested-By", "AlgoHaven");
  }
  return fetch(input, { ...init, headers });
}
