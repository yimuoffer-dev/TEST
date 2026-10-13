import { defineStore } from "pinia";
export const today = () =>
  new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10);
export const cents = (v) => (Number(v || 0) / 100).toFixed(2);
export const statuses = [
  "已投递",
  "笔试",
  "AI面",
  "一面",
  "二面",
  "三面",
  "Offer",
  "已拒绝",
  "已签约",
];
export const interviews = ["AI面", "一面", "二面", "三面"];
let lastListRequest = 0;
let activationSequence = 0;
export const useCampus = defineStore("campus", {
  state: () => ({
    route: "home",
    pageKey: "",
    params: {},
    token: uni.getStorageSync("campus-token") || "",
    ready: false,
    user: null,
    entitlement: { type: "normal" },
    stats: {},
    config: {
      topics: [],
      packages: [],
      dictionaries: {},
      locations: {},
      help: [],
    },
    records: [],
    favoriteIds: [],
    distributor: false,
    wallet: null,
    demo: true,
    jobs: [],
    total: 0,
    page: 1,
    hasMore: false,
    limited: false,
    loading: false,
    error: "",
    detail: null,
    data: [],
    distribution: null,
    admin: null,
    modal: null,
    modalPayload: null,
    toast: "",
    query: { scope: "latest" },
    homeScope: "latest",
    listQuery: {},
    listTitle: "筛选结果",
    search: "",
    date: today(),
    dailyMode: "new",
    dailyStats: { new: 0, closing: 0 },
    recordStatus: "全部",
    pendingAction: null,
    previousRoute: null,
    resumeAction: null,
    busy: false,
    scrolls: {},
    listSnapshots: {},
  }),
  getters: {
    isMember: (s) => s.entitlement.type !== "normal",
    isPartner: (s) => ["partner", "senior"].includes(s.entitlement.type),
    isSenior: (s) => s.entitlement.type === "senior",
    activeRecord: (s) => s.records.find((r) => r.id === s.params.id),
    recordStats: (s) => {
      const stat = {
        已投递: 0,
        笔试: 0,
        面试: 0,
        Offer: 0,
        已拒绝: 0,
        已签约: 0,
      };
      for (const r of s.records)
        stat[interviews.includes(r.status) ? "面试" : r.status]++;
      return stat;
    },
    filteredRecords: (s) =>
      s.records.filter(
        (r) =>
          s.recordStatus === "全部" ||
          (s.recordStatus === "面试" && interviews.includes(r.status)) ||
          r.status === s.recordStatus,
      ),
    inProgress: (s) =>
      s.records.filter((r) =>
        ["已投递", "笔试", ...interviews].includes(r.status),
      ).length,
  },
  actions: {
    async request(path, { method = "GET", body } = {}) {
      const base = import.meta.env.VITE_API_BASE || "";
      return new Promise((resolve, reject) =>
        uni.request({
          url: base + "/api" + path,
          method,
          data: body,
          header: {
            "Content-Type": "application/json",
            ...(this.token ? { Authorization: "Bearer " + this.token } : {}),
          },
          success: (r) => {
            if (r.statusCode >= 200 && r.statusCode < 300) resolve(r.data);
            else {
              const e = new Error(r.data?.message || "请求失败，请重试");
              e.status = r.statusCode;
              reject(e);
            }
          },
          fail: () => reject(new Error("网络连接失败，请检查服务后重试")),
        }),
      );
    },
    notify(message) {
      this.toast = message;
      setTimeout(() => {
        if (this.toast === message) this.toast = "";
      }, 2600);
    },
    async bootstrap() {
      const result = await this.request("/bootstrap");
      if (
        this.user?.id !== result.user?.id ||
        this.entitlement.type !== result.entitlement.type
      ) {
        this.listSnapshots = {};
        this.jobs = [];
      }
      Object.assign(this, {
        user: result.user,
        entitlement: result.entitlement,
        stats: result.stats,
        config: result.config,
        records: result.records,
        favoriteIds: result.favorites,
        distributor: result.distributor,
        wallet: result.wallet,
        demo: result.demo,
        ready: true,
      });
    },
    nav(route, params = {}) {
      this.modal = null;
      const url =
        "/pages/" +
        (route === "home" ? "index" : route) +
        "/index?screen=" +
        route +
        Object.entries(params)
          .map(
            ([k, v]) =>
              "&" + encodeURIComponent(k) + "=" + encodeURIComponent(v),
          )
          .join("");
      if (["home", "daily", "records", "profile"].includes(route))
        uni.reLaunch({ url });
      else uni.navigateTo({ url });
    },
    async activate(route, params = {}, pageKey = "") {
      const seq = ++activationSequence;
      this.route = route;
      this.pageKey = pageKey;
      this.params = params;
      this.error = "";
      this.data = [];
      if (route === "detail") this.detail = null;
      this.search =
        route === "list"
          ? this.listQuery.search || ""
          : route === "home"
            ? this.query.search || ""
            : "";
      try {
        await this.bootstrap();
        if (seq !== activationSequence) return;
        await this.loadRoute();
        if (seq !== activationSequence) return;
        if (this.resumeAction) {
          const action = this.resumeAction;
          this.resumeAction = null;
          await action();
          this.busy = false;
        }
        if (params.ref && this.user)
          await this.request("/referral/visit", {
            method: "POST",
            body: { sharerId: params.ref },
          });
      } catch (e) {
        this.error = e.message;
      }
    },
    back() {
      uni.navigateBack({ fail: () => this.nav("home") });
    },
    async guard(action) {
      if (!this.user) {
        this.pendingAction = action;
        this.modal = "login";
        return;
      }
      return action();
    },
    member(action) {
      return this.guard(() => {
        if (!this.isMember) {
          this.pendingAction = action;
          this.modal = "member";
          return;
        }
        return action();
      });
    },
    closeModal() {
      this.modal = null;
      this.modalPayload = null;
    },
    async demoLogin(type = "senior") {
      const r = await this.request("/auth/demo", {
        method: "POST",
        body: { type, referrerId: this.params.ref },
      });
      await this.finishLogin(r);
    },
    async finishLogin(result) {
      this.token = result.token;
      uni.setStorageSync("campus-token", this.token);
      this.closeModal();
      await this.bootstrap();
      await this.loadRoute();
      this.notify("登录成功");
      const action = this.pendingAction;
      this.pendingAction = null;
      if (action) await action();
    },
    async logout() {
      await this.request("/auth/logout", { method: "POST" });
      this.token = "";
      uni.removeStorageSync("campus-token");
      this.closeModal();
      await this.bootstrap();
      this.nav("home");
    },
    async loadList(append = false, restore = false) {
      const seq = ++lastListRequest;
      this.loading = true;
      this.error = "";
      const q =
        this.route === "daily"
          ? { date: this.date, mode: this.dailyMode }
          : this.route === "list"
            ? this.listQuery
            : this.query;
      const key = this.route + JSON.stringify(q);
      const cached = restore ? this.listSnapshots[key] : null;
      if (cached) {
        this.jobs = cached.items;
        this.page = cached.page;
      }
      const maxPage = restore && this.isMember ? cached?.page || 1 : 1;
      try {
        const pages = append
          ? [this.page + 1]
          : Array.from({ length: maxPage }, (_, i) => i + 1);
        const results = await Promise.all(
          pages.map((page) =>
            this.request(
              "/jobs?q=" +
                encodeURIComponent(JSON.stringify(q)) +
                "&page=" +
                page,
            ),
          ),
        );
        if (seq !== lastListRequest) return;
        const result = results[results.length - 1];
        this.jobs = append
          ? [...this.jobs, ...result.items]
          : results.flatMap((r) => r.items);
        this.total = result.total;
        this.page = result.page;
        this.hasMore = result.hasMore;
        this.limited = result.limited;
        this.listSnapshots[key] = { items: this.jobs, page: this.page };
      } catch (e) {
        if (seq === lastListRequest) this.error = e.message;
      } finally {
        if (seq === lastListRequest) this.loading = false;
      }
    },
    async loadRoute() {
      if (["home", "list", "daily"].includes(this.route)) {
        if (this.route === "daily" && this.user)
          this.dailyStats = await this.request("/daily?date=" + this.date);
        await this.loadList(false, true);
      } else if (this.route === "detail") {
        this.detail = await this.request(
          "/jobs/" +
            this.params.id +
            "?q=" +
            encodeURIComponent(JSON.stringify(this.listQuery)),
        );
      } else if (
        ["favorites", "messages", "orders", "rights", "gifts"].includes(
          this.route,
        )
      ) {
        if (this.user) this.data = await this.request("/" + this.route);
      } else if (
        [
          "distribution",
          "funds",
          "customers",
          "team",
          "distribution-orders",
          "withdraw",
          "promotion",
          "partner",
        ].includes(this.route) &&
        this.distributor
      )
        this.distribution = await this.request("/distribution");
      else if (this.route === "admin")
        this.admin = await this.request("/admin");
    },
    setScope(scope) {
      return this.guard(async () => {
        this.homeScope = scope;
        this.query = { ...this.query, scope };
        await this.loadList();
      });
    },
    openList(title, q) {
      this.guard(() => {
        this.listTitle = title;
        this.listQuery = JSON.parse(JSON.stringify(q));
        this.nav("list");
      });
    },
    searchSubmit() {
      return this.guard(() => {
        if (this.route === "list") {
          this.listQuery = { ...this.listQuery, search: this.search };
          this.loadList();
        } else this.openList("搜索结果", { search: this.search });
      });
    },
    openDetail(job) {
      this.guard(() => {
        if (this.route === "home") this.listQuery = { ...this.query };
        else if (this.route === "daily")
          this.listQuery = { date: this.date, mode: this.dailyMode };
        else if (this.route === "favorites") this.listQuery = {};
        this.nav("detail", { id: job.id });
      });
    },
    async favorite(job) {
      this.guard(async () => {
        try {
          await this.request("/favorites/" + job.id, { method: "POST" });
          await this.bootstrap();
          this.notify(
            this.favoriteIds.includes(job.id) ? "已收藏" : "已取消收藏",
          );
          if (this.route === "favorites") await this.loadRoute();
        } catch (e) {
          this.notify(e.message);
        }
      });
    },
    openProgress(record = null, edit = false) {
      this.guard(() => {
        this.modal = "progress";
        this.modalPayload = {
          record,
          edit,
          job: this.route === "detail" ? this.detail : null,
        };
      });
    },
    async saveProgress(data, record, edit = false) {
      const path = record
        ? "/records/" + record.id + (edit ? "" : "/progress")
        : "/records";
      await this.request(path, { method: edit ? "PATCH" : "POST", body: data });
      await this.bootstrap();
      this.closeModal();
      this.notify("进展已保存");
    },
    async setDate(date) {
      this.date = date;
      ++lastListRequest;
      this.loading = true;
      try {
        const r = await this.request("/daily?date=" + date);
        if (this.date !== date) return;
        this.dailyStats = r;
        await this.loadList();
      } catch (e) {
        this.error = e.message;
        this.loading = false;
      }
    },
    async refresh() {
      await this.member(async () => {
        await this.bootstrap();
        await this.loadList();
        this.notify("已更新至最新信息");
      });
    },
    async nextPage() {
      await this.member(() => this.loadList(true));
    },
    async applyDistribution() {
      await this.request("/distribution/apply", { method: "POST" });
      await this.bootstrap();
      this.notify("分销资格已开通");
      this.nav("distribution");
    },
    async buy(packageId) {
      const order = await this.request("/orders", {
        method: "POST",
        body: { packageId },
      });
      await this.request("/orders/" + order.id + "/pay", {
        method: "POST",
        body: {},
      });
      await this.bootstrap();
      this.notify("演示支付成功，权益已更新");
      const action = this.pendingAction;
      this.pendingAction = null;
      const route = this.previousRoute || "profile";
      this.previousRoute = null;
      this.resumeAction = action;
      this.busy = !!action;
      this.nav(route, this.params.returnId ? { id: this.params.returnId } : {});
    },
    toMembership() {
      this.previousRoute = this.route;
      const returnId = this.params.id;
      this.closeModal();
      this.nav("membership", { returnId: returnId || "" });
    },
    async copy(text, message = "已复制") {
      if (!text) {
        this.notify("暂无可复制内容");
        return;
      }
      await new Promise((resolve, reject) =>
        uni.setClipboardData({ data: text, success: resolve, fail: reject }),
      );
      this.notify(message);
    },
    openLink(kind) {
      const jobId = this.detail.id;
      this.member(async () => {
        let j = this.detail;
        if (!j?.[kind]) {
          j = await this.request(
            "/jobs/" +
              jobId +
              "?q=" +
              encodeURIComponent(JSON.stringify(this.listQuery)),
          );
          this.detail = j;
        }
        const url = j?.[kind];
        if (!url) {
          this.notify("暂无链接");
          return;
        }
        // #ifdef H5
        const opened = window.open(url, "_blank", "noopener,noreferrer");
        if (!opened) await this.copy(url, "已复制链接，请在浏览器打开");
        // #endif
        // #ifndef H5
        this.copy(url, "已复制链接，请在浏览器打开");
        // #endif
      });
    },
    async retry() {
      this.error = "";
      try {
        await this.bootstrap();
        await this.loadRoute();
      } catch (e) {
        this.error = e.message;
      }
    },
  },
});
