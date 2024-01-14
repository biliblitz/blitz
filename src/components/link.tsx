import { JSX } from "preact";

interface LinkProps extends JSX.HTMLAttributes<HTMLAnchorElement> {
  href: string;
}

export function Link(props: LinkProps) {
  return <a {...props} />;
}
