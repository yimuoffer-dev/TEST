<script setup>
import { onLoad, onShow } from "@dcloudio/uni-app";
import Screen from "../../components/Screen.vue";
import { useCampus } from "../../stores/campus";
const store = useCampus();
const pageKey = Math.random().toString(36).slice(2);
let params = {};
let firstShow = true;
let screen = "orders";
onLoad((options) => {
  params = options;
  store.activate(screen, params, pageKey);
});
onShow(() => {
  if (firstShow) {
    firstShow = false;
    return;
  }
  store.activate(screen, params, pageKey);
});
</script>
<template><Screen v-if="store.pageKey === pageKey" /></template>
