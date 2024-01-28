import { createServer } from "@biliblitz/blitz/server";
import { manifest } from "blitz:manifest/server";
import { render } from "preact-render-to-string";
import Root from "./root.tsx";

export default createServer(<Root />, { manifest, render });
