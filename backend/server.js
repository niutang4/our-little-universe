const express = require("express");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");
const pool = require("./db");

dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

const app = express();
const port = Number(process.env.PORT || 3000);
const frontendRoot = path.resolve(__dirname, "..");

app.use(cors({ origin: process.env.CORS_ORIGIN || true }));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

const asyncRoute = (handler) => (request, response, next) => Promise.resolve(handler(request, response, next)).catch(next);
const toDateString = (value) => value ? new Date(value).toISOString().slice(0, 10) : "";
const numberOr = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const requiredText = (value, fallback = "") => String(value ?? fallback).trim();
const parseChoices = (value) => {
  try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed.map(String) : []; }
  catch (error) { return []; }
};

async function readSite() {
  const [settingsRows] = await pool.query("SELECT id, brand_name, brand_subtitle, eyebrow, hero_title, hero_accent, hero_intro, DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date, start_date_label, secret_code FROM site_settings WHERE id = 1 LIMIT 1");
  const [timelineRows] = await pool.query("SELECT id, date_label, title, content, tag, sort_order FROM timeline_items ORDER BY sort_order ASC, id ASC");
  const [galleryRows] = await pool.query("SELECT id, category, title, note, image_path, tone, sort_order FROM gallery_items ORDER BY sort_order ASC, id ASC");
  const [quizRows] = await pool.query("SELECT id, question, choices_json, answer_index, sort_order FROM quiz_questions ORDER BY sort_order ASC, id ASC");
  const [orderRows] = await pool.query("SELECT id, label, correct_order, sort_order FROM order_items ORDER BY sort_order ASC, id ASC");
  const settings = settingsRows[0] || {};
  return {
    brandName: settings.brand_name || "Our Little Universe",
    brandSubtitle: settings.brand_subtitle || "给我们的小小星系",
    eyebrow: settings.eyebrow || "只写给我们",
    heroTitle: settings.hero_title || "世界很大，",
    heroAccent: settings.hero_accent || "但我想把星光都留给你。",
    heroIntro: settings.hero_intro || "",
    startDate: settings.start_date || "",
    startDateLabel: settings.start_date_label || "待补充",
    secretCode: settings.secret_code || "",
    timeline: timelineRows.map((item) => ({ id: item.id, date: item.date_label, title: item.title, text: item.content, tag: item.tag })),
    gallery: galleryRows.map((item) => ({ id: item.id, category: item.category, title: item.title, note: item.note, image: item.image_path, tone: item.tone })),
    quiz: quizRows.map((item) => ({ id: item.id, question: item.question, choices: parseChoices(item.choices_json), answer: item.answer_index })),
    orderItems: orderRows.map((item) => ({ id: item.id, label: item.label, order: item.correct_order }))
  };
}

app.get("/api/health", asyncRoute(async (request, response) => {
  const [rows] = await pool.query("SELECT VERSION() AS version, @@port AS port");
  response.json({ ok: true, database: rows[0] });
}));

app.get("/api/site", asyncRoute(async (request, response) => response.json(await readSite())));

app.put("/api/site/settings", asyncRoute(async (request, response) => {
  const body = request.body || {};
  const values = {
    brand_name: requiredText(body.brandName, "Our Little Universe"),
    brand_subtitle: requiredText(body.brandSubtitle, "给我们的小小星系"),
    eyebrow: requiredText(body.eyebrow, "只写给我们"),
    hero_title: requiredText(body.heroTitle, "世界很大，"),
    hero_accent: requiredText(body.heroAccent, "但我想把星光都留给你。"),
    hero_intro: requiredText(body.heroIntro),
    start_date: requiredText(body.startDate) || null,
    start_date_label: requiredText(body.startDateLabel, "待补充"),
    secret_code: requiredText(body.secretCode)
  };
  await pool.query(`INSERT INTO site_settings (id, brand_name, brand_subtitle, eyebrow, hero_title, hero_accent, hero_intro, start_date, start_date_label, secret_code)
    VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE brand_name=VALUES(brand_name), brand_subtitle=VALUES(brand_subtitle), eyebrow=VALUES(eyebrow), hero_title=VALUES(hero_title), hero_accent=VALUES(hero_accent), hero_intro=VALUES(hero_intro), start_date=VALUES(start_date), start_date_label=VALUES(start_date_label), secret_code=VALUES(secret_code)`, Object.values(values));
  response.json(await readSite());
}));

app.post("/api/timeline", asyncRoute(async (request, response) => {
  const body = request.body || {};
  const [result] = await pool.query("INSERT INTO timeline_items (date_label, title, content, tag, sort_order) VALUES (?, ?, ?, ?, ?)", [requiredText(body.date, "待补充"), requiredText(body.title, "未命名回忆"), requiredText(body.text), requiredText(body.tag, "回忆"), numberOr(body.sortOrder, 0)]);
  response.status(201).json({ id: result.insertId });
}));

app.put("/api/timeline/:id", asyncRoute(async (request, response) => {
  const body = request.body || {};
  await pool.query("UPDATE timeline_items SET date_label=?, title=?, content=?, tag=?, sort_order=? WHERE id=?", [requiredText(body.date, "待补充"), requiredText(body.title, "未命名回忆"), requiredText(body.text), requiredText(body.tag, "回忆"), numberOr(body.sortOrder, 0), numberOr(request.params.id)]);
  response.json({ ok: true });
}));

app.delete("/api/timeline/:id", asyncRoute(async (request, response) => { await pool.query("DELETE FROM timeline_items WHERE id=?", [numberOr(request.params.id)]); response.status(204).end(); }));

app.post("/api/gallery", asyncRoute(async (request, response) => {
  const body = request.body || {};
  const [result] = await pool.query("INSERT INTO gallery_items (category, title, note, image_path, tone, sort_order) VALUES (?, ?, ?, ?, ?, ?)", [requiredText(body.category, "日常"), requiredText(body.title, "未命名照片"), requiredText(body.note), requiredText(body.image), requiredText(body.tone, "coral"), numberOr(body.sortOrder, 0)]);
  response.status(201).json({ id: result.insertId });
}));

app.put("/api/gallery/:id", asyncRoute(async (request, response) => {
  const body = request.body || {};
  await pool.query("UPDATE gallery_items SET category=?, title=?, note=?, image_path=?, tone=?, sort_order=? WHERE id=?", [requiredText(body.category, "日常"), requiredText(body.title, "未命名照片"), requiredText(body.note), requiredText(body.image), requiredText(body.tone, "coral"), numberOr(body.sortOrder, 0), numberOr(request.params.id)]);
  response.json({ ok: true });
}));

app.delete("/api/gallery/:id", asyncRoute(async (request, response) => { await pool.query("DELETE FROM gallery_items WHERE id=?", [numberOr(request.params.id)]); response.status(204).end(); }));

app.post("/api/quiz", asyncRoute(async (request, response) => {
  const body = request.body || {};
  const choices = Array.isArray(body.choices) ? body.choices.map(String) : [];
  if (!choices.length) return response.status(400).json({ error: "至少需要一个选项" });
  const [result] = await pool.query("INSERT INTO quiz_questions (question, choices_json, answer_index, sort_order) VALUES (?, ?, ?, ?)", [requiredText(body.question, "未命名问题"), JSON.stringify(choices), numberOr(body.answer, 0), numberOr(body.sortOrder, 0)]);
  response.status(201).json({ id: result.insertId });
}));

app.put("/api/quiz/:id", asyncRoute(async (request, response) => {
  const body = request.body || {};
  const choices = Array.isArray(body.choices) ? body.choices.map(String) : [];
  await pool.query("UPDATE quiz_questions SET question=?, choices_json=?, answer_index=?, sort_order=? WHERE id=?", [requiredText(body.question, "未命名问题"), JSON.stringify(choices), numberOr(body.answer, 0), numberOr(body.sortOrder, 0), numberOr(request.params.id)]);
  response.json({ ok: true });
}));

app.delete("/api/quiz/:id", asyncRoute(async (request, response) => { await pool.query("DELETE FROM quiz_questions WHERE id=?", [numberOr(request.params.id)]); response.status(204).end(); }));

app.post("/api/order", asyncRoute(async (request, response) => {
  const body = request.body || {};
  const [result] = await pool.query("INSERT INTO order_items (label, correct_order, sort_order) VALUES (?, ?, ?)", [requiredText(body.label, "未命名事件"), numberOr(body.order, 1), numberOr(body.sortOrder, 0)]);
  response.status(201).json({ id: result.insertId });
}));

app.put("/api/order/:id", asyncRoute(async (request, response) => {
  const body = request.body || {};
  await pool.query("UPDATE order_items SET label=?, correct_order=?, sort_order=? WHERE id=?", [requiredText(body.label, "未命名事件"), numberOr(body.order, 1), numberOr(body.sortOrder, 0), numberOr(request.params.id)]);
  response.json({ ok: true });
}));

app.delete("/api/order/:id", asyncRoute(async (request, response) => { await pool.query("DELETE FROM order_items WHERE id=?", [numberOr(request.params.id)]); response.status(204).end(); }));

app.get("/api/letters", asyncRoute(async (request, response) => {
  const [rows] = await pool.query("SELECT id, body, DATE_FORMAT(unlock_at, '%Y-%m-%d') AS unlock_at, created_at FROM future_letters ORDER BY created_at DESC");
  response.json(rows.map((item) => ({ id: item.id, body: item.body, unlockAt: item.unlock_at || "", createdAt: item.created_at })));
}));

app.post("/api/letters", asyncRoute(async (request, response) => {
  const body = requiredText(request.body?.body);
  if (!body) return response.status(400).json({ error: "信件内容不能为空" });
  const [result] = await pool.query("INSERT INTO future_letters (body, unlock_at) VALUES (?, ?)", [body, requiredText(request.body?.unlockAt) || null]);
  response.status(201).json({ id: result.insertId });
}));

app.use(express.static(frontendRoot, { index: "index.html" }));
app.use((error, request, response, next) => { console.error(error); response.status(500).json({ error: "服务器内部错误", detail: process.env.NODE_ENV === "production" ? undefined : error.message }); });

pool.query("SELECT 1").then(() => app.listen(port, () => console.log(`Love Universe API is running at http://localhost:${port}`))).catch((error) => { console.error("Cannot connect to MySQL:", error.message); process.exitCode = 1; });
