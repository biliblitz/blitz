import { hydrate } from "@biliblitz/blitz";
import { manifest } from "blitz:manifest/client";
import Root from "./root.vue";

hydrate(Root, { manifest });
