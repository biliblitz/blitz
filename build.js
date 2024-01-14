import esbuild from "esbuild";
import glob from "tiny-glob";

const watch = process.argv.includes("--watch");

const entryPoints = [
  ...(await glob("src/**/*.ts")),
  ...(await glob("src/**/*.tsx")),
];

/** @type {import("esbuild").BuildOptions} */
const esmOptions = {
  entryPoints,
  format: "esm",
  outdir: "dist/esm",
  platform: "node",
  outExtension: { ".js": ".mjs" },
  bundle: true,
  plugins: [
    {
      name: "add-mjs",
      setup(build) {
        build.onResolve({ filter: /.*/ }, (args) => {
          if (args.importer) {
            if (args.path.endsWith(".ts"))
              return { path: args.path.slice(0, -3) + ".mjs", external: true };
            if (args.path.endsWith(".tsx"))
              return { path: args.path.slice(0, -4) + ".mjs", external: true };
            return { external: true };
          }
        });
      },
    },
  ],
};

/** @type {import("esbuild").BuildOptions} */
const cjsOptions = {
  entryPoints,
  format: "cjs",
  outdir: "dist/cjs",
  platform: "node",
  outExtension: { ".js": ".cjs" },
  bundle: true,
  plugins: [
    {
      name: "add-mjs",
      setup(build) {
        build.onResolve({ filter: /.*/ }, (args) => {
          if (args.importer) {
            if (args.path.endsWith(".ts"))
              return { path: args.path.slice(0, -3), external: true };
            if (args.path.endsWith(".tsx"))
              return { path: args.path.slice(0, -4), external: true };
            return { external: true };
          }
        });
      },
    },
  ],
};

if (watch) {
  await esbuild.context(esmOptions).then((ctx) => ctx.watch());
} else {
  await Promise.all([
    esbuild.build({ ...esmOptions, minify: true }),
    esbuild.build({ ...cjsOptions, minify: true }),
  ]);
}
