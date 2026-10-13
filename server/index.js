import { createApp } from "./app.js";
import express from "express";
import { resolve } from "node:path";
const { app } = createApp({
  dbPath: resolve(process.env.DATA_DIR || ".data", "campus.sqlite"),
  demo: process.env.APP_MODE !== "production",
});
app.use(express.static(resolve("dist/build/h5")));
app.listen(Number(process.env.PORT) || 3001, "0.0.0.0", () =>
  console.log("Campus API listening on port " + (process.env.PORT || 3001)),
);
