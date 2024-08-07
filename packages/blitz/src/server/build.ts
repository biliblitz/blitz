import type { RouteRecord } from "vue-router";
import type { Action } from "./action.ts";
import type { Loader } from "./loader.ts";
import type { Middleware } from "./middleware.ts";

export type Graph = {
  entry: number[];
  assets: string[];
  components: number[][];
};

export interface ClientManifest {
  routes: RouteRecord[];
}

export interface ServerManifest extends ClientManifest {
  base: string;
  entry: string;
  actions: Action[][];
  loaders: Loader[][];
  directory: Directory;
  middlewares: (Middleware | null)[];
}

export type Route = {
  index: number | null;
  layout: number | null;
};

export type Directory = {
  route: Route;
  children: [string, Directory][];
};
