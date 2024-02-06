import { BlitzCityProvider, RouterHead, RouterOutlet } from "@biliblitz/blitz";

/**
 * Attention Developer:
 *
 * Please refrain from importing any additional dependencies in this file,
 * except for the built-in import from "blitz".
 * Also, avoid creating or exporting any global Context for use in other files.
 * Modifying the dependencies or exporting a global Context may lead to unexpected
 * behavior and dependency conflicts.
 * Please ensure that this file remains self-contained and independent to maintain
 * code integrity and modularity.
 */
export default function () {
  return (
    <BlitzCityProvider lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <RouterHead />
      </head>
      <body>
        <RouterOutlet />
      </body>
    </BlitzCityProvider>
  );
}
