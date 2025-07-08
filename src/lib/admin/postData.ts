// shared helper for POST requests
export async function postData(url: string, payload: unknown) {
  const res = await fetch(url, {
    method: "POST",
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" }
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed");
  }
  return res.json();
}
