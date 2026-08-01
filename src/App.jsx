import React, { useState, useEffect, useRef } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import {
  Plus, Trash2, TrendingUp, TrendingDown, Wallet, Save,
  ChevronRight, ChevronLeft, Coins, LineChart, ArrowUpRight, Layers,
  Receipt, Tag, Settings2, X as XIcon, Download, Upload,
  Briefcase, AlertTriangle, Pencil,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Design tokens                                                      */
/* ------------------------------------------------------------------ */
const C = {
  bg: "#FBFAF6",
  card: "#FFFFFF",
  ink: "#1C1B2E",
  sub: "#6E6B7B",
  faint: "#A29FAF",
  line: "#ECE7DD",
  amber: "#D9982F",
  amberSoft: "#FAEFD6",
  gain: "#118A5C",
  gainSoft: "#E3F3EC",
  loss: "#CF4B3A",
  lossSoft: "#FBE8E4",
};
const FONT =
  "'Pretendard','Apple SD Gothic Neo','Malgun Gothic',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";
const numStyle = { fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" };

const KEY = "asset-tracker-v1";

// 내 컴퓨터(브라우저)에서 데이터를 저장하는 방식: localStorage
const localStore = {
  get: (k) => {
    const v = typeof localStorage !== "undefined" ? localStorage.getItem(k) : null;
    return v ? { value: v } : null;
  },
  set: (k, v) => {
    if (typeof localStorage !== "undefined") localStorage.setItem(k, v);
  },
};

/* ------------------------------------------------------------------ */
/*  Seed data (from the user's screenshot, 2026-06)                    */
/* ------------------------------------------------------------------ */
const uid = () => Math.random().toString(36).slice(2, 9);
const acc = (name, broker, category, principal, value, available = false) => ({
  id: uid(), name, broker, category, principal, value, available,
});

const SEED_ACCOUNTS = [
  acc("국내", "삼성증권", "invest", 45379200, 29365727),
  acc("미국", "삼성증권", "invest", 88452115, 115523073),
  acc("국내", "삼성증권 ISA", "invest", 35519400, 22584716),
  acc("국내", "삼성증권 연금", "invest", 4452470, 5903577),
  acc("예수금", "삼성증권 연금", "invest", 614959, 614959),
  acc("국내", "미래에셋", "invest", 8995000, 8669150),
  acc("국내", "코인", "invest", 19990005, 15053005),
  acc("생활비 계좌", "현금", "cash", 563335, 563335, true),
  acc("현금자산(파킹)", "현금", "cash", 0, 0, true),
  acc("주택청약", "현금", "cash", 8010000, 8010000, false),
  acc("집", "현금", "cash", 2700000, 2700000, true),
];

const PALETTE = [
  "#D9982F", "#E07A3B", "#5B8DEF", "#7B6CD9", "#C0567E",
  "#3FA9A0", "#118A5C", "#B0843B", "#9B59B6", "#D35455", "#5FA8D3", "#8FAE3B",
];
const cat = (name, color) => ({ id: uid(), name, color });
const DEFAULT_CATEGORIES = [
  cat("식비", "#D9982F"),
  cat("카페·간식", "#E07A3B"),
  cat("교통", "#5B8DEF"),
  cat("주거·통신", "#7B6CD9"),
  cat("쇼핑", "#C0567E"),
  cat("여가·문화", "#3FA9A0"),
  cat("의료·건강", "#118A5C"),
  cat("기타", "#9B98A8"),
];
const _cm = Object.fromEntries(DEFAULT_CATEGORIES.map((c) => [c.name, c.id]));
const exp = (date, amount, name, memo) => ({ id: uid(), date, amount, categoryId: _cm[name], memo });
const SEED_EXPENSES = [
  exp("2026-06-02", 12000, "식비", "점심 김치찌개"),
  exp("2026-06-03", 4500, "카페·간식", "아메리카노"),
  exp("2026-06-05", 55000, "쇼핑", "여름 티셔츠"),
  exp("2026-06-07", 30000, "여가·문화", "영화 + 팝콘"),
  exp("2026-06-09", 1500, "교통", "지하철"),
  exp("2026-06-11", 89000, "주거·통신", "휴대폰 요금"),
  exp("2026-06-14", 23000, "식비", "저녁 외식"),
  exp("2026-06-16", 6800, "카페·간식", "디저트"),
];

const sec = (name, color) => ({ id: uid(), name, color });
const DEFAULT_SECTORS = [
  sec("반도체", "#5B8DEF"),
  sec("2차전지", "#3FA9A0"),
  sec("전력·에너지", "#E07A3B"),
  sec("플랫폼·IT", "#7B6CD9"),
  sec("바이오·헬스", "#118A5C"),
  sec("자동차", "#C0567E"),
  sec("금융", "#B0843B"),
  sec("현금·기타", "#9B98A8"),
];
const _sm = Object.fromEntries(DEFAULT_SECTORS.map((s) => [s.name, s.id]));
const hold = (name, principal, value, secName) => ({ id: uid(), name, principal, value, sectorId: _sm[secName] });
const SEED_HOLDINGS = [
  hold("삼성전자", 5400000, 6200000, "반도체"),
  hold("SK하이닉스", 4200000, 3800000, "반도체"),
  hold("LG에너지솔루션", 2800000, 2400000, "2차전지"),
  hold("두산에너빌리티", 1100000, 1500000, "전력·에너지"),
  hold("네이버", 2000000, 1800000, "플랫폼·IT"),
];

const SEED = {
  current: { accounts: SEED_ACCOUNTS.map((a) => ({ ...a })) },
  categories: DEFAULT_CATEGORIES,
  expenses: SEED_EXPENSES,
  sectors: DEFAULT_SECTORS,
  holdings: SEED_HOLDINGS,
  snapshots: {
    "2026-06": {
      accounts: SEED_ACCOUNTS.map((a) => ({ ...a })),
      note:
        "- 전체 자산에서 가용자산 비중이 저조함 → 비중 10% 목표\n" +
        "- 욕심으로 코인 투자 시작 → 본전 시 일부 수익 및 매도\n" +
        "- 증시 하락으로 인한 평가 자산 전월 比 축소",
      savedAt: new Date("2026-06-07").toISOString(),
    },
  },
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
const won = (n) =>
  (n < 0 ? "-" : "") + Math.abs(Math.round(n)).toLocaleString("ko-KR");
const wonSigned = (n) =>
  (n > 0 ? "+" : n < 0 ? "-" : "") + Math.abs(Math.round(n)).toLocaleString("ko-KR");
const pct = (r) => (r * 100).toFixed(1) + "%";
const pctSigned = (r) => (r > 0 ? "+" : "") + (r * 100).toFixed(1) + "%";

const profitOf = (a) => (a.category === "invest" ? a.value - a.principal : 0);
const returnOf = (a) =>
  a.category === "invest" && a.principal > 0 ? (a.value - a.principal) / a.principal : 0;

function summarize(accounts) {
  let total = 0, invest = 0, cash = 0, available = 0, principal = 0;
  accounts.forEach((a) => {
    total += a.value;
    if (a.category === "invest") {
      invest += a.value;
      principal += a.principal;
    } else {
      cash += a.value;
    }
    if (a.available) available += a.value;
  });
  const profit = invest - principal;
  const ret = principal > 0 ? profit / principal : 0;
  return { total, invest, cash, available, principal, profit, ret };
}

const thisMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};
const monthLabel = (m) => {
  const [y, mo] = m.split("-");
  return `${y.slice(2)}.${mo}`;
};
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const addMonth = (m, delta) => {
  const [y, mo] = m.split("-").map(Number);
  const d = new Date(y, mo - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};
const monthFull = (m) => {
  const [y, mo] = m.split("-");
  return `${y}년 ${Number(mo)}월`;
};
const savedAtLabel = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
};

/* ------------------------------------------------------------------ */
/*  Small UI primitives                                                */
/* ------------------------------------------------------------------ */
function Card({ children, style }) {
  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${C.line}`,
        borderRadius: 18,
        padding: 20,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function NumberInput({ value, onChange, onCommit, placeholder }) {
  const [text, setText] = useState(value ? value.toLocaleString("ko-KR") : "");
  useEffect(() => {
    setText(value ? value.toLocaleString("ko-KR") : "");
  }, [value]);
  return (
    <input
      inputMode="numeric"
      value={text}
      placeholder={placeholder || "0"}
      onChange={(e) => {
        const digits = e.target.value.replace(/[^\d]/g, "");
        const n = digits ? parseInt(digits, 10) : 0;
        setText(n ? n.toLocaleString("ko-KR") : "");
        onChange(n);
      }}
      onBlur={onCommit}
      style={{
        ...numStyle,
        width: "100%",
        textAlign: "right",
        border: `1px solid ${C.line}`,
        borderRadius: 10,
        padding: "8px 10px",
        fontSize: 14,
        color: C.ink,
        background: "#FCFBF8",
        outline: "none",
        fontFamily: FONT,
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */
export default function AssetTracker() {
  const [data, setData] = useState(SEED);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("dash");
  const [saveMonth, setSaveMonth] = useState(thisMonth());
  const [savedFlash, setSavedFlash] = useState(false);
  const [openSnap, setOpenSnap] = useState(null);
  const [expMonth, setExpMonth] = useState(thisMonth());
  const [newExp, setNewExp] = useState({ date: todayStr(), amount: 0, categoryId: "", memo: "" });
  const [editingExp, setEditingExp] = useState(null);
  const [expDraft, setExpDraft] = useState({ date: "", amount: 0, categoryId: "", memo: "" });
  const [selectedCat, setSelectedCat] = useState(null);
  const [selectedSector, setSelectedSector] = useState(null);
  const [newCatName, setNewCatName] = useState("");
  const [showCatMgr, setShowCatMgr] = useState(false);
  const [newSecName, setNewSecName] = useState("");
  const [showSecMgr, setShowSecMgr] = useState(false);
  const [colorPickerFor, setColorPickerFor] = useState(null);
  const [newHolding, setNewHolding] = useState({ name: "", sectorId: "", principal: 0, value: 0 });
  const [vw, setVw] = useState(typeof window !== "undefined" ? window.innerWidth : 800);
  const persistTimer = useRef(null);
  const touchRef = useRef({ x: 0, y: 0, active: false });

  const hasStore = typeof window !== "undefined" && !!window.localStorage;

  /* load once */
  useEffect(() => {
    (async () => {
      if (hasStore) {
        try {
          const r = localStore.get(KEY);
          if (r && r.value) {
            const parsed = JSON.parse(r.value);
            if (!parsed.categories || parsed.categories.length === 0)
              parsed.categories = DEFAULT_CATEGORIES;
            if (!parsed.expenses) parsed.expenses = [];
            if (!parsed.sectors || parsed.sectors.length === 0)
              parsed.sectors = DEFAULT_SECTORS;
            if (!parsed.holdings) parsed.holdings = [];
            setData(parsed);
          }
        } catch (e) {
          /* first run: key doesn't exist yet — keep SEED */
        }
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    setSelectedCat(null);
  }, [expMonth]);

  const persist = (next) => {
    if (!hasStore) return;
    clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(async () => {
      try {
        localStore.set(KEY, JSON.stringify(next));
      } catch (e) {
        console.error("save failed", e);
      }
    }, 600);
  };
  const commit = (next) => {
    setData(next);
    persist(next);
  };

  /* ---- account mutations ---- */
  const accounts = data.current.accounts;
  const updateAccount = (id, patch) =>
    commit({
      ...data,
      current: {
        accounts: accounts.map((a) => (a.id === id ? { ...a, ...patch } : a)),
      },
    });
  const addAccount = (category) =>
    commit({
      ...data,
      current: {
        accounts: [
          ...accounts,
          acc(category === "invest" ? "새 계좌" : "새 현금", "", category, 0, 0, category === "cash"),
        ],
      },
    });
  const removeAccount = (id) =>
    commit({ ...data, current: { accounts: accounts.filter((a) => a.id !== id) } });

  /* ---- snapshot ---- */
  const saveSnapshot = () => {
    const next = {
      ...data,
      snapshots: {
        ...data.snapshots,
        [saveMonth]: {
          accounts: accounts.map((a) => ({ ...a })),
          note: data.snapshots[saveMonth]?.note || "",
          savedAt: new Date().toISOString(),
        },
      },
    };
    commit(next);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2200);
  };
  const deleteSnapshot = (m) => {
    const s = { ...data.snapshots };
    delete s[m];
    commit({ ...data, snapshots: s });
    if (openSnap === m) setOpenSnap(null);
  };
  const loadSnapshotToCurrent = (m) => {
    commit({
      ...data,
      current: { accounts: data.snapshots[m].accounts.map((a) => ({ ...a, id: uid() })) },
    });
    setTab("accounts");
  };
  const setNote = (m, note) =>
    commit({ ...data, snapshots: { ...data.snapshots, [m]: { ...data.snapshots[m], note } } });

  /* ---- expenses & categories ---- */
  const categories = data.categories || [];
  const expenses = data.expenses || [];
  const addExpense = () => {
    const cid = newExp.categoryId || categories[0]?.id;
    if (!newExp.amount || !cid) return;
    commit({
      ...data,
      expenses: [...expenses, { id: uid(), date: newExp.date, amount: newExp.amount, categoryId: cid, memo: newExp.memo.trim() }],
    });
    setNewExp({ date: newExp.date, amount: 0, categoryId: cid, memo: "" });
  };
  const removeExpense = (id) => commit({ ...data, expenses: expenses.filter((e) => e.id !== id) });
  const startEditExp = (e) => {
    setEditingExp(e.id);
    setExpDraft({ date: e.date, amount: e.amount, categoryId: e.categoryId, memo: e.memo || "" });
  };
  const saveEditExp = () => {
    if (!expDraft.amount || !expDraft.date) return;
    commit({
      ...data,
      expenses: expenses.map((e) =>
        e.id === editingExp
          ? { ...e, date: expDraft.date, amount: expDraft.amount, categoryId: expDraft.categoryId, memo: expDraft.memo.trim() }
          : e
      ),
    });
    setEditingExp(null);
  };
  const addCategory = () => {
    const name = newCatName.trim();
    if (!name) return;
    const color = PALETTE[categories.length % PALETTE.length];
    commit({ ...data, categories: [...categories, { id: uid(), name, color }] });
    setNewCatName("");
  };
  const removeCategory = (id) => {
    if (categories.length <= 1) return;
    commit({ ...data, categories: categories.filter((c) => c.id !== id) });
  };

  /* ---- holdings & sectors (stock portfolio) ---- */
  const sectors = data.sectors || [];
  const holdings = data.holdings || [];
  const addNewHolding = () => {
    const name = newHolding.name.trim();
    if (!name) return;
    const sectorId = newHolding.sectorId || sectors[0]?.id;
    commit({
      ...data,
      holdings: [...holdings, { id: uid(), name, principal: newHolding.principal, value: newHolding.value, sectorId }],
    });
    setNewHolding({ name: "", sectorId, principal: 0, value: 0 });
  };
  const removeHolding = (id) => commit({ ...data, holdings: holdings.filter((h) => h.id !== id) });
  const updateHolding = (id, patch) =>
    commit({ ...data, holdings: holdings.map((h) => (h.id === id ? { ...h, ...patch } : h)) });
  const addSector = () => {
    const name = newSecName.trim();
    if (!name) return;
    const color = PALETTE[(sectors.length + 3) % PALETTE.length];
    commit({ ...data, sectors: [...sectors, { id: uid(), name, color }] });
    setNewSecName("");
  };
  const removeSector = (id) => {
    if (sectors.length <= 1) return;
    commit({ ...data, sectors: sectors.filter((s) => s.id !== id) });
    if (colorPickerFor === id) setColorPickerFor(null);
    if (selectedSector === id) setSelectedSector(null);
  };
  const updateSectorColor = (id, color) =>
    commit({ ...data, sectors: sectors.map((s) => (s.id === id ? { ...s, color } : s)) });

  /* ---- backup: export / import ---- */
  const fileInputRef = useRef(null);
  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `자산가계부-백업-${todayStr()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const importData = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!parsed.current || !Array.isArray(parsed.current.accounts)) throw new Error("형식 오류");
        if (!parsed.categories || parsed.categories.length === 0) parsed.categories = DEFAULT_CATEGORIES;
        if (!parsed.expenses) parsed.expenses = [];
        if (!parsed.snapshots) parsed.snapshots = {};
        if (window.confirm("현재 데이터를 이 파일 내용으로 덮어씁니다. 계속할까요?")) {
          commit(parsed);
          window.alert("불러오기 완료!");
        }
      } catch (err) {
        window.alert("이 파일은 백업 파일이 아니거나 형식이 올바르지 않아요.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  /* ---- derived ---- */
  const cur = summarize(accounts);
  const months = Object.keys(data.snapshots).sort();
  const lastMonth = months[months.length - 1];
  const lastSnap = lastMonth ? summarize(data.snapshots[lastMonth].accounts) : null;
  const delta = lastSnap ? cur.total - lastSnap.total : 0;
  const deltaPct = lastSnap && lastSnap.total ? delta / lastSnap.total : 0;

  const trend = months.map((m) => {
    const s = summarize(data.snapshots[m].accounts);
    return { month: monthLabel(m), 총자산: Math.round(s.total), 투자: Math.round(s.invest), 현금: Math.round(s.cash) };
  });

  /* ---- expense derived ---- */
  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]));
  const spentInMonth = (m) =>
    expenses.filter((e) => e.date.slice(0, 7) === m).reduce((s, e) => s + e.amount, 0);
  const monthExpenses = expenses
    .filter((e) => e.date.slice(0, 7) === expMonth)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  const monthTotal = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const prevMonthTotal = spentInMonth(addMonth(expMonth, -1));
  const byCat = {};
  monthExpenses.forEach((e) => { byCat[e.categoryId] = (byCat[e.categoryId] || 0) + e.amount; });
  const pieData = categories
    .filter((c) => byCat[c.id])
    .map((c) => ({ id: c.id, name: c.name, value: byCat[c.id], color: c.color }))
    .sort((a, b) => b.value - a.value);
  const thisMonthSpent = spentInMonth(thisMonth());

  /* ---- stock portfolio derived ---- */
  const secMap = Object.fromEntries(sectors.map((s) => [s.id, s]));
  const holdingsTotal = holdings.reduce((s, h) => s + h.value, 0);
  const holdingsPrincipal = holdings.reduce((s, h) => s + h.principal, 0);
  const holdingsProfit = holdingsTotal - holdingsPrincipal;
  const holdingsReturn = holdingsPrincipal > 0 ? holdingsProfit / holdingsPrincipal : 0;
  const bySector = {};
  holdings.forEach((h) => { bySector[h.sectorId] = (bySector[h.sectorId] || 0) + h.value; });
  const sectorPie = sectors
    .filter((s) => bySector[s.id])
    .map((s) => ({ name: s.name, value: bySector[s.id], color: s.color }))
    .sort((a, b) => b.value - a.value);
  const topSector = sectorPie[0] || null;
  const topShare = topSector && holdingsTotal ? topSector.value / holdingsTotal : 0;

  const bySectorPrincipal = {};
  holdings.forEach((h) => { bySectorPrincipal[h.sectorId] = (bySectorPrincipal[h.sectorId] || 0) + h.principal; });
  const principalPie = sectors
    .filter((s) => bySectorPrincipal[s.id])
    .map((s) => ({ id: s.id, name: s.name, value: bySectorPrincipal[s.id], color: s.color }))
    .sort((a, b) => b.value - a.value);

  const bySectorProfit = {};
  holdings.forEach((h) => { bySectorProfit[h.sectorId] = (bySectorProfit[h.sectorId] || 0) + (h.value - h.principal); });
  const profitPie = sectors
    .filter((s) => bySectorProfit[s.id])
    .map((s) => ({ id: s.id, name: s.name, raw: bySectorProfit[s.id], value: Math.abs(bySectorProfit[s.id]), color: s.color }))
    .sort((a, b) => b.value - a.value);
  const profitPieTotal = profitPie.reduce((s, d) => s + d.value, 0);

  if (loading) {
    return (
      <div style={{ fontFamily: FONT, color: C.sub, padding: 40, textAlign: "center", background: C.bg }}>
        불러오는 중…
      </div>
    );
  }

  const up = delta >= 0;
  const isMobile = vw < 560;

  const TAB_ORDER = ["dash", "accounts", "stocks", "expense", "history"];
  const TAB_LABELS = { dash: "대시보드", accounts: "계좌", stocks: "종목", expense: "가계부", history: "기록" };

  const onTabTouchStart = (e) => {
    const t = e.touches[0];
    touchRef.current = { x: t.clientX, y: t.clientY, active: true };
  };
  const onTabTouchEnd = (e) => {
    if (!touchRef.current.active) return;
    touchRef.current.active = false;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchRef.current.x;
    const dy = t.clientY - touchRef.current.y;
    if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.8) {
      const idx = TAB_ORDER.indexOf(tab);
      if (dx < 0 && idx < TAB_ORDER.length - 1) setTab(TAB_ORDER[idx + 1]);
      else if (dx > 0 && idx > 0) setTab(TAB_ORDER[idx - 1]);
    }
  };

  /* ------------------------------------------------------------------ */
  return (
    <div style={{ fontFamily: FONT, background: C.bg, color: C.ink, minHeight: "100%", padding: isMobile ? "16px 12px 40px" : "20px 16px 48px" }}>
      <style>{`
        * { box-sizing: border-box; }
        html, body { margin: 0; background: ${C.bg}; overflow-x: hidden; }
        input, select, textarea, button { font-family: inherit; }
      `}</style>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
          <Logo size={46} />
          <div>
            <h1 style={{ fontSize: 25, fontWeight: 800, margin: 0, letterSpacing: "-0.01em" }}>Trend</h1>
            <div style={{ fontSize: 12.5, color: C.sub, marginTop: 1 }}>내 자금의 흐름을 읽다 · 자산 가계부</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
          {TAB_ORDER.map((k) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              style={{
                flex: 1,
                padding: "10px 0",
                borderRadius: 12,
                border: `1px solid ${tab === k ? C.amber : C.line}`,
                background: tab === k ? C.amberSoft : C.card,
                color: tab === k ? "#7A5310" : C.sub,
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                fontFamily: FONT,
                whiteSpace: "nowrap",
              }}
            >
              {TAB_LABELS[k]}
            </button>
          ))}
        </div>

        <div onTouchStart={onTabTouchStart} onTouchEnd={onTabTouchEnd}>

        {/* =================== DASHBOARD =================== */}
        {tab === "dash" && (
          <div style={{ display: "grid", gap: 14 }}>
            {/* Hero */}
            <Card style={{ background: "#1C1B2E", border: "none", color: "#fff", padding: 24 }}>
              <div style={{ fontSize: 13, color: "#B7B4C6" }}>현재 총 자산</div>
              <div style={{ ...numStyle, fontSize: "clamp(28px, 8.5vw, 38px)", fontWeight: 800, marginTop: 4 }}>
                ₩{won(cur.total)}
              </div>
              {lastSnap && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
                  <span
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      background: up ? "rgba(52,211,153,.16)" : "rgba(248,113,113,.16)",
                      color: up ? "#5EE0A8" : "#F89A8C",
                      padding: "5px 10px", borderRadius: 999, fontSize: 13, fontWeight: 700, ...numStyle,
                    }}
                  >
                    {up ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {wonSigned(delta)} ({pctSigned(deltaPct)})
                  </span>
                  <span style={{ fontSize: 12, color: "#8F8CA3" }}>
                    {monthLabel(lastMonth)} 저장분 대비
                  </span>
                </div>
              )}
            </Card>

            {/* Composition stat cards */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 10 }}>
              <MiniStat icon={<LineChart size={15} />} label="투자자산" value={cur.invest} share={cur.invest / cur.total} tint={C.amber} mobile={isMobile} />
              <MiniStat icon={<Wallet size={15} />} label="현금자산" value={cur.cash} share={cur.cash / cur.total} tint={C.sub} mobile={isMobile} />
              <MiniStat icon={<Coins size={15} />} label="가용자산" value={cur.available} share={cur.available / cur.total} tint={C.gain} mobile={isMobile} />
            </div>

            {/* Investment P/L */}
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 13, color: C.sub }}>투자 평가손익</div>
                  <div style={{ ...numStyle, fontSize: 22, fontWeight: 800, marginTop: 2, color: cur.profit >= 0 ? C.gain : C.loss }}>
                    {wonSigned(cur.profit)}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 13, color: C.sub }}>총 수익률</div>
                  <div style={{ ...numStyle, fontSize: 22, fontWeight: 800, marginTop: 2, color: cur.ret >= 0 ? C.gain : C.loss }}>
                    {pctSigned(cur.ret)}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: C.faint, marginTop: 8, ...numStyle }}>
                원금 ₩{won(cur.principal)} → 평가 ₩{won(cur.invest)}
              </div>
            </Card>

            {/* This month spending */}
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: C.sub }}>
                    <Receipt size={15} color={C.amber} />
                    <span style={{ fontSize: 13, fontWeight: 700 }}>이번 달 소비 ({monthFull(thisMonth())})</span>
                  </div>
                  <div style={{ ...numStyle, fontSize: 24, fontWeight: 800, marginTop: 6 }}>₩{won(thisMonthSpent)}</div>
                  <div style={{ fontSize: 12, color: C.faint, marginTop: 4, ...numStyle }}>
                    {cur.available > 0 ? `가용자산의 ${pct(thisMonthSpent / cur.available)}` : "가용자산 정보 없음"}
                  </div>
                </div>
                <button
                  onClick={() => { setExpMonth(thisMonth()); setTab("expense"); }}
                  style={{ display: "inline-flex", alignItems: "center", gap: 3, background: C.amberSoft, color: "#7A5310", border: "none", borderRadius: 9, padding: "7px 11px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}
                >
                  가계부 <ChevronRight size={14} />
                </button>
              </div>
            </Card>

            {/* Trend */}
            <Card>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <ArrowUpRight size={16} color={C.amber} />
                <span style={{ fontWeight: 700, fontSize: 15 }}>총자산 추이</span>
              </div>
              {trend.length >= 2 ? (
                <div style={{ height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trend} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={C.amber} stopOpacity={0.35} />
                          <stop offset="100%" stopColor={C.amber} stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke={C.line} vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 12, fill: C.sub }} axisLine={false} tickLine={false} />
                      <YAxis
                        tick={{ fontSize: 11, fill: C.faint }}
                        axisLine={false}
                        tickLine={false}
                        width={48}
                        tickFormatter={(v) => (v / 10000).toLocaleString("ko-KR") + "만"}
                      />
                      <Tooltip
                        formatter={(v) => "₩" + won(v)}
                        contentStyle={{ borderRadius: 12, border: `1px solid ${C.line}`, fontSize: 13, fontFamily: FONT }}
                      />
                      <Area type="monotone" dataKey="총자산" stroke={C.amber} strokeWidth={2.5} fill="url(#g)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div style={{ padding: "28px 8px", textAlign: "center", color: C.faint, fontSize: 14, lineHeight: 1.6 }}>
                  아직 저장된 달이 한 개예요.<br />
                  다음 달에 금액을 갱신하고 <b style={{ color: C.amber }}>이번 달 저장</b>을 누르면<br />
                  여기에 변화 그래프가 그려져요.
                </div>
              )}
            </Card>

            {/* Account table */}
            <Card>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                <Layers size={16} color={C.amber} />
                <span style={{ fontWeight: 700, fontSize: 15 }}>계좌별 현황</span>
              </div>
              <div style={{ display: "grid", gap: 2 }}>
                {accounts.map((a) => {
                  const r = returnOf(a);
                  return (
                    <div key={a.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 2px", borderBottom: `1px solid ${C.line}` }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>
                          {a.broker && <span style={{ color: C.faint, fontWeight: 500 }}>{a.broker} · </span>}
                          {a.name}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <span style={{ ...numStyle, fontSize: 14, fontWeight: 600 }}>₩{won(a.value)}</span>
                        {a.category === "invest" && (
                          <span style={{ ...numStyle, fontSize: 13, fontWeight: 700, width: 62, textAlign: "right", color: r >= 0 ? C.gain : C.loss }}>
                            {pctSigned(r)}
                          </span>
                        )}
                        {a.category === "cash" && (
                          <span style={{ fontSize: 12, color: C.faint, width: 62, textAlign: "right" }}>현금</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}

        {/* =================== ACCOUNTS =================== */}
        {tab === "accounts" && (
          <div style={{ display: "grid", gap: 16 }}>
            <AccountGroup
              title="투자자산"
              hint="원금과 현재 평가금액을 입력하면 수익·수익률이 자동 계산돼요."
              category="invest"
              accounts={accounts.filter((a) => a.category === "invest")}
              onUpdate={updateAccount}
              onRemove={removeAccount}
              onAdd={() => addAccount("invest")}
            />
            <AccountGroup
              title="현금·기타 자산"
              hint="예금·청약·부동산 등. '가용'에 체크하면 즉시 쓸 수 있는 자산으로 집계돼요."
              category="cash"
              accounts={accounts.filter((a) => a.category === "cash")}
              onUpdate={updateAccount}
              onRemove={removeAccount}
              onAdd={() => addAccount("cash")}
            />

            {/* Live summary + save */}
            <Card style={{ background: C.amberSoft, border: `1px solid #EBD9AE` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontWeight: 700 }}>현재 입력 기준 총 자산</span>
                <span style={{ ...numStyle, fontSize: 22, fontWeight: 800, color: "#7A5310" }}>₩{won(cur.total)}</span>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 16, alignItems: "center", flexWrap: "wrap" }}>
                <input
                  type="month"
                  value={saveMonth}
                  onChange={(e) => setSaveMonth(e.target.value)}
                  style={{ border: `1px solid #E0C98A`, borderRadius: 10, padding: "9px 12px", fontSize: 14, fontFamily: FONT, color: C.ink, background: "#fff" }}
                />
                <button
                  onClick={saveSnapshot}
                  style={{
                    flex: 1, minWidth: 160, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7,
                    background: savedFlash ? C.gain : C.amber, color: "#fff", border: "none", borderRadius: 12,
                    padding: "12px 16px", fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: FONT, transition: "background .2s",
                  }}
                >
                  <Save size={16} />
                  {savedFlash ? `${monthLabel(saveMonth)} 저장 완료` : `${monthLabel(saveMonth)} 기록 저장`}
                </button>
              </div>
              {data.snapshots[saveMonth] && !savedFlash && (
                <div style={{ fontSize: 12, color: "#9A7B30", marginTop: 8 }}>
                  ※ 이미 {monthLabel(saveMonth)} 기록이 있어요. 저장하면 덮어써집니다.
                </div>
              )}
            </Card>
          </div>
        )}

        {/* =================== EXPENSE =================== */}
        {tab === "expense" && (
          <div style={{ display: "grid", gap: 14 }}>
            {/* Month nav + total */}
            <Card style={{ background: "#1C1B2E", border: "none", color: "#fff", padding: 22 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <button onClick={() => setExpMonth(addMonth(expMonth, -1))} style={navBtn}><ChevronLeft size={18} color="#fff" /></button>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 13, color: "#B7B4C6" }}>{monthFull(expMonth)} 소비</div>
                  <div style={{ ...numStyle, fontSize: "clamp(24px, 7.5vw, 30px)", fontWeight: 800, marginTop: 2 }}>₩{won(monthTotal)}</div>
                </div>
                <button
                  onClick={() => setExpMonth(addMonth(expMonth, 1))}
                  disabled={expMonth >= thisMonth()}
                  style={{ ...navBtn, opacity: expMonth >= thisMonth() ? 0.3 : 1 }}
                >
                  <ChevronRight size={18} color="#fff" />
                </button>
              </div>
              {prevMonthTotal > 0 && (
                <div style={{ textAlign: "center", marginTop: 8, fontSize: 12.5, color: "#8F8CA3", ...numStyle }}>
                  전월 ₩{won(prevMonthTotal)} 대비{" "}
                  <span style={{ color: monthTotal > prevMonthTotal ? "#F89A8C" : "#5EE0A8", fontWeight: 700 }}>
                    {wonSigned(monthTotal - prevMonthTotal)}
                  </span>
                </div>
              )}
            </Card>

            {/* Pie + legend */}
            <Card>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <Tag size={16} color={C.amber} />
                <span style={{ fontWeight: 700, fontSize: 15 }}>카테고리별 소비</span>
                {pieData.length > 0 && (
                  <span style={{ fontSize: 12, color: C.faint, marginLeft: "auto" }}>탭하면 내역이 보여요</span>
                )}
              </div>
              {pieData.length > 0 ? (
                <>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <div style={{ position: "relative", width: 180, height: 180, flexShrink: 0, margin: "0 auto" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={52} outerRadius={82} paddingAngle={2} stroke="none">
                          {pieData.map((d, i) => (
                            <Cell
                              key={i}
                              fill={d.color}
                              cursor="pointer"
                              opacity={selectedCat && selectedCat !== d.id ? 0.4 : 1}
                              onClick={() => setSelectedCat(selectedCat === d.id ? null : d.id)}
                            />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => "₩" + won(v)} contentStyle={{ borderRadius: 12, border: `1px solid ${C.line}`, fontSize: 13, fontFamily: FONT }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                      <span style={{ fontSize: 11, color: C.faint }}>합계</span>
                      <span style={{ ...numStyle, fontSize: 15, fontWeight: 800 }}>₩{won(monthTotal)}</span>
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 150, display: "grid", gap: 4 }}>
                    {pieData.map((d) => (
                      <div
                        key={d.id}
                        onClick={() => setSelectedCat(selectedCat === d.id ? null : d.id)}
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13,
                          cursor: "pointer", padding: "5px 7px", borderRadius: 8,
                          background: selectedCat === d.id ? C.amberSoft : "transparent",
                        }}
                      >
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                          <span style={{ width: 10, height: 10, borderRadius: 3, background: d.color }} />
                          {d.name}
                        </span>
                        <span style={{ ...numStyle, color: C.sub }}>
                          ₩{won(d.value)} <span style={{ color: C.faint, fontSize: 12 }}>{pct(d.value / monthTotal)}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedCat && (() => {
                  const c = catMap[selectedCat];
                  const list = monthExpenses.filter((e) => e.categoryId === selectedCat);
                  const sum = list.reduce((s, e) => s + e.amount, 0);
                  return (
                    <div style={{ marginTop: 14, borderTop: `1px solid ${C.line}`, paddingTop: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13.5, fontWeight: 700 }}>
                          <span style={{ width: 9, height: 9, borderRadius: 3, background: c ? c.color : C.faint }} />
                          {c ? c.name : "미분류"} 내역
                          <span style={{ color: C.faint, fontWeight: 500 }}>· ₩{won(sum)}</span>
                        </span>
                        <button onClick={() => setSelectedCat(null)} style={{ background: "none", border: "none", cursor: "pointer", color: C.faint, padding: 4, display: "flex" }}>
                          <XIcon size={15} />
                        </button>
                      </div>
                      <div style={{ display: "grid", gap: 2 }}>
                        {list.length === 0 ? (
                          <div style={{ fontSize: 13, color: C.faint, padding: "6px 0" }}>이 달엔 내역이 없어요.</div>
                        ) : (
                          list.map((e) => (
                            <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, padding: "7px 2px", borderBottom: `1px solid ${C.line}` }}>
                              <span style={{ color: C.sub, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {e.date.slice(5).replace("-", ".")} {e.memo && <span style={{ color: C.ink }}>· {e.memo}</span>}
                              </span>
                              <span style={{ ...numStyle, fontWeight: 600, flexShrink: 0, marginLeft: 8 }}>₩{won(e.amount)}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })()}
                </>
              ) : (
                <div style={{ textAlign: "center", color: C.faint, fontSize: 14, padding: "24px 0" }}>
                  이 달의 소비 내역이 없어요. 아래에서 추가해 보세요.
                </div>
              )}
            </Card>

            {/* Add expense */}
            <Card>
              <span style={{ fontWeight: 700, fontSize: 15 }}>소비 추가</span>
              <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="date"
                    value={newExp.date}
                    onChange={(e) => setNewExp({ ...newExp, date: e.target.value })}
                    style={{ ...inp, flex: 1 }}
                  />
                  <div style={{ flex: 1 }}>
                    <NumberInput value={newExp.amount} onChange={(v) => setNewExp({ ...newExp, amount: v })} onCommit={() => {}} placeholder="금액" />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <select
                    value={newExp.categoryId || categories[0]?.id || ""}
                    onChange={(e) => setNewExp({ ...newExp, categoryId: e.target.value })}
                    style={{ ...inp, flex: 1, cursor: "pointer" }}
                  >
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <input
                    value={newExp.memo}
                    onChange={(e) => setNewExp({ ...newExp, memo: e.target.value })}
                    placeholder="메모 (선택)"
                    style={{ ...inp, flex: 1.4 }}
                  />
                </div>
                <button
                  onClick={addExpense}
                  disabled={!newExp.amount}
                  style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
                    background: newExp.amount ? C.amber : "#E6E2D8", color: "#fff", border: "none", borderRadius: 12,
                    padding: "12px", fontWeight: 700, fontSize: 15, cursor: newExp.amount ? "pointer" : "default", fontFamily: FONT,
                  }}
                >
                  <Plus size={16} /> 추가하기
                </button>
              </div>

              {/* Category manager */}
              <button
                onClick={() => setShowCatMgr(!showCatMgr)}
                style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "none", border: "none", color: C.sub, fontSize: 13, fontWeight: 600, cursor: "pointer", marginTop: 14, fontFamily: FONT, padding: 0 }}
              >
                <Settings2 size={14} /> 카테고리 관리 {showCatMgr ? "닫기" : "열기"}
              </button>
              {showCatMgr && (
                <div style={{ marginTop: 12, borderTop: `1px solid ${C.line}`, paddingTop: 12 }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                    {categories.map((c) => (
                      <span key={c.id} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#FCFBF8", border: `1px solid ${C.line}`, borderRadius: 999, padding: "5px 8px 5px 10px", fontSize: 13 }}>
                        <span style={{ width: 9, height: 9, borderRadius: 3, background: c.color }} />
                        {c.name}
                        <button onClick={() => removeCategory(c.id)} style={{ background: "none", border: "none", cursor: "pointer", color: C.faint, padding: 0, display: "flex" }}>
                          <XIcon size={13} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") addCategory(); }}
                      placeholder="새 카테고리 이름 (예: 반려동물)"
                      style={{ ...inp, flex: 1 }}
                    />
                    <button onClick={addCategory} style={{ ...ghostBtn, flex: 0, padding: "10px 16px", color: "#7A5310", borderColor: "#E0C98A", background: C.amberSoft, fontWeight: 700 }}>추가</button>
                  </div>
                </div>
              )}
            </Card>

            {/* Expense list */}
            <Card>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <Receipt size={16} color={C.amber} />
                <span style={{ fontWeight: 700, fontSize: 15 }}>소비 내역</span>
                <span style={{ fontSize: 12, color: C.faint, marginLeft: "auto" }}>항목을 탭하면 수정돼요</span>
              </div>
              {(() => {
                const groups = {};
                monthExpenses.forEach((e) => { (groups[e.date] = groups[e.date] || []).push(e); });
                const dates = Object.keys(groups).sort((a, b) => (a < b ? 1 : -1));
                if (dates.length === 0)
                  return <div style={{ textAlign: "center", color: C.faint, fontSize: 13, padding: "18px 0" }}>내역이 없어요.</div>;
                return dates.map((d) => {
                  const [, mo, da] = d.split("-");
                  const dayTotal = groups[d].reduce((s, e) => s + e.amount, 0);
                  return (
                    <div key={d} style={{ marginBottom: 6 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 2px 4px", borderBottom: `1px solid ${C.line}` }}>
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: C.sub }}>{Number(mo)}월 {Number(da)}일</span>
                        <span style={{ ...numStyle, fontSize: 12.5, color: C.faint }}>₩{won(dayTotal)}</span>
                      </div>
                      {groups[d].map((e) => {
                        const c = catMap[e.categoryId];
                        if (editingExp === e.id) {
                          return (
                            <div key={e.id} style={{ border: `1px solid ${C.amber}`, borderRadius: 12, padding: 11, margin: "6px 0", background: "#FFFDF8" }}>
                              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                                <input type="date" value={expDraft.date} onChange={(ev) => setExpDraft({ ...expDraft, date: ev.target.value })} style={{ ...inp, flex: 1 }} />
                                <div style={{ flex: 1 }}>
                                  <NumberInput value={expDraft.amount} onChange={(v) => setExpDraft({ ...expDraft, amount: v })} onCommit={() => {}} placeholder="금액" />
                                </div>
                              </div>
                              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                                <select value={expDraft.categoryId} onChange={(ev) => setExpDraft({ ...expDraft, categoryId: ev.target.value })} style={{ ...inp, flex: 1, cursor: "pointer" }}>
                                  {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                </select>
                                <input value={expDraft.memo} onChange={(ev) => setExpDraft({ ...expDraft, memo: ev.target.value })} placeholder="메모" style={{ ...inp, flex: 1.4 }} />
                              </div>
                              <div style={{ display: "flex", gap: 8 }}>
                                <button onClick={saveEditExp} disabled={!expDraft.amount} style={{ flex: 1, background: expDraft.amount ? C.amber : "#E6E2D8", color: "#fff", border: "none", borderRadius: 10, padding: "10px", fontWeight: 700, fontSize: 14, cursor: expDraft.amount ? "pointer" : "default", fontFamily: FONT }}>저장</button>
                                <button onClick={() => setEditingExp(null)} style={{ ...ghostBtn, flex: 0, padding: "10px 16px" }}>취소</button>
                                <button onClick={() => { removeExpense(e.id); setEditingExp(null); }} style={{ ...ghostBtn, flex: 0, padding: "10px 13px", color: C.loss, borderColor: "#F1C9C1", display: "flex", alignItems: "center" }}><Trash2 size={15} /></button>
                              </div>
                            </div>
                          );
                        }
                        return (
                          <div key={e.id} onClick={() => startEditExp(e)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 4px", cursor: "pointer", borderRadius: 8 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
                              <span style={{ width: 8, height: 8, borderRadius: 3, background: c ? c.color : C.faint, flexShrink: 0 }} />
                              <span style={{ fontSize: 13, color: C.sub, flexShrink: 0 }}>{c ? c.name : "미분류"}</span>
                              {e.memo && <span style={{ fontSize: 13, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>· {e.memo}</span>}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                              <span style={{ ...numStyle, fontSize: 14, fontWeight: 600 }}>₩{won(e.amount)}</span>
                              <Pencil size={13} color={C.faint} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                });
              })()}
            </Card>
          </div>
        )}

        {/* =================== STOCKS =================== */}
        {tab === "stocks" && (
          <div style={{ display: "grid", gap: isMobile ? 12 : 14 }}>
            {/* Total + top sector */}
            <Card style={{ background: "#1C1B2E", border: "none", color: "#fff", padding: isMobile ? 18 : 22 }}>
              <div style={{ fontSize: 13, color: "#B7B4C6" }}>보유 종목 평가금액 합계</div>
              <div style={{ ...numStyle, fontSize: "clamp(26px, 8vw, 32px)", fontWeight: 800, marginTop: 4 }}>
                ₩{won(holdingsTotal)}
              </div>
              {holdings.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    background: holdingsProfit >= 0 ? "rgba(52,211,153,.16)" : "rgba(248,113,113,.16)",
                    color: holdingsProfit >= 0 ? "#5EE0A8" : "#F89A8C",
                    padding: "5px 10px", borderRadius: 999, fontSize: 13, fontWeight: 700, ...numStyle,
                  }}>
                    {holdingsProfit >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {wonSigned(holdingsProfit)} ({pctSigned(holdingsReturn)})
                  </span>
                  <span style={{ fontSize: 12, color: "#8F8CA3", ...numStyle }}>원금 ₩{won(holdingsPrincipal)}</span>
                </div>
              )}
              {topSector && (
                <div style={{ marginTop: 8, fontSize: 12.5, color: "#8F8CA3" }}>
                  최고 비중 섹터 ·{" "}
                  <span style={{ color: "#fff", fontWeight: 700 }}>{topSector.name} {pct(topShare)}</span>
                </div>
              )}
            </Card>

            {/* Concentration warning */}
            {topSector && topShare >= 0.4 && (
              <Card style={{ background: C.lossSoft, border: "1px solid #F1C9C1", padding: isMobile ? 13 : 16 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <AlertTriangle size={18} color={C.loss} style={{ flexShrink: 0, marginTop: 1 }} />
                  <div style={{ fontSize: 13.5, color: "#8A3325", lineHeight: 1.5 }}>
                    <b>{topSector.name}</b> 섹터가 전체의 <b>{pct(topShare)}</b>를 차지해요.
                    한 섹터에 쏠리면 위험이 커질 수 있으니 분산을 고려해 보세요.
                  </div>
                </div>
              </Card>
            )}

            {/* Sector pie - principal basis */}
            <Card style={{ padding: isMobile ? 16 : 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <Briefcase size={16} color={C.amber} />
                <span style={{ fontWeight: 700, fontSize: isMobile ? 14 : 15 }}>섹터별 보유 비중 (원금 기준)</span>
                {principalPie.length > 0 && (
                  <span style={{ fontSize: 11.5, color: C.faint, marginLeft: "auto" }}>탭하면 종목이 보여요</span>
                )}
              </div>
              {principalPie.length > 0 ? (
                <>
                <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: "center", gap: isMobile ? 12 : 8 }}>
                  <div style={{ position: "relative", width: isMobile ? 148 : 180, height: isMobile ? 148 : 180, flexShrink: 0 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={principalPie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={isMobile ? 42 : 52} outerRadius={isMobile ? 67 : 82} paddingAngle={2} stroke="none">
                          {principalPie.map((d, i) => (
                            <Cell
                              key={i}
                              fill={d.color}
                              cursor="pointer"
                              opacity={selectedSector && selectedSector !== d.id ? 0.4 : 1}
                              onClick={() => setSelectedSector(selectedSector === d.id ? null : d.id)}
                            />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => "₩" + won(v)} contentStyle={{ borderRadius: 12, border: `1px solid ${C.line}`, fontSize: 13, fontFamily: FONT }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                      <span style={{ fontSize: 10.5, color: C.faint }}>원금 합계</span>
                      <span style={{ ...numStyle, fontSize: isMobile ? 12.5 : 14, fontWeight: 800 }}>₩{won(holdingsPrincipal)}</span>
                    </div>
                  </div>
                  <div style={{ width: isMobile ? "100%" : "auto", flex: isMobile ? "none" : 1, minWidth: isMobile ? 0 : 170, display: "grid", gap: isMobile ? 7 : 9 }}>
                    {principalPie.map((d) => (
                      <div
                        key={d.id}
                        onClick={() => setSelectedSector(selectedSector === d.id ? null : d.id)}
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: isMobile ? 12.5 : 13,
                          cursor: "pointer", padding: "4px 6px", borderRadius: 8,
                          background: selectedSector === d.id ? C.amberSoft : "transparent",
                        }}
                      >
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 7, minWidth: 0 }}>
                          <span style={{ width: 10, height: 10, borderRadius: 3, background: d.color, flexShrink: 0 }} />
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</span>
                        </span>
                        <span style={{ ...numStyle, color: C.sub, flexShrink: 0, marginLeft: 8 }}>
                          {pct(d.value / holdingsPrincipal)} <span style={{ color: C.faint, fontSize: 11.5 }}>₩{won(d.value)}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                {selectedSector && (
                  <SectorHoldingsDetail
                    sector={secMap[selectedSector]}
                    list={holdings.filter((h) => h.sectorId === selectedSector)}
                    onClose={() => setSelectedSector(null)}
                  />
                )}
                </>
              ) : (
                <div style={{ textAlign: "center", color: C.faint, fontSize: 14, padding: "24px 0" }}>
                  보유 종목이 없어요. 아래에서 추가해 보세요.
                </div>
              )}
            </Card>

            {/* Sector pie - profit basis */}
            <Card style={{ padding: isMobile ? 16 : 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <TrendingUp size={16} color={C.amber} />
                <span style={{ fontWeight: 700, fontSize: isMobile ? 14 : 15 }}>섹터별 보유 비중 (수익금 기준)</span>
                {profitPie.length > 0 && (
                  <span style={{ fontSize: 11.5, color: C.faint, marginLeft: "auto" }}>탭하면 종목이 보여요</span>
                )}
              </div>
              {profitPie.length > 0 ? (
                <>
                <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: "center", gap: isMobile ? 12 : 8 }}>
                  <div style={{ position: "relative", width: isMobile ? 148 : 180, height: isMobile ? 148 : 180, flexShrink: 0 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={profitPie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={isMobile ? 42 : 52} outerRadius={isMobile ? 67 : 82} paddingAngle={2} stroke="none">
                          {profitPie.map((d, i) => (
                            <Cell
                              key={i}
                              fill={d.raw >= 0 ? d.color : C.loss}
                              cursor="pointer"
                              opacity={selectedSector && selectedSector !== d.id ? 0.4 : 1}
                              onClick={() => setSelectedSector(selectedSector === d.id ? null : d.id)}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          content={({ active, payload }) => {
                            if (!active || !payload || !payload.length) return null;
                            const d = payload[0].payload;
                            return (
                              <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 12, padding: "8px 10px", fontSize: 13, fontFamily: FONT }}>
                                <div style={{ fontWeight: 700, marginBottom: 2 }}>{d.name}</div>
                                <div style={{ ...numStyle, color: d.raw >= 0 ? C.gain : C.loss, fontWeight: 700 }}>{wonSigned(d.raw)}</div>
                              </div>
                            );
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                      <span style={{ fontSize: 10.5, color: C.faint }}>평가손익 합계</span>
                      <span style={{ ...numStyle, fontSize: isMobile ? 12.5 : 14, fontWeight: 800, color: holdingsProfit >= 0 ? C.gain : C.loss }}>{wonSigned(holdingsProfit)}</span>
                    </div>
                  </div>
                  <div style={{ width: isMobile ? "100%" : "auto", flex: isMobile ? "none" : 1, minWidth: isMobile ? 0 : 170, display: "grid", gap: isMobile ? 7 : 9 }}>
                    {profitPie.map((d) => (
                      <div
                        key={d.id}
                        onClick={() => setSelectedSector(selectedSector === d.id ? null : d.id)}
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: isMobile ? 12.5 : 13,
                          cursor: "pointer", padding: "4px 6px", borderRadius: 8,
                          background: selectedSector === d.id ? C.amberSoft : "transparent",
                        }}
                      >
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 7, minWidth: 0 }}>
                          <span style={{ width: 10, height: 10, borderRadius: 3, background: d.raw >= 0 ? d.color : C.loss, flexShrink: 0 }} />
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</span>
                        </span>
                        <span style={{ ...numStyle, color: d.raw >= 0 ? C.gain : C.loss, fontWeight: 700, flexShrink: 0, marginLeft: 8 }}>
                          {wonSigned(d.raw)} <span style={{ color: C.faint, fontSize: 11.5, fontWeight: 500 }}>{pct(d.value / profitPieTotal)}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                {selectedSector && (
                  <SectorHoldingsDetail
                    sector={secMap[selectedSector]}
                    list={holdings.filter((h) => h.sectorId === selectedSector)}
                    onClose={() => setSelectedSector(null)}
                  />
                )}
                </>
              ) : (
                <div style={{ textAlign: "center", color: C.faint, fontSize: 14, padding: "24px 0" }}>
                  보유 종목이 없어요. 아래에서 추가해 보세요.
                </div>
              )}
            </Card>

            {/* Sector manager */}
            <Card style={{ padding: isMobile ? 16 : 20 }}>
              <button
                onClick={() => { setShowSecMgr(!showSecMgr); setColorPickerFor(null); }}
                style={{ display: "flex", width: "100%", alignItems: "center", gap: 6, background: "none", border: "none", color: C.ink, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: FONT, padding: 0 }}
              >
                <Settings2 size={16} color={C.amber} /> 섹터 관리
                <span style={{ marginLeft: "auto", fontSize: 13, color: C.sub, fontWeight: 600 }}>{showSecMgr ? "닫기" : "열기"}</span>
              </button>
              {showSecMgr && (
                <div style={{ marginTop: 12, borderTop: `1px solid ${C.line}`, paddingTop: 12 }}>
                  <div style={{ fontSize: 11.5, color: C.faint, marginBottom: 10 }}>색 점을 탭하면 섹터 색상을 바꿀 수 있어요.</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                    {sectors.map((s) => (
                      <span key={s.id} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#FCFBF8", border: `1px solid ${C.line}`, borderRadius: 999, padding: "5px 8px 5px 8px", fontSize: 13 }}>
                        <button
                          onClick={() => setColorPickerFor(colorPickerFor === s.id ? null : s.id)}
                          aria-label="색상 변경"
                          style={{ width: 16, height: 16, borderRadius: 5, background: s.color, border: colorPickerFor === s.id ? `2px solid ${C.ink}` : "2px solid transparent", cursor: "pointer", padding: 0, flexShrink: 0 }}
                        />
                        {s.name}
                        <button onClick={() => removeSector(s.id)} style={{ background: "none", border: "none", cursor: "pointer", color: C.faint, padding: 0, display: "flex" }}>
                          <XIcon size={13} />
                        </button>
                      </span>
                    ))}
                  </div>

                  {colorPickerFor && (() => {
                    const target = sectors.find((s) => s.id === colorPickerFor);
                    if (!target) return null;
                    return (
                      <div style={{ marginBottom: 12, padding: 10, background: "#FCFBF8", border: `1px solid ${C.line}`, borderRadius: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 9 }}>
                          <span style={{ fontSize: 12, color: C.sub, fontWeight: 700 }}><b style={{ color: C.ink }}>{target.name}</b> 색상 선택</span>
                          <button onClick={() => setColorPickerFor(null)} style={{ background: "none", border: "none", cursor: "pointer", color: C.faint, padding: 4, display: "flex" }}>
                            <XIcon size={13} />
                          </button>
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
                          {PALETTE.map((color) => (
                            <button
                              key={color}
                              onClick={() => { updateSectorColor(colorPickerFor, color); setColorPickerFor(null); }}
                              aria-label={color}
                              style={{
                                width: 26, height: 26, borderRadius: "50%", background: color,
                                border: target.color === color ? `2px solid ${C.ink}` : `2px solid ${C.card}`,
                                boxShadow: target.color === color ? `0 0 0 1px ${C.ink}` : `0 0 0 1px ${C.line}`,
                                cursor: "pointer", padding: 0, flexShrink: 0,
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      value={newSecName}
                      onChange={(e) => setNewSecName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") addSector(); }}
                      placeholder="새 섹터 (예: 우주항공, 방산)"
                      style={{ ...inp, flex: 1 }}
                    />
                    <button onClick={addSector} style={{ ...ghostBtn, flex: 0, padding: "10px 16px", color: "#7A5310", borderColor: "#E0C98A", background: C.amberSoft, fontWeight: 700 }}>추가</button>
                  </div>
                </div>
              )}
            </Card>

            {/* Holdings (editable, grouped by sector) */}
            <Card style={{ padding: isMobile ? 16 : 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                <Layers size={16} color={C.amber} />
                <span style={{ fontWeight: 700, fontSize: isMobile ? 14 : 15 }}>보유 종목</span>
              </div>

              {/* New holding form */}
              <div style={{ border: `1px dashed ${C.line}`, borderRadius: 14, padding: isMobile ? 12 : 13, marginBottom: 16, background: "#FCFBF8" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.sub, marginBottom: 10 }}>신규 종목 추가</div>
                <div style={{ display: "grid", gap: 8 }}>
                  <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 8 }}>
                    <input
                      value={newHolding.name}
                      onChange={(e) => setNewHolding({ ...newHolding, name: e.target.value })}
                      onKeyDown={(e) => { if (e.key === "Enter") addNewHolding(); }}
                      placeholder="종목명"
                      style={{ flex: isMobile ? "none" : 1.4, width: isMobile ? "100%" : "auto", minWidth: 0, border: `1px solid ${C.line}`, borderRadius: 9, padding: "9px 11px", fontSize: 14, fontWeight: 600, color: C.ink, background: "#fff", fontFamily: FONT, outline: "none" }}
                    />
                    <select
                      value={newHolding.sectorId || sectors[0]?.id || ""}
                      onChange={(e) => setNewHolding({ ...newHolding, sectorId: e.target.value })}
                      style={{ flex: isMobile ? "none" : 1, width: isMobile ? "100%" : "auto", border: `1px solid ${C.line}`, borderRadius: 9, padding: "9px 11px", fontSize: 13, color: C.sub, background: "#fff", fontFamily: FONT, outline: "none", cursor: "pointer" }}
                    >
                      {sectors.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <Field label="원금">
                      <NumberInput value={newHolding.principal} onChange={(v) => setNewHolding({ ...newHolding, principal: v })} onCommit={() => {}} />
                    </Field>
                    <Field label="평가금액">
                      <NumberInput value={newHolding.value} onChange={(v) => setNewHolding({ ...newHolding, value: v })} onCommit={() => {}} />
                    </Field>
                  </div>
                  <button
                    onClick={addNewHolding}
                    disabled={!newHolding.name.trim()}
                    style={{
                      display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
                      background: newHolding.name.trim() ? C.amber : "#E6E2D8", color: "#fff", border: "none", borderRadius: 11,
                      padding: "11px", fontWeight: 700, fontSize: isMobile ? 13 : 14, cursor: newHolding.name.trim() ? "pointer" : "default", fontFamily: FONT, textAlign: "center",
                    }}
                  >
                    <Plus size={15} /> {isMobile ? "종목 추가" : "종목 추가 — 저장하면 섹터별로 자동 분류돼요"}
                  </button>
                </div>
              </div>

              {holdings.length === 0 ? (
                <div style={{ textAlign: "center", color: C.faint, fontSize: 13, padding: "18px 0" }}>위에서 종목을 추가하면 여기에 섹터별로 정리돼요.</div>
              ) : (
                (() => {
                  const groups = {};
                  holdings.forEach((h) => { (groups[h.sectorId] = groups[h.sectorId] || []).push(h); });
                  const sids = Object.keys(groups).sort((a, b) => (bySector[b] || 0) - (bySector[a] || 0));
                  return sids.map((sid) => {
                    const s = secMap[sid];
                    const stot = bySector[sid] || 0;
                    return (
                      <div key={sid} style={{ marginBottom: 14 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 8 }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 700, color: C.sub, minWidth: 0 }}>
                            <span style={{ width: 9, height: 9, borderRadius: 3, background: s ? s.color : C.faint, flexShrink: 0 }} />
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s ? s.name : "미분류"}</span>
                          </span>
                          <span style={{ ...numStyle, fontSize: 12.5, color: C.faint, flexShrink: 0 }}>
                            {holdingsTotal ? pct(stot / holdingsTotal) : "0.0%"} · ₩{won(stot)}
                          </span>
                        </div>
                        <div style={{ display: "grid", gap: isMobile ? 8 : 10 }}>
                          {groups[sid].map((h) => {
                            const p = h.value - h.principal;
                            const r = h.principal > 0 ? p / h.principal : 0;
                            return (
                              <div key={h.id} style={{ border: `1px solid ${C.line}`, borderRadius: 12, padding: isMobile ? 10 : 11 }}>
                                <div style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
                                  <input
                                    value={h.name}
                                    onChange={(e) => updateHolding(h.id, { name: e.target.value })}
                                    placeholder="종목명"
                                    style={{ flex: 1, minWidth: 0, border: `1px solid ${C.line}`, borderRadius: 9, padding: "9px 11px", fontSize: 14, fontWeight: 600, color: C.ink, background: "#FCFBF8", fontFamily: FONT, outline: "none" }}
                                  />
                                  <button onClick={() => removeHolding(h.id)} style={{ background: "none", border: "none", cursor: "pointer", color: C.faint, padding: 4, flexShrink: 0, display: "flex" }}>
                                    <Trash2 size={18} />
                                  </button>
                                </div>
                                <select
                                  value={h.sectorId}
                                  onChange={(e) => updateHolding(h.id, { sectorId: e.target.value })}
                                  style={{ width: "100%", border: `1px solid ${C.line}`, borderRadius: 9, padding: "9px 11px", fontSize: 13, color: C.sub, background: "#FCFBF8", fontFamily: FONT, outline: "none", cursor: "pointer", marginBottom: 10 }}
                                >
                                  {sectors.map((sec) => <option key={sec.id} value={sec.id}>{sec.name}</option>)}
                                </select>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                                  <Field label="원금">
                                    <NumberInput value={h.principal} onChange={(v) => updateHolding(h.id, { principal: v })} onCommit={() => {}} />
                                  </Field>
                                  <Field label="평가금액">
                                    <NumberInput value={h.value} onChange={(v) => updateHolding(h.id, { value: v })} onCommit={() => {}} />
                                  </Field>
                                </div>
                                <div style={{ display: "flex", justifyContent: "flex-end", gap: 14, marginTop: 8, fontSize: isMobile ? 12.5 : 13, ...numStyle }}>
                                  <span style={{ color: C.faint }}>수익 <b style={{ color: p >= 0 ? C.gain : C.loss }}>{wonSigned(p)}</b></span>
                                  <span style={{ color: C.faint }}>수익률 <b style={{ color: r >= 0 ? C.gain : C.loss }}>{pctSigned(r)}</b></span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  });
                })()
              )}
            </Card>
          </div>
        )}

        {/* =================== HISTORY =================== */}
        {tab === "history" && (
          <div style={{ display: "grid", gap: 12 }}>
            {months.length === 0 && (
              <Card><div style={{ color: C.faint, textAlign: "center", padding: 20 }}>저장된 월이 없어요. ‘계좌 입력’에서 기록을 저장해 보세요.</div></Card>
            )}
            {months.slice().reverse().map((m, i, arr) => {
              const s = summarize(data.snapshots[m].accounts);
              const prevM = arr[i + 1];
              const prevS = prevM ? summarize(data.snapshots[prevM].accounts) : null;
              const d = prevS ? s.total - prevS.total : null;
              const isOpen = openSnap === m;
              return (
                <Card key={m} style={{ padding: 0, overflow: "hidden" }}>
                  <button
                    onClick={() => setOpenSnap(isOpen ? null : m)}
                    style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: 18, background: "none", border: "none", cursor: "pointer", fontFamily: FONT, textAlign: "left", color: C.ink }}
                  >
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 800 }}>{monthFull(m)}</div>
                      {data.snapshots[m].savedAt && (
                        <div style={{ fontSize: 11.5, color: C.faint, marginTop: 1 }}>
                          {savedAtLabel(data.snapshots[m].savedAt)} 기준
                        </div>
                      )}
                      <div style={{ ...numStyle, fontSize: 13, color: C.sub, marginTop: 2 }}>₩{won(s.total)}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      {d !== null && (
                        <span style={{ ...numStyle, fontSize: 13, fontWeight: 700, color: d >= 0 ? C.gain : C.loss }}>
                          {wonSigned(d)}
                        </span>
                      )}
                      <ChevronRight size={18} color={C.faint} style={{ transform: isOpen ? "rotate(90deg)" : "none", transition: "transform .2s" }} />
                    </div>
                  </button>

                  {isOpen && (
                    <div style={{ borderTop: `1px solid ${C.line}`, padding: 18 }}>
                      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr 1fr" : "repeat(3,1fr)", gap: 8, marginBottom: 10 }}>
                        <KV label="투자" v={s.invest} />
                        <KV label="현금" v={s.cash} />
                        <KV label="가용" v={s.available} />
                      </div>
                      {spentInMonth(m) > 0 && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: C.sub, marginBottom: 12, ...numStyle }}>
                          <Receipt size={14} color={C.amber} />
                          이 달 소비 <b style={{ color: C.ink }}>₩{won(spentInMonth(m))}</b>
                        </div>
                      )}
                      {data.snapshots[m].accounts.map((a) => (
                        <div key={a.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "5px 0", color: C.sub }}>
                          <span>{a.broker ? a.broker + " · " : ""}{a.name}</span>
                          <span style={numStyle}>₩{won(a.value)}{a.category === "invest" ? `  (${pctSigned(returnOf(a))})` : ""}</span>
                        </div>
                      ))}
                      <textarea
                        value={data.snapshots[m].note || ""}
                        onChange={(e) => setNote(m, e.target.value)}
                        placeholder="이 달에 대한 메모 (예: 코인 본전 시 일부 매도, 가용자산 비중 목표 등)"
                        rows={3}
                        style={{ width: "100%", marginTop: 12, border: `1px solid ${C.line}`, borderRadius: 10, padding: 10, fontSize: 13, fontFamily: FONT, color: C.ink, resize: "vertical", background: "#FCFBF8" }}
                      />
                      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                        <button onClick={() => loadSnapshotToCurrent(m)} style={ghostBtn}>이 달 값 불러와 편집</button>
                        <button onClick={() => deleteSnapshot(m)} style={{ ...ghostBtn, color: C.loss, borderColor: C.lossSoft }}>
                          <Trash2 size={14} style={{ marginRight: 4, verticalAlign: "-2px" }} />삭제
                        </button>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        </div>

        {/* Backup footer (always visible) */}
        <div style={{ marginTop: 24, paddingTop: 18, borderTop: `1px solid ${C.line}` }}>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <button onClick={exportData} style={footerBtn}>
              <Download size={15} /> 데이터 내보내기
            </button>
            <button onClick={() => fileInputRef.current && fileInputRef.current.click()} style={footerBtn}>
              <Upload size={15} /> 가져오기
            </button>
            <input ref={fileInputRef} type="file" accept="application/json,.json" onChange={importData} style={{ display: "none" }} />
          </div>
          <div style={{ textAlign: "center", fontSize: 11.5, color: C.faint, marginTop: 10, lineHeight: 1.5 }}>
            기기를 바꾸거나 PC↔휴대폰을 옮길 땐, 한쪽에서 <b>내보내기</b>한 파일을<br />
            다른 기기에서 <b>가져오기</b> 하면 데이터가 그대로 옮겨져요.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */
const ghostBtn = {
  flex: 1, padding: "10px", borderRadius: 10, border: `1px solid ${C.line}`,
  background: "#fff", color: C.sub, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: FONT,
};
const footerBtn = {
  display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 10,
  border: `1px solid ${C.line}`, background: "#fff", color: C.sub, fontWeight: 600, fontSize: 13,
  cursor: "pointer", fontFamily: FONT,
};
const navBtn = {
  background: "rgba(255,255,255,.12)", border: "none", borderRadius: 10,
  width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
};
const inp = {
  border: `1px solid ${C.line}`, borderRadius: 10, padding: "10px 12px",
  fontSize: 14, color: C.ink, background: "#FCFBF8", fontFamily: FONT, outline: "none", minWidth: 0,
};

function Logo({ size = 44 }) {
  return (
    <img
      src="/logo.png"
      width={size}
      height={size}
      alt="Trend"
      style={{ display: "block", borderRadius: size * 0.27, flexShrink: 0, objectFit: "cover", background: "#fff" }}
    />
  );
}


function MiniStat({ icon, label, value, share, tint, mobile }) {
  if (mobile) {
    return (
      <Card style={{ padding: "13px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: tint }}>
            {icon}
            <span style={{ fontSize: 13, fontWeight: 700, color: C.sub }}>{label}</span>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ ...numStyle, fontSize: 16, fontWeight: 800 }}>₩{won(value)}</div>
            <div style={{ ...numStyle, fontSize: 11.5, color: C.faint }}>{isFinite(share) ? pct(share) : "0.0%"}</div>
          </div>
        </div>
      </Card>
    );
  }
  return (
    <Card style={{ padding: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5, color: tint }}>
        {icon}
        <span style={{ fontSize: 12, fontWeight: 700, color: C.sub }}>{label}</span>
      </div>
      <div style={{ ...numStyle, fontSize: 16, fontWeight: 800, marginTop: 8 }}>₩{won(value)}</div>
      <div style={{ ...numStyle, fontSize: 12, color: C.faint, marginTop: 2 }}>
        {isFinite(share) ? pct(share) : "0.0%"}
      </div>
    </Card>
  );
}

function KV({ label, v }) {
  return (
    <div style={{ background: "#FCFBF8", border: `1px solid ${C.line}`, borderRadius: 10, padding: "8px 8px", overflow: "hidden" }}>
      <div style={{ fontSize: 11, color: C.sub }}>{label}</div>
      <div style={{ ...numStyle, fontSize: "clamp(11px, 3vw, 13px)", fontWeight: 700, marginTop: 2, whiteSpace: "nowrap" }}>₩{won(v)}</div>
    </div>
  );
}

function AccountGroup({ title, hint, category, accounts, onUpdate, onRemove, onAdd }) {
  return (
    <Card>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontWeight: 800, fontSize: 16 }}>{title}</span>
        <button
          onClick={onAdd}
          style={{ display: "inline-flex", alignItems: "center", gap: 4, background: C.amberSoft, color: "#7A5310", border: "none", borderRadius: 9, padding: "6px 10px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}
        >
          <Plus size={14} /> 추가
        </button>
      </div>
      <div style={{ fontSize: 12, color: C.faint, marginBottom: 14 }}>{hint}</div>

      <div style={{ display: "grid", gap: 12 }}>
        {accounts.map((a) => {
          const r = returnOf(a);
          const p = profitOf(a);
          return (
            <div key={a.id} style={{ border: `1px solid ${C.line}`, borderRadius: 14, padding: 12 }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <input
                  value={a.broker}
                  onChange={(e) => onUpdate(a.id, { broker: e.target.value })}
                  placeholder={category === "invest" ? "증권사" : "분류"}
                  style={{ width: "38%", border: `1px solid ${C.line}`, borderRadius: 9, padding: "8px 10px", fontSize: 13, color: C.sub, background: "#FCFBF8", fontFamily: FONT, outline: "none" }}
                />
                <input
                  value={a.name}
                  onChange={(e) => onUpdate(a.id, { name: e.target.value })}
                  placeholder="계좌명"
                  style={{ flex: 1, minWidth: 0, border: `1px solid ${C.line}`, borderRadius: 9, padding: "8px 10px", fontSize: 14, fontWeight: 600, color: C.ink, background: "#FCFBF8", fontFamily: FONT, outline: "none" }}
                />
                <button onClick={() => onRemove(a.id)} style={{ background: "none", border: "none", cursor: "pointer", color: C.faint, padding: 6 }}>
                  <Trash2 size={16} />
                </button>
              </div>

              {category === "invest" ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <Field label="원금">
                    <NumberInput value={a.principal} onChange={(v) => onUpdate(a.id, { principal: v })} onCommit={() => {}} />
                  </Field>
                  <Field label="현재 평가금액">
                    <NumberInput value={a.value} onChange={(v) => onUpdate(a.id, { value: v })} onCommit={() => {}} />
                  </Field>
                </div>
              ) : (
                <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                  <div style={{ flex: 1 }}>
                    <Field label="금액">
                      <NumberInput value={a.value} onChange={(v) => onUpdate(a.id, { value: v, principal: v })} onCommit={() => {}} />
                    </Field>
                  </div>
                  <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: C.sub, padding: "9px 4px", cursor: "pointer", whiteSpace: "nowrap" }}>
                    <input type="checkbox" checked={a.available} onChange={(e) => onUpdate(a.id, { available: e.target.checked })} style={{ accentColor: C.gain, width: 16, height: 16 }} />
                    가용
                  </label>
                </div>
              )}

              {category === "invest" && (
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 14, marginTop: 8, fontSize: 13, ...numStyle }}>
                  <span style={{ color: C.faint }}>수익 <b style={{ color: p >= 0 ? C.gain : C.loss }}>{wonSigned(p)}</b></span>
                  <span style={{ color: C.faint }}>수익률 <b style={{ color: r >= 0 ? C.gain : C.loss }}>{pctSigned(r)}</b></span>
                </div>
              )}
            </div>
          );
        })}
        {accounts.length === 0 && (
          <div style={{ textAlign: "center", color: C.faint, fontSize: 13, padding: "16px 0" }}>‘추가’를 눌러 계좌를 등록하세요.</div>
        )}
      </div>
    </Card>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: C.sub, marginBottom: 5 }}>{label}</div>
      {children}
    </div>
  );
}

function SectorHoldingsDetail({ sector, list, onClose }) {
  const sum = list.reduce((s, h) => s + h.value, 0);
  return (
    <div style={{ marginTop: 14, borderTop: `1px solid ${C.line}`, paddingTop: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13.5, fontWeight: 700 }}>
          <span style={{ width: 9, height: 9, borderRadius: 3, background: sector ? sector.color : C.faint }} />
          {sector ? sector.name : "미분류"} 종목
          <span style={{ color: C.faint, fontWeight: 500 }}>· ₩{won(sum)}</span>
        </span>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.faint, padding: 4, display: "flex" }}>
          <XIcon size={15} />
        </button>
      </div>
      <div style={{ display: "grid", gap: 2 }}>
        {list.length === 0 ? (
          <div style={{ fontSize: 13, color: C.faint, padding: "6px 0" }}>이 섹터엔 종목이 없어요.</div>
        ) : (
          list.map((h) => {
            const p = h.value - h.principal;
            const r = h.principal > 0 ? p / h.principal : 0;
            return (
              <div key={h.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, padding: "7px 2px", borderBottom: `1px solid ${C.line}` }}>
                <span style={{ color: C.ink, fontWeight: 600, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.name}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  <span style={numStyle}>₩{won(h.value)}</span>
                  <span style={{ ...numStyle, fontWeight: 700, color: r >= 0 ? C.gain : C.loss, width: 56, textAlign: "right" }}>{pctSigned(r)}</span>
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
