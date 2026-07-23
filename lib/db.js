import { supabase } from "./supabaseClient";

/* ------------------------------------------------------------------
   DAILY ENTRIES (source of truth) + ROWS
------------------------------------------------------------------- */
export async function fetchDailyEntries() {
  const { data: entries, error: e1 } = await supabase
    .from("daily_entries")
    .select("*")
    .order("entry_date", { ascending: false });
  if (e1) throw e1;

  const { data: rows, error: e2 } = await supabase
    .from("daily_entry_rows")
    .select("*");
  if (e2) throw e2;

  return entries.map((e) => ({
    id: e.id,
    date: e.entry_date,
    workDescription: e.work_description,
    notes: e.notes,
    rows: rows
      .filter((r) => r.entry_id === e.id)
      .map((r) => ({
        id: r.id,
        materialType: r.material_type,
        supplierName: r.supplier_name,
        quantity: r.quantity,
        unit: r.unit,
        rate: r.rate,
        totalAmount: r.total_amount,
        remarks: r.remarks,
      })),
  }));
}

// Saves a daily entry AND its rows. Because Materials & Suppliers are
// derived from daily_entry_rows, this single call is what "automatically"
// keeps every other module in sync.
export async function saveDailyEntry(entry) {
  const isNew = entry.__isNew;

  const payload = {
    entry_date: entry.date,
    work_description: entry.workDescription,
    notes: entry.notes,
  };

  let entryId = entry.id;

  if (isNew) {
    const { data, error } = await supabase
      .from("daily_entries")
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    entryId = data.id;
  } else {
    const { error } = await supabase
      .from("daily_entries")
      .update(payload)
      .eq("id", entryId);
    if (error) throw error;
    // Replace all rows for this entry (simple + safe for MVP scale)
    const { error: delErr } = await supabase
      .from("daily_entry_rows")
      .delete()
      .eq("entry_id", entryId);
    if (delErr) throw delErr;
  }

  const rowsPayload = (entry.rows || [])
    .filter((r) => r.materialType)
    .map((r) => ({
      entry_id: entryId,
      material_type: r.materialType,
      supplier_name: r.supplierName || null,
      quantity: r.quantity === "" ? null : Number(r.quantity),
      unit: r.unit || null,
      rate: r.rate === "" ? null : Number(r.rate),
      total_amount: Number(r.totalAmount) || 0,
      remarks: r.remarks || null,
    }));

  if (rowsPayload.length) {
    const { error: insErr } = await supabase.from("daily_entry_rows").insert(rowsPayload);
    if (insErr) throw insErr;
  }

  return entryId;
}

export async function deleteDailyEntry(id) {
  // ON DELETE CASCADE removes the linked rows automatically,
  // which is what keeps Materials & Suppliers accurate.
  const { error } = await supabase.from("daily_entries").delete().eq("id", id);
  if (error) throw error;
}

/* ------------------------------------------------------------------
   MATERIAL TYPES
------------------------------------------------------------------- */
export async function fetchMaterialTypes() {
  const { data, error } = await supabase.from("material_types").select("*").order("name");
  if (error) throw error;
  return data.map((d) => d.name);
}
export async function addMaterialType(name) {
  const { error } = await supabase.from("material_types").insert({ name });
  if (error) throw error;
}
export async function removeMaterialType(name) {
  const { error } = await supabase.from("material_types").delete().eq("name", name);
  if (error) throw error;
}

/* ------------------------------------------------------------------
   GENERIC CRUD TABLES: customers, shops, apartments, sales, installments
------------------------------------------------------------------- */
const TABLE_COLUMN_MAP = {
  customers: {
    name: "name", contact: "contact", property: "property",
    purchaseDate: "purchase_date", totalAmount: "total_amount", status: "status",
  },
  shops: {
    shopNo: "shop_no", floor: "floor", area: "area", status: "status",
    customer: "customer", saleStatus: "sale_status",
  },
  apartments: {
    aptNo: "apt_no", floor: "floor", area: "area", status: "status",
    customer: "customer", saleStatus: "sale_status",
  },
  sales: {
    saleId: "sale_id", customer: "customer", property: "property",
    bookingDate: "booking_date", salePrice: "sale_price",
    paymentMethod: "payment_method", status: "status",
  },
  installments: {
    customer: "customer", property: "property", dueDate: "due_date",
    installmentAmount: "installment_amount", paid: "paid",
    remaining: "remaining", status: "status",
  },
};

function toDbRow(table, row) {
  const map = TABLE_COLUMN_MAP[table];
  const out = {};
  for (const [jsKey, dbKey] of Object.entries(map)) {
    if (row[jsKey] === undefined) continue;
    const v = row[jsKey];
    out[dbKey] = v === "" ? null : v;
  }
  return out;
}
function fromDbRow(table, row) {
  const map = TABLE_COLUMN_MAP[table];
  const out = { id: row.id };
  for (const [jsKey, dbKey] of Object.entries(map)) {
    out[jsKey] = row[dbKey];
  }
  return out;
}

export async function fetchTable(table) {
  const { data, error } = await supabase.from(table).select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data.map((r) => fromDbRow(table, r));
}

export async function upsertRow(table, row) {
  const payload = toDbRow(table, row);
  if (row.__isNew) {
    const { data, error } = await supabase.from(table).insert(payload).select().single();
    if (error) throw error;
    return fromDbRow(table, data);
  } else {
    const { data, error } = await supabase.from(table).update(payload).eq("id", row.id).select().single();
    if (error) throw error;
    return fromDbRow(table, data);
  }
}

export async function deleteRow(table, id) {
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw error;
}

/* ------------------------------------------------------------------
   APP SETTINGS (key/value)
------------------------------------------------------------------- */
export async function fetchSetting(key, fallback) {
  const { data, error } = await supabase.from("app_settings").select("*").eq("key", key).maybeSingle();
  if (error) throw error;
  return data ? data.value : fallback;
}
export async function saveSetting(key, value) {
  const { error } = await supabase.from("app_settings").upsert({ key, value });
  if (error) throw error;
}
