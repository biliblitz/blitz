export declare interface PluginOptions {
  /** loader & action hash salt */
  salt?: string;
}
/** file path of the wasm file */
export declare const wasm: string;
/** A SWC plugin for removing named exports and related imports from a module. */
export default function func(
  options?: PluginOptions | undefined,
): [string, PluginOptions];
