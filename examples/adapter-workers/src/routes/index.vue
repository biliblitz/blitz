<template>
  <div>hello cloudflare worker = {{ random }}</div>
</template>

<script lang="ts">
import { loader$ } from "@biliblitz/blitz/server";

export const useRandom = loader$(async () => {
  return Math.random();
});
</script>

<script setup lang="ts">
const random = useRandom();
</script>
