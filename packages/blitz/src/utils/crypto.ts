/** i32 * i32 */
const imul = Math.imul;

function cyrb53(str: string, seed = 0) {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = imul(h1 ^ ch, 0x85ebca6b);
    h2 = imul(h2 ^ ch, 0xc2b2ae35);
    h1 = (h1 << 13) | (h1 >>> 19);
    h2 = (h2 << 15) | (h2 >>> 17);
  }

  h1 = imul(h1 ^ (h1 >>> 16), 0x85ebca6b) ^ imul(h2 ^ (h2 >>> 13), 0xc2b2ae35);
  h2 = imul(h2 ^ (h2 >>> 16), 0x85ebca6b) ^ imul(h1 ^ (h1 >>> 13), 0xc2b2ae35);

  return [h1 >>> 0, h2 >>> 0];
}

function toBase64(array: Uint8Array) {
  const string = String.fromCharCode.apply(null, Array.from(array));
  return btoa(string);
}

export function hashRef(message: string) {
  const [x, y] = cyrb53(message);
  const buffer = new ArrayBuffer(8);
  {
    const dataview = new DataView(buffer);
    dataview.setUint32(0, x);
    dataview.setUint32(4, y);
  }
  return toBase64(new Uint8Array(buffer)).slice(0, 7);
}
