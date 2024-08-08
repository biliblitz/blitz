import { createServer } from "@biliblitz/blitz/server";
import { manifest } from "blitz:manifest/server";
import Root from "./root.vue";

export default createServer(Root, { manifest });
