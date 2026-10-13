import test from "node:test";
import assert from "node:assert/strict";
import { seed } from "../server/seed.js";
import {
  HEADERS,
  template,
  previewFile,
  previewRows,
  parseCsv,
  importDrafts,
} from "../server/imports.js";
test("真实xlsx标准模板可解析，缺必填与错误行明确返回", async () => {
  const db = seed();
  const file = await template();
  const result = await previewFile({ format: "xlsx", file }, db.jobs);
  assert.equal(result.items.length, 1);
  assert.deepEqual(result.errors, []);
  const bad = previewRows([HEADERS, ["", "企业", "", "私企"]], []);
  assert.ok(bad.errors.length);
});
test("CSV支持带引号的逗号，疑似重复不覆盖，必须ID确认更新", () => {
  const db = seed();
  assert.deepEqual(parseCsv('a,b\n"x,y",z'), [
    ["a", "b"],
    ["x,y", "z"],
  ]);
  const row = {
    company: "公司",
    title: db.jobs[0].title,
    nature: "央企",
    degree: "本科及以上",
    batch: "2027届",
    type: "秋招专场",
    cities: ["上海"],
    deadline: null,
  };
  assert.throws(() => importDrafts(db, [row]));
  assert.equal(db.jobs[0].company, "中国移动");
  row.id = db.jobs[0].id;
  importDrafts(db, [row]);
  assert.equal(db.jobs[0].company, "公司");
  assert.equal(db.jobs[0].published, false);
});
test("批量导入先完整校验，错误不会保存部分草稿", () => {
  const db = seed();
  const count = db.jobs.length;
  assert.throws(() =>
    importDrafts(db, [
      {
        company: "有效",
        title: "有效公告",
        nature: "私企",
        degree: "本科及以上",
        batch: "2027届",
        type: "秋招专场",
        cities: ["上海"],
      },
      { company: "缺字段" },
    ]),
  );
  assert.equal(db.jobs.length, count);
});
