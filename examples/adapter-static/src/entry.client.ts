import { hydrate } from "@biliblitz/blitz";
import { manifest } from "blitz:manifest/client";

import Root from "./Root.vue";

hydrate(Root, { manifest });
