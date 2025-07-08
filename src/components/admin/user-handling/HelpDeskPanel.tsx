"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Updated imports
import { Badge } from "@/components/ui/badge";
import { Select, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

interface Ticket {
  _id: string;
  name: string;
  email: string;
  category: string;
  type: string;
  status: "open" | "in_progress" | "resolved";
  createdAt: string;
  message: string;
  image?: string;
}

export default function HelpDeskPanel() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [statusTab, setStatusTab] = useState<"open" | "in_progress" | "resolved">("open");

  useEffect(() => {
    fetch(`/api/admin/user-handling/helpdesk?status=${statusTab}`)
      .then((res) => res.json())
      .then((data) => setTickets(data.tickets || []));
  }, [statusTab]);

  const updateStatus = async (id: string, status: Ticket["status"]) => {
    await fetch(`/api/admin/user-handling/helpdesk`, {
      method: "PATCH",
      body: JSON.stringify({ id, status }),
      headers: { "Content-Type": "application/json" },
    });
    setTickets((prev) =>
      prev.map((t) => (t._id === id ? { ...t, status } : t))
    );
  };

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">Help Desk Tickets</h2>

     <Tabs value={statusTab} onValueChange={(value) => setStatusTab(value as any)}>
        <TabsList>
          <TabsTrigger value="open">Open</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="border rounded-lg overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">User</th>
              <th className="p-3">Category</th>
              <th className="p-3">Type</th>
              <th className="p-3">Status</th>
              <th className="p-3">Created</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <tr key={ticket._id} className="border-t">
                <td className="p-3">
                  <div className="font-medium">{ticket.name}</div>
                  <div className="text-gray-500 text-xs">{ticket.email}</div>
                </td>
                <td className="p-3">{ticket.category}</td>
                <td className="p-3">{ticket.type}</td>
                <td className="p-3">
                  <Select
                    value={ticket.status}
                    onValueChange={(val) => updateStatus(ticket._id, val as Ticket["status"])}
                  >
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </Select>
                </td>
                <td className="p-3 text-xs text-gray-500">
                  {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                </td>
                <td className="p-3">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">View</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <h3 className="text-lg font-semibold">{ticket.category} - {ticket.type}</h3>
                      <p className="mt-2 text-sm text-gray-700 whitespace-pre-line">{ticket.message}</p>
                      {ticket.image && (
                        <img src={ticket.image} alt="Attachment" className="mt-4 rounded-lg max-h-64" />
                      )}
                    </DialogContent>
                  </Dialog>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
