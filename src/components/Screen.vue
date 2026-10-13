<script setup>
import { computed, ref, watch } from "vue";
import {
  useCampus,
  today,
  cents,
  statuses,
  interviews,
} from "../stores/campus";
import Icon from "./Icon.vue";
import CompanyLogo from "./CompanyLogo.vue";
import JobCard from "./JobCard.vue";
import EmptyState from "./EmptyState.vue";
import Overlays from "./Overlays.vue";
import Avatar from "./Avatar.vue";
import { chooseImageData } from "../utils/images";
const s = useCampus();
const navs = [
  { id: "home", title: "校招信息", icon: "home" },
  { id: "daily", title: "求职日报", icon: "file" },
  { id: "records", title: "投递记录", icon: "records" },
  { id: "profile", title: "个人中心", icon: "user" },
];
const titles = {
  home: "校招信息",
  daily: "求职日报",
  records: "投递记录",
  profile: "个人中心",
  detail: "招聘详情",
  list: "筛选结果",
  messages: "消息中心",
  "record-detail": "投递进展",
  favorites: "我的收藏",
  membership: "开通会员",
  orders: "我的订单",
  rights: "权益记录",
  "profile-edit": "个人资料",
  account: "账号安全",
  help: "帮助中心",
  about: "关于我们",
  distribution: "分销中心",
  partner: "合伙人中心",
  funds: "资金明细",
  customers: "我的客户",
  team: "我的团队",
  "distribution-orders": "订单明细",
  promotion: "推广工具",
  withdraw: "申请提现",
  gifts: "会员赠送",
  redeem: "会员兑换",
  admin: "管理后台",
};
const title = computed(() =>
  s.route === "list" ? s.listTitle : titles[s.route] || "校招指南",
);
const isTab = computed(() => navs.some((n) => n.id === s.route));
const requiresUser = computed(
  () => !["home", "about", "help", "membership"].includes(s.route),
);
const money = cents;
const date = (v) =>
  v
    ? new Date(new Date(v).getTime() + 8 * 3600000)
        .toISOString()
        .slice(0, 10)
        .replaceAll("-", ".")
    : "";
const week = computed(() => {
  const selected = new Date(s.date + "T12:00:00+08:00");
  const localDay = new Date(selected.getTime() + 8 * 3600000).getUTCDay();
  const monday = new Date(selected.getTime() - ((localDay + 6) % 7) * 86400000);
  return Array.from({ length: 7 }, (_, i) => {
    const v = new Date(monday.getTime() + i * 86400000);
    const key = new Date(v.getTime() + 8 * 3600000).toISOString().slice(0, 10);
    return {
      key,
      day: Number(key.slice(-2)),
      label: ["周一", "周二", "周三", "周四", "周五", "周六", "周日"][i],
    };
  });
});
const weekTitle = computed(() => {
  const a = week.value[0].key,
    b = week.value[6].key;
  return (
    a.slice(0, 4) +
    "年" +
    Number(a.slice(5, 7)) +
    "月" +
    Number(a.slice(8)) +
    "日 – " +
    (a.slice(5, 7) !== b.slice(5, 7) ? Number(b.slice(5, 7)) + "月" : "") +
    Number(b.slice(8)) +
    "日"
  );
});
const moveWeek = (offset) =>
  s.setDate(
    new Date(
      Date.parse(s.date + "T12:00:00+08:00") +
        offset * 7 * 86400000 +
        8 * 3600000,
    )
      .toISOString()
      .slice(0, 10),
  );
const recordOptions = ["全部", ...statuses];
const selectRecord = (e) => {
  s.recordStatus = recordOptions[Number(e.detail.value)];
};
const expanded = ref({});
const selectedPackage = ref("vip-year");
const profileDraft = ref({});
const withdraw = ref({ amount: "", method: "微信", name: "", image: "" });
const formError = ref("");
const submitting = ref(false);
const giftType = ref("vip");
const giftDays = ref("7");
const redeemCode = ref("");
const adminTab = ref("jobs");
const adminQuery = ref("");
const configText = ref("");
const topicsText = ref("");
const importFileName = ref("");
const accountAction = ref("phone");
const accountPhone = ref("");
const accountPassword = ref("");
const accountCode = ref("");
const helpExpanded = ref(0);
watch(
  () => [s.route, s.user?.id],
  () => {
    expanded.value = {};
    formError.value = "";
    if (s.route === "profile-edit")
      profileDraft.value = {
        nickname: s.user?.nickname || "",
        batch: s.user?.batch || "2027届",
        major: s.user?.major || "",
        seeking: s.user?.seeking || "求职中",
        avatar: s.user?.avatar || "李",
      };
    if (s.route === "withdraw")
      withdraw.value = {
        amount: "",
        method: "微信",
        name: s.user?.nickname || "",
        image: "",
      };
  },
);
watch(
  () => s.admin,
  () => {
    if (s.admin) {
      configText.value = JSON.stringify(s.admin.config, null, 2);
      topicsText.value = JSON.stringify(s.admin.config.topics, null, 2);
    }
  },
);
const run = async (action) => {
  submitting.value = true;
  formError.value = "";
  try {
    await action();
  } catch (e) {
    formError.value = e.message;
  } finally {
    submitting.value = false;
  }
};
const gateNav = (route, params = {}) => s.guard(() => s.nav(route, params));
const filter = () =>
  s.guard(() => {
    s.modal = "filter";
  });
const conditionLabels = computed(() =>
  Object.entries(s.listQuery)
    .flatMap(([k, v]) =>
      k === "scope"
        ? [
            {
              latest: "最近72小时",
              new24: "最近24小时",
              open: "当前可投",
              closing: "即将截止",
              recommended: "人工推荐",
              hot: "热度最高",
            }[v],
          ]
        : Array.isArray(v)
          ? v
          : k === "search" && v
            ? ["关键词：" + v]
            : [],
    )
    .filter(Boolean),
);
const personalMenus = computed(() => [
  { icon: "user", label: "个人资料", route: "profile-edit" },
  { icon: "shield", label: "账号绑定", route: "account" },
  { icon: "star", label: "我的收藏", route: "favorites" },
  { icon: "records", label: "投递记录", route: "records" },
  { icon: "bag", label: "我的订单", route: "orders" },
  { icon: "file", label: "权益记录", route: "rights" },
  { icon: "gift", label: "会员兑换", route: "redeem" },
  ...(s.distributor
    ? [{ icon: "wallet", label: "分销中心", route: "distribution" }]
    : [{ icon: "wallet", label: "申请分销", action: "applyDistribution" }]),
  ...(s.isPartner
    ? [{ icon: "crown", label: "合伙人中心", route: "partner" }]
    : []),
  { icon: "help", label: "帮助中心", route: "help" },
  { icon: "info", label: "关于我们", route: "about" },
]);
const distributionMenus = computed(() => [
  { icon: "wallet", label: "资金明细", route: "funds" },
  { icon: "file", label: "订单明细", route: "distribution-orders" },
  ...(s.isPartner ? [{ icon: "team", label: "团队明细", route: "team" }] : []),
  { icon: "user", label: "客户明细", route: "customers" },
  { icon: "share", label: "推广工具", route: "promotion" },
  { icon: "crown", label: "合伙人中心", route: "partner" },
]);
const partnerMenus = computed(() => [
  ...(s.isSenior
    ? [{ icon: "gift", label: "超级管理 · 会员赠送", route: "gifts" }]
    : []),
  { icon: "wallet", label: "分销中心", route: "distribution" },
  { icon: "user", label: "我的客户", route: "customers" },
  { icon: "team", label: "我的团队", route: "team" },
  { icon: "file", label: "资金明细", route: "funds" },
  { icon: "bell", label: "推送设置", action: "push" },
  { icon: "share", label: "推广工具", route: "promotion" },
]);
function menuClick(m) {
  if (m.action === "applyDistribution")
    s.guard(() => {
      s.modal = "distribution-apply";
    });
  else if (m.action === "push")
    s.notify("第一版仅提供站内招聘统计提醒，可在消息中心查看");
  else gateNav(m.route);
}
const chooseImage = () =>
  run(async () => {
    withdraw.value.image = await chooseImageData();
  });
const chooseAvatar = () =>
  run(async () => {
    profileDraft.value.avatar = await chooseImageData();
  });
const submitWithdraw = () =>
  run(async () => {
    const amount = Number(withdraw.value.amount);
    if (
      !Number.isFinite(amount) ||
      !/^\d+(\.\d{1,2})?$/.test(withdraw.value.amount)
    )
      throw new Error("请输入正确金额，最多两位小数");
    await s.request("/withdrawals", {
      method: "POST",
      body: {
        cents: Math.round(amount * 100),
        method: withdraw.value.method,
        name: withdraw.value.name,
        image: withdraw.value.image,
      },
    });
    await s.bootstrap();
    s.notify("申请已提交，等待审核");
    s.nav("funds");
  });
const saveProfile = () =>
  run(async () => {
    if (!profileDraft.value.nickname.trim()) throw new Error("请填写昵称");
    await s.request("/profile", { method: "PATCH", body: profileDraft.value });
    await s.bootstrap();
    s.notify("资料已保存");
    s.back();
  });
const generate = () =>
  run(async () => {
    await s.request("/gifts", {
      method: "POST",
      body: { type: giftType.value, validDays: Number(giftDays.value) },
    });
    await s.loadRoute();
    s.notify("赠送凭证已生成");
  });
const redeem = () =>
  run(async () => {
    await s.request("/redeem", {
      method: "POST",
      body: { code: redeemCode.value },
    });
    await s.bootstrap();
    redeemCode.value = "";
    s.notify("兑换成功，权益已更新");
    s.nav("rights");
  });
const promoLink = computed(() => {
  // #ifdef H5
  return (
    window.location.origin +
    "/#/pages/index/index?screen=home&ref=" +
    s.user?.id
  );
  // #endif
  // #ifndef H5
  return "/pages/index/index?screen=home&ref=" + s.user?.id;
  // #endif
});
const dailyTitle = computed(
  () =>
    Number(s.date.slice(5, 7)) +
    "月" +
    Number(s.date.slice(8)) +
    "日" +
    (s.dailyMode === "new" ? "新增公告" : "截止公告"),
);
const saveAccount = () =>
  run(async () => {
    await s.request("/account", {
      method: "POST",
      body: {
        action: accountAction.value,
        phone: accountPhone.value,
        password: accountPassword.value,
        code: accountCode.value,
      },
    });
    await s.bootstrap();
    s.notify("账号设置已更新");
    accountCode.value = "";
    accountPassword.value = "";
  });
const openAdminJob = (job) => {
  s.modal = "admin-job";
  s.modalPayload = job || null;
};
const adminAction = (path, body) =>
  run(async () => {
    await s.request(path, { method: "POST", body });
    await s.loadRoute();
    s.notify("操作已完成");
  });
const importText = ref("");
const importRows = ref([]);
const importErrors = ref([]);
const previewImport = () =>
  run(async () => {
    const result = await s.request("/admin/import/preview", {
      method: "POST",
      body: { format: "csv", text: importText.value },
    });
    importRows.value = result.items;
    importErrors.value = [...result.errors, ...result.warnings];
  });
const downloadTemplate = () =>
  run(async () => {
    const result = await s.request("/admin/import/template");
    // #ifdef H5
    const bytes = Uint8Array.from(atob(result.file), (c) => c.charCodeAt(0));
    const url = URL.createObjectURL(
      new Blob([bytes], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = result.filename;
    a.click();
    URL.revokeObjectURL(url);
    // #endif
    // #ifndef H5
    const path = uni.env.USER_DATA_PATH + "/campus-template.xlsx";
    uni
      .getFileSystemManager()
      .writeFile({
        filePath: path,
        data: result.file,
        encoding: "base64",
        success: () => uni.openDocument({ filePath: path, showMenu: true }),
      });
    // #endif
  });
const chooseImportFile = () => {
  const accept = async (result) => {
    try {
      const file = result.tempFiles[0];
      let encoded = "";
      // #ifdef H5
      const blob = await (await fetch(file.path)).blob();
      if (blob.size > 4 * 1024 * 1024) throw new Error("文件请小于4MB");
      encoded = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(",")[1]);
        reader.readAsDataURL(blob);
      });
      // #endif
      // #ifndef H5
      encoded = await new Promise((resolve, reject) =>
        uni
          .getFileSystemManager()
          .readFile({
            filePath: file.path,
            encoding: "base64",
            success: (r) => resolve(r.data),
            fail: reject,
          }),
      );
      // #endif
      const response = await s.request("/admin/import/preview", {
        method: "POST",
        body: { format: "xlsx", file: encoded },
      });
      importRows.value = response.items;
      importErrors.value = [...response.errors, ...response.warnings];
      importFileName.value = file.name || "Excel文件";
    } catch (e) {
      formError.value = e.message;
    }
  };
  // #ifdef H5
  uni.chooseFile({ count: 1, extension: [".xlsx"], success: accept });
  // #endif
  // #ifndef H5
  uni.chooseMessageFile({
    count: 1,
    type: "file",
    extension: ["xlsx"],
    success: accept,
  });
  // #endif
};
const downloadPoster = () => {
  // #ifdef H5
  const c = document.createElement("canvas");
  c.width = 750;
  c.height = 1100;
  const x = c.getContext("2d");
  x.fillStyle = "#F1F8FF";
  x.fillRect(0, 0, 750, 1100);
  x.fillStyle = "#007AFF";
  x.fillRect(0, 0, 750, 16);
  x.font = "bold 64px sans-serif";
  x.fillText("好机会，不错过。", 70, 170);
  x.font = "32px sans-serif";
  x.fillStyle = "#65758E";
  x.fillText("与你一起，走好校招的每一步", 70, 240);
  x.fillStyle = "#FFFFFF";
  x.fillRect(50, 330, 650, 580);
  x.fillStyle = "#17233B";
  x.font = "bold 42px sans-serif";
  x.fillText("校招指南", 95, 410);
  x.font = "28px sans-serif";
  [
    "招聘信息 · 求职日报",
    "投递记录 · 进展追踪",
    s.user.nickname + " 邀请你加入",
  ].forEach((line, i) => x.fillText(line, 95, 520 + i * 70));
  x.font = "18px sans-serif";
  const link = promoLink.value;
  for (let i = 0; i < link.length; i += 48)
    x.fillText(link.slice(i, i + 48), 95, 790 + Math.floor(i / 48) * 30);
  x.fillStyle = "#007AFF";
  x.font = "26px sans-serif";
  x.fillText("复制推广链接，开启新的可能", 95, 1000);
  const a = document.createElement("a");
  a.download = "校招指南-推广海报.png";
  a.href = c.toDataURL("image/png");
  a.click();
  s.notify("推广海报已生成");
  // #endif
  // #ifndef H5
  s.notify("小程序海报生成需接入服务端小程序码");
  // #endif
};
</script>
<template>
  <view class="workspace">
    <!-- #ifdef H5 -->
    <view class="desktop-brand"
      ><view class="brand-symbol"
        ><Icon name="grid" color="#FFFFFF" :size="24" /></view
      ><text>校招指南</text><text class="brand-en">CAMPUS GUIDE</text></view
    >
    <view class="desktop-note"
      ><text class="desktop-eyebrow">YOUR NEXT CHAPTER</text
      ><text class="desktop-heading">好机会，<br />不错过。</text
      ><text class="desktop-desc"
        >把招聘信息、求职日程与每一次进展，<br />放在一起。让未来，更有方向。</text
      ><view class="desktop-feature"
        ><Icon name="shield" color="#007AFF" /><text
          >信息有序 · 进展清晰</text
        ></view
      ><text class="desktop-foot">原生蓝白 × 冰蓝通透</text></view
    >
    <!-- #endif -->
    <view
      class="app-shell"
      :data-ready="s.ready && !!s.user"
      :class="{
        native: ['home', 'list', 'detail', 'favorites'].includes(s.route),
      }"
    >
      <view class="app-header" :class="{ compact: !isTab }"
        ><button
          class="ui-reset icon-button back-button"
          v-if="!isTab"
          aria-label="返回"
          @click="s.back()"
        >
          <Icon name="back" color="#17233B" /></button
        ><text class="page-title">{{ title }}</text
        ><button
          class="ui-reset icon-button"
          v-if="s.route === 'home'"
          aria-label="消息中心"
          @click="gateNav('messages')"
        >
          <Icon name="bell" color="#17233B" /><view
            v-if="s.ready"
            class="notification-dot"
          /></button
        ><view v-else class="header-mark"><view /><view /><view /></view
      ></view>
      <scroll-view
        scroll-y
        class="page-scroll"
        :scroll-top="s.scrolls[s.route] || 0"
        @scroll="s.scrolls[s.route] = $event.detail.scrollTop"
      >
        <view
          class="page-content"
          :class="{ 'detail-content': s.route === 'detail' }"
        >
          <view v-if="s.error" class="error-banner" role="alert"
            ><Icon name="info" color="#E5484D" /><text>{{ s.error }}</text
            ><button class="ui-reset text-button" @click="s.retry()">
              重试
            </button></view
          >
          <EmptyState
            v-if="requiresUser && !s.user && s.ready"
            title="登录后，开启你的求职旅程"
            description="招聘浏览、收藏与投递管理，为你有序保存"
            action="去登录"
            @action="s.modal = 'login'"
          />
          <template v-else>
            <template v-if="['home', 'list'].includes(s.route)">
              <view class="search-field"
                ><Icon name="search" :size="19" /><input
                  v-model="s.search"
                  placeholder="搜索公司、岗位、城市"
                  confirm-type="search"
                  aria-label="搜索公司、岗位、城市"
                  @confirm="s.searchSubmit()"
                  @keydown.enter="s.searchSubmit()"
                /><button
                  class="ui-reset icon-button clear-search"
                  v-if="s.search"
                  aria-label="清除搜索"
                  @click="s.search = ''"
                >
                  ×
                </button></view
              >
              <template v-if="s.route === 'home'">
                <view class="topics"
                  ><button
                    class="ui-reset topic"
                    v-for="topic in s.config.topics"
                    :key="topic.id"
                    @click="s.openList(topic.name, topic.query)"
                  >
                    <view
                      class="topic-symbol"
                      :style="{
                        color: topic.color,
                        background: topic.color + '10',
                      }"
                      ><Icon
                        :name="topic.icon"
                        :color="topic.color"
                        :size="28" /></view
                    ><text>{{ topic.name }}</text>
                  </button></view
                >
                <view class="platform-stats"
                  ><button
                    class="ui-reset"
                    v-for="stat in [
                      { key: 'total', label: '累计公告', scope: '' },
                      { key: 'new24', label: '24H新增', scope: 'new24' },
                      { key: 'open', label: '当前可投', scope: 'open' },
                      { key: 'closing', label: '即将截止', scope: 'closing' },
                    ]"
                    :key="stat.key"
                    @click="
                      s.openList(
                        stat.label,
                        stat.scope ? { scope: stat.scope } : {},
                      )
                    "
                  >
                    <text class="stat-caption">{{ stat.label }}</text
                    ><text class="stat-value">{{
                      s.ready ? s.stats[stat.key] : "—"
                    }}</text>
                  </button></view
                >
                <view class="column-tabs"
                  ><button
                    class="ui-reset"
                    v-for="tab in [
                      { id: 'latest', label: '最新' },
                      { id: 'recommended', label: '推荐' },
                      { id: 'closing', label: '即将截止' },
                      { id: 'hot', label: '热度最高' },
                    ]"
                    :key="tab.id"
                    :class="{ selected: s.homeScope === tab.id }"
                    @click="s.setScope(tab.id)"
                  >
                    {{ tab.label }}</button
                  ><button class="ui-reset filter-trigger" @click="filter">
                    <Icon name="filter" :size="15" />筛选
                  </button></view
                >
              </template>
              <template v-else
                ><view class="list-summary"
                  ><text
                    >共找到
                    <text class="blue strong">{{ s.total }}</text> 条公告</text
                  ><button class="ui-reset text-button" @click="filter">
                    <Icon name="filter" :size="16" color="#007AFF" />筛选
                  </button></view
                ><view v-if="conditionLabels.length" class="condition-tags"
                  ><text v-for="label in conditionLabels" :key="label">{{
                    label
                  }}</text></view
                ></template
              >
            </template>
            <template v-if="s.route === 'daily'">
              <view class="week-heading"
                ><button
                  class="ui-reset icon-button"
                  aria-label="上一周"
                  @click="moveWeek(-1)"
                >
                  <Icon name="back" :size="18" /></button
                ><text>{{ weekTitle }}</text
                ><button
                  class="ui-reset icon-button"
                  aria-label="下一周"
                  @click="moveWeek(1)"
                >
                  <Icon name="chevron" :size="18" /></button
              ></view>
              <view class="week-calendar"
                ><button
                  class="ui-reset"
                  v-for="w in week"
                  :key="w.key"
                  :class="{ active: w.key === s.date }"
                  @click="s.setDate(w.key)"
                >
                  <text>{{ w.day }}</text
                  ><text>{{ w.label }}</text
                  ><view v-if="w.key === today()" class="today-dot" /></button
              ></view>
              <button
                class="ui-reset text-button return-today"
                v-if="s.date !== today()"
                @click="s.setDate(today())"
              >
                回到本周
              </button>
              <view class="daily-stats"
                ><button
                  class="ui-reset daily-stat blue-stat"
                  :class="{ chosen: s.dailyMode === 'new' }"
                  @click="
                    s.dailyMode = 'new';
                    s.loadList();
                  "
                >
                  <view class="stat-icon"
                    ><Icon name="file" color="#007AFF" :size="26" /></view
                  ><view
                    ><text class="muted">今日新增</text
                    ><text class="daily-number">{{
                      s.dailyStats.new
                    }}</text></view
                  ></button
                ><button
                  class="ui-reset daily-stat orange-stat"
                  :class="{ chosen: s.dailyMode === 'closing' }"
                  @click="
                    s.dailyMode = 'closing';
                    s.loadList();
                  "
                >
                  <view class="stat-icon"
                    ><Icon name="clock" color="#F59A23" :size="26" /></view
                  ><view
                    ><text class="muted">今日截止</text
                    ><text class="daily-number">{{
                      s.dailyStats.closing
                    }}</text></view
                  >
                </button></view
              >
              <view class="section-heading plain"
                ><text>{{ dailyTitle }}</text
                ><text class="muted">{{ s.total }} 条</text></view
              >
            </template>
            <template v-if="['home', 'list', 'daily'].includes(s.route)">
              <view v-if="s.loading && !s.jobs.length" class="skeleton-list"
                ><view v-for="n in 3" :key="n" class="skeleton-card"
                  ><view /><view /><view /></view
              ></view>
              <view v-else class="job-list"
                ><JobCard
                  v-for="job in s.jobs"
                  :key="job.id"
                  :job="job"
                  @open="s.openDetail"
              /></view>
              <EmptyState
                v-if="!s.loading && !s.jobs.length && !s.error"
                title="暂未找到相关公告"
                description="试试调整筛选条件，发现更多可能"
                action="调整筛选"
                @action="filter"
              />
              <button
                class="ui-reset list-limit"
                v-if="s.limited"
                @click="s.toMembership()"
              >
                <Icon name="crown" :size="18" color="#B1874E" /><text
                  >开通会员，查看更多校招机会</text
                ><Icon name="chevron" :size="15" /></button
              ><button
                class="ui-reset load-more"
                v-else-if="s.hasMore"
                :disabled="s.loading || s.busy"
                @click="s.nextPage()"
              >
                {{ s.loading ? "加载中…" : "加载更多" }}
              </button>
              <view v-if="s.jobs.length" class="list-end"
                ><view /><text>{{
                  s.hasMore ? "每一次出发，都更接近未来" : "已展示全部公告"
                }}</text
                ><view
              /></view>
              <button
                class="ui-reset text-button refresh-button"
                v-if="s.user"
                @click="s.refresh()"
              >
                刷新招聘信息
              </button>
            </template>
            <template v-if="s.route === 'detail' && s.detail">
              <view class="detail-overview"
                ><CompanyLogo
                  :name="s.detail.company"
                  :logo="s.detail.logo"
                  :size="50"
                /><view class="job-main"
                  ><view class="job-title-row"
                    ><text class="job-title">{{ s.detail.title }}</text
                    ><text class="nature">{{ s.detail.nature }}</text></view
                  ><view class="job-tags"
                    ><text>{{ s.detail.type }}</text
                    ><text>{{ s.detail.degree }}</text
                    ><text>{{ s.detail.batch }}</text></view
                  ></view
                ></view
              >
              <view class="detail-meta"
                ><text>{{ s.detail.industry }}</text
                ><text>收录 {{ date(s.detail.uploadedAt) }}</text
                ><text>{{ s.detail.views }} 次浏览</text></view
              >
              <view class="detail-info card"
                ><view
                  v-for="row in [
                    {
                      icon: 'clock',
                      label: '开始时间',
                      value: date(s.detail.start) || '未注明',
                    },
                    {
                      icon: 'clock',
                      label: '截止时间',
                      value: date(s.detail.deadline) || '截止时间未注明',
                    },
                    {
                      icon: 'shield',
                      label: '招聘状态',
                      value: s.detail.status,
                      status: true,
                    },
                    {
                      icon: 'location',
                      label: '工作地点',
                      value: s.detail.cities.join('　'),
                    },
                    { icon: 'user', label: '招聘批次', value: s.detail.batch },
                    {
                      icon: 'building',
                      label: '学历要求',
                      value: s.detail.degree,
                    },
                  ]"
                  :key="row.label"
                  ><Icon :name="row.icon" :size="16" /><text class="muted">{{
                    row.label
                  }}</text
                  ><text
                    :class="{
                      'status-open': row.status && row.value === '投递中',
                    }"
                    >{{ row.value }}</text
                  ></view
                ></view
              >
              <view
                v-for="block in [
                  { id: 'positions', title: '招聘岗位' },
                  { id: 'majors', title: '招聘专业' },
                ]"
                :key="block.id"
                class="detail-section"
                ><template v-if="s.detail[block.id]?.length"
                  ><view class="section-heading"
                    ><text>{{ block.title }}</text
                    ><text class="muted"
                      >共 {{ s.detail[block.id].length }} 类</text
                    ></view
                  ><view
                    class="detail-chips"
                    :class="{ collapsed: !expanded[block.id] }"
                    ><text v-for="item in s.detail[block.id]" :key="item">{{
                      item
                    }}</text></view
                  ><button
                    class="ui-reset text-button expand-button"
                    v-if="s.detail[block.id].length > 3"
                    @click="expanded[block.id] = !expanded[block.id]"
                  >
                    {{ expanded[block.id] ? "收起" : "展开更多"
                    }}<Icon
                      :name="expanded[block.id] ? 'down' : 'chevron'"
                      :size="14"
                      color="#007AFF"
                    /></button></template
              ></view>
              <view
                v-if="s.detail.intro || s.detail.introImages?.length"
                class="detail-section"
                ><view class="section-heading"
                  ><text>企业介绍</text
                  ><button
                    class="ui-reset text-button"
                    @click="expanded.intro = !expanded.intro"
                  >
                    {{ expanded.intro ? "收起" : "展开更多" }}
                  </button></view
                ><text
                  class="company-intro"
                  :class="{ clamp: !expanded.intro }"
                  >{{
                    s.detail.intro || "企业图文介绍，展开查看完整内容。"
                  }}</text
                ><view
                  v-if="expanded.intro && s.detail.introImages?.length"
                  class="intro-images"
                  ><image
                    v-for="(src, i) in s.detail.introImages"
                    :key="i"
                    :src="src"
                    mode="widthFix"
                    lazy-load /></view
              ></view>
              <view class="detail-disclaimer"
                ><Icon name="info" :size="16" /><text
                  >招聘信息请以企业官方公告为准。投递前请确认岗位要求与报名时间。</text
                ></view
              >
            </template>
            <template v-if="s.route === 'records'">
              <view class="records-summary"
                ><text
                  >共 {{ s.records.length }} 条记录 ·
                  {{ s.inProgress }} 条进行中</text
                ><picker
                  :range="recordOptions"
                  :value="recordOptions.indexOf(s.recordStatus)"
                  @change="selectRecord"
                  ><view class="status-select"
                    >{{ s.recordStatus === "全部" ? "全部状态" : s.recordStatus
                    }}<Icon name="down" :size="14" /></view></picker
              ></view>
              <view class="record-stats"
                ><button
                  class="ui-reset"
                  v-for="(value, key, i) in s.recordStats"
                  :key="key"
                  :class="'state-' + i"
                  @click="s.recordStatus = key"
                >
                  <text>{{ value }}</text
                  ><text>{{ key }}</text>
                </button></view
              >
              <view class="record-list"
                ><view
                  v-for="record in s.filteredRecords"
                  :key="record.id"
                  class="record-card"
                  role="button"
                  tabindex="0"
                  @click="s.nav('record-detail', { id: record.id })"
                  ><CompanyLogo
                    :name="record.company"
                    :logo="record.logo"
                  /><view class="record-main"
                    ><view class="row-between"
                      ><text class="strong">{{ record.company }}</text
                      ><text
                        class="status-badge"
                        :class="'status-' + statuses.indexOf(record.status)"
                        >{{ record.status }}</text
                      ></view
                    ><view class="row-between"
                      ><text class="muted">{{ record.position }}</text
                      ><text class="record-date"
                        >{{
                          record.initialDate.replaceAll("-", ".")
                        }}
                        投递</text
                      ></view
                    ><text v-if="record.notes" class="record-notes">{{
                      record.notes
                    }}</text></view
                  ></view
                ></view
              >
              <EmptyState
                v-if="!s.filteredRecords.length"
                title="当前状态暂无记录"
                description="记录一次投递，让求职进展清晰可见"
                action="添加投递"
                @action="s.openProgress()"
              />
            </template>
            <template v-if="s.route === 'record-detail' && s.activeRecord">
              <view class="record-detail-top card"
                ><CompanyLogo
                  :name="s.activeRecord.company"
                  :logo="s.activeRecord.logo"
                  :size="52"
                /><view
                  ><text class="block strong">{{ s.activeRecord.company }}</text
                  ><text class="muted">{{
                    s.activeRecord.position
                  }}</text></view
                ><text
                  class="status-badge"
                  :class="'status-' + statuses.indexOf(s.activeRecord.status)"
                  >{{ s.activeRecord.status }}</text
                ></view
              >
              <view class="section-heading"
                ><text>投递信息</text
                ><button
                  class="ui-reset text-button"
                  @click="s.openProgress(s.activeRecord, true)"
                >
                  编辑
                </button></view
              ><view class="card record-details"
                ><view
                  v-for="field in [
                    { k: 'initialDate', label: '最初投递' },
                    { k: 'referralCode', label: '内推码' },
                    { k: 'referralUrl', label: '内推链接' },
                    { k: 'applyUrl', label: '投递地址' },
                    { k: 'sourceUrl', label: '公告原文' },
                    { k: 'notes', label: '备注' },
                  ]"
                  :key="field.k"
                  ><text class="muted">{{ field.label }}</text
                  ><text class="break-word">{{
                    s.activeRecord[field.k] || "未填写"
                  }}</text></view
                ></view
              >
              <view class="section-heading"
                ><text>进展时间线</text
                ><text class="muted"
                  >{{ s.activeRecord.history.length }} 次进展</text
                ></view
              ><view class="card timeline"
                ><view
                  v-for="event in [...s.activeRecord.history].sort(
                    (a, b) =>
                      b.date.localeCompare(a.date) || b.at.localeCompare(a.at),
                  )"
                  :key="event.id"
                  class="timeline-event"
                  ><view class="timeline-dot" /><text class="strong">{{
                    event.status
                  }}</text
                  ><text class="muted">{{
                    event.date.replaceAll("-", ".")
                  }}</text
                  ><text v-if="event.notes" class="block muted">{{
                    event.notes
                  }}</text></view
                ></view
              >
              <button
                class="ui-reset secondary full"
                @click="
                  s.activeRecord.jobId
                    ? s.openDetail({ id: s.activeRecord.jobId })
                    : s.notify('该记录未关联平台公告')
                "
              >
                查看原招聘公告</button
              ><button
                class="ui-reset danger-text full"
                @click="
                  s.modal = 'delete-record';
                  s.modalPayload = s.activeRecord;
                "
              >
                删除记录及全部历史
              </button>
            </template>
            <template v-if="s.route === 'profile'">
              <view
                class="profile-row"
                role="button"
                @click="gateNav('profile-edit')"
                ><Avatar :value="s.user?.avatar" /><view class="profile-name"
                  ><text>{{ s.user?.nickname || "你好，同学" }}</text
                  ><text
                    >{{ s.user?.batch || "毕业届别" }} ·
                    {{ s.user?.major || "完善专业" }} ·
                    {{ s.user?.seeking || "求职中" }}</text
                  ></view
                ><Icon name="chevron" :size="18"
              /></view>
              <view
                class="identity-card"
                :class="{ gold: s.isPartner }"
                @click="s.isPartner ? s.nav('partner') : s.toMembership()"
                ><Icon
                  name="crown"
                  :size="34"
                  :color="s.isPartner ? '#FFEDCC' : '#007AFF'" /><view
                  ><text>{{
                    s.isMember ? s.entitlement.label : "开启 VIP 求职之旅"
                  }}</text
                  ><text>{{
                    s.isPartner
                      ? "求职权益 · 永久 VIP · 团队成长"
                      : s.isMember
                        ? "有效期至 " + date(s.entitlement.expires)
                        : "不限浏览 · 官方入口 · 把握每个机会"
                  }}</text></view
                ><button class="ui-reset">
                  {{
                    s.isPartner ? "合伙人中心" : s.isMember ? "续费" : "去开通"
                  }}<Icon
                    name="chevron"
                    :size="12"
                    :color="s.isPartner ? '#765536' : '#007AFF'"
                  /></button
              ></view>
              <view class="personal-stats card"
                ><button class="ui-reset" @click="gateNav('records')">
                  <view class="round-icon blue-soft"
                    ><Icon name="file" color="#007AFF" /></view
                  ><view
                    ><text>投递记录</text
                    ><text>{{ s.records.length }}</text></view
                  ></button
                ><button class="ui-reset" @click="gateNav('favorites')">
                  <view class="round-icon orange-soft"
                    ><Icon name="star" color="#F59A23" /></view
                  ><view
                    ><text>我的收藏</text
                    ><text>{{ s.favoriteIds.length }}</text></view
                  ></button
                ><button
                  class="ui-reset"
                  @click="
                    s.recordStatus = 'Offer';
                    gateNav('records');
                  "
                >
                  <view class="round-icon green-soft"
                    ><Icon name="gift" color="#1B9A67" /></view
                  ><view
                    ><text>我的Offer</text
                    ><text>{{ s.recordStats.Offer }}</text></view
                  >
                </button></view
              >
              <view class="menu-group card"
                ><button
                  class="ui-reset menu-row"
                  v-for="m in personalMenus"
                  :key="m.label"
                  @click="menuClick(m)"
                >
                  <Icon :name="m.icon" color="#17233B" :size="20" /><text>{{
                    m.label
                  }}</text
                  ><Icon name="chevron" :size="16" /></button
              ></view>
              <view
                v-if="!s.isPartner"
                class="partner-invite"
                @click="s.toMembership()"
                ><view
                  ><text class="strong">成为职场合伙人</text
                  ><text class="muted block"
                    >永久权益，与伙伴共同成长</text
                  ></view
                ><Icon name="chevron" color="#A77A45"
              /></view>
              <button
                class="ui-reset logout-button"
                v-if="s.user"
                @click="s.modal = 'logout'"
              >
                退出登录
              </button>
              <view v-if="s.demo" class="demo-panel"
                ><view
                  ><Icon name="info" :size="16" color="#007AFF" /><text
                    >当前为演示环境 · 示例数据</text
                  ></view
                ><button
                  class="ui-reset text-button"
                  @click="s.modal = 'demo-accounts'"
                >
                  切换演示身份</button
                ><button
                  class="ui-reset text-button"
                  v-if="['admin', 'editor'].includes(s.user?.role)"
                  @click="s.nav('admin')"
                >
                  进入管理后台
                </button></view
              >
            </template>
            <template v-if="s.route === 'favorites'"
              ><JobCard
                v-for="job in s.data"
                :key="job.id"
                :job="job"
                @open="s.openDetail" /><EmptyState
                v-if="!s.data.length"
                title="还没有收藏"
                description="把心仪的机会收藏起来，随时回看"
                action="发现机会"
                @action="s.nav('home')"
            /></template>
            <template v-if="s.route === 'messages'"
              ><view class="info-note">仅提供站内招聘新增与截止提醒</view
              ><view
                v-for="m in s.data"
                :key="m.id"
                class="message-card card"
                :class="{ unread: !m.read }"
                @click="
                  s.request('/messages/' + m.id + '/read', { method: 'POST' });
                  s.date = m.date;
                  s.dailyMode = m.mode;
                  s.nav('daily');
                "
                ><view
                  class="round-icon"
                  :class="m.mode === 'new' ? 'blue-soft' : 'orange-soft'"
                  ><Icon
                    :name="m.mode === 'new' ? 'file' : 'clock'"
                    :color="m.mode === 'new' ? '#007AFF' : '#F59A23'" /></view
                ><view
                  ><text class="strong"
                    >{{
                      m.mode === "new" ? "今日校招更新" : "今日截止提醒"
                    }}｜{{ m.count }}条公告</text
                  ><text class="muted block"
                    >{{ m.date }}
                    {{
                      m.count
                        ? (m.mode === "new" ? "新增" : "有") +
                          m.count +
                          "条招聘公告" +
                          (m.mode === "closing" ? "截止" : "")
                        : m.mode === "new"
                          ? "暂无新增"
                          : "暂无今日截止公告"
                    }}，点击查看。</text
                  ></view
                ></view
              ><EmptyState
                v-if="!s.data.length"
                title="暂无统计提醒"
                description="有新增或截止公告时，会在这里提醒你"
            /></template>
            <template v-if="s.route === 'membership'">
              <view class="membership-hero"
                ><view class="membership-crown"
                  ><Icon name="crown" color="#007AFF" :size="44" /></view
                ><text class="membership-title">让好机会，无限靠近</text
                ><text class="muted">专注求职，每一步都从容</text
                ><view class="benefit-grid"
                  ><view
                    ><Icon name="file" color="#007AFF" /><text
                      >不限条数</text
                    ></view
                  ><view
                    ><Icon name="link" color="#007AFF" /><text
                      >官方入口</text
                    ></view
                  ><view
                    ><Icon name="calendar" color="#007AFF" /><text
                      >日报回看</text
                    ></view
                  ></view
                ></view
              >
              <view class="section-heading plain"
                ><text>选择适合你的计划</text
                ><text class="muted">{{
                  s.demo ? "演示价格" : "配置价格"
                }}</text></view
              ><view class="packages"
                ><button
                  class="ui-reset package-card"
                  v-for="p in s.config.packages"
                  :key="p.id"
                  :class="{ active: selectedPackage === p.id }"
                  @click="selectedPackage = p.id"
                >
                  <view
                    ><view class="row"
                      ><text class="strong">{{ p.title }}</text
                      ><text v-if="p.recommended" class="recommended-label"
                        >推荐</text
                      ></view
                    ><text class="muted block">{{ p.subtitle }}</text
                    ><text class="package-duration">{{
                      p.type === "partner" ? "永久有效" : p.days + "天有效期"
                    }}</text></view
                  ><view
                    ><text class="price">¥{{ money(p.cents) }}</text
                    ><view
                      class="radio"
                      :class="{ active: selectedPackage === p.id }"
                      ><Icon
                        v-if="selectedPackage === p.id"
                        name="check"
                        color="#FFFFFF"
                        :size="13" /></view
                  ></view></button></view
              ><view v-if="s.demo" class="info-note"
                >演示支付不扣款，不连接微信商户。真实上线前需配置支付服务。</view
              ><view v-if="formError" class="form-error">{{ formError }}</view
              ><button
                class="ui-reset primary full"
                :disabled="submitting"
                @click="s.guard(() => run(() => s.buy(selectedPackage)))"
              >
                {{
                  submitting
                    ? "处理中…"
                    : (s.demo ? "演示开通" : "立即开通") +
                      " · ¥" +
                      money(
                        s.config.packages.find((p) => p.id === selectedPackage)
                          ?.cents,
                      )
                }}</button
              ><text class="terms">继续即代表同意会员服务协议与隐私政策</text>
            </template>
            <template
              v-if="
                ['orders', 'rights', 'distribution-orders'].includes(s.route)
              "
            >
              <view class="info-note">{{
                s.route === "rights"
                  ? "权益来源独立保存；合伙人永久有效"
                  : s.route === "orders"
                    ? "购买与续费记录；退款由管理员处理"
                    : "仅展示产生本人佣金的订单"
              }}</view
              ><view
                v-for="item in s.route === 'distribution-orders'
                  ? s.distribution?.orders || []
                  : s.data"
                :key="item.id"
                class="order-card card"
                ><view class="row-between"
                  ><text class="strong">{{
                    item.title ||
                    {
                      vip: "VIP会员",
                      partner: "职场合伙人",
                      senior: "高级合伙人",
                    }[item.type]
                  }}</text
                  ><text class="status-badge">{{
                    item.revoked
                      ? "已撤销"
                      : {
                          paid: "已支付",
                          pending: "待支付",
                          refunded: "已退款",
                        }[item.status] || item.source
                  }}</text></view
                ><text class="muted block"
                  >{{ date(item.at) }} ·
                  {{ item.days ? item.days + "天" : "永久有效" }}</text
                ><text v-if="item.cents" class="price small-price"
                  >¥{{ money(item.cents) }}</text
                ><text class="order-id"
                  >{{ s.route === "rights" ? "来源ID" : "订单号" }}
                  {{ item.id }}</text
                ><text v-if="item.refundReason" class="muted block"
                  >退款原因：{{ item.refundReason }}</text
                ></view
              ><EmptyState
                v-if="
                  !(
                    s.route === 'distribution-orders'
                      ? s.distribution?.orders || []
                      : s.data
                  ).length
                "
                title="暂无记录"
                description="相关交易和权益会在这里保存"
              />
            </template>
            <template v-if="s.route === 'profile-edit'"
              ><view class="form-section card"
                ><label
                  >昵称<input
                    v-model="profileDraft.nickname"
                    placeholder="请输入昵称"
                    maxlength="20" /></label
                ><label
                  >个人头像<view class="avatar-upload"
                    ><Avatar :value="profileDraft.avatar" /><button
                      class="ui-reset secondary small"
                      @click="chooseAvatar"
                    >
                      选择头像
                    </button></view
                  ></label
                ><label
                  >毕业届别<input
                    v-model="profileDraft.batch"
                    placeholder="例如2027届" /></label
                ><label
                  >招聘专业<input
                    v-model="profileDraft.major"
                    placeholder="填写你的专业" /></label
                ><label
                  >求职状态<input
                    v-model="profileDraft.seeking"
                    placeholder="例如求职中" /></label></view
              ><view v-if="formError" class="form-error">{{ formError }}</view
              ><button
                class="ui-reset primary full"
                :disabled="submitting"
                @click="saveProfile"
              >
                {{ submitting ? "保存中…" : "保存资料" }}</button
              ><button
                class="ui-reset secondary full"
                @click="s.nav('account')"
              >
                账号安全与绑定
              </button></template
            >
            <template v-if="s.route === 'account'"
              ><view class="card account-summary"
                ><Icon name="shield" :size="32" color="#007AFF" /><view
                  ><text class="strong">账号安全</text
                  ><text class="muted block"
                    >{{ s.user?.phone?.slice(0, 3) }}****{{
                      s.user?.phone?.slice(-4)
                    }}
                    · 微信{{ s.user?.wechatBound ? "已绑定" : "未绑定" }}</text
                  ></view
                ></view
              ><view class="segmented"
                ><button
                  class="ui-reset"
                  v-for="a in [
                    { id: 'phone', label: '更换手机号' },
                    { id: 'password', label: '设置密码' },
                    { id: 'wechat', label: '微信绑定' },
                  ]"
                  :key="a.id"
                  :class="{ active: accountAction === a.id }"
                  @click="accountAction = a.id"
                >
                  {{ a.label }}
                </button></view
              ><view class="form-section card"
                ><label v-if="accountAction === 'phone'"
                  >新手机号<input
                    v-model="accountPhone"
                    type="number"
                    maxlength="11"
                    placeholder="请输入新手机号" /></label
                ><label v-if="accountAction === 'password'"
                  >新密码<input
                    v-model="accountPassword"
                    password
                    placeholder="至少8位" /></label
                ><view v-if="accountAction === 'wechat'" class="info-note">{{
                  s.user?.wechatBound
                    ? "解绑后保留手机号登录方式"
                    : "将微信登录关联至当前账号"
                }}</view
                ><label
                  >身份验证码<input
                    v-model="accountCode"
                    type="number"
                    maxlength="6"
                    placeholder="请输入身份验证码" /></label
                ><text v-if="s.demo" class="muted"
                  >演示验证码：123456，真实短信/微信未接入</text
                ></view
              ><view v-if="formError" class="form-error">{{ formError }}</view
              ><button
                class="ui-reset primary full"
                :disabled="submitting"
                @click="saveAccount"
              >
                {{
                  accountAction === "wechat"
                    ? s.user?.wechatBound
                      ? "解绑微信"
                      : "绑定微信"
                    : "验证并保存"
                }}
              </button></template
            >
            <template v-if="s.route === 'help'"
              ><view class="help-hero"
                ><Icon name="help" color="#007AFF" :size="46" /><text
                  class="strong"
                  >有什么可以帮到你？</text
                ><text class="muted">常见问题与使用指南</text></view
              ><view class="menu-group card"
                ><view
                  v-for="(h, i) in s.config.help"
                  :key="h.title"
                  class="faq"
                  ><button
                    class="ui-reset menu-row"
                    @click="helpExpanded = helpExpanded === i ? -1 : i"
                  >
                    <text>{{ h.title }}</text
                    ><Icon name="down" :size="16" /></button
                  ><text v-if="helpExpanded === i" class="faq-answer">{{
                    h.body
                  }}</text></view
                ></view
              ></template
            >
            <template v-if="s.route === 'about'"
              ><view class="about-hero"
                ><view class="brand-symbol"
                  ><Icon name="grid" color="#FFFFFF" :size="28" /></view
                ><text class="membership-title">校招指南</text
                ><text class="muted">让每一步求职，更有方向</text
                ><text class="version">V1.0.0 · 开发演示版</text></view
              ><view class="card prose"
                ><text class="strong">为你的下一站，做好准备</text
                ><text
                  >校招指南将校招公告、求职日报、个人投递进展和会员服务连接起来，帮助你更清晰地管理求职旅程。</text
                ><text class="strong">隐私与服务说明</text
                ><text
                  >个人资料、收藏与投递记录仅向本人开放。客户及收款资料需授权访问。本演示使用测试数据，真实服务需上线前补齐法律审核、隐私政策和用户协议。</text
                ><text
                  >所有招聘公告请以官方来源为准；本演示不提供真实支付或外部消息推送。</text
                ></view
              ></template
            >
            <template v-if="['distribution', 'partner'].includes(s.route)">
              <template v-if="s.distributor"
                ><view class="distribution-identity"
                  ><Avatar :value="s.user?.avatar" small /><text
                    class="strong"
                    >{{ s.user?.nickname }}</text
                  ><text class="gold-badge"
                    ><Icon
                      v-if="s.isPartner"
                      name="crown"
                      :size="12"
                      color="#986225"
                    />{{ s.isPartner ? s.entitlement.label : "分销员" }}</text
                  ><text class="referrer"
                    >推荐人：{{ s.distribution?.referrer }}</text
                  ></view
                >
                <template v-if="s.route === 'distribution'"
                  ><view class="balance-panel card"
                    ><view class="row-between"
                      ><view
                        ><text class="balance-label"
                          >可提现余额 <Icon name="info" :size="13" /></text
                        ><text class="balance-number"
                          >¥ {{ money(s.distribution?.wallet.available) }}</text
                        ></view
                      ><button
                        class="ui-reset primary withdraw-button"
                        @click="s.nav('withdraw')"
                      >
                        提现
                      </button></view
                    ><view class="balance-stats"
                      ><view
                        ><text>已提现</text
                        ><text
                          >¥{{ money(s.distribution?.wallet.paid) }}</text
                        ></view
                      ><view
                        ><text>提现处理中</text
                        ><text
                          >¥{{ money(s.distribution?.wallet.pending) }}</text
                        ></view
                      ><view
                        ><text>累计佣金</text
                        ><text
                          >¥{{ money(s.distribution?.wallet.total) }}</text
                        ></view
                      ></view
                    ></view
                  ><view
                    v-if="s.distribution?.wallet.recovery"
                    class="form-error"
                    >待追回 ¥{{
                      money(s.distribution.wallet.recovery)
                    }}，结清前不可提现</view
                  ><view class="distribution-stats card"
                    ><view
                      v-for="stat in [
                        {
                          label: '今日佣金',
                          value: '¥' + money(s.distribution?.today),
                        },
                        {
                          label: '本月佣金',
                          value: '¥' + money(s.distribution?.thisMonth),
                        },
                        {
                          label: '累计订单',
                          value: s.distribution?.orderCount,
                        },
                        {
                          label: '今日推荐',
                          value: s.distribution?.todayReferrals,
                        },
                        {
                          label: '付费客户',
                          value: s.distribution?.paidCustomers,
                        },
                        {
                          label: '转化率',
                          value: s.distribution?.conversion + '%',
                        },
                      ]"
                      :key="stat.label"
                      ><text>{{ stat.label }}</text
                      ><text>{{ stat.value }}</text></view
                    ></view
                  ></template
                >
                <template v-else
                  ><view class="identity-card gold partner-hero"
                    ><Icon name="crown" :size="40" color="#FFEDCC" /><view
                      ><text>{{ s.entitlement.label }}</text
                      ><text>永久 VIP 权益 · 与伙伴一起成长</text></view
                    ></view
                  ><view class="info-note">{{
                    s.isSenior
                      ? "高级合伙人可管理本人会员赠送，身份不等于后台管理员。"
                      : "职场合伙人拥有团队权益；高级赠送权限仅由管理员授权。"
                  }}</view></template
                >
                <view class="menu-group card"
                  ><button
                    class="ui-reset menu-row"
                    v-for="m in s.route === 'distribution'
                      ? distributionMenus
                      : partnerMenus"
                    :key="m.label"
                    @click="menuClick(m)"
                  >
                    <Icon :name="m.icon" :size="20" color="#17233B" /><text>{{
                      m.label
                    }}</text
                    ><Icon name="chevron" :size="16" /></button></view
                ><text v-if="s.demo" class="terms"
                  >演示账本 · 示例佣金不代表真实可提现资金</text
                ></template
              >
              <EmptyState
                v-else
                title="开启你的分销之旅"
                description="申请立即开通，不改变会员身份"
                action="申请分销"
                @action="s.modal = 'distribution-apply'"
              />
            </template>
            <template v-if="s.route === 'funds' && s.distribution"
              ><view class="fund-overview card"
                ><text class="muted">累计已结佣金</text
                ><text class="balance-number"
                  >¥{{ money(s.distribution.wallet.total) }}</text
                ><view class="balance-stats"
                  ><view
                    ><text>可提现</text
                    ><text
                      >¥{{ money(s.distribution.wallet.available) }}</text
                    ></view
                  ><view
                    ><text>处理中</text
                    ><text
                      >¥{{ money(s.distribution.wallet.pending) }}</text
                    ></view
                  ><view
                    ><text>已提现</text
                    ><text>¥{{ money(s.distribution.wallet.paid) }}</text></view
                  ></view
                ></view
              ><view class="section-heading"
                ><text>佣金明细</text
                ><text class="muted">收入与冲回独立留痕</text></view
              ><view
                v-for="l in s.distribution.ledger.slice().reverse()"
                :key="l.id"
                class="ledger-row card"
                ><view
                  ><text class="strong">{{
                    l.kind === "reversal" ? "佣金冲回" : l.channel + "佣金"
                  }}</text
                  ><text class="muted block"
                    >{{ date(l.at) }} · {{ l.rate || ""
                    }}{{ l.rate ? "%" : "" }}</text
                  ><text class="order-id">订单 {{ l.orderId }}</text></view
                ><text :class="l.cents > 0 ? 'success' : 'danger'"
                  >{{ l.cents > 0 ? "+" : "" }}¥{{ money(l.cents) }}</text
                ></view
              ><view class="section-heading"
                ><text>提现记录</text
                ><button
                  class="ui-reset text-button"
                  @click="s.nav('withdraw')"
                >
                  申请提现
                </button></view
              ><view
                v-for="w in s.distribution.withdrawals.slice().reverse()"
                :key="w.id"
                class="card withdrawal-record"
                ><view class="row-between"
                  ><text class="strong"
                    >{{ w.method }}提现 · ¥{{ money(w.cents) }}</text
                  ><text class="status-badge">{{ w.status }}</text></view
                ><text class="muted block">{{ date(w.at) }} · {{ w.name }}</text
                ><text v-if="w.reason" class="muted block"
                  >{{ w.status === "已打款" ? "流水/凭证：" : "原因："
                  }}{{ w.reason }}</text
                ><button
                  class="ui-reset text-button danger-text"
                  v-if="w.status === '待审核'"
                  @click="
                    s.modal = 'cancel-withdraw';
                    s.modalPayload = w;
                  "
                >
                  撤销申请
                </button></view
              ><EmptyState
                v-if="!s.distribution.withdrawals.length"
                title="暂无提现记录"
                description="提交后可在这里查看审核进度"
            /></template>
            <template
              v-if="['customers', 'team'].includes(s.route) && s.distribution"
              ><view class="list-summary"
                ><text
                  >共
                  {{
                    (s.route === "customers"
                      ? s.distribution.customers
                      : s.distribution.team
                    ).length
                  }}
                  位{{ s.route === "team" ? "团队成员" : "客户" }}</text
                ></view
              ><view
                v-for="c in s.route === 'customers'
                  ? s.distribution.customers
                  : s.distribution.team"
                :key="c.id"
                class="card customer-card"
                ><view class="row"
                  ><Avatar :value="c.avatar" small /><view
                    ><text class="strong">{{ c.nickname }}</text
                    ><text class="muted block"
                      >{{ c.phone }} · {{ date(c.at) }}注册</text
                    ></view
                  ></view
                ><text class="order-id">用户ID {{ c.id }}</text
                ><text v-if="s.route === 'team'" class="muted block"
                  >有效访问 {{ c.visits }} 人 · {{ date(c.teamAt) }} 入团</text
                ><view
                  v-for="o in c.orders || []"
                  :key="o.id"
                  class="customer-order"
                  >{{ o.title }} · ¥{{ money(o.cents) }} ·
                  {{ date(o.at) }}</view
                ></view
              ><EmptyState
                v-if="
                  !(
                    s.route === 'customers'
                      ? s.distribution.customers
                      : s.distribution.team
                  ).length
                "
                :title="s.route === 'team' ? '暂无团队成员' : '暂无推荐客户'"
                description="分享你的推广链接，邀请伙伴一起成长"
                action="前往推广工具"
                @action="s.nav('promotion')"
            /></template>
            <template v-if="s.route === 'promotion'"
              ><view class="promotion-poster"
                ><text class="poster-eyebrow">CAMPUS GUIDE</text
                ><text class="poster-title">好机会，<br />不错过。</text
                ><text>招聘信息 · 求职日报<br />投递记录 · 进展追踪</text
                ><view class="poster-card"
                  ><Icon name="grid" color="#007AFF" :size="38" /><text
                    class="strong"
                    >{{ s.user?.nickname }} 邀请你加入</text
                  ><text class="muted">一起开启下一段精彩</text></view
                ><text class="poster-code"
                  >推荐标识：{{ s.user?.id }}</text
                ></view
              ><view class="promotion-actions"
                ><button
                  class="ui-reset primary"
                  @click="s.copy(promoLink, '推广链接已复制')"
                >
                  <Icon
                    name="link"
                    color="#FFFFFF"
                    :size="18"
                  />复制链接</button
                ><button class="ui-reset secondary" @click="downloadPoster">
                  <Icon name="upload" color="#007AFF" :size="18" />保存海报
                </button></view
              ><button
                class="ui-reset text-button full"
                @click="s.copy(s.user.id, '推荐标识已复制')"
              >
                复制推荐标识</button
              ><view class="info-note"
                >只有真实登录用户打开推广入口才计有效访问，分享点击不会计入。</view
              ></template
            >
            <template v-if="s.route === 'withdraw'"
              ><view class="withdraw-balance"
                ><text class="muted">可提现余额</text
                ><text class="balance-number"
                  >¥{{ money(s.wallet?.available) }}</text
                ><text class="muted">最低提现金额 ¥50.00</text></view
              ><view class="form-section card"
                ><label
                  >提现金额 <text class="required">*</text
                  ><view class="amount-input"
                    ><text>¥</text
                    ><input
                      v-model="withdraw.amount"
                      type="digit"
                      placeholder="请输入提现金额" /></view
                  ><button
                    class="ui-reset text-button"
                    @click="withdraw.amount = money(s.wallet?.available)"
                  >
                    全部提现
                  </button></label
                ><label
                  >收款方式 <text class="required">*</text
                  ><view class="payment-methods"
                    ><button
                      class="ui-reset"
                      v-for="m in ['微信', '支付宝']"
                      :key="m"
                      :class="{ active: withdraw.method === m }"
                      @click="withdraw.method = m"
                    >
                      {{ m
                      }}<Icon
                        v-if="withdraw.method === m"
                        name="check"
                        :size="16"
                        color="#007AFF"
                      /></button></view></label
                ><label
                  >收款人姓名 <text class="required">*</text
                  ><input
                    v-model="withdraw.name"
                    placeholder="与收款账户一致的真实姓名" /></label
                ><label
                  >收款码 <text class="required">*</text
                  ><view v-if="withdraw.image" class="upload-preview"
                    ><image :src="withdraw.image" mode="aspectFit" /><button
                      class="ui-reset icon-button"
                      aria-label="删除收款码"
                      @click="withdraw.image = ''"
                    >
                      ×
                    </button></view
                  ><button
                    class="ui-reset upload-area"
                    v-else
                    @click="chooseImage"
                  >
                    <Icon name="upload" color="#8793A6" :size="28" /><text
                      >上传收款码图片</text
                    ><text class="muted">支持 JPG、PNG · 3MB 以内</text>
                  </button></label
                ></view
              ><view v-if="formError" class="form-error" role="alert">{{
                formError
              }}</view
              ><view v-if="s.wallet?.recovery" class="form-error"
                >待追回金额未结清，暂不可提现</view
              ><view class="info-note"
                >提交后金额转入处理中，由管理员审核打款。请确认收款资料准确。</view
              ><button
                class="ui-reset primary full"
                :disabled="
                  submitting ||
                  s.wallet?.available < 5000 ||
                  s.wallet?.recovery > 0
                "
                @click="submitWithdraw"
              >
                {{
                  submitting
                    ? "提交中…"
                    : "提交提现申请" +
                      (Number(withdraw.amount) > 0
                        ? " · ¥" +
                          money(Math.round(Number(withdraw.amount) * 100))
                        : "")
                }}
              </button></template
            >
            <template v-if="s.route === 'gifts'"
              ><template v-if="s.isSenior"
                ><view class="gift-quotas"
                  ><view
                    v-for="q in s.data.quotas || []"
                    :key="q.type"
                    class="card"
                    ><Icon name="gift" color="#B1874E" /><text>{{
                      q.type === "vip" ? "VIP会员" : "职场合伙人"
                    }}</text
                    ><text class="quota-number"
                      >{{ q.limit - q.used }}<text>/ {{ q.limit }}</text></text
                    ><text class="muted">本月剩余额度</text></view
                  ></view
                ><view class="form-section card"
                  ><label
                    >赠送权益<view class="payment-methods"
                      ><button
                        class="ui-reset"
                        v-for="q in s.data.quotas || []"
                        :key="q.type"
                        :class="{ active: giftType === q.type }"
                        @click="giftType = q.type"
                      >
                        {{ q.type === "vip" ? "VIP会员" : "职场合伙人" }}
                      </button></view
                    ></label
                  ><label
                    >领取有效期（天）<input
                      v-model="giftDays"
                      type="number"
                      :placeholder="
                        '1至' + s.config.giftMaxDays + '天'
                      " /></label></view
                ><view v-if="formError" class="form-error">{{ formError }}</view
                ><button
                  class="ui-reset primary full"
                  :disabled="submitting"
                  @click="generate"
                >
                  {{ submitting ? "生成中…" : "生成兑换码 / 领取链接" }}</button
                ><view class="section-heading"
                  ><text>我的赠送记录</text
                  ><text class="muted">生成即占用额度</text></view
                ><view
                  v-for="g in s.data.items || []"
                  :key="g.id"
                  class="gift-record card"
                  ><view class="row-between"
                    ><text class="strong">{{
                      g.type === "vip" ? g.days + "天VIP" : "职场合伙人"
                    }}</text
                    ><text class="status-badge">{{ g.status }}</text></view
                  ><text class="gift-code">{{ g.code }}</text
                  ><text class="muted block"
                    >生成 {{ date(g.at) }} · 到期 {{ date(g.expires) }}</text
                  ><text v-if="g.reason" class="muted block">{{
                    g.reason
                  }}</text
                  ><view v-if="g.status === '待领取'" class="gift-actions"
                    ><button
                      class="ui-reset text-button"
                      @click="s.copy(g.code)"
                    >
                      复制兑换码</button
                    ><button
                      class="ui-reset text-button"
                      @click="
                        s.copy(
                          promoLink.replace('screen=home', 'screen=redeem') +
                            '&code=' +
                            g.code,
                        )
                      "
                    >
                      复制领取链接</button
                    ><button
                      class="ui-reset danger-text"
                      @click="
                        s.modal = 'revoke-gift';
                        s.modalPayload = g;
                      "
                    >
                      作废
                    </button></view
                  ></view
                ><view class="info-note"
                  >额度每月重置，不结转。作废与过期仅退回生成月份的额度；已领取不退回。</view
                ></template
              ><EmptyState
                v-else
                title="当前无赠送权限"
                description="仅高级合伙人可生成会员赠送凭证"
            /></template>
            <template v-if="s.route === 'redeem'"
              ><view class="redeem-hero"
                ><view class="gift-illustration"
                  ><Icon name="gift" :size="60" color="#007AFF" /></view
                ><text class="membership-title">一份心意，更多可能</text
                ><text class="muted">输入兑换码，领取你的求职权益</text></view
              ><view class="form-section card"
                ><label
                  >会员兑换码<input
                    v-model="redeemCode"
                    :placeholder="s.params.code || '请输入会员兑换码'"
                    @focus="
                      !redeemCode &&
                      s.params.code &&
                      (redeemCode = s.params.code)
                    " /></label></view
              ><view v-if="formError" class="form-error">{{ formError }}</view
              ><button
                class="ui-reset primary full"
                :disabled="submitting"
                @click="redeem"
              >
                {{ submitting ? "领取中…" : "确认领取" }}</button
              ><view class="info-note"
                >兑换无需支付。已拥有永久合伙人权益时不会核销凭证。</view
              ></template
            >
            <template v-if="s.route === 'admin' && s.admin">
              <view class="admin-role"
                ><Icon name="shield" color="#007AFF" /><text
                  >{{ s.user.role === "admin" ? "超级管理员" : "招聘编辑" }} ·
                  所有变更保存操作日志</text
                ></view
              ><scroll-view scroll-x class="admin-tabs"
                ><view
                  ><button
                    class="ui-reset"
                    v-for="tab in [
                      { id: 'jobs', label: '招聘公告' },
                      { id: 'import', label: '模板导入' },
                      { id: 'topics', label: '专题维护' },
                      ...(s.user.role === 'admin'
                        ? [
                            { id: 'users', label: '用户权益' },
                            { id: 'orders', label: '订单退款' },
                            { id: 'withdrawals', label: '提现审核' },
                            { id: 'config', label: '系统配置' },
                          ]
                        : []),
                      { id: 'audit', label: '操作日志' },
                    ]"
                    :key="tab.id"
                    :class="{ active: adminTab === tab.id }"
                    @click="adminTab = tab.id"
                  >
                    {{ tab.label }}
                  </button></view
                ></scroll-view
              >
              <template v-if="adminTab === 'jobs'"
                ><view class="row-between"
                  ><input
                    v-model="adminQuery"
                    class="admin-search"
                    placeholder="搜索公告"
                  /><button
                    class="ui-reset primary small"
                    @click="openAdminJob()"
                  >
                    新建公告
                  </button></view
                ><view
                  v-for="j in s.admin.jobs.filter((j) =>
                    j.title.includes(adminQuery),
                  )"
                  :key="j.id"
                  class="card admin-job"
                  ><view class="row-between"
                    ><text class="strong">{{ j.title }}</text
                    ><text class="status-badge">{{
                      !j.published ? "草稿" : j.hidden ? "已下架" : "已发布"
                    }}</text></view
                  ><text class="muted block"
                    >上传 {{ date(j.uploadedAt) }} · {{ j.nature }}</text
                  ><view class="admin-actions"
                    ><button
                      class="ui-reset text-button"
                      @click="openAdminJob(j)"
                    >
                      编辑</button
                    ><button
                      class="ui-reset text-button"
                      @click="
                        run(async () => {
                          await s.request('/admin/jobs/' + j.id, {
                            method: 'PATCH',
                            body: !j.published
                              ? {
                                  published: true,
                                  hidden: false,
                                  uploadedAt: new Date().toISOString(),
                                }
                              : { hidden: !j.hidden },
                          });
                          await s.loadRoute();
                        })
                      "
                    >
                      {{
                        !j.published ? "发布" : j.hidden ? "上架" : "下架"
                      }}</button
                    ><button
                      class="ui-reset danger-text"
                      @click="
                        s.modal = 'admin-delete';
                        s.modalPayload = j;
                      "
                    >
                      删除
                    </button></view
                  ></view
                ></template
              >
              <template v-if="adminTab === 'import'"
                ><view class="info-note"
                  >上传标准 Excel .xlsx 模板，或粘贴 CSV
                  内容。先预览校验，再保存为草稿；更新已有公告必须填写公告ID。</view
                ><button
                  class="ui-reset secondary full"
                  @click="downloadTemplate"
                >
                  下载标准 Excel 模板</button
                ><button
                  class="ui-reset secondary full"
                  @click="chooseImportFile"
                >
                  上传 Excel 文件并校验</button
                ><text v-if="importFileName" class="muted block">{{
                  importFileName
                }}</text
                ><textarea
                  v-model="importText"
                  class="import-text"
                  placeholder="将模板 CSV 内容粘贴到这里"
                /><button class="ui-reset primary full" @click="previewImport">
                  预览校验</button
                ><text
                  v-for="e in importErrors"
                  :key="e"
                  class="form-error block"
                  >{{ e }}</text
                ><view
                  v-for="(j, i) in importRows"
                  :key="i"
                  class="card import-row"
                  ><text
                    >{{ i + 2 }} · {{ j.title }} ·
                    {{ j.id ? "更新现有" : "新建草稿" }}</text
                  ></view
                ><button
                  class="ui-reset secondary full"
                  v-if="importRows.length"
                  :disabled="!!importErrors.length || submitting"
                  @click="
                    run(async () => {
                      await s.request('/admin/import', {
                        method: 'POST',
                        body: { items: importRows },
                      });
                      await s.loadRoute();
                      importRows = [];
                      importText = '';
                      s.notify('草稿已保存，请检查后发布');
                    })
                  "
                >
                  确认保存 {{ importRows.length }} 条草稿
                </button></template
              >
              <template v-if="adminTab === 'topics'"
                ><view class="info-note"
                  >维护专题名称、图标、颜色、顺序和初始筛选条件。专题使用与首页相同的公告查询规则。</view
                ><textarea
                  v-model="topicsText"
                  class="config-text"
                  auto-height
                /><button
                  class="ui-reset primary full"
                  :disabled="submitting"
                  @click="
                    run(async () => {
                      let topics;
                      try {
                        topics = JSON.parse(topicsText);
                      } catch {
                        throw new Error('JSON格式错误');
                      }
                      await s.request('/admin/topics', {
                        method: 'PATCH',
                        body: { topics },
                      });
                      await s.loadRoute();
                      await s.bootstrap();
                      s.notify('专题已保存');
                    })
                  "
                >
                  保存专题
                </button></template
              ><template v-if="adminTab === 'users'"
                ><view
                  v-for="u in s.admin.users"
                  :key="u.id"
                  class="card admin-job"
                  ><text class="strong">{{ u.nickname }}</text
                  ><text class="muted block"
                    >{{ u.phone.slice(0, 3) }}****{{ u.phone.slice(-4) }} ·
                    {{ date(u.at) }}注册 · {{ u.id }}</text
                  ><view class="admin-actions"
                    ><button
                      class="ui-reset text-button"
                      v-for="a in [
                        { type: 'vip', label: '授权VIP' },
                        { type: 'partner', label: '职场' },
                        { type: 'senior', label: '高级' },
                        { type: 'revoke-senior', label: '取消高级' },
                      ]"
                      :key="a.type"
                      @click="
                        s.modal = 'admin-authorize';
                        s.modalPayload = {
                          user: u,
                          type: a.type,
                          label: a.label,
                        };
                      "
                    >
                      {{ a.label }}
                    </button></view
                  ></view
                ></template
              >
              <template v-if="adminTab === 'orders'"
                ><view
                  v-for="o in s.admin.orders"
                  :key="o.id"
                  class="card admin-job"
                  ><view class="row-between"
                    ><text class="strong"
                      >{{ o.title }} · ¥{{ money(o.cents) }}</text
                    ><text class="status-badge">{{ o.status }}</text></view
                  ><text class="order-id">{{ o.id }}</text
                  ><button
                    class="ui-reset danger-text"
                    v-if="o.status === 'paid'"
                    @click="
                      s.modal = 'admin-refund';
                      s.modalPayload = o;
                    "
                  >
                    整笔退款
                  </button></view
                ><EmptyState
                  v-if="!s.admin.orders.length"
                  title="暂无订单"
                  description="用户购买后在这里查看与处理"
              /></template>
              <template v-if="adminTab === 'withdrawals'"
                ><view
                  v-for="w in s.admin.withdrawals"
                  :key="w.id"
                  class="card admin-job"
                  ><view class="row-between"
                    ><text class="strong"
                      >¥{{ money(w.cents) }} · {{ w.name }}</text
                    ><text class="status-badge">{{ w.status }}</text></view
                  ><text class="muted block"
                    >{{ w.method }} · {{ date(w.at) }}</text
                  ><image
                    :src="w.image"
                    class="admin-receipt"
                    mode="aspectFit"
                  /><view class="admin-actions"
                    ><button
                      class="ui-reset text-button"
                      v-if="w.status === '待审核'"
                      @click="
                        s.modal = 'admin-withdraw';
                        s.modalPayload = {
                          w,
                          action: 'approve',
                          label: '审核通过',
                        };
                      "
                    >
                      审核通过</button
                    ><button
                      class="ui-reset danger-text"
                      v-if="w.status === '待审核'"
                      @click="
                        s.modal = 'admin-withdraw';
                        s.modalPayload = {
                          w,
                          action: 'reject',
                          label: '驳回申请',
                        };
                      "
                    >
                      驳回</button
                    ><button
                      class="ui-reset text-button"
                      v-if="w.status === '待打款'"
                      @click="
                        s.modal = 'admin-withdraw';
                        s.modalPayload = {
                          w,
                          action: 'pay',
                          label: '登记打款',
                        };
                      "
                    >
                      登记打款
                    </button></view
                  ></view
                ><EmptyState
                  v-if="!s.admin.withdrawals.length"
                  title="暂无提现申请"
              /></template>
              <template v-if="adminTab === 'config'"
                ><view class="info-note"
                  >配置包含专题、全国省市、字典、套餐、各身份佣金比例、赠送额度、客服内容。金额单位为分；历史佣金规则不回改。</view
                ><textarea
                  v-model="configText"
                  class="config-text"
                  auto-height
                /><button
                  class="ui-reset primary full"
                  :disabled="submitting"
                  @click="
                    run(async () => {
                      let body;
                      try {
                        body = JSON.parse(configText);
                      } catch {
                        throw new Error('JSON格式错误，请检查配置');
                      }
                      await s.request('/admin/config', {
                        method: 'PATCH',
                        body,
                      });
                      await s.loadRoute();
                      await s.bootstrap();
                      s.notify('配置已保存');
                    })
                  "
                >
                  保存系统配置
                </button></template
              >
              <template v-if="adminTab === 'audit'"
                ><view
                  v-for="a in s.admin.audit.slice().reverse()"
                  :key="a.id"
                  class="card audit-row"
                  ><text class="strong">{{ a.action }}</text
                  ><text class="muted block"
                    >{{ date(a.at) }} · {{ a.userId }}</text
                  ><text class="order-id">{{ a.entity }}</text></view
                ><EmptyState
                  v-if="!s.admin.audit.length"
                  title="暂无操作日志" /></template
              ><view v-if="formError" class="form-error">{{ formError }}</view>
            </template>
          </template>
        </view>
      </scroll-view>
      <button
        class="ui-reset floating-add"
        v-if="s.route === 'records' && s.user"
        aria-label="添加投递记录"
        @click="s.openProgress()"
      >
        <Icon name="plus" color="#FFFFFF" :size="28" />
      </button>
      <view v-if="s.route === 'detail' && s.detail" class="detail-bottom"
        ><button class="ui-reset add-progress" @click="s.openProgress()">
          <Icon name="plus" color="#FFFFFF" :size="18" />添加进展</button
        ><view class="detail-actions"
          ><button class="ui-reset" @click="s.favorite(s.detail)">
            <Icon
              :name="s.favoriteIds.includes(s.detail.id) ? 'star' : 'heart'"
              :color="
                s.favoriteIds.includes(s.detail.id) ? '#007AFF' : '#17233B'
              "
            /><text>{{
              s.favoriteIds.includes(s.detail.id) ? "已收藏" : "收藏"
            }}</text></button
          ><button
            class="ui-reset"
            @click="
              s.copy(
                '/pages/index/index?screen=detail&id=' + s.detail.id,
                '公告链接已复制',
              )
            "
          >
            <Icon name="share" color="#17233B" /><text>分享</text></button
          ><button class="ui-reset" @click="s.openLink('sourceUrl')">
            <Icon name="file" color="#17233B" /><text>原文</text></button
          ><button
            class="ui-reset primary apply-button"
            :disabled="s.detail.status !== '投递中'"
            @click="s.openLink('applyUrl')"
          >
            {{
              s.detail.status === "已截止"
                ? "已截止"
                : s.detail.status === "未开始"
                  ? "尚未开始"
                  : "立即投递"
            }}
          </button></view
        ></view
      >
      <view
        v-if="s.route === 'record-detail' && s.activeRecord"
        class="sticky-action"
        ><button
          class="ui-reset primary full"
          @click="s.openProgress(s.activeRecord)"
        >
          添加后续进展
        </button></view
      >
      <view v-if="isTab" class="bottom-tabs"
        ><button
          class="ui-reset"
          v-for="n in navs"
          :key="n.id"
          :class="{ active: s.route === n.id }"
          @click="n.id === 'home' ? s.nav('home') : gateNav(n.id)"
        >
          <Icon
            :name="n.icon"
            :color="s.route === n.id ? '#007AFF' : '#65758E'"
            :size="23"
          /><text>{{ n.title }}</text
          ><view v-if="s.route === n.id" class="tab-active-dot" /></button
      ></view>
      <view v-if="s.toast" class="toast" role="status"
        ><Icon name="check" color="#FFFFFF" :size="18" /><text>{{
          s.toast
        }}</text></view
      >
      <Overlays />
    </view>
    <!-- #ifdef H5 -->
    <view class="desktop-meta"
      ><text>从信息，到行动。</text><view /><text
        >专为毕业生打造的求职工作台</text
      ><text class="desktop-version">开发演示 · V1.0</text></view
    >
    <!-- #endif -->
  </view>
</template>
