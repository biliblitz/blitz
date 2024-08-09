import server from "./entry.server.ts";

import { getAssetFromKV } from "@cloudflare/kv-asset-handler";
import manifestJSON from "__STATIC_CONTENT_MANIFEST";
const assetManifest = JSON.parse(manifestJSON);

export default {
  async fetch(req, env, ctx) {
    try {
      return await getAssetFromKV(
        { request: req.clone(), waitUntil: ctx.waitUntil.bind(ctx) },
        {
          ASSET_NAMESPACE: env.__STATIC_CONTENT,
          ASSET_MANIFEST: assetManifest,
        },
      );
    } catch {
      return await server.fetch(req, env, ctx);
    }
  },
} satisfies ExportedHandler<Env>;
