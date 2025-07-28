// helpdesk/TicketForm.tsx
"use client";
import { useState } from "react";
import { uploadImage } from "@/lib/uploadImage";
import { X, Plus } from "lucide-react";

interface Props {
  onClose: () => void;
  onCreated: (t: any) => void;
}
export default function TicketForm({ onClose, onCreated }: Props) {
  const [form, setForm]   = useState({ subject:"", category:"", message:"" });
  const [files, setFiles] = useState<File[]>([]);
  const [previews,setPrev]= useState<string[]>([]);
  const [loading,setLoad] = useState(false);

  const addFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files ? Array.from(e.target.files).slice(0, 4-files.length) : [];
    setFiles(prev=>[...prev, ...f]);
    setPrev(prev=>[...prev, ...f.map(fl=>URL.createObjectURL(fl))]);
  };
  const remove = (i:number) => {
    URL.revokeObjectURL(previews[i]);
    setPrev(p=>p.filter((_,idx)=>idx!==i));
    setFiles(f=>f.filter((_,idx)=>idx!==i));
  };

  const submit = async(e:React.FormEvent) =>{
    e.preventDefault(); setLoad(true);
    try{
      const uploaded = await Promise.all(files.map(uploadImage)); // [{url,name}]
      const res = await fetch("/api/helpdesk",{
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ ...form, files: uploaded })
      });
      const data = await res.json();
      onCreated(data);
      onClose();
    }catch(err){ console.error(err); }
    finally{ setLoad(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <form onSubmit={submit}
        className="bg-white rounded-lg w-full max-w-md p-6 space-y-4">
        <h3 className="font-bold text-lg">Create Ticket</h3>

        <input placeholder="Subject" required
          className="w-full p-2 border rounded-md"
          value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})}/>

        <select required className="w-full p-2 border rounded-md"
          value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
          <option value="">Category</option>
          <option value="order">Order Issue</option>
          <option value="return">Return/Refund</option>
          <option value="payment">Payment</option>
          <option value="account">Account</option>
          <option value="other">Other</option>
        </select>

        <textarea rows={4} placeholder="Describe your issue…" required
          className="w-full p-2 border rounded-md resize-none"
          value={form.message} onChange={e=>setForm({...form,message:e.target.value})}/>

        {/* attachment grid */}
        <div className="grid grid-cols-4 gap-3">
          {previews.map((src,i)=>(
            <div key={i} className="relative group">
              <img src={src} className="h-20 w-full object-cover rounded"/>
              <button type="button"
                onClick={()=>remove(i)}
                className="absolute inset-0 bg-black/50 hidden
                           group-hover:flex items-center justify-center text-white">
                <X size={16}/>
              </button>
            </div>
          ))}
          {files.length<4 &&
            <label className="h-20 border-2 border-dashed rounded flex
                               flex-col items-center justify-center cursor-pointer">
              <input type="file" multiple hidden accept="image/*" onChange={addFiles}/>
              <Plus size={16} className="text-gray-400"/>
              <span className="text-[10px] text-gray-400">Add</span>
            </label>}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose}
                  className="px-4 py-2 border rounded-md">Cancel</button>
          <button disabled={loading}
            className="px-4 py-2 bg-orange-600 text-white rounded-md">
            {loading?"Submitting…":"Submit"}
          </button>
        </div>
      </form>
    </div>
  );
}
