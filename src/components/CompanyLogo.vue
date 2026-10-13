<script setup>
import { computed } from "vue";
const props = defineProps({
  name: String,
  logo: String,
  size: { type: Number, default: 44 },
});
const colors = {
  mobile: "#007AFF",
  byte: "#00A7FF",
  grid: "#08735E",
  huawei: "#D61522",
  tencent: "#007AFF",
  alibaba: "#FF6A00",
  meituan: "#FFD800",
  bank: "#D72B37",
  jd: "#D72B37",
  mi: "#FF6900",
  pg: "#153F89",
  netease: "#D72B37",
};
const brandAssets = {
  huawei: "huawei",
  byte: "bytedance",
  alibaba: "alibabadotcom",
  meituan: "meituan",
  mi: "xiaomi",
};
const logoUrl = computed(() =>
  /^(https:\/\/|\/static\/)/.test(props.logo || "") ? props.logo : null,
);
const text = computed(
  () =>
    ({
      grid: "电",
      huawei: "华",
      tencent: "T",
      alibaba: "阿",
      meituan: "美团",
      bank: "银",
      jd: "京东",
      mi: "mi",
      pg: "P&G",
      netease: "易",
    })[props.logo] ||
    props.name?.slice(0, 1) ||
    "企",
);
</script>
<template>
  <view
    class="company-logo"
    :class="logo"
    :style="{
      width: size + 'px',
      height: size + 'px',
      color: colors[logo] || '#007AFF',
    }"
    ><image
      v-if="logoUrl"
      :src="logoUrl"
      class="brand-logo-image"
      mode="aspectFit"
    /><image
      v-else-if="brandAssets[logo]"
      :src="'/static/logos/' + brandAssets[logo] + '.png'"
      class="brand-logo-image"
      mode="aspectFit"
    /><view v-else-if="logo === 'mobile'" class="mobile-mark"
      ><view /><view /><view /></view
    ><view v-else-if="logo === 'byte'" class="byte-mark"
      ><view /><view /><view /><view /></view
    ><view v-else-if="logo === 'huawei'" class="huawei-mark"
      ><view
        v-for="n in 7"
        :key="n"
        :style="{ transform: 'rotate(' + (n - 4) * 22 + 'deg)' }"
      /><text>HUAWEI</text></view
    ><text
      v-else
      :style="{ background: logo === 'meituan' ? '#FFD800' : 'transparent' }"
      >{{ text }}</text
    ></view
  >
</template>
