<script setup>
import { withBase } from "vitepress";
import { onMounted, ref } from "vue";
import mediumZoom from "medium-zoom";
defineProps({
  src: String,
});
const imgRef = ref(null);
onMounted(() => {
  mediumZoom(imgRef.value, { background: "var(--vp-c-bg)" });
});
</script>

<template>
  <img class="zoomImage" ref="imgRef" :src="withBase(src)" />
</template>

<style>
.zoomImage {
  box-shadow: rgba(149, 157, 165, 0.2) 0px 8px 24px;
}
.medium-zoom-overlay {
  z-index: 20;
}
.medium-zoom-image {
  z-index: 21;
}
</style>
