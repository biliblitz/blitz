<template>
  <div class="box">
    <div>/post/[[id]]/index.vue</div>
    <div class="loader">{{ random }}</div>
    <div>$route.params.id = {{ id }}</div>
  </div>
</template>

<script lang="ts">
import { loader$ } from "@biliblitz/blitz/server";

export const useRandom = loader$((c) => {
  const id = c.req.param("id");
  return `Post (${id}) - ${Math.random()}`;
});
</script>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";

const random = useRandom();
const route = useRoute();

const id = computed(() => route.params.id);
</script>
