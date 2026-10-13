<script setup>
import CompanyLogo from "./CompanyLogo.vue";
import Icon from "./Icon.vue";
defineProps({ job: Object });
defineEmits(["open"]);
const date = (v) =>
  v
    ? new Date(new Date(v).getTime() + 8 * 3600000)
        .toISOString()
        .slice(0, 10)
        .replaceAll("-", ".")
    : "";
</script>
<template>
  <view
    class="job-card"
    role="button"
    tabindex="0"
    @click="$emit('open', job)"
    @keydown.enter="$emit('open', job)"
    ><view class="job-top"
      ><CompanyLogo :name="job.company" :logo="job.logo" /><view
        class="job-main"
        ><view class="job-title-row"
          ><text class="job-title">{{ job.title }}</text
          ><text class="nature">{{ job.nature }}</text></view
        ><view class="job-tags"
          ><text>{{ job.type }}</text
          ><text>{{ job.degree }}</text
          ><text>{{ job.batch }}</text></view
        ></view
      ></view
    ><view class="job-footer"
      ><view
        ><Icon name="clock" :size="14" /><text>{{
          job.deadline ? "截止 " + date(job.deadline) : "截止时间未注明"
        }}</text></view
      ><text class="publication">{{ job.publication }}</text></view
    ></view
  >
</template>
