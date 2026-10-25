/*
  只需要编辑 siteData，就可以把模板变成你们自己的故事。
  图片填写 media/ 下的相对路径；留空时会显示不依赖网络的占位视觉。
*/
const fallbackSiteData = {
  brandName: "Our Little Universe",
  brandSubtitle: "给我们的小小星系",
  eyebrow: "只写给我们",
  heroTitle: "世界很大，",
  heroAccent: "但我想把星光都留给你。",
  heroIntro: "这里先留一块位置，等我们把那些值得记住的日子，一点一点放进来。",
  startDate: "", // 例如：2024-05-20
  startDateLabel: "待补充",
  secretCode: "", // 例如：第一次见面的地点；留空则使用默认彩蛋
  timeline: [
    { date: "待补充", title: "我们故事的起点", text: "在这里写下第一次认识、第一次见面，或者你最想记住的开场。", tag: "起点" },
    { date: "待补充", title: "第一次并肩去远方", text: "一段旅程、一家店、一次临时起意，都值得拥有自己的位置。", tag: "旅行" },
    { date: "待补充", title: "一个普通但闪闪发光的日子", text: "恋爱里最珍贵的，常常是没有特别安排，却一起度过的那天。", tag: "日常" },
    { date: "未来", title: "还没有写完的下一章", text: "把未来留成开放式结尾，等你们一起回来补上。", tag: "未完待续" }
  ],
  gallery: [
    { category: "全部", title: "我们第一次的合照", note: "等待一张照片进入这里", image: "", tone: "coral" },
    { category: "日常", title: "她笑起来的时候", note: "那些不需要理由的快乐", image: "", tone: "blue" },
    { category: "旅行", title: "一起去过的地方", note: "把地图变成我们的收藏夹", image: "", tone: "gold" },
    { category: "她的瞬间", title: "我眼中的她", note: "只写给她的观察笔记", image: "", tone: "lilac" },
    { category: "未来", title: "下一张照片留给未来", note: "还没发生，但已经开始期待", image: "", tone: "mint" }
  ],
  quiz: [
    { question: "这里可以换成你们的第一个问题。", choices: ["答案 A", "答案 B", "答案 C"], answer: 0 },
    { question: "哪一件小事最像你们？", choices: ["临时出发", "一起发呆", "为了一家店绕路"], answer: 1 },
    { question: "下一次想和她一起做什么？", choices: ["去海边", "看日落", "把三件事都做了"], answer: 2 }
  ],
  orderItems: [
    { label: "第一次认识", order: 1 },
    { label: "第一次见面", order: 2 },
    { label: "第一次旅行", order: 3 },
    { label: "下一次出发", order: 4 }
  ]
};

let siteData = fallbackSiteData;
const API_BASE_URL = window.LOVE_API_BASE_URL || "";
const apiUrl = (path) => `${API_BASE_URL}${path}`;
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const copyFields = ["brandName", "brandSubtitle", "eyebrow", "heroTitle", "heroAccent", "heroIntro", "startDateLabel"];

async function loadSiteData() {
  if (window.location.protocol === "file:") return;
  try {
    const response = await fetch(apiUrl("/api/site"), { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`API ${response.status}`);
    const remoteData = await response.json();
    siteData = { ...fallbackSiteData, ...remoteData };
  } catch (error) {
    console.warn("API 不可用，使用离线占位内容。", error.message);
  }
}

function renderCopy() {
  copyFields.forEach((key) => {
    $$(`[data-copy="${key}"]`).forEach((element) => { element.textContent = siteData[key]; });
  });
  document.title = `${siteData.brandName} | ${siteData.brandSubtitle}`;
}

function renderCountdown() {
  const daysElement = $("#daysTogether");
  const hint = $("#dateHint");
  const next = $("#nextAnniversary");
  const start = siteData.startDate && new Date(`${siteData.startDate}T00:00:00`);
  if (!start || Number.isNaN(start.getTime())) {
    daysElement.textContent = "--";
    hint.textContent = "填入开始日期后，这里会自动计时";
    next.textContent = "待补充";
    return;
  }
  const now = new Date();
  const days = Math.max(0, Math.floor((now - start) / 86400000));
  daysElement.textContent = days.toLocaleString("zh-CN");
  hint.textContent = `${siteData.startDate} · 每天都在继续`;
  const anniversary = new Date(now.getFullYear(), start.getMonth(), start.getDate());
  if (anniversary < new Date(now.getFullYear(), now.getMonth(), now.getDate())) anniversary.setFullYear(now.getFullYear() + 1);
  const remaining = Math.ceil((anniversary - new Date(now.getFullYear(), now.getMonth(), now.getDate())) / 86400000);
  next.textContent = `${anniversary.getMonth() + 1} 月 ${anniversary.getDate()} 日 · ${remaining} 天`;
}

function renderTimeline() {
  $("#timelineList").innerHTML = siteData.timeline.map((item) => `
    <article class="timeline-item">
      <span class="timeline-pin" aria-hidden="true"></span>
      <time class="timeline-date">${escapeHtml(item.date)}</time>
      <div><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.text)}</p><span class="timeline-tag">${escapeHtml(item.tag)}</span></div>
    </article>`).join("");
}

function renderGallery() {
  const categories = ["全部", ...new Set(siteData.gallery.map((item) => item.category).filter((category) => category !== "全部"))];
  $("#galleryFilters").innerHTML = categories.map((category, index) => `<button class="filter-button ${index === 0 ? "active" : ""}" type="button" data-filter="${escapeHtml(category)}">${escapeHtml(category)}</button>`).join("");
  const draw = (filter = "全部") => {
    const items = siteData.gallery.filter((item) => filter === "全部" || item.category === filter);
    $("#galleryGrid").innerHTML = items.map((item) => `
      <article class="gallery-card">
        ${item.image ? `<img class="gallery-art gallery-image" src="${escapeAttribute(item.image)}" alt="${escapeAttribute(item.title)}">` : `<div class="gallery-art gallery-placeholder ${escapeAttribute(item.tone || "coral")}" aria-hidden="true"></div>`}
        <span class="gallery-label">${escapeHtml(item.category)}</span>
        <div class="gallery-content"><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.note)}</p></div>
      </article>`).join("");
    $("#memoryCount").textContent = siteData.gallery.length + siteData.timeline.length;
  };
  draw();
  $$(".filter-button").forEach((button) => button.addEventListener("click", () => {
    $$(".filter-button").forEach((item) => item.classList.toggle("active", item === button));
    draw(button.dataset.filter);
  }));
}

let quizIndex = 0;
function renderQuiz() {
  const quiz = siteData.quiz[quizIndex % siteData.quiz.length];
  $("#quizGame").innerHTML = `<div class="quiz-question">${escapeHtml(quiz.question)}</div><div class="choice-list">${quiz.choices.map((choice, index) => `<button class="choice-button" type="button" data-choice="${index}">${escapeHtml(choice)}</button>`).join("")}</div><p class="game-feedback" id="quizFeedback" aria-live="polite"></p>`;
  $$(".choice-button", $("#quizGame")).forEach((button) => button.addEventListener("click", () => {
    const chosen = Number(button.dataset.choice);
    $$(".choice-button", $("#quizGame")).forEach((item) => { item.disabled = true; if (Number(item.dataset.choice) === quiz.answer) item.classList.add("correct"); });
    if (chosen !== quiz.answer) button.classList.add("wrong");
    $("#quizFeedback").textContent = chosen === quiz.answer ? "记得很准确，下一题继续。" : "没关系，答案会告诉你：这就是你们的故事。";
    setTimeout(() => { quizIndex += 1; renderQuiz(); }, 1100);
  }));
}

function renderOrderGame() {
  const items = siteData.orderItems.map((item) => ({ ...item }));
  const draw = () => {
    $("#orderGame").innerHTML = `<div class="order-list">${items.map((item, index) => `<div class="order-row"><span>${index + 1}. ${escapeHtml(item.label)}</span><button type="button" data-move="up" data-index="${index}" aria-label="上移">↑</button><button type="button" data-move="down" data-index="${index}" aria-label="下移">↓</button></div>`).join("")}</div><p class="game-feedback" id="orderFeedback" aria-live="polite"></p>`;
    $$(".order-row button", $("#orderGame")).forEach((button) => button.addEventListener("click", () => {
      const index = Number(button.dataset.index); const target = button.dataset.move === "up" ? index - 1 : index + 1;
      if (target >= 0 && target < items.length) [items[index], items[target]] = [items[target], items[index]];
      draw();
      if (items.every((item, position) => item.order === position + 1)) $("#orderFeedback").textContent = "顺序正确，下一章已经在等你们。";
    }));
  };
  draw();
}

function renderLetterGame() {
  let saved = "";
  try { saved = localStorage.getItem("love-future-letter") || ""; } catch (error) { saved = ""; }
  $("#letterGame").innerHTML = `<textarea class="letter-area" id="letterText" placeholder="写下一句话，给未来某一天的我们……">${escapeHtml(saved)}</textarea><div class="small-actions"><span class="saved-note" id="letterStatus">${saved ? "已保存在这台设备" : "只保存在当前浏览器"}</span><button class="mini-button" type="button" id="saveLetter">保存信件 →</button></div>`;
  $("#saveLetter").addEventListener("click", async () => {
    const text = $("#letterText").value.trim();
    if (!text) { $("#letterStatus").textContent = "先写下一句话，再保存。"; return; }
    if (window.location.protocol !== "file:") {
      try {
        const response = await fetch(apiUrl("/api/letters"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: text }) });
        if (!response.ok) throw new Error(`API ${response.status}`);
        localStorage.setItem("love-future-letter", text);
        $("#letterStatus").textContent = "已保存到本地数据库，未来见。";
        return;
      } catch (error) { console.warn("信件 API 不可用，改为浏览器本地保存。", error.message); }
    }
    try { localStorage.setItem("love-future-letter", text); $("#letterStatus").textContent = "已保存在这台设备。"; }
    catch (error) { $("#letterStatus").textContent = "当前浏览器不允许保存，但文字仍可复制留存。"; }
  });
}

function setupNavigation() {
  const menu = $("#menuButton"); const nav = $("#siteNav");
  menu.addEventListener("click", () => { const open = nav.classList.toggle("open"); menu.setAttribute("aria-expanded", String(open)); });
  $$(".nav-link").forEach((link) => link.addEventListener("click", () => nav.classList.remove("open")));
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) { $$(".nav-link").forEach((link) => link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`)); } }), { rootMargin: "-35% 0px -55%" });
    $$("main section[id]").forEach((section) => observer.observe(section));
  }
}

function setupModal() {
  const backdrop = $("#modalBackdrop"); const close = () => { backdrop.hidden = true; document.body.style.overflow = ""; };
  const open = (secret = false) => { backdrop.hidden = false; document.body.style.overflow = "hidden"; $("#secretField").hidden = !secret; $("#modalTitle").textContent = secret ? "你找到了隐藏星球" : "给你的星光"; $("#modalText").textContent = secret ? "这里可以放一段只有她能解锁的话，或者一张不想放在首页的照片。" : "每一颗星都代表一个还没来得及说出口的“谢谢你”。"; };
  $("#surpriseButton").addEventListener("click", () => open(false)); $("#openLetterButton").addEventListener("click", () => open(true)); $("#secretTrigger").addEventListener("click", () => open(true)); $("#modalClose").addEventListener("click", close); backdrop.addEventListener("click", (event) => { if (event.target === backdrop) close(); });
  $("#unlockButton").addEventListener("click", () => { const code = $("#secretCode").value.trim(); const expected = siteData.secretCode.trim(); $("#unlockFeedback").textContent = expected && code === expected ? "解锁成功：你是这座星系的唯一访客。" : expected ? "再想想，这是你们之间的那个暗号。" : "还没有设置暗号，请在 app.js 中填写 secretCode。"; });
}

function escapeHtml(value) { return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[character])); }
function escapeAttribute(value) { return escapeHtml(value); }

async function bootstrap() {
  await loadSiteData();
  renderCopy(); renderCountdown(); renderTimeline(); renderGallery(); renderQuiz(); renderOrderGame(); renderLetterGame(); setupNavigation(); setupModal();
}

bootstrap();
