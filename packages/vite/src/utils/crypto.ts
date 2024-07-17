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

export function hashRef(message: string) {
  const [x, y] = cyrb53(message);
  const buffer = new ArrayBuffer(8);
  {
    const dataview = new DataView(buffer);
    dataview.setInt32(0, x);
    dataview.setInt32(1, y);
  }
  return toBase64(new Uint8Array(buffer)).slice(0, 7);
}

const imul = Math.imul;

// copy from https://stackoverflow.com/a/52171480/8873690
export function cyrb53(str: string, seed = 0) {
  let h1 = 0xdeadbeef ^ seed,
    h2 = 0x41c6ce57 ^ seed;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = imul(h1 ^ ch, 2654435761);
    h2 = imul(h2 ^ ch, 1597334677);
  }
  h1 = imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= imul(h1 ^ (h1 >>> 13), 3266489909);
  return [h1 >>> 0, h2 >>> 0];
}
