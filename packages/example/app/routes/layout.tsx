import { layout$ } from "@biliblitz/blitz";

import "./bbb.css";

export default layout$((props) => {
  return <div>layout [ {props.children} ]</div>;
});
