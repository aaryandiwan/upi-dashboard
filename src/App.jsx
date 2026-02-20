import { useState, useEffect, useRef } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

// ── Synthetic Dataset ────────────────────────────────────────────────────────
const CATEGORIES = ["Food & Dining", "Shopping", "Transport", "Utilities", "Entertainment", "Healthcare", "Education", "Travel"];
const MERCHANTS = {
  "Food & Dining": ["Swiggy", "Zomato", "McDonald's", "Domino's", "Cafe Coffee Day"],
  "Shopping": ["Amazon", "Flipkart", "Myntra", "Meesho", "Nykaa"],
  "Transport": ["Ola", "Uber", "Rapido", "Metro Card", "IRCTC"],
  "Utilities": ["BESCOM", "Airtel", "Jio", "BWSSB", "Gas Agency"],
  "Entertainment": ["Netflix", "Hotstar", "BookMyShow", "Spotify", "YouTube Premium"],
  "Healthcare": ["PharmEasy", "1mg", "Apollo", "Medlife", "Lab Tests"],
  "Education": ["Coursera", "Udemy", "BYJU'S", "Unacademy", "WhiteHat Jr"],
  "Travel": ["MakeMyTrip", "Goibibo", "OYO", "Airbnb", "Cleartrip"],
};

function randBetween(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
function randFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function generateTransactions(n = 500) {
  const txns = [];
  const start = new Date("2024-01-01");
  for (let i = 0; i < n; i++) {
    const date = new Date(start.getTime() + randBetween(0, 364) * 86400000 + randBetween(0, 86400) * 1000);
    const cat = randFrom(CATEGORIES);
    const merchant = randFrom(MERCHANTS[cat]);
    const amount = randBetween(50, 8000);
    // Fraud heuristics: very high amount + odd hour
    const hour = date.getHours();
    const isFraud = (amount > 6000 && hour < 5) || (amount > 7000 && Math.random() < 0.3);
    txns.push({
      id: `TXN${String(i + 1).padStart(5, "0")}`,
      date,
      month: date.toLocaleString("default", { month: "short" }),
      monthNum: date.getMonth(),
      day: date.getDate(),
      hour,
      dayOfWeek: date.toLocaleString("default", { weekday: "short" }),
      category: cat,
      merchant,
      amount,
      status: isFraud ? "Flagged" : "Success",
      paymentMode: randFrom(["UPI ID", "QR Code", "Phone Number"]),
    });
  }
  return txns.sort((a, b) => a.date - b.date);
}

const TRANSACTIONS = generateTransactions(500);

// ── Aggregations ─────────────────────────────────────────────────────────────
function aggregateMonthly(txns) {
  const map = {};
  txns.forEach(t => {
    const key = `${t.monthNum}`;
    if (!map[key]) map[key] = { month: t.month, total: 0, count: 0, flagged: 0 };
    map[key].total += t.amount;
    map[key].count++;
    if (t.status === "Flagged") map[key].flagged++;
  });
  return Object.values(map).sort((a, b) => {
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return months.indexOf(a.month) - months.indexOf(b.month);
  });
}

function aggregateCategory(txns) {
  const map = {};
  txns.forEach(t => {
    if (!map[t.category]) map[t.category] = { name: t.category, value: 0, count: 0 };
    map[t.category].value += t.amount;
    map[t.category].count++;
  });
  return Object.values(map).sort((a, b) => b.value - a.value);
}

function aggregateHourly(txns) {
  const map = Array.from({ length: 24 }, (_, h) => ({ hour: `${h}:00`, count: 0, flagged: 0 }));
  txns.forEach(t => {
    map[t.hour].count++;
    if (t.status === "Flagged") map[t.hour].flagged++;
  });
  return map;
}

function aggregateDayOfWeek(txns) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const map = {};
  days.forEach(d => (map[d] = { day: d, total: 0, count: 0 }));
  txns.forEach(t => {
    const d = t.dayOfWeek;
    if (map[d]) { map[d].total += t.amount; map[d].count++; }
  });
  return days.map(d => map[d]);
}

// ── Color Palette ─────────────────────────────────────────────────────────────
const PALETTE = ["#00e5ff", "#00b8d4", "#0091ea", "#ff6d00", "#ff9100", "#ffd740", "#69f0ae", "#ea80fc"];
const FRAUD_COLOR = "#ff1744";
const SUCCESS_COLOR = "#00e676";

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.04)", border: `1px solid ${accent}33`,
      borderRadius: 16, padding: "20px 24px", flex: 1, minWidth: 160,
      boxShadow: `0 0 24px ${accent}22`
    }}>
      <div style={{ fontSize: 12, color: "#aaa", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 28, fontFamily: "'Space Mono', monospace", color: accent, fontWeight: 700 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ── Custom Tooltip ─────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label, prefix = "₹" }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#111", border: "1px solid #333", borderRadius: 8, padding: "10px 14px", fontSize: 13 }}>
      <div style={{ color: "#aaa", marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }}>{p.name}: {prefix}{Number(p.value).toLocaleString()}</div>
      ))}
    </div>
  );
}

// ── Section Heading ───────────────────────────────────────────────────────────
function SectionHead({ title, accent = "#00e5ff" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
      <div style={{ width: 4, height: 24, background: accent, borderRadius: 2 }} />
      <h2 style={{ margin: 0, fontSize: 16, letterSpacing: 2, textTransform: "uppercase", color: "#eee", fontFamily: "'Space Mono', monospace" }}>{title}</h2>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function UPIDashboard() {
  const [filter, setFilter] = useState("All");
  const [tab, setTab] = useState("overview");

  const filtered = filter === "All" ? TRANSACTIONS : TRANSACTIONS.filter(t => t.status === filter);
  const monthly = aggregateMonthly(filtered);
  const catData = aggregateCategory(filtered);
  const hourly = aggregateHourly(filtered);
  const weekly = aggregateDayOfWeek(filtered);

  const totalSpend = filtered.reduce((s, t) => s + t.amount, 0);
  const flaggedTxns = TRANSACTIONS.filter(t => t.status === "Flagged");
  const fraudRate = ((flaggedTxns.length / TRANSACTIONS.length) * 100).toFixed(1);
  const avgTxn = (totalSpend / filtered.length).toFixed(0);
  const topCat = catData[0]?.name || "-";

  const tabs = ["overview", "fraud", "trends", "data"];

  return (
    <div style={{
      minHeight: "100vh", background: "#080c10",
      color: "#e0e0e0", fontFamily: "'DM Sans', sans-serif",
      padding: "32px 24px", maxWidth: 1280, margin: "0 auto"
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 36, flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 4, color: "#00e5ff", textTransform: "uppercase", marginBottom: 6 }}>India · 2024</div>
          <h1 style={{ margin: 0, fontSize: 36, fontFamily: "'Space Mono', monospace", fontWeight: 700, color: "#fff", lineHeight: 1.1 }}>
            UPI Transaction<br /><span style={{ color: "#00e5ff" }}>Analytics</span>
          </h1>
          <div style={{ fontSize: 13, color: "#666", marginTop: 8 }}>500 transactions · Jan–Dec 2024 · All modes</div>
        </div>
        {/* Filter Pills */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {["All", "Success", "Flagged"].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: "8px 18px", borderRadius: 20, border: "1px solid",
              borderColor: filter === f ? "#00e5ff" : "#333",
              background: filter === f ? "#00e5ff15" : "transparent",
              color: filter === f ? "#00e5ff" : "#888",
              cursor: "pointer", fontSize: 13, fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
              transition: "all 0.2s"
            }}>{f}</button>
          ))}
        </div>
      </div>

      {/* KPI Row */}
      <div style={{ display: "flex", gap: 16, marginBottom: 36, flexWrap: "wrap" }}>
        <StatCard label="Total Spend" value={`₹${(totalSpend / 100000).toFixed(2)}L`} sub={`${filtered.length} transactions`} accent="#00e5ff" />
        <StatCard label="Avg Transaction" value={`₹${Number(avgTxn).toLocaleString()}`} sub="Per transaction" accent="#69f0ae" />
        <StatCard label="Fraud Rate" value={`${fraudRate}%`} sub={`${flaggedTxns.length} flagged`} accent="#ff1744" />
        <StatCard label="Top Category" value={topCat.split(" ")[0]} sub="By total spend" accent="#ff9100" />
        <StatCard label="Transactions" value={filtered.length} sub="Filtered count" accent="#ea80fc" />
      </div>

      {/* Tab Nav */}
      <div style={{ display: "flex", gap: 4, marginBottom: 32, borderBottom: "1px solid #1a1a2e", paddingBottom: 0 }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "10px 20px", background: "none", border: "none",
            borderBottom: tab === t ? "2px solid #00e5ff" : "2px solid transparent",
            color: tab === t ? "#00e5ff" : "#666",
            fontSize: 13, fontFamily: "'Space Mono', monospace", cursor: "pointer",
            textTransform: "capitalize", letterSpacing: 1, fontWeight: tab === t ? 700 : 400,
            transition: "all 0.2s", marginBottom: -1
          }}>{t}</button>
        ))}
      </div>

      {/* ── TAB: OVERVIEW ── */}
      {tab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {/* Monthly Spend Area Chart */}
          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 20, padding: 28, border: "1px solid #1a1a2e" }}>
            <SectionHead title="Monthly Spending Trend" />
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={monthly}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#00e5ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" />
                <XAxis dataKey="month" stroke="#444" tick={{ fill: "#888", fontSize: 12 }} />
                <YAxis stroke="#444" tick={{ fill: "#888", fontSize: 12 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="total" name="Total Spend" stroke="#00e5ff" fill="url(#areaGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Category Breakdown + Day of Week */}
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            {/* Pie */}
            <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 20, padding: 28, border: "1px solid #1a1a2e", flex: 1, minWidth: 300 }}>
              <SectionHead title="Category Breakdown" accent="#ff9100" />
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
                <ResponsiveContainer width={200} height={200}>
                  <PieChart>
                    <Pie data={catData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" paddingAngle={3}>
                      {catData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => `₹${Number(v).toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                  {catData.map((c, i) => (
                    <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: PALETTE[i % PALETTE.length], flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: "#aaa", flex: 1 }}>{c.name}</span>
                      <span style={{ fontSize: 12, fontFamily: "'Space Mono', monospace", color: PALETTE[i % PALETTE.length] }}>
                        ₹{(c.value / 1000).toFixed(1)}k
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Day of Week Bar */}
            <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 20, padding: 28, border: "1px solid #1a1a2e", flex: 1, minWidth: 300 }}>
              <SectionHead title="Spend by Day of Week" accent="#69f0ae" />
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={weekly} barSize={22}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" vertical={false} />
                  <XAxis dataKey="day" stroke="#444" tick={{ fill: "#888", fontSize: 12 }} />
                  <YAxis stroke="#444" tick={{ fill: "#888", fontSize: 12 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="total" name="Total Spend" fill="#69f0ae" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: FRAUD ── */}
      {tab === "fraud" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {/* Summary Cards */}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <StatCard label="Flagged Transactions" value={flaggedTxns.length} sub="High-risk activity" accent="#ff1744" />
            <StatCard label="Fraud Rate" value={`${fraudRate}%`} sub="Of total transactions" accent="#ff9100" />
            <StatCard label="Fraud Amount" value={`₹${(flaggedTxns.reduce((s, t) => s + t.amount, 0) / 1000).toFixed(1)}k`} sub="Total at-risk value" accent="#ff1744" />
            <StatCard label="Peak Fraud Hour" value="1:00–4:00 AM" sub="Highest risk window" accent="#ff9100" />
          </div>

          {/* Fraud by Hour */}
          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 20, padding: 28, border: "1px solid #1a1a2e" }}>
            <SectionHead title="Fraud Activity by Hour of Day" accent="#ff1744" />
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={hourly} barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" vertical={false} />
                <XAxis dataKey="hour" stroke="#444" tick={{ fill: "#888", fontSize: 10 }} interval={2} />
                <YAxis stroke="#444" tick={{ fill: "#888", fontSize: 12 }} />
                <Tooltip content={<CustomTooltip prefix="" />} />
                <Bar dataKey="count" name="All Txns" fill="#333" radius={[3, 3, 0, 0]} />
                <Bar dataKey="flagged" name="Flagged" fill="#ff1744" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Fraud by Month */}
          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 20, padding: 28, border: "1px solid #1a1a2e" }}>
            <SectionHead title="Flagged vs Normal Transactions by Month" accent="#ff9100" />
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthly} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" vertical={false} />
                <XAxis dataKey="month" stroke="#444" tick={{ fill: "#888", fontSize: 12 }} />
                <YAxis stroke="#444" tick={{ fill: "#888", fontSize: 12 }} />
                <Tooltip content={<CustomTooltip prefix="" />} />
                <Legend wrapperStyle={{ color: "#888", fontSize: 12 }} />
                <Bar dataKey="count" name="Total Txns" fill="#0091ea" radius={[4, 4, 0, 0]} />
                <Bar dataKey="flagged" name="Flagged" fill="#ff1744" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Flagged Transactions Table */}
          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 20, padding: 28, border: "1px solid #1a1a2e" }}>
            <SectionHead title={`Flagged Transactions (${flaggedTxns.length})`} accent="#ff1744" />
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ color: "#666", textAlign: "left" }}>
                    {["TXN ID", "Date", "Merchant", "Category", "Amount", "Hour", "Mode"].map(h => (
                      <th key={h} style={{ padding: "8px 12px", borderBottom: "1px solid #1a1a2e", fontWeight: 500, letterSpacing: 1 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {flaggedTxns.slice(0, 15).map(t => (
                    <tr key={t.id} style={{ borderBottom: "1px solid #111" }}>
                      <td style={{ padding: "10px 12px", fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#ff1744" }}>{t.id}</td>
                      <td style={{ padding: "10px 12px", color: "#888" }}>{t.date.toLocaleDateString("en-IN")}</td>
                      <td style={{ padding: "10px 12px", color: "#e0e0e0" }}>{t.merchant}</td>
                      <td style={{ padding: "10px 12px", color: "#ff9100" }}>{t.category}</td>
                      <td style={{ padding: "10px 12px", fontFamily: "'Space Mono', monospace", color: "#ff1744", fontWeight: 700 }}>₹{t.amount.toLocaleString()}</td>
                      <td style={{ padding: "10px 12px", color: "#888" }}>{t.hour}:00</td>
                      <td style={{ padding: "10px 12px", color: "#666", fontSize: 11 }}>{t.paymentMode}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {flaggedTxns.length > 15 && <div style={{ color: "#666", fontSize: 12, marginTop: 12, textAlign: "center" }}>Showing 15 of {flaggedTxns.length} flagged transactions</div>}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: TRENDS ── */}
      {tab === "trends" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {/* Top Merchants Bar */}
          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 20, padding: 28, border: "1px solid #1a1a2e" }}>
            <SectionHead title="Top Merchants by Spend" accent="#ea80fc" />
            {(() => {
              const map = {};
              filtered.forEach(t => { if (!map[t.merchant]) map[t.merchant] = 0; map[t.merchant] += t.amount; });
              const top = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([m, v]) => ({ merchant: m, spend: v }));
              return (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={top} layout="vertical" barSize={14} margin={{ left: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" horizontal={false} />
                    <XAxis type="number" stroke="#444" tick={{ fill: "#888", fontSize: 11 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                    <YAxis dataKey="merchant" type="category" stroke="#444" tick={{ fill: "#aaa", fontSize: 12 }} width={80} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="spend" name="Total Spend" fill="#ea80fc" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              );
            })()}
          </div>

          {/* Hourly Pattern Line */}
          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 20, padding: 28, border: "1px solid #1a1a2e" }}>
            <SectionHead title="Transaction Volume by Hour" accent="#ffd740" />
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={hourly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" />
                <XAxis dataKey="hour" stroke="#444" tick={{ fill: "#888", fontSize: 10 }} interval={2} />
                <YAxis stroke="#444" tick={{ fill: "#888", fontSize: 12 }} />
                <Tooltip content={<CustomTooltip prefix="" />} />
                <Line type="monotone" dataKey="count" name="Count" stroke="#ffd740" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Payment Mode Pie */}
          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 20, padding: 28, border: "1px solid #1a1a2e" }}>
            <SectionHead title="Payment Mode Distribution" accent="#00b8d4" />
            {(() => {
              const modeMap = {};
              filtered.forEach(t => { if (!modeMap[t.paymentMode]) modeMap[t.paymentMode] = 0; modeMap[t.paymentMode]++; });
              const modeData = Object.entries(modeMap).map(([k, v]) => ({ name: k, value: v }));
              return (
                <div style={{ display: "flex", alignItems: "center", gap: 32, flexWrap: "wrap" }}>
                  <ResponsiveContainer width={200} height={200}>
                    <PieChart>
                      <Pie data={modeData} cx="50%" cy="50%" outerRadius={85} dataKey="value" label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {modeData.map((_, i) => <Cell key={i} fill={["#00e5ff", "#69f0ae", "#ff9100"][i]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {modeData.map((d, i) => (
                      <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 12, height: 12, borderRadius: 3, background: ["#00e5ff", "#69f0ae", "#ff9100"][i] }} />
                        <span style={{ fontSize: 15, color: "#ccc" }}>{d.name}</span>
                        <span style={{ fontSize: 15, fontFamily: "'Space Mono', monospace", color: "#fff", fontWeight: 700 }}>{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ── TAB: DATA ── */}
      {tab === "data" && (
        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 20, padding: 28, border: "1px solid #1a1a2e" }}>
          <SectionHead title="Raw Transaction Data (first 50)" />
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ color: "#555" }}>
                  {["TXN ID", "Date", "Merchant", "Category", "Amount", "Status", "Mode"].map(h => (
                    <th key={h} style={{ padding: "8px 12px", borderBottom: "1px solid #1a1a2e", textAlign: "left", fontWeight: 500, letterSpacing: 1 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 50).map((t, i) => (
                  <tr key={t.id} style={{ background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)", borderBottom: "1px solid #0d0d1a" }}>
                    <td style={{ padding: "9px 12px", fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#555" }}>{t.id}</td>
                    <td style={{ padding: "9px 12px", color: "#777" }}>{t.date.toLocaleDateString("en-IN")}</td>
                    <td style={{ padding: "9px 12px", color: "#ccc" }}>{t.merchant}</td>
                    <td style={{ padding: "9px 12px" }}>
                      <span style={{ padding: "3px 8px", borderRadius: 4, fontSize: 11, background: `${PALETTE[CATEGORIES.indexOf(t.category) % 8]}22`, color: PALETTE[CATEGORIES.indexOf(t.category) % 8] }}>
                        {t.category}
                      </span>
                    </td>
                    <td style={{ padding: "9px 12px", fontFamily: "'Space Mono', monospace", color: "#e0e0e0", fontWeight: 700 }}>₹{t.amount.toLocaleString()}</td>
                    <td style={{ padding: "9px 12px" }}>
                      <span style={{ color: t.status === "Flagged" ? FRAUD_COLOR : SUCCESS_COLOR, fontSize: 11, fontWeight: 600 }}>
                        {t.status === "Flagged" ? "⚠ FLAGGED" : "✓ OK"}
                      </span>
                    </td>
                    <td style={{ padding: "9px 12px", color: "#555", fontSize: 11 }}>{t.paymentMode}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ color: "#444", fontSize: 12, marginTop: 16, textAlign: "center" }}>Showing 50 of {filtered.length} transactions</div>
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid #1a1a2e", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <span style={{ fontSize: 12, color: "#333", fontFamily: "'Space Mono', monospace" }}>UPI ANALYSIS · 2024</span>
        <span style={{ fontSize: 12, color: "#333" }}>Synthetic dataset · 500 transactions</span>
      </div>
    </div>
  );
}

