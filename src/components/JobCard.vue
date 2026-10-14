<script setup>
// 与附件 jobHTML 对齐：左侧方形企业标识，右侧标题/性质、分类与时间，右上角独立收藏。
// 收藏按钮停止冒泡，防止点击收藏时同时进入详情；收藏状态来自统一 store。
import { useCampus } from '../stores/campus';
import CompanyLogo from './CompanyLogo.vue';
import Icon from './Icon.vue';
defineProps({ job: Object });
defineEmits(['open']);
const s = useCampus();
const date = value => value ? new Date(new Date(value).getTime()+8*3600000).toISOString().slice(0,10).replaceAll('-','.') : '';
</script>
<template>
  <view class="job-card" role="button" tabindex="0" @click="$emit('open', job)" @keydown.enter="$emit('open', job)">
    <CompanyLogo :name="job.company" :logo="job.logo" :size="51" />
    <view class="job-main">
      <view class="job-title-row"><text class="job-title">{{job.title}}</text><text class="nature">{{job.nature}}</text></view>
      <view class="job-tags"><Icon name="bag" :size="11" /><text>{{job.type}} ｜ {{job.degree}} ｜ {{job.batch}}</text></view>
      <view class="job-footer"><view><Icon name="clock" :size="11" /><text>{{job.deadline ? '截止 '+date(job.deadline) : '截止时间未注明'}}</text></view><text class="publication">{{job.publication}}</text></view>
    </view>
    <button class="ui-reset card-save" :aria-label="'收藏'+job.title" :aria-pressed="s.favoriteIds.includes(job.id)" @click.stop="s.favorite(job)" @keydown.enter.stop>
      <Icon name="star" :size="18" :color="s.favoriteIds.includes(job.id)?'#1464ff':'#7087ae'" />
    </button>
  </view>
</template>
