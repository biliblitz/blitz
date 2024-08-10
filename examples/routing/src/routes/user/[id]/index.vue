<template>
  <div class="box">
    <div>/user/[id]/index.vue</div>
    <div class="loader">{{ random }}</div>
    <div>$route.params.id = {{ id }}</div>
  </div>
</template>

<script lang="ts">
import { loader$ } from "@biliblitz/blitz/server";

export const useRandom = loader$((c) => {
  const id = c.req.param("id");
  return `User (${id}) - ${Math.random()}`;
});
</script>

<script setup lang="ts">
import { useRoute } from "vue-router";
import { computed } from "vue";

const random = useRandom();
const route = useRoute();

const id = computed(() => route.params.id);
</script>
