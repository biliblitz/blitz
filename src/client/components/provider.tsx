import { JSX } from "preact";

interface ProviderProps extends JSX.HTMLAttributes<HTMLHtmlElement> {}

export function BlitzCityProvider(props: ProviderProps) {
  const { children, ...remains } = props;

  return <html {...remains}>{children}</html>;
}
