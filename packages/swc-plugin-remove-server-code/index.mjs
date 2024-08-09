import { fileURLToPath } from "node:url";
export const wasm = fileURLToPath(
  new URL("./remove_server_code.wasm", import.meta.url),
);
export default function (options) {
  return [wasm, options || {}];
}
