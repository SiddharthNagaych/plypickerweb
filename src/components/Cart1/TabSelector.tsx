"use client";
import React from "react";

export type TabType = "products" | "services";

interface TabSelectorProps {
  activeTab: TabType;
  onChange: (tab: TabType) => void;
}

const TabSelector: React.FC<TabSelectorProps> = ({ activeTab, onChange }) => {
  return (
    <div className="flex justify-center mb-6">
      <div
        className="bg-white rounded-full p-2 shadow-[0px_2px_8px_0px_#00000033]"
        style={{ width: 182, height: 40, borderRadius: 50 }}
      >
        <div className="flex h-full">
          {(["products", "services"] as TabType[]).map((t) => (
            <button
              key={t}
              onClick={() => onChange(t)}
              className={`flex-1 text-sm font-medium transition-all rounded-full flex items-center justify-center ${
                activeTab === t
                  ? "bg-[#FF7803] text-white"
                  : "text-gray-600 hover:text-gray-800"
              }`}
              style={{
                width: 83,
                height: 24,
                borderRadius: 100,
                padding: "4px 16px",
              }}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TabSelector;
