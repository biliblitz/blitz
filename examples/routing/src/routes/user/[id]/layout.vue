<script lang="ts">
import { paths$ } from "@biliblitz/blitz/server";

export const paths = paths$(() => {
  return ["alice", "bob"];
});

export default {};
</script>

<template>
  <router-view />
</template>
