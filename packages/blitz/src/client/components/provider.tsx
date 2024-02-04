import { JSX } from "preact";
import { useHistoryRestore } from "../history.ts";

interface ProviderProps extends JSX.HTMLAttributes<HTMLHtmlElement> {}

export function BlitzCityProvider(props: ProviderProps) {
  const { children, ...remains } = props;

  useHistoryRestore();

  return <html {...remains}>{children}</html>;
}
