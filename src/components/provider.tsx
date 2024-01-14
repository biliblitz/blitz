import { JSX } from "preact";

interface ProviderProps extends JSX.HTMLAttributes<HTMLHtmlElement> {}

export function BlitzCityProvider(props: ProviderProps) {
  return <html {...props} />;
}
