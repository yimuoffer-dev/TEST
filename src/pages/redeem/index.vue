<script setup>
// 路由入口：由 Screen 共享视觉结构，store.activate 负责拉取本页数据与恢复筛选。
// pageKey 避免被保留在页面栈中的旧入口重复渲染；首次 onShow 不重复发起 onLoad 请求。
import { onLoad, onShow } from "@dcloudio/uni-app";
import Screen from "../../components/Screen.vue";
import { useCampus } from "../../stores/campus";
const store = useCampus();
const pageKey = Math.random().toString(36).slice(2);
let params = {};
let firstShow = true;
let screen = "redeem";
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
