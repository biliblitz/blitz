<template>
  <div class="box yellow">
    <div>/about/index.tsx</div>
    <div>This is about page. <router-link to="/">Go Back</router-link></div>
    <div>Random = {{ random }}</div>
  </div>
</template>

<style scoped>
.yellow {
  border-color: yellow;
}
</style>

<script lang="ts">
import { loader$ } from "@biliblitz/blitz/server";

export const useRandom = loader$(() => {
  return Math.random();
});
</script>

<script setup lang="ts">
const random = useRandom();
</script>
