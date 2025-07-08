"use client";

import React, { useState } from "react";

import type { Taxonomy, City } from "../../../app/admin/types/admin"; // update the path based on where you defined these types



interface BulkProductUploadProps {
  city: City;
  taxonomy: Taxonomy;
  onUploaded: () => void;
}
export const BulkProductUploadComponent: React.FC<BulkProductUploadProps> = ({  onUploaded }) => {

  const [bulkJson, setBulkJson] = useState("");
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const handleUpload = async () => {
    setUploading(true);
    setStatus(null);

    try {
      const parsed = JSON.parse(bulkJson);
      if (!Array.isArray(parsed)) {
        throw new Error("Input must be a JSON array of products.");
      }

      const res = await fetch("/api/admin/productBulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ items: parsed }),
      });

      const result = await res.json();

      if (res.ok) {
        setStatus(`✅ Uploaded ${result.count} products successfully.`);
        setBulkJson("");
        onUploaded();
      } else {
        setStatus(`❌ Error: ${result.error}`);
      }
    } catch (err) {
      setStatus(`❌ Error: ${(err as Error).message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mt-6 border border-dashed rounded-md p-6 bg-white shadow-sm">
      <h2 className="text-xl font-semibold text-orange-700 mb-4">📦 Bulk Product Upload</h2>
      <textarea
        value={bulkJson}
        onChange={(e) => setBulkJson(e.target.value)}
        placeholder='Paste JSON array of products here...'
        className="w-full h-64 border p-3 font-mono rounded mb-3"
      />
      <div className="flex gap-4 items-center">
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="bg-green-600 text-white px-6 py-2 rounded disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "📤 Upload"}
        </button>
        {status && <span className="text-sm">{status}</span>}
      </div>
    </div>
  );
}
