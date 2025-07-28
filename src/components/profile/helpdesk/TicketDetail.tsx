// helpdesk/TicketDetail.tsx
"use client";
import { useEffect, useState } from "react";
import { User, ShieldCheck, X } from "lucide-react";

interface Props {
  id: string;
  onClose: () => void;
}
export default function TicketDetail({ id, onClose }: Props) {
  const [ticket, setTicket] = useState<ITicket | null>(null);
  useEffect(() => {
    fetch(`/api/helpdesk/${id}`)
      .then((r) => r.json())
      .then(setTicket);
  }, [id]);

  if (!ticket) return null;
  const icon = (from: string) =>
    from === "user" ? (
      <User className="text-gray-400" />
    ) : (
      <ShieldCheck className="text-orange-600" />
    );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <article className="bg-white rounded-lg w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto relative">
        <button onClick={onClose} className="absolute top-3 right-3">
          <X />
        </button>

        <h2 className="font-bold text-xl mb-4">
          #{ticket._id!.slice(-6)} | {ticket.subject}
        </h2>

        <ul className="space-y-6">
          {ticket.messages.map((m) => (
            <li key={m._id?.toString()} className="flex gap-4">
              <div className="w-6">{icon(m.from)}</div>
              <div>
                <p className="text-sm">{m.text}</p>
                {(m.files?.length ?? 0) > 0 && (
                  <div className="flex gap-2 mt-2">
                    {(m.files ?? []).map((f) => (
                      <a key={f.url} href={f.url} target="_blank">
                        <img src={f.url} className="h-16 w-16 rounded" />
                      </a>
                    ))}
                  </div>
                )}

                <span className="text-xs text-gray-400">
                  {new Date(m.createdAt!).toLocaleString()}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </article>
    </div>
  );
}
