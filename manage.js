const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const API_BASE_URL = window.LOVE_API_BASE_URL || "";
const apiUrl = (path) => `${API_BASE_URL}${path}`;
let site = null;

function escapeHtml(value) { return String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[character])); }
function formValues(form) { return Object.fromEntries(new FormData(form).entries()); }
function setStatus(message, error = false) { const element = $("#manageStatus"); element.textContent = message; element.style.borderColor = error ? "#c47d78" : "rgba(239,156,131,.3)"; }
async function api(url, options = {}) { const response = await fetch(apiUrl(url), { headers: { "Content-Type": "application/json", Accept: "application/json" }, ...options }); if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body.error || `请求失败（${response.status}）`); } return response.status === 204 ? null : response.json(); }

async function refresh() {
  site = await api("/api/site");
  const settings = { brandName: site.brandName, brandSubtitle: site.brandSubtitle, eyebrow: site.eyebrow, heroTitle: site.heroTitle, heroAccent: site.heroAccent, heroIntro: site.heroIntro, startDate: site.startDate, startDateLabel: site.startDateLabel, secretCode: site.secretCode };
  Object.entries(settings).forEach(([key, value]) => { const field = $(`[name="${key}"]`, $("#settingsForm")); if (field) field.value = value || ""; });
  renderTimeline(); renderGallery(); renderQuiz(); renderOrder(); setStatus(`已连接 MySQL，共 ${site.timeline.length} 条时间线、${site.gallery.length} 张照片卡片。`);
}

function renderTimeline() { $("#timelineEntries").innerHTML = site.timeline.map((item) => `<div class="entry-row"><time>${escapeHtml(item.date)}</time><div><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.text)}</small></div><div class="entry-actions"><button type="button" data-edit-timeline="${item.id}">编辑</button><button type="button" data-delete-timeline="${item.id}">删除</button></div></div>`).join(""); }
function renderGallery() { $("#galleryEntries").innerHTML = site.gallery.map((item) => `<div class="entry-row"><time>${escapeHtml(item.category)}</time><div><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.image || item.note)}</small></div><div class="entry-actions"><button type="button" data-edit-gallery="${item.id}">编辑</button><button type="button" data-delete-gallery="${item.id}">删除</button></div></div>`).join(""); }
function renderQuiz() { $("#quizEntries").innerHTML = site.quiz.map((item) => `<div class="entry-row"><time>答案 ${Number(item.answer) + 1}</time><div><strong>${escapeHtml(item.question)}</strong><small>${item.choices.map(escapeHtml).join(" / ")}</small></div><div class="entry-actions"><button type="button" data-edit-quiz="${item.id}">编辑</button><button type="button" data-delete-quiz="${item.id}">删除</button></div></div>`).join(""); }
function renderOrder() { $("#orderEntries").innerHTML = site.orderItems.map((item) => `<div class="entry-row"><time>顺序 ${escapeHtml(item.order)}</time><div><strong>${escapeHtml(item.label)}</strong></div><div class="entry-actions"><button type="button" data-edit-order="${item.id}">编辑</button><button type="button" data-delete-order="${item.id}">删除</button></div></div>`).join(""); }
function fillForm(form, data) { Object.entries(data).forEach(([key, value]) => { const field = $(`[name="${key}"]`, form); if (field) field.value = value ?? ""; }); form.scrollIntoView({ behavior: "smooth", block: "center" }); }
function clearForm(form) { form.reset(); $("[name=id]", form).value = ""; }

$("#settingsForm").addEventListener("submit", async (event) => { event.preventDefault(); try { await api("/api/site/settings", { method: "PUT", body: JSON.stringify(formValues(event.currentTarget)) }); await refresh(); setStatus("首页设置已保存。"); } catch (error) { setStatus(error.message, true); } });
$("#timelineForm").addEventListener("submit", async (event) => { event.preventDefault(); const form = event.currentTarget; const values = formValues(form); try { await api(values.id ? `/api/timeline/${values.id}` : "/api/timeline", { method: values.id ? "PUT" : "POST", body: JSON.stringify(values) }); clearForm(form); await refresh(); setStatus("时间线已保存。"); } catch (error) { setStatus(error.message, true); } });
$("#galleryForm").addEventListener("submit", async (event) => { event.preventDefault(); const form = event.currentTarget; const values = formValues(form); try { await api(values.id ? `/api/gallery/${values.id}` : "/api/gallery", { method: values.id ? "PUT" : "POST", body: JSON.stringify(values) }); clearForm(form); await refresh(); setStatus("照片卡片已保存。"); } catch (error) { setStatus(error.message, true); } });
$("#quizForm").addEventListener("submit", async (event) => { event.preventDefault(); const form = event.currentTarget; const values = formValues(form); values.choices = values.choicesText.split(/\r?\n/).map((choice) => choice.trim()).filter(Boolean); delete values.choicesText; try { await api(values.id ? `/api/quiz/${values.id}` : "/api/quiz", { method: values.id ? "PUT" : "POST", body: JSON.stringify(values) }); clearForm(form); await refresh(); setStatus("问答题目已保存。"); } catch (error) { setStatus(error.message, true); } });
$("#orderForm").addEventListener("submit", async (event) => { event.preventDefault(); const form = event.currentTarget; const values = formValues(form); try { await api(values.id ? `/api/order/${values.id}` : "/api/order", { method: values.id ? "PUT" : "POST", body: JSON.stringify(values) }); clearForm(form); await refresh(); setStatus("拼图事件已保存。"); } catch (error) { setStatus(error.message, true); } });

document.addEventListener("click", async (event) => {
  const target = event.target;
  try {
    if (target.dataset.clear) clearForm($("#" + target.dataset.clear));
    if (target.dataset.editTimeline) { const item = site.timeline.find((entry) => String(entry.id) === target.dataset.editTimeline); fillForm($("#timelineForm"), { ...item, text: item.text }); }
    if (target.dataset.editGallery) { const item = site.gallery.find((entry) => String(entry.id) === target.dataset.editGallery); fillForm($("#galleryForm"), item); }
    if (target.dataset.editQuiz) { const item = site.quiz.find((entry) => String(entry.id) === target.dataset.editQuiz); fillForm($("#quizForm"), { ...item, choicesText: item.choices.join("\n") }); }
    if (target.dataset.editOrder) { const item = site.orderItems.find((entry) => String(entry.id) === target.dataset.editOrder); fillForm($("#orderForm"), item); }
    if (target.dataset.deleteTimeline && confirm("确定删除这条时间线吗？")) { await api(`/api/timeline/${target.dataset.deleteTimeline}`, { method: "DELETE" }); await refresh(); }
    if (target.dataset.deleteGallery && confirm("确定删除这张照片卡片吗？")) { await api(`/api/gallery/${target.dataset.deleteGallery}`, { method: "DELETE" }); await refresh(); }
    if (target.dataset.deleteQuiz && confirm("确定删除这道题吗？")) { await api(`/api/quiz/${target.dataset.deleteQuiz}`, { method: "DELETE" }); await refresh(); }
    if (target.dataset.deleteOrder && confirm("确定删除这个拼图事件吗？")) { await api(`/api/order/${target.dataset.deleteOrder}`, { method: "DELETE" }); await refresh(); }
  } catch (error) { setStatus(error.message, true); }
});

refresh().catch((error) => setStatus(`无法连接后端：${error.message}。请先运行 npm start。`, true));
