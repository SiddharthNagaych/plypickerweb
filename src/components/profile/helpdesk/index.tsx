// components/profile/helpdesk/index.tsx
"use client";
import { useEffect, useState } from "react";
import TicketList from "./TicketList";
import TicketForm from "./TicketForm";
import TicketDetail from "./TicketDetail";


export default function HelpDesk() {
  const [tickets,setTickets]=useState<TicketMeta[]>([]);
  const [loading,setLoading]=useState(true);
  const [showForm,setForm]=useState(false);
  const [detail,setDetail]=useState<string|null>(null);

  const fetchTickets = async()=> {
    setLoading(true);
    const res = await fetch("/api/helpdesk");
    setTickets(await res.json());
    setLoading(false);
  };
  useEffect(()=>{ fetchTickets(); },[]);

  if(loading) return <p>Loading …</p>;

  return (
    <div className="space-y-6">
      <TicketList
        tickets={tickets}
        openForm={()=>setForm(true)}
        openDetail={id=>setDetail(id)}
      />
      {showForm &&
        <TicketForm onClose={()=>setForm(false)}
                    onCreated={t=>{setTickets([t,...tickets]);}}/>}
      {detail && <TicketDetail id={detail} onClose={()=>setDetail(null)}/>}
    </div>
  );
}
