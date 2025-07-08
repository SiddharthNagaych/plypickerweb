// components/profile/DeleteAccount.tsx
"use client";

import React, { useState } from "react";

const DeleteAccount = () => {
  const [confirmed, setConfirmed] = useState(false);

  const handleDelete = () => {
    if (!confirmed) return;
    console.log("Account deletion requested");
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-red-600">Delete Account</h2>
      <p className="text-gray-600">This action is permanent. Your account will be archived and cannot be restored.</p>
      <label className="flex items-center space-x-2">
        <input type="checkbox" onChange={(e) => setConfirmed(e.target.checked)} />
        <span>I understand the consequences of deleting my account.</span>
      </label>
      <button
        className={`px-4 py-2 rounded text-white ${confirmed ? "bg-red-600 hover:bg-red-700" : "bg-gray-300 cursor-not-allowed"}`}
        onClick={handleDelete}
        disabled={!confirmed}
      >
        Delete My Account
      </button>
    </div>
  );
};

export default DeleteAccount;