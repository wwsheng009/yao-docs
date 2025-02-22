<script setup lang="ts">
import { computed, onErrorCaptured, ref } from 'vue';

const props = defineProps<{ pkg: string; path: string }>();

const demoPath = computed(
  () => props.pkg && (props.path ? `/${props.pkg}/${props.path}` : '')
);
const error = ref({});

onErrorCaptured((err) => {
  error.value = err;
});

const GITHUB_BLOB_URL = 'https://github.com/wwsheng009/yao-docs/tree/main/docs';
const URL = `${GITHUB_BLOB_URL}${demoPath.value}`;
</script>

<template>
  <div :key="demoPath" class="demo wide">
    <p v-if="demoPath" class="demo-source-link">
      <a :href="URL" target="_blank">source</a>
    </p>
    <ClientOnly>
      <Suspense>
        <slot></slot>
        <template #fallback> Loading demo... </template>
      </Suspense>
    </ClientOnly>
    <div v-if="error" class="error">
      {{ error }}
    </div>
  </div>
</template>
