<script lang="ts">
import { paths$ } from "@biliblitz/blitz/server";

export const paths = paths$(() => {
  return ["alice/public", "alice/private", "bob/public", "bob/private"];
});

export default {};
</script>

<template>
  <router-view />
</template>
