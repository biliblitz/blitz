<template>
  <div>hello world</div>
  <div>random = {{ random }}</div>
</template>

<script lang="ts">
import { loader$ } from "@biliblitz/blitz/server";
export const useRandom = loader$(() => {
  return Math.random();
});
</script>

<script setup lang="ts">
const random = useRandom();
</script>
