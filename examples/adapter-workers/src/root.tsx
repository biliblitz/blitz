import { BlitzCityProvider, RouterHead, RouterOutlet } from "@biliblitz/blitz";

/**
 * Main entry of the whole application.
 */
export default function Root() {
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
