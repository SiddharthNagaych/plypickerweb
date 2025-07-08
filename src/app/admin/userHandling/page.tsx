"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CouponsPanel from "@/components/admin/user-handling/CouponPanel";
import PCashPanel from "@/components/admin/user-handling/PCashPanel";
import HelpDeskPanel from "@/components/admin/user-handling/HelpDeskPanel";
import SavedMethodsPanel from "@/components/admin/user-handling/SavedMethod";


export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState("coupons");

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Ply Picker Admin Panel</h1>
      <Tabs defaultValue="coupons" onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 gap-2 mb-6">
          <TabsTrigger value="coupons">Coupons</TabsTrigger>
          <TabsTrigger value="pcash">PCash</TabsTrigger>
          <TabsTrigger value="helpdesk">Help Desk</TabsTrigger>
          <TabsTrigger value="methods">Saved Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="coupons">
          <CouponsPanel />
        </TabsContent>

        <TabsContent value="pcash">
          <PCashPanel />
        </TabsContent>

        <TabsContent value="helpdesk">
          <HelpDeskPanel />
        </TabsContent>

        <TabsContent value="methods">
          <SavedMethodsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
