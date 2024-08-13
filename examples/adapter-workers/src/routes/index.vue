<template>
  <div>hello cloudflare worker = {{ names }}</div>
</template>

<script lang="ts">
import { loader$ } from "@biliblitz/blitz/server";
import { computed } from "vue";

export const useRandom = loader$(async (c) => {
  const kv = await c.env.__STATIC_CONTENT.list();
  return kv.keys.map((x) => x.name);
});
</script>

<script setup lang="ts">
const random = useRandom();

const names = computed(() => random.value.join(", "));
</script>
