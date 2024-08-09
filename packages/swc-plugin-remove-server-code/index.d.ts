export interface PluginOptions {}
/** file path of the wasm file */
export declare const wasm: string;
/** A SWC plugin for removing named exports and related imports from a module. */
declare function func(
  options?: PluginOptions | undefined,
): [string, PluginOptions];
export default func;
