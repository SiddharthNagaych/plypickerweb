// helpdesk/TicketList.tsx
"use client";
import { Plus } from "lucide-react";


interface Props {
  tickets: TicketMeta[];
  openForm: () => void;
  openDetail: (id: string) => void;
}
export default function TicketList({ tickets, openForm, openDetail }: Props) {
  const pill = (s: string) =>
    s === "open"       ? "text-blue-600" :
    s === "in_progress"? "text-yellow-600" :
                         "text-green-600";

  return (
    <section className="space-y-6">
      <div className="flex justify-between items-center bg-[#F8F8F8] rounded-lg p-6">
        <p className="font-medium text-gray-700">
          Want to raise a complaint or give feedback?
        </p>
        <button onClick={openForm}
          className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
          Create Ticket
        </button>
      </div>

      <h3 className="font-semibold text-lg">Ticket history</h3>

      <div className="space-y-3">
        {tickets.map(t => (
          <button onClick={()=>openDetail(t._id)} key={t._id}
                  className="flex items-center justify-between w-full p-4 bg-gray-50
                             rounded-lg hover:bg-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full"/>
              <span className="text-sm text-gray-800 line-clamp-1">
                #{t._id.slice(-6)} | {t.subject}
              </span>
            </div>
            <span className={`text-sm font-medium ${pill(t.status)}`}>
              {t.status.replace("_"," ")}
            </span>
          </button>
        ))}
        {tickets.length === 0 &&
          <p className="text-gray-500 text-sm">No tickets yet.</p>}
      </div>
    </section>
  );
}
