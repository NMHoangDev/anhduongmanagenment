import { db } from "./firebase";
import {
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  orderBy,
  startAt,
  endAt,
  limit,
} from "firebase/firestore";

/**
 * Helpers / defaults
 */
const facilitiesCol = collection(db, "facilities");

const normalizeFacility = (raw = {}) => ({
  name: raw.name || "",
  category: raw.category || "",
  code: raw.code || "",
  location: raw.location || "",
  quantity: raw.quantity != null ? Number(raw.quantity) : 1,
  cost: raw.cost != null ? Number(raw.cost) : 0,
  status: raw.status || "Đang dùng",
  condition: raw.condition || "",
  purchaseDate: raw.purchaseDate || null,
  warrantyExpiry: raw.warrantyExpiry || null,
  lastMaintenanceDate: raw.lastMaintenanceDate || null,
  nextMaintenanceDate: raw.nextMaintenanceDate || null,
  assignedTo: raw.assignedTo || "",
  notes: raw.notes || "",
  images: raw.images || [],
  manualDocument: raw.manualDocument || "",
  createdAt: raw.createdAt || null,
  updatedAt: raw.updatedAt || null,
});

/**
 * Get all facilities (returns array of { id, ...data })
 */
export async function getAllFacilities({
  whereField,
  whereOp,
  whereValue,
} = {}) {
  try {
    let q = facilitiesCol;
    if (whereField && whereOp && typeof whereValue !== "undefined") {
      q = query(facilitiesCol, where(whereField, whereOp, whereValue));
    }
    const snap = await getDocs(q);
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return list;
  } catch (err) {
    console.error("getAllFacilities error:", err);
    throw err;
  }
}

/**
 * Get single facility by id
 */
export async function getFacilityById(id) {
  try {
    if (!id) return null;
    const ref = doc(db, "facilities", id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  } catch (err) {
    console.error("getFacilityById error:", err);
    throw err;
  }
}

/**
 * Create facility
 * If id supplied -> setDoc (useful to control code),
 * otherwise addDoc and return new id
 */
export async function createFacility(data, id = null) {
  try {
    const payload = normalizeFacility(data);
    payload.createdAt = serverTimestamp();
    payload.updatedAt = serverTimestamp();

    if (id) {
      const ref = doc(db, "facilities", id);
      await setDoc(ref, payload);
      return { id, ...payload };
    } else {
      const added = await addDoc(facilitiesCol, payload);
      return { id: added.id, ...payload };
    }
  } catch (err) {
    console.error("createFacility error:", err);
    throw err;
  }
}

/**
 * Update facility fields (partial update supported)
 */
export async function updateFacility(id, updated) {
  try {
    if (!id) throw new Error("Missing facility id");
    const ref = doc(db, "facilities", id);

    const updatePayload = {};
    // Only include fields that are defined in updated
    const allowed = [
      "name",
      "category",
      "code",
      "location",
      "quantity",
      "cost",
      "status",
      "condition",
      "purchaseDate",
      "warrantyExpiry",
      "lastMaintenanceDate",
      "nextMaintenanceDate",
      "assignedTo",
      "notes",
      "images",
      "manualDocument",
    ];
    allowed.forEach((k) => {
      if (typeof updated[k] !== "undefined") {
        updatePayload[k] =
          k === "quantity" || k === "cost" ? Number(updated[k]) : updated[k];
      }
    });

    updatePayload.updatedAt = serverTimestamp();

    await updateDoc(ref, updatePayload);
    return { id, ...updatePayload };
  } catch (err) {
    console.error("updateFacility error:", err);
    throw err;
  }
}

/**
 * Delete facility by id
 */
export async function deleteFacility(id) {
  try {
    if (!id) throw new Error("Missing facility id");
    const ref = doc(db, "facilities", id);
    await deleteDoc(ref);
    return true;
  } catch (err) {
    console.error("deleteFacility error:", err);
    throw err;
  }
}

/**
 * Utility: find by code
 */
export async function findFacilityByCode(code) {
  try {
    if (!code) return null;
    const q = query(facilitiesCol, where("code", "==", code));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { id: d.id, ...d.data() };
  } catch (err) {
    console.error("findFacilityByCode error:", err);
    throw err;
  }
}

/**
 * Search facilities by name (tries server-side prefix search, falls back to client filter)
 * - name: search string (prefix or substring)
 * - options.limit: max results (default 20)
 *
 * Note: Firestore text search is limited. For best results add a `nameLower` indexed field
 * (lowercased name) when creating/updating facilities and query by range on that field.
 */
export async function searchFacilitiesByName(name, { limit: max = 20 } = {}) {
  try {
    if (!name || !name.trim()) return [];

    const term = name.trim();

    // 1) Try server-side prefix search (fast, but case-sensitive and prefix-only)
    try {
      const q = query(
        facilitiesCol,
        orderBy("name"),
        startAt(term),
        endAt(term + "\uf8ff"),
        limit(max)
      );
      const snap = await getDocs(q);
      const results = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      if (results.length > 0) return results;
    } catch (err) {
      // ignore and fallback to client-side search
      console.warn("Prefix query failed, falling back to client filter:", err);
    }

    // 2) Fallback: fetch all (or use paginated fetch) and filter case-insensitive contains
    const all = await getAllFacilities();
    const lower = term.toLowerCase();
    const filtered = all.filter((f) =>
      (f.name || "").toLowerCase().includes(lower)
    );
    return filtered.slice(0, max);
  } catch (err) {
    console.error("searchFacilitiesByName error:", err);
    throw err;
  }
}
