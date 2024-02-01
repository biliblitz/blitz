export async function sha256(message: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return new Uint8Array(digest);
}

export function toBase64(array: Uint8Array) {
  const string = String.fromCharCode.apply(null, Array.from(array));
  return btoa(string);
}

export async function hashRef(message: string) {
  return toBase64(await sha256(message)).slice(0, 7);
}
