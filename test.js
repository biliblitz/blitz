import { init, parse } from "es-module-lexer";
await init;
const [imports, exports] = parse(`
export const 🤡 = action$(() => {});
`);
console.log(imports, exports);
