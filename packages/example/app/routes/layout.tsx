import { layout$ } from "@biliblitz/blitz";

import "./test.css";

export default layout$((props) => {
  return <div>layout [ {props.children} ]</div>;
});
