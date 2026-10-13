<script setup>
import { ref, computed, watch } from "vue";
import Icon from "./Icon.vue";
import { useCampus, today, statuses } from "../stores/campus";
const s = useCampus();
const clone = (v) => JSON.parse(JSON.stringify(v));
const draft = ref({});
const major = ref("");
const province = ref("广东");
const form = ref({});
const initialForm = ref("");
const dirty = computed(() => JSON.stringify(form.value) !== initialForm.value);
const discard = ref(false);
const errors = ref({});
const error = ref("");
const busy = ref(false);
const reason = ref("");
const loginMode = ref("password");
const phone = ref("");
const password = ref("");
const code = ref("");
const demoType = ref("senior");
const isSheet = computed(() =>
  ["filter", "progress", "login", "demo-accounts", "admin-job"].includes(
    s.modal,
  ),
);
const modalTitle = computed(
  () =>
    ({
      filter: "筛选招聘信息",
      progress: s.modalPayload?.edit
        ? "编辑投递记录"
        : s.modalPayload?.record
          ? "添加后续进展"
          : "添加投递进展",
      login: "欢迎来到校招指南",
      "demo-accounts": "选择演示身份",
      "admin-job": s.modalPayload ? "编辑招聘公告" : "新建招聘公告",
    })[s.modal] || "",
);
watch(
  () => s.modal,
  (modal) => {
    error.value = "";
    errors.value = {};
    busy.value = false;
    discard.value = false;
    reason.value = "";
    if (modal === "filter") {
      draft.value = clone(
        s.route === "list" ? s.listQuery : { ...s.query, scope: undefined },
      );
      major.value = "";
    }
    if (modal === "progress") {
      const r = s.modalPayload?.record,
        j = s.modalPayload?.job;
      form.value = {
        company: r?.company || j?.company || "",
        position: r?.position || "",
        status: r?.status || "已投递",
        date: today(),
        notes: r?.notes || "",
        referralCode: r?.referralCode || "",
        referralUrl: r?.referralUrl || "",
        applyUrl: r?.applyUrl || (s.isMember ? j?.applyUrl : "") || "",
        sourceUrl: r?.sourceUrl || (s.isMember ? j?.sourceUrl : "") || "",
        jobId: r?.jobId || j?.id || "",
      };
      initialForm.value = JSON.stringify(form.value);
    }
    if (modal === "admin-job") {
      const j = s.modalPayload;
      form.value = j
        ? clone(j)
        : {
            company: "",
            title: "",
            nature: "私企",
            degree: "本科及以上",
            batch: "2027届",
            type: "秋招专场",
            industry: "互联网",
            start: "",
            deadline: "",
            uploadedAt: new Date().toISOString(),
            cities: [],
            positions: [],
            majors: [],
            intro: "",
            introImages: [],
            sourceUrl: "",
            applyUrl: "",
            recommended: false,
            published: false,
          };
      form.value.citiesText = form.value.cities.join("、");
      form.value.positionsText = form.value.positions.join("\n");
      form.value.majorsText = form.value.majors.join("\n");
      form.value.imagesText = (form.value.introImages || []).join("\n");
    }
  },
);
function close() {
  if (s.modal === "progress" && dirty.value) {
    discard.value = true;
    return;
  }
  s.closeModal();
}
function toggle(key, value) {
  const values = draft.value[key] || [];
  draft.value[key] = values.includes(value)
    ? values.filter((v) => v !== value)
    : [...values, value];
}
function addMajor() {
  const value = major.value.trim();
  if (value) {
    draft.value.majors = [...new Set([...(draft.value.majors || []), value])];
    major.value = "";
  }
}
function confirmFilter() {
  addMajor();
  const q = clone(draft.value);
  Object.keys(q).forEach((k) => {
    if (
      q[k] === "" ||
      q[k] === undefined ||
      (Array.isArray(q[k]) && !q[k].length)
    )
      delete q[k];
  });
  if (s.route === "list") {
    s.listQuery = q;
    const original = s.config.topics.find((t) => t.name === s.listTitle);
    if (
      original &&
      !Object.entries(original.query).every(([k, v]) =>
        Array.isArray(v) ? v.every((x) => q[k]?.includes(x)) : q[k] === v,
      )
    )
      s.listTitle = "筛选结果";
    if (!q.scope && ["24H新增", "当前可投", "即将截止"].includes(s.listTitle))
      s.listTitle = "筛选结果";
    s.closeModal();
    s.loadList();
  } else {
    s.listQuery = q;
    s.listTitle = "筛选结果";
    s.closeModal();
    s.nav("list");
  }
}
async function submitProgress() {
  errors.value = {};
  for (const key of ["company", "position", "date"])
    if (!form.value[key]?.trim())
      errors.value[key] = {
        company: "请填写单位名称",
        position: "请填写投递岗位",
        date: "请选择进展日期",
      }[key];
  if (Object.keys(errors.value).length) {
    // #ifdef H5
    setTimeout(
      () => document.querySelector('[data-error="true"] input')?.focus(),
      0,
    );
    // #endif
    return;
  }
  busy.value = true;
  error.value = "";
  try {
    await s.saveProgress(
      clone(form.value),
      s.modalPayload?.record,
      s.modalPayload?.edit,
    );
  } catch (e) {
    error.value = e.message;
  } finally {
    busy.value = false;
  }
}
async function login() {
  busy.value = true;
  error.value = "";
  try {
    const result = await s.request("/auth/login", {
      method: "POST",
      body: {
        phone: phone.value,
        password: password.value,
        mode: loginMode.value,
        code: code.value,
        referrerId: s.params.ref,
      },
    });
    await s.finishLogin(result);
  } catch (e) {
    error.value = e.message;
  } finally {
    busy.value = false;
  }
}
async function demo(type = demoType.value) {
  busy.value = true;
  error.value = "";
  try {
    await s.demoLogin(type);
  } catch (e) {
    error.value = e.message;
  } finally {
    busy.value = false;
  }
}
const confirms = computed(
  () =>
    ({
      member: {
        title: "更多机会，等你探索",
        body: "开通 VIP 即可不限条数浏览招聘公告、查看原文与官方投递入口。收藏和投递管理免费开放。",
        primary: "去开通",
        secondary: "暂不开通",
        icon: "crown",
      },
      "delete-record": {
        title: "删除这条投递记录？",
        body: "该记录及全部历史进展将被删除，无法恢复。平台招聘公告不受影响。",
        primary: "删除记录",
        secondary: "保留记录",
        danger: true,
        icon: "trash",
      },
      logout: {
        title: "退出当前账号？",
        body: "个人资料、收藏与投递记录会保留，下次登录可继续查看。",
        primary: "退出登录",
        secondary: "取消",
        icon: "logout",
      },
      "distribution-apply": {
        title: "申请加入分销",
        body: "提交后立即开通，无需审核。会员身份不变，开通前订单不补发佣金。",
        primary: "立即申请",
        secondary: "暂不申请",
        icon: "team",
      },
      "cancel-withdraw": {
        title: "撤销提现申请？",
        body: "仅待审核申请可以撤销，撤销后金额退回可提现余额。",
        primary: "撤销申请",
        secondary: "保留申请",
        danger: true,
        icon: "wallet",
      },
      "revoke-gift": {
        title: "作废赠送凭证？",
        body: "作废后不能再领取，额度仅退回凭证的生成月份。",
        primary: "作废凭证",
        secondary: "保留凭证",
        danger: true,
        icon: "gift",
      },
      "admin-delete": {
        title: "删除招聘公告？",
        body: "公告将退出所有公开列表和统计，个人投递记录继续保留。",
        primary: "删除公告",
        secondary: "取消",
        danger: true,
        icon: "trash",
      },
      "admin-refund": {
        title: "整笔退款",
        body: "演示退款成功后撤回此订单权益，冲回相关佣金并关闭相关未打款提现。其他权益来源保留。",
        primary: "执行整笔退款",
        secondary: "取消",
        danger: true,
        icon: "wallet",
        input: "请填写退款原因",
      },
      "admin-authorize": {
        title: s.modalPayload?.label || "权益授权",
        body: "授权将保存独立权益来源和操作日志。取消高级赠送权限会作废未领取凭证。",
        primary: "确认" + (s.modalPayload?.label || "授权"),
        secondary: "取消",
        icon: "shield",
      },
      "admin-withdraw": {
        title: s.modalPayload?.label || "处理提现",
        body: "处理前服务端会再次校验状态，所有操作留痕。",
        primary: s.modalPayload?.label || "处理",
        secondary: "取消",
        icon: "wallet",
        input:
          s.modalPayload?.action === "pay"
            ? "填写打款流水号或凭证"
            : s.modalPayload?.action === "reject"
              ? "填写驳回原因"
              : null,
      },
    })[s.modal],
);
async function confirm() {
  busy.value = true;
  error.value = "";
  try {
    const payload = s.modalPayload;
    switch (s.modal) {
      case "member":
        s.toMembership();
        return;
      case "logout":
        await s.logout();
        return;
      case "distribution-apply":
        await s.applyDistribution();
        break;
      case "delete-record":
        await s.request("/records/" + payload.id, { method: "DELETE" });
        await s.bootstrap();
        s.nav("records");
        break;
      case "cancel-withdraw":
        await s.request("/withdrawals/" + payload.id + "/cancel", {
          method: "POST",
        });
        await s.bootstrap();
        await s.loadRoute();
        s.notify("申请已撤销，金额已退回");
        break;
      case "revoke-gift":
        await s.request("/gifts/" + payload.id + "/revoke", { method: "POST" });
        await s.loadRoute();
        s.notify("凭证已作废");
        break;
      case "admin-delete":
        await s.request("/admin/jobs/" + payload.id, {
          method: "PATCH",
          body: { deleted: true, hidden: true },
        });
        await s.loadRoute();
        break;
      case "admin-refund":
        await s.request("/admin/orders/" + payload.id + "/refund", {
          method: "POST",
          body: { reason: reason.value },
        });
        await s.loadRoute();
        s.notify("演示退款完成");
        break;
      case "admin-authorize":
        await s.request("/admin/users/" + payload.user.id + "/authorize", {
          method: "POST",
          body: { type: payload.type },
        });
        await s.loadRoute();
        break;
      case "admin-withdraw":
        await s.request("/admin/withdrawals/" + payload.w.id, {
          method: "POST",
          body: { action: payload.action, reason: reason.value },
        });
        await s.loadRoute();
        break;
    }
    s.closeModal();
  } catch (e) {
    error.value = e.message;
  } finally {
    busy.value = false;
  }
}
async function saveJob() {
  busy.value = true;
  error.value = "";
  try {
    const j = clone(form.value);
    j.cities = j.citiesText
      .split(/[、,，]/)
      .map((v) => v.trim())
      .filter(Boolean);
    j.positions = j.positionsText.split("\n").filter(Boolean);
    j.majors = j.majorsText.split("\n").filter(Boolean);
    j.introImages = j.imagesText
      .split("\n")
      .map((v) => v.trim())
      .filter(Boolean);
    delete j.imagesText;
    delete j.citiesText;
    delete j.positionsText;
    delete j.majorsText;
    await s.request("/admin/jobs", { method: "POST", body: j });
    await s.loadRoute();
    s.closeModal();
    s.notify("公告已保存");
  } catch (e) {
    error.value = e.message;
  } finally {
    busy.value = false;
  }
}
const demoAccounts = [
  {
    type: "senior",
    name: "高级合伙人",
    description: "参考图身份 · 含赠送功能",
  },
  {
    type: "normal",
    name: "普通用户",
    description: "每列表10条 · 收藏投递免费",
  },
  { type: "vip", name: "VIP会员", description: "不限浏览 · 时限会员" },
  { type: "partner", name: "职场合伙人", description: "永久VIP · 无高级赠送" },
  { type: "admin", name: "超级管理员", description: "公告、配置、资金管理" },
  { type: "editor", name: "招聘编辑", description: "仅公告与专题维护" },
];
</script>
<template>
  <view v-if="s.modal" class="modal-layer" @click.self="close">
    <view
      v-if="isSheet"
      class="bottom-sheet"
      role="dialog"
      :aria-label="modalTitle"
      aria-modal="true"
    >
      <view class="sheet-handle" /><view class="sheet-heading"
        ><text>{{ modalTitle }}</text
        ><button
          class="ui-reset icon-button"
          aria-label="关闭面板"
          :disabled="busy"
          @click="close"
        >
          <Icon name="close" color="#65758E" /></button
      ></view>
      <scroll-view scroll-y class="sheet-scroll"
        ><view class="sheet-body">
          <template v-if="s.modal === 'filter'">
            <view
              v-if="draft.scope || draft.industries?.length"
              class="filter-section"
              ><text class="filter-label">当前入口条件</text
              ><view class="filter-options"
                ><button
                  class="ui-reset selected"
                  v-if="draft.scope"
                  @click="delete draft.scope"
                >
                  {{
                    {
                      latest: "最近72小时",
                      new24: "最近24小时",
                      open: "当前可投",
                      closing: "即将截止",
                      recommended: "人工推荐",
                      hot: "热度最高",
                    }[draft.scope]
                  }}
                  ×</button
                ><button
                  class="ui-reset selected"
                  v-for="industry in draft.industries || []"
                  :key="industry"
                  @click="toggle('industries', industry)"
                >
                  {{ industry }} ×
                </button></view
              ></view
            >
            <view class="filter-section"
              ><text class="filter-label">招聘专业</text
              ><view class="major-input"
                ><input
                  v-model="major"
                  placeholder="输入专业，回车添加标签"
                  confirm-type="done"
                  @confirm="addMajor"
                  @keydown.enter="addMajor"
                /><button class="ui-reset text-button" @click="addMajor">
                  添加
                </button></view
              ><view class="filter-options"
                ><button
                  class="ui-reset selected"
                  v-for="m in draft.majors || []"
                  :key="m"
                  @click="toggle('majors', m)"
                >
                  {{ m }} ×
                </button></view
              ></view
            >
            <view
              v-for="field in [
                { key: 'natures', label: '企业性质' },
                { key: 'degrees', label: '学历要求' },
                { key: 'batches', label: '招聘批次' },
                { key: 'types', label: '招聘类型' },
              ]"
              :key="field.key"
              class="filter-section"
              ><text class="filter-label">{{ field.label }}</text
              ><view class="filter-options"
                ><button
                  class="ui-reset"
                  :class="{ selected: !draft[field.key]?.length }"
                  @click="draft[field.key] = []"
                >
                  不限</button
                ><button
                  class="ui-reset"
                  v-for="option in s.config.dictionaries[field.key] || []"
                  :key="option"
                  :class="{ selected: draft[field.key]?.includes(option) }"
                  @click="toggle(field.key, option)"
                >
                  {{ option }}
                </button></view
              ></view
            >
            <view class="filter-section"
              ><text class="filter-label"
                >工作地点 <text class="muted">可跨省多选</text></text
              ><view class="selected-cities"
                ><button
                  class="ui-reset"
                  :class="{ selected: !draft.cities?.length }"
                  @click="draft.cities = []"
                >
                  不限</button
                ><button
                  class="ui-reset selected"
                  v-for="city in draft.cities || []"
                  :key="city"
                  @click="toggle('cities', city)"
                >
                  {{ city }} ×
                </button></view
              ><view class="location-picker"
                ><scroll-view scroll-y class="province-list"
                  ><button
                    class="ui-reset"
                    v-for="(cities, p) in s.config.locations"
                    :key="p"
                    :class="{ active: province === p }"
                    @click="province = p"
                  >
                    {{ p }}
                  </button></scroll-view
                ><view class="city-list"
                  ><button
                    class="ui-reset"
                    :class="{ selected: draft.cities?.includes(province) }"
                    @click="toggle('cities', province)"
                  >
                    省内全部</button
                  ><button
                    class="ui-reset"
                    v-for="city in s.config.locations[province] || []"
                    :key="city"
                    :class="{ selected: draft.cities?.includes(city) }"
                    @click="toggle('cities', city)"
                  >
                    {{ city }}
                  </button></view
                ></view
              ></view
            >
          </template>
          <template v-if="s.modal === 'progress'">
            <view class="form-fields"
              ><label :data-error="!!errors.company"
                >单位名称 <text class="required">*</text
                ><input
                  v-model="form.company"
                  placeholder="请输入单位名称"
                /><text v-if="errors.company" class="field-error">{{
                  errors.company
                }}</text></label
              ><label :data-error="!!errors.position"
                >投递岗位 <text class="required">*</text
                ><input
                  v-model="form.position"
                  placeholder="自由填写岗位，例如前端开发工程师"
                /><text v-if="errors.position" class="field-error">{{
                  errors.position
                }}</text></label
              ><label
                >当前状态 <text class="required">*</text
                ><picker
                  :range="statuses"
                  :value="statuses.indexOf(form.status)"
                  :disabled="s.modalPayload?.edit"
                  @change="form.status = statuses[Number($event.detail.value)]"
                  ><view class="picker-field"
                    >{{ form.status
                    }}<Icon name="down" :size="16" /></view></picker
                ><text v-if="s.modalPayload?.edit" class="muted"
                  >状态变更请使用“添加后续进展”，保留历史</text
                ></label
              ><label v-if="!s.modalPayload?.edit" :data-error="!!errors.date"
                >进展日期 <text class="required">*</text
                ><picker
                  mode="date"
                  :value="form.date"
                  @change="form.date = $event.detail.value"
                  ><view class="picker-field"
                    >{{ form.date
                    }}<Icon name="calendar" :size="18" /></view></picker
                ><text v-if="errors.date" class="field-error">{{
                  errors.date
                }}</text></label
              ><label
                >备注 <text class="optional">选填</text
                ><textarea
                  v-model="form.notes"
                  placeholder="记录这一次进展、面试感受或后续安排"
                  maxlength="2000"
                /></label
              ><label v-if="!s.modalPayload?.record && !s.modalPayload?.job"
                >关联公告 <text class="optional">选填</text
                ><input
                  v-model="form.jobId"
                  placeholder="可填写平台公告ID，也可不关联" /></label
              ><text class="subform-heading"
                >附加信息 <text class="muted">仅影响你的个人记录</text></text
              ><label
                >内推码<input
                  v-model="form.referralCode"
                  placeholder="选填" /></label
              ><label
                >内推链接<input
                  v-model="form.referralUrl"
                  placeholder="选填" /></label
              ><label
                >投递地址<input
                  v-model="form.applyUrl"
                  placeholder="选填，可填写自己的链接" /></label
              ><label
                >公告原文<input
                  v-model="form.sourceUrl"
                  placeholder="选填" /></label
            ></view>
          </template>
          <template v-if="s.modal === 'login'">
            <view class="login-intro"
              ><view class="brand-symbol"
                ><Icon name="grid" color="#FFFFFF" :size="24" /></view
              ><text>让每一步求职，更有方向</text></view
            ><view class="segmented"
              ><button
                class="ui-reset"
                :class="{ active: loginMode === 'password' }"
                @click="loginMode = 'password'"
              >
                密码登录</button
              ><button
                class="ui-reset"
                :class="{ active: loginMode === 'code' }"
                @click="loginMode = 'code'"
              >
                验证码登录
              </button></view
            ><view class="form-fields"
              ><label
                >手机号<input
                  v-model="phone"
                  type="number"
                  maxlength="11"
                  placeholder="请输入手机号" /></label
              ><label v-if="loginMode === 'password'"
                >密码<input
                  v-model="password"
                  password
                  placeholder="请输入密码" /></label
              ><label v-else
                >验证码<view class="code-input"
                  ><input
                    v-model="code"
                    type="number"
                    maxlength="6"
                    placeholder="请输入验证码"
                  /><button
                    class="ui-reset text-button"
                    @click="
                      s.notify(
                        s.demo ? '演示验证码：123456' : '短信服务尚未配置',
                      )
                    "
                  >
                    获取验证码
                  </button></view
                ><text v-if="s.demo" class="muted"
                  >演示验证码 123456，不会发送真实短信</text
                ></label
              ></view
            ><button
              class="ui-reset primary full"
              :disabled="busy"
              @click="login"
            >
              {{ busy ? "登录中…" : "登录" }}</button
            ><button
              class="ui-reset secondary full"
              :disabled="busy"
              @click="
                s.demo ? demo('senior') : s.notify('微信登录适配器尚未配置')
              "
            >
              {{ s.demo ? "微信登录（演示）" : "微信登录" }}</button
            ><view v-if="s.demo" class="demo-login"
              ><text>仅用于开发验证，不使用真实个人资料</text
              ><button
                class="ui-reset text-button"
                @click="s.modal = 'demo-accounts'"
              >
                选择演示身份
                <Icon
                  name="chevron"
                  color="#007AFF"
                  :size="13"
                /></button></view
            ><text class="terms"
              >使用即代表同意演示环境服务说明 · 可随时取消登录</text
            >
          </template>
          <template v-if="s.modal === 'demo-accounts'"
            ><view class="info-note"
              >不同身份使用独立测试账号，数据持久保存。管理权限与合伙人等级独立。</view
            ><button
              class="ui-reset demo-account"
              v-for="a in demoAccounts"
              :key="a.type"
              :disabled="busy"
              @click="demo(a.type)"
            >
              <view class="round-icon blue-soft"
                ><Icon
                  :name="
                    ['admin', 'editor'].includes(a.type)
                      ? 'shield'
                      : a.type === 'normal'
                        ? 'user'
                        : 'crown'
                  "
                  color="#007AFF" /></view
              ><view
                ><text class="strong">{{ a.name }}</text
                ><text class="muted block">{{ a.description }}</text></view
              ><Icon name="chevron" :size="18" /></button
          ></template>
          <template v-if="s.modal === 'admin-job'"
            ><view class="form-fields"
              ><label
                >单位名称 *<input
                  v-model="form.company"
                  placeholder="必填" /></label
              ><label
                >公告标题 *<input
                  v-model="form.title"
                  placeholder="必填" /></label
              ><label>企业性质<input v-model="form.nature" /></label
              ><label>学历要求<input v-model="form.degree" /></label
              ><label>招聘批次<input v-model="form.batch" /></label
              ><label>招聘类型<input v-model="form.type" /></label
              ><label>行业<input v-model="form.industry" /></label
              ><label
                >开始时间<input
                  v-model="form.start"
                  placeholder="ISO时间，可留空" /></label
              ><label
                >截止时间<input
                  v-model="form.deadline"
                  placeholder="ISO时间，可留空" /></label
              ><label
                >业务上传时间<input
                  v-model="form.uploadedAt"
                  placeholder="ISO时间" /></label
              ><label
                >工作地点<input
                  v-model="form.citiesText"
                  placeholder="多个城市以顿号分隔" /></label
              ><label
                >招聘岗位<textarea
                  v-model="form.positionsText"
                  placeholder="每行一项，可空"
                /></label
              ><label
                >招聘专业<textarea
                  v-model="form.majorsText"
                  placeholder="每行一项，可空"
                /></label
              ><label
                >企业介绍<textarea
                  v-model="form.intro"
                  placeholder="可空"
                /></label
              ><label
                >企业介绍图片<textarea
                  v-model="form.imagesText"
                  placeholder="每行一个HTTPS图片地址，可空"
                /></label
              ><label
                >企业Logo<input
                  v-model="form.logo"
                  placeholder="HTTPS图片地址，或本地标识如mobile" /></label
              ><label>原文链接<input v-model="form.sourceUrl" /></label
              ><label>官方投递入口<input v-model="form.applyUrl" /></label
              ><view class="row-between"
                ><text>人工推荐</text
                ><switch
                  :checked="form.recommended"
                  color="#007AFF"
                  @change="form.recommended = $event.detail.value" /></view
              ><view class="row-between"
                ><text>发布公告（关闭则为草稿）</text
                ><switch
                  :checked="form.published"
                  color="#007AFF"
                  @change="form.published = $event.detail.value" /></view></view
          ></template>
          <view v-if="error" class="form-error" role="alert">{{ error }}</view>
        </view></scroll-view
      >
      <view v-if="s.modal === 'filter'" class="sheet-footer"
        ><button
          class="ui-reset secondary"
          @click="
            draft = {};
            major = '';
          "
        >
          重置</button
        ><button class="ui-reset primary" @click="confirmFilter">
          确定筛选
        </button></view
      >
      <view v-if="s.modal === 'progress'" class="sheet-footer"
        ><button class="ui-reset secondary" :disabled="busy" @click="close">
          取消</button
        ><button
          class="ui-reset primary"
          :disabled="busy"
          @click="submitProgress"
        >
          {{ busy ? "保存中…" : "保存进展" }}
        </button></view
      >
      <view v-if="s.modal === 'admin-job'" class="sheet-footer"
        ><button class="ui-reset secondary" :disabled="busy" @click="close">
          取消</button
        ><button class="ui-reset primary" :disabled="busy" @click="saveJob">
          {{ busy ? "保存中…" : "保存公告" }}
        </button></view
      >
    </view>
    <view
      v-else-if="confirms"
      class="confirm-dialog"
      role="dialog"
      :aria-label="confirms.title"
      aria-modal="true"
      ><view class="confirm-icon" :class="{ danger: confirms.danger }"
        ><Icon
          :name="confirms.icon"
          :size="32"
          :color="confirms.danger ? '#E5484D' : '#007AFF'" /></view
      ><text class="confirm-title">{{ confirms.title }}</text
      ><text class="confirm-body">{{ confirms.body }}</text
      ><textarea
        v-if="confirms.input"
        v-model="reason"
        class="reason-input"
        :placeholder="confirms.input"
      /><view v-if="error" class="form-error">{{ error }}</view
      ><button
        class="ui-reset primary full"
        :class="{ danger: confirms.danger }"
        :disabled="busy"
        @click="confirm"
      >
        {{ busy ? "处理中…" : confirms.primary }}</button
      ><button
        class="ui-reset text-button full"
        :disabled="busy"
        @click="s.closeModal()"
      >
        {{ confirms.secondary }}
      </button></view
    >
    <view v-if="discard" class="discard-layer"
      ><view class="confirm-dialog"
        ><text class="confirm-title">放弃本次填写？</text
        ><text class="confirm-body">未保存的内容将丢失。</text
        ><button class="ui-reset primary full" @click="discard = false">
          继续编辑</button
        ><button
          class="ui-reset danger-text full"
          @click="
            discard = false;
            s.closeModal();
          "
        >
          放弃填写
        </button></view
      ></view
    >
  </view>
</template>
