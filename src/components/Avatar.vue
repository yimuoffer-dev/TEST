<script setup>
// 头像展示组件：缺少图片时显示名称首字，避免破图。
import { computed } from "vue";
const props = defineProps({ value: String, small: Boolean });
const image = computed(() =>
  /^(data:image\/|https:\/\/|\/static\/)/.test(props.value || ""),
);
</script>
<template>
  <view class="avatar" :class="{ 'small-avatar': small }"
    ><image v-if="image" :src="value" mode="aspectFill" /><text v-else>{{
      (value || "同").slice(0, 1)
    }}</text></view
  >
</template>
