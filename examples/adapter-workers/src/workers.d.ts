declare module "__STATIC_CONTENT_MANIFEST" {
  declare const x: string;
  export default x;
}

interface Env {
  __STATIC_CONTENT: KVNamespace<string>;
}
