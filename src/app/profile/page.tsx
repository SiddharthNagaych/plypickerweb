"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import MyOrders from "@/components/profile/OrdersAndReturns";

import Coupons from "@/components/profile/Coupons";

import PCash from "@/components/profile/PCash"; // Updated component
import ProfileSettings from "@/components/profile/ProfileSettings";
import SavedCards from "@/components/profile/SavedCards";
import SavedUPI from "@/components/profile/SavedUPI";
import SavedWallet from "@/components/profile/SavedWallet";
import Addresses from "@/components/profile/Addresses";
import HelpDesk from "@/components/profile/helpdesk";
import DeleteAccount from "@/components/profile/DeleteAccount";
import TermsOfUse from "@/components/profile/TermOfUse";
import PrivacyPolicy from "@/components/profile/PrivacyPolicy";

const navItems = [
  {
    heading: "Overview",
    items: [],
  },
  {
    heading: "Orders",
    items: [{ label: "Orders & Returns" }],
  },
  {
    heading: "Credits",
    items: [{ label: "Coupons" }, { label: "PCash" }],
  },
  {
    heading: "Account",
    items: [
      { label: "Profile" },
      { label: "Saved Cards" },
      { label: "Saved UPI" },
      { label: "BNPL / Wallet" },
      { label: "Addresses" },
      { label: "Help Desk" },
      { label: "Delete Account" },
    ],
  },
  {
    heading: "Legal",
    items: [{ label: "Terms of Use" }, { label: "Privacy Policy" }],
  },
];

export default function ProfilePage() {
  const { data: session } = useSession();

  const [activeSection, setActiveSection] = useState<string>(
    () => localStorage.getItem("profileTab") || "Overview"
  );

  const changeTab = (label: string) => {
    setActiveSection(label);
    localStorage.setItem("profileTab", label);
  };

  if (!session?.user) {
    return (
      <div className="p-6 text-center text-gray-600">
        Please log in to view your profile.
      </div>
    );
  }

  const { name, email, phone, image } = session.user as any;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 max-w-6xl mx-auto p-6">
      {/* Left Navigation Panel - Hidden on mobile */}
      <aside className="hidden lg:block bg-white shadow rounded-lg p-4 space-y-6 border border-gray-200">
        {navItems.map((section) => (
          <div key={section.heading}>
            <p className="text-xs font-semibold text-gray-400 uppercase mb-2">
              {section.heading}
            </p>
            <div className="space-y-1">
              {(section.items.length > 0
                ? section.items
                : [{ label: "Overview" }]
              ).map(({ label }) => (
                <button
                  key={label}
                  onClick={() => changeTab(label)}
                  className={`flex items-center w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeSection === label
                      ? "bg-orange-100 text-orange-600"
                      : "hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </aside>

      {/* Right Content Panel */}
      <section className="bg-white shadow rounded-lg p-6 border border-gray-200">
        {activeSection === "Overview" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-800">Overview</h2>

            {/* User Info */}
            <div className="flex items-center space-x-4">
              {image ? (
                <img
                  src={image}
                  alt="Profile"
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 text-lg font-semibold">
                  {name?.[0]?.toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-lg font-semibold text-gray-800">{name}</p>
                <p className="text-sm text-gray-600">{email || phone}</p>
              </div>
            </div>

            {/* Navigation Square Cards - Responsive Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {navItems
                .flatMap((section) =>
                  section.items.length ? section.items : [{ label: "Overview" }]
                )
                .filter(({ label }) => label !== "Overview") // Remove Overview from the cards since we're already in it
                .map(({ label }) => (
                  <button
                    key={label}
                    onClick={() => changeTab(label)}
                    className={`w-full h-[160px] md:h-[180px] lg:h-[200px] rounded-[4px] p-4 border border-gray-300 flex items-center justify-center text-sm font-semibold text-gray-700 text-center hover:border-orange-400 hover:text-orange-600 transition-all`}
                  >
                    {label}
                  </button>
                ))}
            </div>
          </div>
        )}

        {activeSection === "Orders & Returns" && <MyOrders />}

        {activeSection === "Coupons" && <Coupons />}

        {activeSection === "PCash" && <PCash />}
        {activeSection === "Profile" && <ProfileSettings />}
        {activeSection === "Saved Cards" && <SavedCards />}
        {activeSection === "Saved UPI" && <SavedUPI />}
        {activeSection === "BNPL / Wallet" && <SavedWallet />}
        {activeSection === "Addresses" && <Addresses />}
        {activeSection === "Help Desk" && <HelpDesk />}
        {activeSection === "Delete Account" && <DeleteAccount />}
        {activeSection === "Terms of Use" && <TermsOfUse />}
        {activeSection === "Privacy Policy" && <PrivacyPolicy />}
      </section>
    </div>
  );
}
