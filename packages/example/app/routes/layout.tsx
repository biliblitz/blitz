import { Outlet } from "@biliblitz/blitz";

import "./bbb.css";

export default function () {
  return (
    <div>
      <h1>/layout</h1>
      <Outlet />
    </div>
  );
}
