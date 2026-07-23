"use client";
import React, { useState, useEffect, useMemo } from "react";
import {
  LayoutDashboard, BookOpen, Boxes, Truck, Users, Store, Building2,
  Receipt, CalendarClock, FileBarChart, Settings as SettingsIcon,
  Plus, Trash2, Pencil, X, Search, ChevronDown, ChevronRight,
  Download, Save, ArrowLeft, Filter, AlertTriangle,
} from "lucide-react";
import * as db from "../lib/db";

/* ---------------- THEME ---------------- */
const THEME = {
  paper: "#F6F3EC", paperRaised: "#FFFFFF", ink: "#1E2430", inkSoft: "#5B6270",
  inkFaint: "#9CA0AC", rule: "#E1DBCB", ruleStrong: "#CFC7AF", amber: "#D9822B",
  amberDeep: "#B5661A", blue: "#2C5E8A", blueSoft: "#E8F0F6", green: "#3E7A4C",
  greenSoft: "#E8F3EA", red: "#B4453A", redSoft: "#F7E9E7", sidebar: "#1E2430",
  sidebarSoft: "#2A3140", sidebarText: "#C7CBD4",
};
const FONT_DISPLAY = "'Space Grotesk', sans-serif";
const FONT_BODY = "'Inter', sans-serif";
const FONT_MONO = "'IBM Plex Mono', monospace";

const DEFAULT_MATERIALS = [
  "Sand", "Cement", "Bricks", "Steel", "Blocks", "Tiles", "Paint",
  "Glass", "Wood", "Electrical", "Plumbing", "Hardware", "Aluminium",
  "Ceiling", "Marble", "Granite", "MS Items",
];

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "daily", label: "Daily Entry (Roznamcha)", icon: BookOpen },
  { id: "materials", label: "Materials", icon: Boxes, group: true },
  { id: "suppliers", label: "Suppliers", icon: Truck },
  { id: "customers", label: "Customers", icon: Users },
  { id: "shops", label: "Shops", icon: Store },
  { id: "apartments", label: "Apartments", icon: Building2 },
  { id: "sales", label: "Sales", icon: Receipt },
  { id: "installments", label: "Installments", icon: CalendarClock },
  { id: "reports", label: "Reports", icon: FileBarChart },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

const uid = (p = "id") => `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
const money = (n) => "Rs " + (Number(n) || 0).toLocaleString("en-PK", { maximumFractionDigits: 0 });
const todayISO = () => new Date().toISOString().slice(0, 10);
const fmtDate = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt)) return d;
  return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

/* ---------------- UI PRIMITIVES ---------------- */
function Card({ children, style }) {
  return <div className="p-4" style={{ background: THEME.paperRaised, border: `1px solid ${THEME.rule}`, borderRadius: 10, boxShadow: "0 1px 2px rgba(30,36,48,0.04)", ...style }}>{children}</div>;
}
function Button({ children, onClick, variant = "primary", type = "button", disabled, style }) {
  const base = { fontFamily: FONT_BODY, fontWeight: 600, fontSize: 13.5, borderRadius: 7, padding: "8px 14px", display: "inline-flex", alignItems: "center", gap: 6, cursor: disabled ? "not-allowed" : "pointer", border: "1px solid transparent", opacity: disabled ? 0.5 : 1 };
  const variants = {
    primary: { background: THEME.ink, color: "#fff" },
    amber: { background: THEME.amber, color: "#fff" },
    ghost: { background: "transparent", color: THEME.ink, border: `1px solid ${THEME.ruleStrong}` },
    danger: { background: THEME.redSoft, color: THEME.red, border: `1px solid ${THEME.red}33` },
    subtle: { background: THEME.paper, color: THEME.inkSoft, border: `1px solid ${THEME.rule}` },
  };
  return <button type={type} disabled={disabled} onClick={onClick} style={{ ...base, ...variants[variant], ...style }}>{children}</button>;
}
function Field({ label, children, span }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4, gridColumn: span ? "1 / -1" : undefined }}>
      <span style={{ fontFamily: FONT_BODY, fontSize: 11.5, fontWeight: 600, color: THEME.inkSoft, textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</span>
      {children}
    </label>
  );
}
const inputStyle = { fontFamily: FONT_BODY, fontSize: 13.5, padding: "8px 10px", borderRadius: 6, border: `1px solid ${THEME.ruleStrong}`, background: "#fff", color: THEME.ink, outline: "none", width: "100%" };
function Input(props) { return <input {...props} style={{ ...inputStyle, ...(props.style || {}) }} />; }
function Select({ children, ...props }) { return <select {...props} style={{ ...inputStyle, ...(props.style || {}) }}>{children}</select>; }
function Th({ children, style }) { return <th style={{ textAlign: "left", fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", color: THEME.inkSoft, padding: "9px 12px", borderBottom: `1px solid ${THEME.ruleStrong}`, whiteSpace: "nowrap", ...style }}>{children}</th>; }
function Td({ children, style }) { return <td style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: THEME.ink, padding: "10px 12px", borderBottom: `1px solid ${THEME.rule}`, ...style }}>{children}</td>; }
function Badge({ children, tone = "gray" }) {
  const tones = { amber: { bg: "#FBEEDD", fg: THEME.amberDeep }, green: { bg: THEME.greenSoft, fg: THEME.green }, red: { bg: THEME.redSoft, fg: THEME.red }, blue: { bg: THEME.blueSoft, fg: THEME.blue }, gray: { bg: THEME.paper, fg: THEME.inkSoft } };
  const t = tones[tone] || tones.gray;
  return <span style={{ fontFamily: FONT_BODY, fontSize: 11.5, fontWeight: 700, padding: "3px 8px", borderRadius: 20, background: t.bg, color: t.fg, whiteSpace: "nowrap" }}>{children}</span>;
}
function Modal({ title, onClose, children, width = 640 }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(30,36,48,0.45)", zIndex: 50, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 16px", overflowY: "auto" }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: THEME.paper, borderRadius: 12, width: "100%", maxWidth: width, border: `1px solid ${THEME.ruleStrong}`, boxShadow: "0 12px 40px rgba(0,0,0,0.25)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${THEME.rule}` }}>
          <h3 style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 17, color: THEME.ink, margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: THEME.inkSoft }}><X size={20} /></button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  );
}
function EmptyState({ label, sub }) {
  return <div style={{ textAlign: "center", padding: "48px 20px", color: THEME.inkFaint }}><div style={{ fontFamily: FONT_DISPLAY, fontSize: 15, color: THEME.inkSoft, marginBottom: 4 }}>{label}</div>{sub && <div style={{ fontFamily: FONT_BODY, fontSize: 12.5 }}>{sub}</div>}</div>;
}
function IconBtn({ children, onClick, title, danger }) {
  return <button onClick={onClick} title={title} style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, border: `1px solid ${THEME.rule}`, background: "#fff", cursor: "pointer", color: danger ? THEME.red : THEME.inkSoft }}>{children}</button>;
}
function SectionTitle({ children }) { return <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 14.5, color: THEME.ink, marginBottom: 10 }}>{children}</div>; }
function PageHeader({ title, sub, right }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
      <div>
        <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 700, color: THEME.ink, margin: 0 }}>{title}</h1>
        {sub && <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: THEME.inkSoft, marginTop: 3 }}>{sub}</div>}
      </div>
      {right}
    </div>
  );
}
function ErrorBanner({ message, onClose }) {
  if (!message) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, background: THEME.redSoft, color: THEME.red, border: `1px solid ${THEME.red}33`, padding: "10px 14px", borderRadius: 8, marginBottom: 14, fontFamily: FONT_BODY, fontSize: 13 }}>
      <AlertTriangle size={16} />
      <span style={{ flex: 1 }}>{message}</span>
      <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: THEME.red }}><X size={14} /></button>
    </div>
  );
}
function csvDownload(filename, rows) {
  const csv = rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

/* ================================================================
   ROOT
================================================================= */
export default function ERP() {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("dashboard");
  const [materialsOpen, setMaterialsOpen] = useState(true);
  const [activeMaterial, setActiveMaterial] = useState(null);

  const [dailyEntries, setDailyEntries] = useState([]);
  const [materialTypes, setMaterialTypes] = useState(DEFAULT_MATERIALS);
  const [customers, setCustomers] = useState([]);
  const [shops, setShops] = useState([]);
  const [apartments, setApartments] = useState([]);
  const [sales, setSales] = useState([]);
  const [installments, setInstallments] = useState([]);
  const [companyName, setCompanyName] = useState("Plaza Management ERP");

  async function loadAll() {
    try {
      const [de, mt, cu, sh, ap, sa, ins, name] = await Promise.all([
        db.fetchDailyEntries(),
        db.fetchMaterialTypes(),
        db.fetchTable("customers"),
        db.fetchTable("shops"),
        db.fetchTable("apartments"),
        db.fetchTable("sales"),
        db.fetchTable("installments"),
        db.fetchSetting("company_name", "Plaza Management ERP"),
      ]);
      setDailyEntries(de);
      setMaterialTypes(mt.length ? mt : DEFAULT_MATERIALS);
      setCustomers(cu); setShops(sh); setApartments(ap); setSales(sa); setInstallments(ins);
      setCompanyName(name || "Plaza Management ERP");
      setLoaded(true);
    } catch (e) {
      console.error(e);
      setError("Could not load data from the database. Check your Supabase connection (.env.local) and try refreshing.");
      setLoaded(true);
    }
  }

  useEffect(() => { loadAll(); }, []);

  const allRows = useMemo(() => {
    const out = [];
    for (const entry of dailyEntries) for (const row of entry.rows || []) out.push({ ...row, entryId: entry.id, entryDate: entry.date, entryDesc: entry.workDescription });
    return out;
  }, [dailyEntries]);

  const totals = useMemo(() => {
    const totalConstruction = allRows.reduce((s, r) => s + (Number(r.totalAmount) || 0), 0);
    const today = todayISO();
    const todaysExpense = allRows.filter((r) => r.entryDate === today).reduce((s, r) => s + (Number(r.totalAmount) || 0), 0);
    const todaysIncome = installments.filter((i) => i.dueDate === today).reduce((s, i) => s + (Number(i.paid) || 0), 0);
    const pendingPayments = installments.filter((i) => i.status !== "Paid").reduce((s, i) => s + (Number(i.remaining) || 0), 0);
    const completedPayments = installments.filter((i) => i.status === "Paid").reduce((s, i) => s + (Number(i.paid) || 0), 0);
    return { totalConstruction, todaysExpense, todaysIncome, pendingPayments, completedPayments };
  }, [allRows, installments]);

  if (!loaded) {
    return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 420, fontFamily: FONT_BODY, color: THEME.inkSoft }}>Loading site ledger…</div>;
  }

  const ctx = {
    dailyEntries, setDailyEntries, materialTypes, setMaterialTypes, allRows,
    customers, setCustomers, shops, setShops, apartments, setApartments,
    sales, setSales, installments, setInstallments, totals,
    setTab, setActiveMaterial, companyName, setCompanyName, setError, reload: loadAll,
  };

  return (
    <div style={{ display: "flex", minHeight: 640, fontFamily: FONT_BODY, background: THEME.paper, borderRadius: 12, overflow: "hidden", border: `1px solid ${THEME.rule}`, maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ width: 240, background: THEME.sidebar, flexShrink: 0, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "20px 18px 14px" }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 16, color: "#fff", lineHeight: 1.25 }}>{companyName}</div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 10.5, color: THEME.amber, marginTop: 4, letterSpacing: 0.5 }}>SITE LEDGER SYSTEM</div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "6px 10px" }}>
          {NAV.map((item) => {
            const Icon = item.icon;
            if (item.id === "materials") {
              const isActive = tab === "materials";
              return (
                <div key="materials">
                  <button onClick={() => { setMaterialsOpen((v) => !v); setTab("materials"); setActiveMaterial(null); }} style={navBtnStyle(isActive)}>
                    <Icon size={16} /><span style={{ flex: 1, textAlign: "left" }}>Materials</span>{materialsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                  {materialsOpen && (
                    <div style={{ marginLeft: 14, borderLeft: `1px solid ${THEME.sidebarSoft}`, paddingLeft: 10, marginBottom: 4 }}>
                      {materialTypes.map((m) => (
                        <button key={m} onClick={() => { setTab("materials"); setActiveMaterial(m); }} style={{ display: "block", width: "100%", textAlign: "left", background: "transparent", border: "none", color: tab === "materials" && activeMaterial === m ? THEME.amber : THEME.sidebarText, fontFamily: FONT_BODY, fontSize: 12.5, padding: "5px 6px", cursor: "pointer", fontWeight: tab === "materials" && activeMaterial === m ? 700 : 400 }}>{m}</button>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            return <button key={item.id} onClick={() => { setTab(item.id); setActiveMaterial(null); }} style={navBtnStyle(tab === item.id)}><Icon size={16} /><span>{item.label}</span></button>;
          })}
        </div>
        <div style={{ padding: "12px 18px", borderTop: `1px solid ${THEME.sidebarSoft}`, fontFamily: FONT_MONO, fontSize: 10, color: THEME.inkFaint }}>Backed by your Supabase database</div>
      </div>

      <div style={{ flex: 1, minWidth: 0, padding: 24, overflowX: "auto" }}>
        <ErrorBanner message={error} onClose={() => setError("")} />
        {tab === "dashboard" && <Dashboard ctx={ctx} />}
        {tab === "daily" && <DailyEntryModule ctx={ctx} />}
        {tab === "materials" && <MaterialsModule ctx={ctx} activeMaterial={activeMaterial} setActiveMaterial={setActiveMaterial} />}
        {tab === "suppliers" && <SuppliersModule ctx={ctx} />}
        {tab === "customers" && <CustomersModule ctx={ctx} />}
        {tab === "shops" && <ShopsModule ctx={ctx} />}
        {tab === "apartments" && <ApartmentsModule ctx={ctx} />}
        {tab === "sales" && <SalesModule ctx={ctx} />}
        {tab === "installments" && <InstallmentsModule ctx={ctx} />}
        {tab === "reports" && <ReportsModule ctx={ctx} />}
        {tab === "settings" && <SettingsModule ctx={ctx} />}
      </div>
    </div>
  );
}
function navBtnStyle(active) {
  return { display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "9px 10px", borderRadius: 7, border: "none", cursor: "pointer", background: active ? THEME.sidebarSoft : "transparent", color: active ? "#fff" : THEME.sidebarText, fontFamily: FONT_BODY, fontSize: 13, fontWeight: active ? 600 : 500, marginBottom: 2, textAlign: "left" };
}

/* ================================================================
   DASHBOARD
================================================================= */
function Dashboard({ ctx }) {
  const { totals, dailyEntries, allRows, installments, setTab } = ctx;
  const materialTotal = allRows.reduce((s, r) => s + (Number(r.totalAmount) || 0), 0);
  const recentEntries = [...dailyEntries].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 5);
  const recentRows = [...allRows].sort((a, b) => (a.entryDate < b.entryDate ? 1 : -1)).slice(0, 6);

  const stat = (label, value, tone) => (
    <Card style={{ flex: "1 1 200px" }}>
      <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, fontWeight: 700, color: THEME.inkSoft, textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</div>
      <div style={{ fontFamily: FONT_MONO, fontSize: 22, fontWeight: 600, color: tone || THEME.ink, marginTop: 6 }}>{value}</div>
    </Card>
  );

  return (
    <div>
      <PageHeader title="Dashboard" sub="Real-time overview of the construction project" />
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
        {stat("Today's Expenses", money(totals.todaysExpense), THEME.red)}
        {stat("Today's Income", money(totals.todaysIncome), THEME.green)}
        {stat("Total Construction Cost", money(totals.totalConstruction), THEME.ink)}
        {stat("Total Material Cost", money(materialTotal), THEME.blue)}
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
        {stat("Pending Payments", money(totals.pendingPayments), THEME.amberDeep)}
        {stat("Completed Payments", money(totals.completedPayments), THEME.green)}
        {stat("Daily Entries Logged", dailyEntries.length)}
        {stat("Active Installments", installments.filter((i) => i.status !== "Paid").length)}
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
        {[{ id: "daily", label: "New Daily Entry", icon: BookOpen }, { id: "customers", label: "Add Customer", icon: Users }, { id: "installments", label: "Record Installment", icon: CalendarClock }, { id: "reports", label: "View Reports", icon: FileBarChart }].map((q) => (
          <button key={q.id} onClick={() => setTab(q.id)} style={{ flex: "1 1 200px", display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", background: THEME.paperRaised, border: `1px solid ${THEME.rule}`, borderRadius: 10, cursor: "pointer", fontFamily: FONT_BODY, fontWeight: 600, fontSize: 13.5, color: THEME.ink }}>
            <q.icon size={18} color={THEME.amber} />{q.label}
          </button>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Card>
          <SectionTitle>Recent Daily Entries</SectionTitle>
          {recentEntries.length === 0 ? <EmptyState label="No entries yet" sub="Start with the Daily Entry module" /> : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}><tbody>
              {recentEntries.map((e) => (<tr key={e.id}><Td style={{ fontFamily: FONT_MONO, fontSize: 12 }}>{fmtDate(e.date)}</Td><Td>{e.workDescription || "—"}</Td><Td style={{ textAlign: "right", fontFamily: FONT_MONO }}>{money((e.rows || []).reduce((s, r) => s + (Number(r.totalAmount) || 0), 0))}</Td></tr>))}
            </tbody></table>
          )}
        </Card>
        <Card>
          <SectionTitle>Recent Material Purchases</SectionTitle>
          {recentRows.length === 0 ? <EmptyState label="No purchases yet" /> : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}><tbody>
              {recentRows.map((r, i) => (<tr key={i}><Td style={{ fontFamily: FONT_MONO, fontSize: 12 }}>{fmtDate(r.entryDate)}</Td><Td>{r.materialType}</Td><Td style={{ textAlign: "right", fontFamily: FONT_MONO }}>{money(r.totalAmount)}</Td></tr>))}
            </tbody></table>
          )}
        </Card>
      </div>
    </div>
  );
}

/* ================================================================
   DAILY ENTRY
================================================================= */
function blankRow() { return { id: uid("row"), materialType: "", supplierName: "", quantity: "", unit: "", rate: "", totalAmount: 0, remarks: "" }; }

function DailyEntryModule({ ctx }) {
  const { dailyEntries, setDailyEntries, materialTypes, setError, reload } = ctx;
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [viewing, setViewing] = useState(null);

  const filtered = useMemo(() => [...dailyEntries].filter((e) => !search || e.workDescription?.toLowerCase().includes(search.toLowerCase()) || e.date?.includes(search)).sort((a, b) => (a.date < b.date ? 1 : -1)), [dailyEntries, search]);

  function newEntry() { setEditing({ __isNew: true, id: uid("entry"), date: todayISO(), workDescription: "", notes: "", rows: [blankRow()] }); }

  async function saveEntry(entry) {
    setSaving(true);
    try {
      await db.saveDailyEntry(entry);
      await reload();
      setEditing(null);
    } catch (e) {
      console.error(e);
      setError("Could not save this entry: " + (e.message || "unknown error"));
    } finally { setSaving(false); }
  }

  async function deleteEntry(id) {
    if (!confirm("Delete this daily entry? All linked material and supplier records will be removed too.")) return;
    try { await db.deleteDailyEntry(id); await reload(); }
    catch (e) { setError("Could not delete this entry: " + (e.message || "unknown error")); }
  }

  const total = (e) => (e.rows || []).reduce((s, r) => s + (Number(r.totalAmount) || 0), 0);

  return (
    <div>
      <PageHeader title="Daily Entry (Roznamcha)" sub="Enter construction activity once — materials, suppliers, dashboard & reports update automatically" right={<Button variant="amber" onClick={newEntry}><Plus size={15} />New Entry</Button>} />
      <div style={{ marginBottom: 14, maxWidth: 320 }}><Input placeholder="Search by date or description…" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        {filtered.length === 0 ? <EmptyState label="No daily entries yet" sub="Click “New Entry” to log the first day of construction" /> : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><Th>Date</Th><Th>Description</Th><Th>Materials</Th><Th style={{ textAlign: "right" }}>Total</Th><Th></Th></tr></thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id}>
                  <Td style={{ fontFamily: FONT_MONO, fontSize: 12.5 }}>{fmtDate(e.date)}</Td>
                  <Td>{e.workDescription || "—"}</Td>
                  <Td>{(e.rows || []).map((r) => r.materialType).filter(Boolean).join(", ") || "—"}</Td>
                  <Td style={{ textAlign: "right", fontFamily: FONT_MONO, fontWeight: 600 }}>{money(total(e))}</Td>
                  <Td><div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                    <IconBtn onClick={() => setViewing(e)} title="View"><Search size={14} /></IconBtn>
                    <IconBtn onClick={() => setEditing({ ...e, __isNew: false })} title="Edit"><Pencil size={14} /></IconBtn>
                    <IconBtn onClick={() => deleteEntry(e.id)} title="Delete" danger><Trash2 size={14} /></IconBtn>
                  </div></Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
      {editing && <DailyEntryForm entry={editing} materialTypes={materialTypes} saving={saving} onCancel={() => setEditing(null)} onSave={saveEntry} />}
      {viewing && (
        <Modal title={`Daily Entry — ${fmtDate(viewing.date)}`} onClose={() => setViewing(null)} width={760}>
          <div style={{ marginBottom: 10, fontFamily: FONT_BODY, fontSize: 13.5, color: THEME.inkSoft }}>{viewing.workDescription}</div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><Th>Material</Th><Th>Supplier</Th><Th>Qty</Th><Th>Unit</Th><Th style={{ textAlign: "right" }}>Rate</Th><Th style={{ textAlign: "right" }}>Total</Th><Th>Remarks</Th></tr></thead>
            <tbody>{(viewing.rows || []).map((r) => (<tr key={r.id}><Td>{r.materialType}</Td><Td>{r.supplierName || "—"}</Td><Td style={{ fontFamily: FONT_MONO }}>{r.quantity}</Td><Td>{r.unit}</Td><Td style={{ textAlign: "right", fontFamily: FONT_MONO }}>{money(r.rate)}</Td><Td style={{ textAlign: "right", fontFamily: FONT_MONO }}>{money(r.totalAmount)}</Td><Td>{r.remarks || "—"}</Td></tr>))}</tbody>
          </table>
        </Modal>
      )}
    </div>
  );
}

function DailyEntryForm({ entry, materialTypes, saving, onCancel, onSave }) {
  const [form, setForm] = useState(entry);
  function updateRow(id, patch) {
    setForm((f) => ({ ...f, rows: f.rows.map((r) => { if (r.id !== id) return r; const merged = { ...r, ...patch }; const qty = parseFloat(merged.quantity) || 0; const rate = parseFloat(merged.rate) || 0; merged.totalAmount = +(qty * rate).toFixed(2); return merged; }) }));
  }
  function addRow() { setForm((f) => ({ ...f, rows: [...f.rows, blankRow()] })); }
  function removeRow(id) { setForm((f) => ({ ...f, rows: f.rows.filter((r) => r.id !== id) })); }
  const grandTotal = form.rows.reduce((s, r) => s + (Number(r.totalAmount) || 0), 0);

  return (
    <Modal title={form.__isNew ? "New Daily Entry" : "Edit Daily Entry"} onClose={onCancel} width={880}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12, marginBottom: 16 }}>
        <Field label="Date"><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
        <Field label="Work Description"><Input value={form.workDescription || ""} onChange={(e) => setForm({ ...form, workDescription: e.target.value })} placeholder="e.g. Foundation casting — Block A" /></Field>
      </div>
      <Field label="Notes (optional)"><Input value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Any remarks about the day" /></Field>
      <div style={{ marginTop: 18, marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <SectionTitle>Material Rows</SectionTitle><Button variant="subtle" onClick={addRow}><Plus size={14} />Add Row</Button>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 780 }}>
          <thead><tr><Th>Material</Th><Th>Supplier</Th><Th style={{ width: 80 }}>Qty</Th><Th style={{ width: 90 }}>Unit</Th><Th style={{ width: 100 }}>Rate</Th><Th style={{ width: 120 }}>Total</Th><Th>Remarks</Th><Th></Th></tr></thead>
          <tbody>
            {form.rows.map((row) => (
              <tr key={row.id}>
                <Td><Select value={row.materialType} onChange={(e) => updateRow(row.id, { materialType: e.target.value })}><option value="">Select…</option>{materialTypes.map((m) => <option key={m} value={m}>{m}</option>)}</Select></Td>
                <Td><Input value={row.supplierName} onChange={(e) => updateRow(row.id, { supplierName: e.target.value })} placeholder="Supplier name" /></Td>
                <Td><Input type="number" value={row.quantity} onChange={(e) => updateRow(row.id, { quantity: e.target.value })} /></Td>
                <Td><Input value={row.unit} onChange={(e) => updateRow(row.id, { unit: e.target.value })} placeholder="Bags" /></Td>
                <Td><Input type="number" value={row.rate} onChange={(e) => updateRow(row.id, { rate: e.target.value })} /></Td>
                <Td style={{ fontFamily: FONT_MONO, fontWeight: 600 }}>{money(row.totalAmount)}</Td>
                <Td><Input value={row.remarks} onChange={(e) => updateRow(row.id, { remarks: e.target.value })} /></Td>
                <Td><IconBtn onClick={() => removeRow(row.id)} danger title="Remove row"><Trash2 size={14} /></IconBtn></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10, marginBottom: 20 }}><div style={{ fontFamily: FONT_MONO, fontSize: 16, fontWeight: 700, color: THEME.ink }}>Grand Total: {money(grandTotal)}</div></div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <Button variant="ghost" onClick={onCancel} disabled={saving}>Cancel</Button>
        <Button variant="amber" onClick={() => onSave(form)} disabled={saving}><Save size={14} />{saving ? "Saving…" : "Save Entry"}</Button>
      </div>
    </Modal>
  );
}

/* ================================================================
   MATERIALS (auto-derived, read-only)
================================================================= */
function MaterialsModule({ ctx, activeMaterial, setActiveMaterial }) {
  const { allRows, materialTypes, setTab } = ctx;
  const [search, setSearch] = useState("");
  if (!activeMaterial) {
    const summary = materialTypes.map((m) => { const rows = allRows.filter((r) => r.materialType === m); return { m, count: rows.length, total: rows.reduce((s, r) => s + (Number(r.totalAmount) || 0), 0) }; });
    return (
      <div>
        <PageHeader title="Materials" sub="Every material's purchase history, generated automatically from Daily Entries" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px,1fr))", gap: 12 }}>
          {summary.map((s) => (
            <button key={s.m} onClick={() => setActiveMaterial(s.m)} style={{ textAlign: "left", cursor: "pointer", border: "none", padding: 0, background: "transparent" }}>
              <Card><div style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 15, color: THEME.ink }}>{s.m}</div><div style={{ fontFamily: FONT_MONO, fontSize: 18, color: THEME.blue, marginTop: 8 }}>{money(s.total)}</div><div style={{ fontFamily: FONT_BODY, fontSize: 12, color: THEME.inkSoft, marginTop: 2 }}>{s.count} purchase{s.count === 1 ? "" : "s"}</div></Card>
            </button>
          ))}
        </div>
      </div>
    );
  }
  const rows = allRows.filter((r) => r.materialType === activeMaterial).filter((r) => !search || r.entryDesc?.toLowerCase().includes(search.toLowerCase())).sort((a, b) => (a.entryDate < b.entryDate ? 1 : -1));
  const total = rows.reduce((s, r) => s + (Number(r.totalAmount) || 0), 0);
  return (
    <div>
      <button onClick={() => setActiveMaterial(null)} style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", color: THEME.inkSoft, fontFamily: FONT_BODY, fontSize: 13, cursor: "pointer", marginBottom: 10 }}><ArrowLeft size={14} /> All Materials</button>
      <PageHeader title={activeMaterial} sub={`Total spent: ${money(total)} · ${rows.length} record(s)`} />
      <div style={{ marginBottom: 14, maxWidth: 320 }}><Input placeholder="Search by work description…" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        {rows.length === 0 ? <EmptyState label={`No ${activeMaterial} records yet`} sub="Add a Daily Entry row using this material" /> : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><Th>Date</Th><Th>Quantity</Th><Th>Unit</Th><Th style={{ textAlign: "right" }}>Rate</Th><Th style={{ textAlign: "right" }}>Total Amount</Th><Th>Daily Entry</Th></tr></thead>
            <tbody>{rows.map((r, i) => (<tr key={i}><Td style={{ fontFamily: FONT_MONO, fontSize: 12.5 }}>{fmtDate(r.entryDate)}</Td><Td style={{ fontFamily: FONT_MONO }}>{r.quantity}</Td><Td>{r.unit}</Td><Td style={{ textAlign: "right", fontFamily: FONT_MONO }}>{money(r.rate)}</Td><Td style={{ textAlign: "right", fontFamily: FONT_MONO, fontWeight: 600 }}>{money(r.totalAmount)}</Td><Td><button onClick={() => setTab("daily")} style={{ color: THEME.blue, background: "transparent", border: "none", cursor: "pointer", fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 600, textDecoration: "underline" }}>View</button></Td></tr>))}</tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

/* ================================================================
   SUPPLIERS (auto-derived)
================================================================= */
function SuppliersModule({ ctx }) {
  const { allRows } = ctx;
  const [search, setSearch] = useState("");
  const rows = allRows.filter((r) => r.supplierName).filter((r) => !search || r.supplierName.toLowerCase().includes(search.toLowerCase()) || r.materialType.toLowerCase().includes(search.toLowerCase())).sort((a, b) => (a.entryDate < b.entryDate ? 1 : -1));
  const bySupplier = useMemo(() => { const map = {}; for (const r of allRows) { if (!r.supplierName) continue; map[r.supplierName] = (map[r.supplierName] || 0) + (Number(r.totalAmount) || 0); } return Object.entries(map).sort((a, b) => b[1] - a[1]); }, [allRows]);
  return (
    <div>
      <PageHeader title="Suppliers" sub="Auto-generated from Daily Entry — who supplied what, and how much was paid" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 10, marginBottom: 18 }}>
        {bySupplier.map(([name, total]) => (<Card key={name}><div style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 14, color: THEME.ink }}>{name}</div><div style={{ fontFamily: FONT_MONO, fontSize: 16, color: THEME.blue, marginTop: 6 }}>{money(total)}</div></Card>))}
      </div>
      <div style={{ marginBottom: 14, maxWidth: 320 }}><Input placeholder="Search supplier or material…" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        {rows.length === 0 ? <EmptyState label="No supplier transactions yet" /> : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><Th>Date</Th><Th>Supplier Name</Th><Th>Material Type</Th><Th style={{ textAlign: "right" }}>Payment Amount (Paid)</Th></tr></thead>
            <tbody>{rows.map((r, i) => (<tr key={i}><Td style={{ fontFamily: FONT_MONO, fontSize: 12.5 }}>{fmtDate(r.entryDate)}</Td><Td>{r.supplierName}</Td><Td>{r.materialType}</Td><Td style={{ textAlign: "right", fontFamily: FONT_MONO, fontWeight: 600 }}>{money(r.totalAmount)}</Td></tr>))}</tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

/* ================================================================
   GENERIC CRUD MODULE (Customers, Shops, Apartments, Sales, Installments)
================================================================= */
function CrudModule({ title, sub, columns, blank, table, stateKey, ctx, renderStatusTone }) {
  const { setError } = ctx;
  const data = ctx[stateKey];
  const setData = ctx[`set${stateKey[0].toUpperCase()}${stateKey.slice(1)}`];
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = data.filter((row) => !search || Object.values(row).some((v) => String(v || "").toLowerCase().includes(search.toLowerCase())));

  async function save(row) {
    setSaving(true);
    try {
      const saved = await db.upsertRow(table, row);
      const exists = data.some((r) => r.id === saved.id);
      setData(exists ? data.map((r) => (r.id === saved.id ? saved : r)) : [saved, ...data]);
      setEditing(null);
    } catch (e) { setError("Could not save record: " + (e.message || "unknown error")); }
    finally { setSaving(false); }
  }
  async function remove(id) {
    if (!confirm("Delete this record?")) return;
    try { await db.deleteRow(table, id); setData(data.filter((r) => r.id !== id)); }
    catch (e) { setError("Could not delete record: " + (e.message || "unknown error")); }
  }

  return (
    <div>
      <PageHeader title={title} sub={sub} right={<Button variant="amber" onClick={() => setEditing({ __isNew: true, id: uid(stateKey), ...blank })}><Plus size={15} />Add</Button>} />
      <div style={{ marginBottom: 14, maxWidth: 320 }}><Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        {filtered.length === 0 ? <EmptyState label="No records yet" /> : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>{columns.map((c) => <Th key={c.key} style={c.right ? { textAlign: "right" } : {}}>{c.label}</Th>)}<Th></Th></tr></thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id}>
                    {columns.map((c) => (<Td key={c.key} style={{ ...(c.right ? { textAlign: "right", fontFamily: FONT_MONO } : {}), ...(c.mono ? { fontFamily: FONT_MONO } : {}) }}>{c.status ? <Badge tone={renderStatusTone ? renderStatusTone(row[c.key]) : "gray"}>{row[c.key] || "—"}</Badge> : c.money ? money(row[c.key]) : c.date ? fmtDate(row[c.key]) : (row[c.key] || "—")}</Td>))}
                    <Td><div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}><IconBtn onClick={() => setEditing({ ...row, __isNew: false })} title="Edit"><Pencil size={14} /></IconBtn><IconBtn onClick={() => remove(row.id)} title="Delete" danger><Trash2 size={14} /></IconBtn></div></Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {editing && (
        <Modal title={editing.__isNew ? "Add Record" : "Edit Record"} onClose={() => setEditing(null)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {columns.map((c) => (
              <Field key={c.key} label={c.label} span={c.wide}>
                {c.options ? (
                  <Select value={editing[c.key] || ""} onChange={(e) => setEditing({ ...editing, [c.key]: e.target.value })}><option value="">Select…</option>{c.options.map((o) => <option key={o} value={o}>{o}</option>)}</Select>
                ) : (
                  <Input type={c.date ? "date" : c.money ? "number" : "text"} value={editing[c.key] ?? ""} onChange={(e) => setEditing({ ...editing, [c.key]: e.target.value })} />
                )}
              </Field>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
            <Button variant="ghost" onClick={() => setEditing(null)} disabled={saving}>Cancel</Button>
            <Button variant="amber" onClick={() => save(editing)} disabled={saving}><Save size={14} />{saving ? "Saving…" : "Save"}</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function CustomersModule({ ctx }) {
  return <CrudModule ctx={ctx} table="customers" stateKey="customers" title="Customers" sub="Buyers of shops and apartments"
    blank={{ name: "", contact: "", property: "", purchaseDate: todayISO(), totalAmount: "", status: "Partial" }}
    renderStatusTone={(v) => (v === "Paid" ? "green" : v === "Partial" ? "amber" : "red")}
    columns={[{ key: "name", label: "Customer" }, { key: "contact", label: "Contact" }, { key: "property", label: "Property" }, { key: "purchaseDate", label: "Purchase Date", date: true }, { key: "totalAmount", label: "Total Amount", money: true, right: true }, { key: "status", label: "Status", status: true, options: ["Paid", "Partial", "Pending"] }]} />;
}
function ShopsModule({ ctx }) {
  return <CrudModule ctx={ctx} table="shops" stateKey="shops" title="Shops" sub="Manage shop units and their sale status"
    blank={{ shopNo: "", floor: "", area: "", status: "Available", customer: "", saleStatus: "Not Sold" }}
    renderStatusTone={(v) => (v === "Available" ? "green" : v === "Sold" ? "blue" : "amber")}
    columns={[{ key: "shopNo", label: "Shop No" }, { key: "floor", label: "Floor" }, { key: "area", label: "Area" }, { key: "status", label: "Status", status: true, options: ["Available", "Reserved", "Sold"] }, { key: "customer", label: "Customer" }, { key: "saleStatus", label: "Sale Status", options: ["Not Sold", "In Progress", "Completed"] }]} />;
}
function ApartmentsModule({ ctx }) {
  return <CrudModule ctx={ctx} table="apartments" stateKey="apartments" title="Apartments" sub="Manage apartment units and their sale status"
    blank={{ aptNo: "", floor: "", area: "", status: "Available", customer: "", saleStatus: "Not Sold" }}
    renderStatusTone={(v) => (v === "Available" ? "green" : v === "Sold" ? "blue" : "amber")}
    columns={[{ key: "aptNo", label: "Apartment" }, { key: "floor", label: "Floor" }, { key: "area", label: "Area" }, { key: "status", label: "Status", status: true, options: ["Available", "Reserved", "Sold"] }, { key: "customer", label: "Customer" }, { key: "saleStatus", label: "Sale Status", options: ["Not Sold", "In Progress", "Completed"] }]} />;
}
function SalesModule({ ctx }) {
  return <CrudModule ctx={ctx} table="sales" stateKey="sales" title="Sales" sub="Every property sale, booking to completion"
    blank={{ saleId: `SAL-${String(Date.now()).slice(-4)}`, customer: "", property: "", bookingDate: todayISO(), salePrice: "", paymentMethod: "Installments", status: "Active" }}
    renderStatusTone={(v) => (v === "Active" ? "blue" : v === "Completed" ? "green" : "amber")}
    columns={[{ key: "saleId", label: "Sale ID" }, { key: "customer", label: "Customer" }, { key: "property", label: "Property" }, { key: "bookingDate", label: "Booking Date", date: true }, { key: "salePrice", label: "Sale Price", money: true, right: true }, { key: "paymentMethod", label: "Payment Method", options: ["Cash", "Installments", "Bank Transfer"] }, { key: "status", label: "Status", status: true, options: ["Active", "Completed", "Cancelled"] }]} />;
}
function InstallmentsModule({ ctx }) {
  return <CrudModule ctx={ctx} table="installments" stateKey="installments" title="Installments" sub="Payment schedule and history per customer"
    blank={{ customer: "", property: "", dueDate: todayISO(), installmentAmount: "", paid: "0", remaining: "", status: "Pending" }}
    renderStatusTone={(v) => (v === "Paid" ? "green" : v === "Pending" ? "amber" : "red")}
    columns={[{ key: "customer", label: "Customer" }, { key: "property", label: "Property" }, { key: "dueDate", label: "Due Date", date: true }, { key: "installmentAmount", label: "Installment", money: true, right: true }, { key: "paid", label: "Paid", money: true, right: true }, { key: "remaining", label: "Remaining", money: true, right: true }, { key: "status", label: "Status", status: true, options: ["Paid", "Pending", "Overdue"] }]} />;
}

/* ================================================================
   REPORTS
================================================================= */
function ReportsModule({ ctx }) {
  const { allRows, customers, sales, installments } = ctx;
  const [from, setFrom] = useState(""); const [to, setTo] = useState("");
  const inRange = (d) => (!from || d >= from) && (!to || d <= to);
  const rows = allRows.filter((r) => inRange(r.entryDate));
  const totalExpense = rows.reduce((s, r) => s + (Number(r.totalAmount) || 0), 0);
  const byMaterial = useMemo(() => { const map = {}; for (const r of rows) map[r.materialType] = (map[r.materialType] || 0) + (Number(r.totalAmount) || 0); return Object.entries(map).sort((a, b) => b[1] - a[1]); }, [rows]);
  const bySupplier = useMemo(() => { const map = {}; for (const r of rows) { if (!r.supplierName) continue; map[r.supplierName] = (map[r.supplierName] || 0) + (Number(r.totalAmount) || 0); } return Object.entries(map).sort((a, b) => b[1] - a[1]); }, [rows]);
  const byMonth = useMemo(() => { const map = {}; for (const r of rows) { const m = (r.entryDate || "").slice(0, 7); if (!m) continue; map[m] = (map[m] || 0) + (Number(r.totalAmount) || 0); } return Object.entries(map).sort((a, b) => (a[0] < b[0] ? -1 : 1)); }, [rows]);
  const salesTotal = sales.reduce((s, sl) => s + (Number(sl.salePrice) || 0), 0);
  const installmentsCollected = installments.reduce((s, i) => s + (Number(i.paid) || 0), 0);
  const installmentsRemaining = installments.reduce((s, i) => s + (Number(i.remaining) || 0), 0);

  return (
    <div>
      <PageHeader title="Reports" sub="Financial visibility across construction, suppliers, sales & installments"
        right={<Button variant="ghost" onClick={() => csvDownload("construction-expense-report.csv", [["Date", "Material", "Supplier", "Quantity", "Unit", "Rate", "Total"], ...rows.map((r) => [r.entryDate, r.materialType, r.supplierName, r.quantity, r.unit, r.rate, r.totalAmount])])}><Download size={14} />Export CSV</Button>} />
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
          <Field label="From"><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
          <Field label="To"><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></Field>
          <Button variant="subtle" onClick={() => { setFrom(""); setTo(""); }}><Filter size={14} />Clear</Button>
        </div>
      </Card>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <Card style={{ flex: "1 1 200px" }}><div style={{ fontFamily: FONT_BODY, fontSize: 11.5, fontWeight: 700, color: THEME.inkSoft, textTransform: "uppercase" }}>Total Construction Expense</div><div style={{ fontFamily: FONT_MONO, fontSize: 20, fontWeight: 600, marginTop: 6 }}>{money(totalExpense)}</div></Card>
        <Card style={{ flex: "1 1 200px" }}><div style={{ fontFamily: FONT_BODY, fontSize: 11.5, fontWeight: 700, color: THEME.inkSoft, textTransform: "uppercase" }}>Sales Value</div><div style={{ fontFamily: FONT_MONO, fontSize: 20, fontWeight: 600, marginTop: 6, color: THEME.blue }}>{money(salesTotal)}</div></Card>
        <Card style={{ flex: "1 1 200px" }}><div style={{ fontFamily: FONT_BODY, fontSize: 11.5, fontWeight: 700, color: THEME.inkSoft, textTransform: "uppercase" }}>Installments Collected</div><div style={{ fontFamily: FONT_MONO, fontSize: 20, fontWeight: 600, marginTop: 6, color: THEME.green }}>{money(installmentsCollected)}</div></Card>
        <Card style={{ flex: "1 1 200px" }}><div style={{ fontFamily: FONT_BODY, fontSize: 11.5, fontWeight: 700, color: THEME.inkSoft, textTransform: "uppercase" }}>Installments Remaining</div><div style={{ fontFamily: FONT_MONO, fontSize: 20, fontWeight: 600, marginTop: 6, color: THEME.amberDeep }}>{money(installmentsRemaining)}</div></Card>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Card><SectionTitle>Material-wise Expenses</SectionTitle>{byMaterial.length === 0 ? <EmptyState label="No data in range" /> : byMaterial.map(([m, v]) => <BarRow key={m} label={m} value={v} max={byMaterial[0][1]} />)}</Card>
        <Card><SectionTitle>Supplier Payment Report</SectionTitle>{bySupplier.length === 0 ? <EmptyState label="No data in range" /> : bySupplier.map(([s, v]) => <BarRow key={s} label={s} value={v} max={bySupplier[0][1]} tone={THEME.blue} />)}</Card>
        <Card style={{ gridColumn: "1 / -1" }}><SectionTitle>Monthly Expense Report</SectionTitle>{byMonth.length === 0 ? <EmptyState label="No data in range" /> : (<table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><Th>Month</Th><Th style={{ textAlign: "right" }}>Total Expense</Th></tr></thead><tbody>{byMonth.map(([m, v]) => (<tr key={m}><Td style={{ fontFamily: FONT_MONO }}>{m}</Td><Td style={{ textAlign: "right", fontFamily: FONT_MONO, fontWeight: 600 }}>{money(v)}</Td></tr>))}</tbody></table>)}</Card>
      </div>
    </div>
  );
}
function BarRow({ label, value, max, tone }) {
  const pct = max ? Math.max(4, (value / max) * 100) : 0;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: FONT_BODY, fontSize: 12.5, marginBottom: 3 }}><span style={{ color: THEME.ink, fontWeight: 500 }}>{label}</span><span style={{ fontFamily: FONT_MONO, color: THEME.inkSoft }}>{money(value)}</span></div>
      <div style={{ height: 6, borderRadius: 4, background: THEME.rule, overflow: "hidden" }}><div style={{ height: "100%", width: `${pct}%`, background: tone || THEME.amber, borderRadius: 4 }} /></div>
    </div>
  );
}

/* ================================================================
   SETTINGS
================================================================= */
function SettingsModule({ ctx }) {
  const { materialTypes, setMaterialTypes, companyName, setCompanyName, setError } = ctx;
  const [newMaterial, setNewMaterial] = useState("");
  const [nameDraft, setNameDraft] = useState(companyName);

  async function addMaterial() {
    const v = newMaterial.trim();
    if (!v || materialTypes.includes(v)) return;
    try { await db.addMaterialType(v); setMaterialTypes([...materialTypes, v]); setNewMaterial(""); }
    catch (e) { setError("Could not add material: " + (e.message || "unknown error")); }
  }
  async function removeMaterial(m) {
    if (!confirm(`Remove "${m}" from the materials list? Existing records referencing it are kept.`)) return;
    try { await db.removeMaterialType(m); setMaterialTypes(materialTypes.filter((x) => x !== m)); }
    catch (e) { setError("Could not remove material: " + (e.message || "unknown error")); }
  }
  async function saveName() {
    try { await db.saveSetting("company_name", nameDraft); setCompanyName(nameDraft); }
    catch (e) { setError("Could not save project name: " + (e.message || "unknown error")); }
  }

  return (
    <div>
      <PageHeader title="Settings" sub="Configure project details and the materials catalogue" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Card><SectionTitle>Project Name</SectionTitle><div style={{ display: "flex", gap: 8 }}><Input value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} /><Button variant="amber" onClick={saveName}><Save size={14} />Save</Button></div></Card>
        <Card><SectionTitle>Add Material Type</SectionTitle><div style={{ display: "flex", gap: 8 }}><Input value={newMaterial} onChange={(e) => setNewMaterial(e.target.value)} placeholder="e.g. Insulation" onKeyDown={(e) => e.key === "Enter" && addMaterial()} /><Button variant="amber" onClick={addMaterial}><Plus size={14} />Add</Button></div></Card>
        <Card style={{ gridColumn: "1 / -1" }}>
          <SectionTitle>Materials Catalogue</SectionTitle>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {materialTypes.map((m) => (<div key={m} style={{ display: "flex", alignItems: "center", gap: 6, background: THEME.paper, border: `1px solid ${THEME.rule}`, borderRadius: 20, padding: "5px 6px 5px 12px" }}><span style={{ fontFamily: FONT_BODY, fontSize: 12.5 }}>{m}</span><button onClick={() => removeMaterial(m)} style={{ background: "transparent", border: "none", cursor: "pointer", color: THEME.inkFaint, display: "flex" }}><X size={13} /></button></div>))}
          </div>
        </Card>
      </div>
    </div>
  );
}
