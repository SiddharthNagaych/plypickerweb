// components/profile/HelpDesk.tsx
"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";

interface Ticket {
  _id: string;
  subject: string;
  category: string;
  message: string;
  status: "open" | "in_progress" | "resolved";
  createdAt: string;
  updatedAt: string;
}

export default function HelpDesk() {
  const { data: session } = useSession();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    subject: "",
    category: "",
    message: "",
    attachments: [] as File[]
  });
  const [previewImages, setPreviewImages] = useState<string[]>([]);

  const fetchTickets = async () => {
    try {
      const { data } = await axios.get("/api/profile/helpdesk");
      setTickets(data);
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setIsLoading(false);
    }
  };
    useEffect(() => {
    fetchTickets();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const formPayload = new FormData();
      formPayload.append("subject", formData.subject);
      formPayload.append("category", formData.category);
      formPayload.append("message", formData.message);
      
      formData.attachments.forEach(file => {
        formPayload.append("attachments", file);
      });

      const { data } = await axios.post("/api/profile/helpdesk", formPayload, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      
      setTickets([data, ...tickets]);
      setShowForm(false);
      setFormData({
        subject: "",
        category: "",
        message: "",
        attachments: []
      });
      setPreviewImages([]);
    } catch (error) {
      console.error("Error submitting ticket:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setFormData(prev => ({
        ...prev,
        attachments: [...prev.attachments, ...files]
      }));

      // Create preview URLs
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setPreviewImages(prev => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index: number) => {
    const newAttachments = [...formData.attachments];
    newAttachments.splice(index, 1);
    setFormData(prev => ({
      ...prev,
      attachments: newAttachments
    }));

    const newPreviews = [...previewImages];
    URL.revokeObjectURL(newPreviews[index]);
    newPreviews.splice(index, 1);
    setPreviewImages(newPreviews);
  };

  if (isLoading) {
    return <div>Loading your support tickets...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">Help Desk</h2>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
        >
          New Ticket
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Create New Ticket</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Subject</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  <option value="">Select a category</option>
                  <option value="order">Order Issue</option>
                  <option value="return">Return/Refund</option>
                  <option value="payment">Payment Problem</option>
                  <option value="account">Account Issue</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Message</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  className="w-full p-2 border rounded-md"
                  rows={5}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Attachments (optional)</label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="w-full p-2 border rounded-md"
                  multiple
                  accept="image/*"
                />
                
                {previewImages.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {previewImages.map((src, index) => (
                      <div key={index} className="relative">
                        <img
                          src={src}
                          alt={`Preview ${index}`}
                          className="h-20 w-20 object-cover rounded-md"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border rounded-md hover:bg-gray-50"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:bg-orange-300"
                  disabled={isLoading}
                >
                  {isLoading ? "Submitting..." : "Submit Ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {tickets.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-600">No support tickets found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map(ticket => (
            <div key={ticket._id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <h3 className="font-medium text-gray-800">{ticket.subject}</h3>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  ticket.status === "open" ? "bg-yellow-100 text-yellow-800" :
                  ticket.status === "in_progress" ? "bg-blue-100 text-blue-800" :
                  "bg-green-100 text-green-800"
                }`}>
                  {ticket.status.replace("_", " ")}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">{ticket.category}</p>
              <p className="text-sm text-gray-700 mt-2">{ticket.message}</p>
              <p className="text-xs text-gray-500 mt-2">
                Created: {new Date(ticket.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}