/* ------------------------------------------------------------------ */
/*  Address manager — web (Next.js / React)                           */
/* ------------------------------------------------------------------ */
"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import axios from "axios";

/* ───────────────────────── helpers ───────────────────────── */
const normalise = (raw: any) => ({
  id:          raw._id,
  name:        raw.name,
  phone:       raw.phone,
  addressLine1: raw.addressLine1,
  city:        raw.city,
  state:       raw.state,
  pincode:     raw.pincode,
  country:     raw.country,
  type:        raw.locationType ?? "HOME",
  isDefault:   raw.isDefault ?? false,
});

/* ───────────────────────── types ───────────────────────── */
export type Address = ReturnType<typeof normalise>;

/* ───────────────────────── component ───────────────────── */
export default function Addresses() {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  /* state */
  const [addresses, setAddresses]   = useState<Address[]>([]);
  const [isEditing, setIsEditing]   = useState<string | null>(null);
  const [formData, setFormData]     = useState<Partial<Address>>({});
  const [busy, setBusy]             = useState(false);
  const [fetching, setFetching]     = useState(true);

  /* -------- FETCH once user is known -------- */
  useEffect(() => {
    if (!userId) return;

    (async () => {
      try {
        const { data } = await axios.get("/api/address", { params: { userId } });
        setAddresses(data.map(normalise));
      } catch (err) {
        console.error("Fetch addresses:", err);
      } finally {
        setFetching(false);
      }
    })();
  }, [userId]);

  /* -------- handlers -------- */
  const handleEdit = (addr: Address | "new") => {
    setFormData(
      addr === "new"
        ? {
            name: "",
            phone: "",
            addressLine1: "",
            city: "",
            state: "",
            pincode: "",
            country: "India",
            type: "HOME",
            isDefault: false,
          }
        : { ...addr },
    );
    setIsEditing(addr === "new" ? "new" : addr.id);
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  /* -------- SAVE (add / update) -------- */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setBusy(true);
    try {
      let next: Address[];
      if (isEditing === "new") {
        const { data } = await axios.post("/api/address", {
          ...formData,
          userId,
        });
        next = [...addresses, normalise(data)];
      } else {
        const { data } = await axios.put(`/api/address/${isEditing}`, {
          ...formData,
          userId,
        });
        next = addresses.map((a) =>
          a.id === isEditing ? normalise(data) : a,
        );
      }
      setAddresses(next);
      setIsEditing(null);
    } catch (err) {
      console.error("Save address:", err);
    } finally {
      setBusy(false);
    }
  };

  /* -------- DELETE -------- */
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this address?")) return;
    try {
      await axios.delete(`/api/address/${id}`, { params: { userId } });
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error("Delete address:", err);
    }
  };

  /* -------- DEFAULT -------- */
  const handleSetDefault = async (id: string) => {
    try {
      await axios.patch(`/api/address/${id}/default`, null, {
        params: { userId },
      });
      setAddresses((p) => p.map((a) => ({ ...a, isDefault: a.id === id })));
    } catch (err) {
      console.error("Set default:", err);
    }
  };

  /* ───────────────────────── render ───────────────────── */
  if (fetching) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* header + CTA */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">My Addresses</h2>
        <button
          onClick={() => handleEdit("new")}
          className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
        >
          Add New Address
        </button>
      </div>

      {/* ───── FORM ───── */}
      {isEditing ? (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 max-w-md bg-gray-50 p-6 rounded-lg border"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Name</label>
              <input
                name="name"
                value={formData.name || ""}
                onChange={handleChange}
                required
                className="w-full border p-2 rounded"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Phone</label>
              <input
                name="phone"
                value={formData.phone || ""}
                onChange={handleChange}
                required
                className="w-full border p-2 rounded"
              />
            </div>
          </div>

          <label className="block text-sm mb-1">Address Line</label>
          <input
            name="addressLine1"
            value={formData.addressLine1 || ""}
            onChange={handleChange}
            required
            className="w-full border p-2 rounded"
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm mb-1">City</label>
              <input
                name="city"
                value={formData.city || ""}
                onChange={handleChange}
                required
                className="w-full border p-2 rounded"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">State</label>
              <input
                name="state"
                value={formData.state || ""}
                onChange={handleChange}
                required
                className="w-full border p-2 rounded"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Pincode</label>
              <input
                name="pincode"
                value={formData.pincode || ""}
                onChange={handleChange}
                required
                className="w-full border p-2 rounded"
              />
            </div>
          </div>
 <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={busy}
              className="px-4 py-2 bg-orange-600 text-white rounded disabled:opacity-60"
            >
              {busy ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(null)}
              className="px-4 py-2 border rounded"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : addresses.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-600">You have no saved addresses.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`border rounded-lg p-4 ${
                addr.isDefault
                  ? "border-orange-500 bg-orange-50"
                  : "border-gray-200"
              }`}
            >
              <div className="flex justify-between">
                {/* left */}
                <div>
                  <p className="font-semibold">{addr.name}</p>
                  <p className="text-sm text-gray-600">{addr.phone}</p>
                  <p className="mt-1 text-sm">
                    {addr.addressLine1}, {addr.city}, {addr.state} –{" "}
                    {addr.pincode}
                  </p>
                  {addr.isDefault && (
                    <span className="inline-block mt-1 text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded">
                      Default
                    </span>
                  )}
                </div>

                {/* actions */}
                <div className="text-right space-y-1">
                  {!addr.isDefault && (
                    <button
                      onClick={() => handleSetDefault(addr.id)}
                      className="text-xs text-orange-600 hover:underline"
                    >
                      Set Default
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(addr)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(addr.id)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}