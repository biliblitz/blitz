import { Outlet } from "@biliblitz/blitz";

export default function Layout() {
  return (
    <div class="box">
      <div>/layout.tsx</div>
      <Outlet />
    </div>
  );
}
