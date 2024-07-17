import type { MetaFunction } from "./meta.ts";
import type { Action } from "./action.ts";
import type { Loader } from "./loader.ts";
import type { Middleware } from "./middleware.ts";
import type { ComponentType } from "preact";

export type Graph = {
  assets: string[];
  entry: number[];
  components: number[][];
};

export interface ClientManifest {
  components: (ComponentType | null)[];
}

export interface ServerManifest extends ClientManifest {
  base: string;
  graph: Graph;
  metas: (MetaFunction | null)[];
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
