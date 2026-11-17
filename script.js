const KEY = "task-buddy-v4";
const CAT = {
  study:   { label: "📚 Study",   color: "#fff1a8" },
  project: { label: "💻 Project", color: "#c4e6ff" },
  life:    { label: "🌷 Life",    color: "#c8ecd0" },
  fun:     { label: "🎀 Fun",     color: "#ffb5c8" }
};
const PRI = { low: "Chill", med: "Soon", high: "Urgent!" };
const TILTS = ["-2deg", "1.5deg", "-1deg", "2deg", "-1.5deg", "0.8deg"];

const $ = (id) => document.getElementById(id);
const board = $("board");
let tasks = load();
let filter = "all";

// Storage: localStorage with a safe fallback
function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (Array.isArray(saved)) return saved;
  } catch (e) {}
  return [
    { id: uid(), title: "Welcome! Tap Mark done when you finish ✿", category: "fun", priority: "low", due: "", done: false },
    { id: uid(), title: "Practice CSS flexbox for 20 minutes", category: "study", priority: "med", due: "", done: false }
  ];
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(tasks)); } catch (e) {}
}
function uid() { return Math.random().toString(36).slice(2, 10); }

// Dates
function isLate(t) {
  if (!t.due || t.done) return false;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return new Date(t.due + "T00:00") < today;
}
function fmtDate(d) {
  return new Date(d + "T00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// Filtering
function visible() {
  return tasks.filter(t =>
    filter === "active" ? !t.done :
    filter === "done" ? t.done :
    (filter === "study" || filter === "project") ? t.category === filter :
    true
  );
}

// Header stats and progress
function updateStats() {
  const total = tasks.length;
  const doneCount = tasks.filter(t => t.done).length;
  const left = total - doneCount;
  $("remaining").textContent = left;
  $("greeting").textContent = total === 0 ? "A blank page. Lovely."
    : left === 0 ? "All caught up. Go enjoy it ♡"
    : `You've finished ${doneCount} of ${total}. Keep going!`;
  $("stats").textContent = total ? `${doneCount}/${total} complete` : "";
}

// Rendering: DOM methods keep typed text safe
function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
}

function buildNote(t, i) {
  const li = el("li", "note" + (t.done ? " done" : ""));
  li.dataset.id = t.id;
  li.style.background = CAT[t.category].color;
  li.style.setProperty("--tilt", TILTS[i % TILTS.length]);

  const late = isLate(t);
  const tag = el("span", "tag", `${CAT[t.category].label} · ${PRI[t.priority]}`);
  const meta = el("div", "meta" + (late ? " late" : ""), (late ? "Overdue · " : "Due ") + (t.due ? fmtDate(t.due) : "anytime"));

  const actions = el("div", "note-actions");
  const check = el("button", "check");
  check.type = "button";
  check.setAttribute("role", "checkbox");
  check.setAttribute("aria-checked", String(t.done));
  check.dataset.act = "toggle";
  check.append(el("span", "box", t.done ? "✓" : ""), document.createTextNode(t.done ? "Done" : "Mark done"));

  const del = el("button", "icon-btn", "🗑️");
  del.type = "button";
  del.dataset.act = "delete";
  del.setAttribute("aria-label", "Delete task");
  actions.append(check, del);

  li.append(tag, el("h3", "", t.title), meta, actions);
  return li;
}

function render() {
  updateStats();
  board.replaceChildren();
  const list = visible();
  if (!list.length) {
    const li = el("li", "empty");
    li.append(
      el("span", "emoji", tasks.length ? "🫧" : "🌸"),
      el("h3", "", tasks.length ? "Nothing here right now" : "Your list is empty"),
      el("p", "", tasks.length ? "Try another filter, or add something new." : "Add your first task above and watch it bloom.")
    );
    board.append(li);
    return;
  }
  list.forEach((t, i) => board.append(buildNote(t, i)));
}

// Events
$("form").addEventListener("submit", (e) => {
  e.preventDefault();
  const title = $("title").value.trim();
  if (!title) return;
  tasks.unshift({
    id: uid(),
    title,
    category: $("category").value,
    priority: $("priority").value,
    due: $("due").value,
    done: false
  });
  e.target.reset();
  save();
  render();
  $("title").focus();
});

board.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-act]");
  if (!btn) return;
  const id = btn.closest(".note").dataset.id;
  if (btn.dataset.act === "toggle") {
    const task = tasks.find(t => t.id === id);
    if (task) task.done = !task.done;
  } else {
    tasks = tasks.filter(t => t.id !== id);
  }
  save();
  render();
});

document.querySelector(".filters").addEventListener("click", (e) => {
  const chip = e.target.closest("[data-filter]");
  if (!chip) return;
  filter = chip.dataset.filter;
  document.querySelectorAll(".chip").forEach(c => c.setAttribute("aria-pressed", String(c === chip)));
  render();
});

$("clear").addEventListener("click", () => {
  tasks = tasks.filter(t => !t.done);
  save();
  render();
});

render();