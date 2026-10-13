<script setup>
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
