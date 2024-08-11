import type { RouteRecord } from "vue-router";
import type { Action } from "./action.ts";
import type { Loader } from "./loader.ts";
import type { Middleware } from "./middleware.ts";
import type { PathsFunction } from "./paths.ts";

export type Graph = {
  entry: string;
  styles: string[];
};

export interface ClientManifest {
  base: string;
  routes: RouteRecord[];
}

export interface ServerManifest extends ClientManifest {
  entry: string;
  paths: (PathsFunction | null)[];
  styles: string[];
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
