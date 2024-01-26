import { AnyComponent } from "preact";
import { Directory } from "../build/scanner.ts";
import { Action } from "../server/action.ts";
import { Loader } from "../server/loader.ts";
import { Middleware } from "../server/middleware.ts";

export interface ClientManifest {
  components: AnyComponent[];
  preloadComponents(ids: number[]): Promise<void>;
}

export interface ServerManifest extends ClientManifest {
  actions: Action[][];
  loaders: Loader[][];
  middlewares: Middleware[];
  directory: Directory;
}
