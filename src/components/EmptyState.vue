<script setup>
import Icon from "./Icon.vue";
defineProps({
  title: { type: String, default: "暂时没有内容" },
  description: { type: String, default: "新的机会，正在路上" },
  action: String,
});
defineEmits(["action"]);
</script>
<template>
  <view class="empty-state"
    ><view class="empty-art"
      ><Icon name="file" :size="38" color="#8DBAFF" /><view
        class="empty-dot" /></view
    ><text class="empty-title">{{ title }}</text
    ><text class="muted">{{ description }}</text
    ><button
      class="ui-reset secondary small"
      v-if="action"
      @click="$emit('action')"
    >
      {{ action }}
    </button></view
  >
</template>
