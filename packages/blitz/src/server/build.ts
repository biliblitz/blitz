import { ComponentType } from "preact";
import { MetaFunction } from "./meta.ts";
import { Action } from "./action.ts";
import { Loader } from "./loader.ts";
import { StaticFunction } from "./static.ts";
import { Middleware } from "./middleware.ts";

export type Graph = {
  assets: string[];
  entry: number[];
  components: number[][];
};

export interface ClientManifest {
  components: ComponentType[];
}

export interface ServerManifest extends ClientManifest {
  base: string;
  graph: Graph;
  metas: (MetaFunction | null)[];
  actions: Action[][];
  loaders: Loader[][];
  statics: StaticFunction[];
  directory: Directory;
  middlewares: Middleware[];
}

export type Route = {
  index: number | null;
  error: number | null;
  layout: number | null;
  static: number | null;
  middleware: number | null;
};

export type Directory = {
  route: Route;
  children: [string, Directory][];
};
