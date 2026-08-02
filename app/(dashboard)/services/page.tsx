"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import * as XLSX from "xlsx";
import {
  Plus, Loader2, ChevronRight, Briefcase, LayoutGrid, List,
  Search, MessageCircle, TrendingDown, Clock, IndianRupee,
  AlertTriangle, Eye, Calendar, Keyboard, Download, CheckSquare,
} from "lucide-react";
import { formatCurrency, formatDate, SERVICE_STATUS_COLORS, PAYMENT_STATUS_COLORS } from "@/lib/utils";
import { useToast } from "@/contexts/ToastContext";
import PageHeader from "@/components/layout/PageHeader";
import NewServiceDialog from "@/components/services/NewServiceDialog";
import ServiceDetailsDialog from "@/components/services/ServiceDetailsDialog";
import dynamic from "next/dynamic";

const ServicesAnalyticsPanel = dynamic(() => import("@/components/services/ServicesAnalyticsPanel"), { ssr: false });
const DailyChecklist = dynamic(() => import("@/components/services/DailyChecklist"), { ssr: false });

// ─── Types ────────────────────────────────────────────────────────────────────
interface Service {
  id: string; trackingId?: string; serviceType: string; status: string;
  fees: number; paymentStatus: string; createdAt: string;
  deadline?: string | null; missingDocs?: string; notes?: string;
  customer: { id: string; name: string; mobile: string };
}
interface DayRevenue { day: string; revenue: number; }
type CardColor = "" | "red" | "blue" | "green" | "yellow";
interface SavedFilter { name: string; filter: string; query: string; }

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_ORDER = ["PENDING","SUBMITTED","PROCESSING","APPROVED","DELIVERED"];
const STATUS_LABELS: Record<string,string> = { PENDING:"Pending",SUBMITTED:"Submitted",PROCESSING:"Processing",APPROVED:"Approved",DELIVERED:"Delivered",CANCELLED:"Cancelled" };
const STATUS_BG: Record<string,string> = { PENDING:"#fffde7",SUBMITTED:"#e3f0ff",PROCESSING:"#e6f7ff",APPROVED:"#f0fff0",DELIVERED:"#d9f7be",CANCELLED:"#fff1f0" };
const COLOR_BORDER: Record<CardColor,string> = { "":"1px solid var(--border-primary)","red":"3px solid #cf1322","blue":"3px solid #000080","green":"3px solid #006600","yellow":"3px solid #d4b800" };
const COLOR_BG: Record<CardColor,string> = { "":"","red":"#ffe","blue":"#f0f4ff","green":"#f0fff0","yellow":"#fffde7" };
const QUICK_FILTERS = [
  { key:"ALL",label:"All",color:"#555",bg:"#f0f0f0" },
  { key:"PENDING",label:"Pending",color:"#7c5e00",bg:"#fffde7" },
  { key:"SUBMITTED",label:"Submitted",color:"#003a8c",bg:"#e3f0ff" },
  { key:"PROCESSING",label:"Processing",color:"#00596b",bg:"#e6f7ff" },
  { key:"APPROVED",label:"Approved",color:"#1a5c1a",bg:"#f0fff0" },
  { key:"DELIVERED",label:"Delivered",color:"#135200",bg:"#d9f7be" },
  { key:"UNPAID",label:"💰 Unpaid",color:"#d46b08",bg:"#fff7e6" },
  { key:"DUE_TODAY",label:"📅 Due Today",color:"#cf1322",bg:"#fff1f0" },
];
const MILESTONES = [1000,5000,10000,25000,50000,100000,200000];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getDaysOld(d: string) { return Math.floor((Date.now()-new Date(d).getTime())/(1000*60*60*24)); }
function getAgeingBg(d: number) { if(d>=10)return"#ffe4cc"; if(d>=6)return"#fff3e0"; if(d>=3)return"#fffde7"; return""; }
function getSLA(deadline?: string|null) {
  if(!deadline) return null;
  const diff = new Date(deadline).getTime()-Date.now();
  if(diff<0) return { text:"OVERDUE",color:"#cf1322" };
  const days=Math.floor(diff/(1000*60*60*24)); const hrs=Math.floor((diff%(1000*60*60*24))/(1000*60*60));
  if(days===0) return { text:`${hrs}h left`,color:"#cf1322" };
  if(days<=2) return { text:`${days}d ${hrs}h left`,color:"#d46b08" };
  return { text:`${days}d left`,color:"#006600" };
}
function playBeep() {
  try {
    const ctx=new ((window as any).AudioContext||(window as any).webkitAudioContext)();
    const o=ctx.createOscillator(); const g=ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type="sine"; o.frequency.value=880;
    g.gain.setValueAtTime(0.3,ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.5);
    o.start(ctx.currentTime); o.stop(ctx.currentTime+0.5);
  } catch {}
}
function lsGet<T>(key:string,fallback:T):T {
  try { const v=localStorage.getItem(key); return v?JSON.parse(v):fallback; } catch { return fallback; }
}
function lsSet(key:string,val:unknown) { try { localStorage.setItem(key,JSON.stringify(val)); } catch {} }

// ─── Confetti ─────────────────────────────────────────────────────────────────
function Confetti({ milestone, onDone }: { milestone: number; onDone: () => void }) {
  const pieces = useMemo(() => Array.from({length:40},(_,i)=>({
    id:i, color:["#ff4444","#4444ff","#44ff44","#ffff44","#ff44ff","#44ffff","#ff8800"][i%7],
    left:(i/40)*100+(Math.random()*6-3), delay:Math.random()*1.5, dur:2.5+Math.random()*1.5,
    size:6+Math.floor(Math.random()*8), circle:i%3===0,
  })), []);
  useEffect(() => { const t=setTimeout(onDone,4200); return ()=>clearTimeout(t); },[onDone]);
  return (
    <>
      <style>{`@keyframes cfall{0%{transform:translateY(-60px) rotate(0deg);opacity:1}100%{transform:translateY(110vh) rotate(720deg);opacity:0}}`}</style>
      <div style={{ position:"fixed",inset:0,zIndex:999999,pointerEvents:"none",overflow:"hidden" }}>
        {pieces.map(p=>(
          <div key={p.id} style={{ position:"absolute",left:`${p.left}%`,top:0,width:p.size,height:p.size,background:p.color,borderRadius:p.circle?"50%":2,animation:`cfall ${p.dur}s ${p.delay}s linear forwards` }}/>
        ))}
        <div style={{ position:"fixed",top:"35%",left:"50%",transform:"translateX(-50%)",textAlign:"center",pointerEvents:"none" }}>
          <div style={{ fontSize:52 }}>🎉</div>
          <div style={{ background:"rgba(0,0,128,0.92)",color:"white",padding:"10px 22px",borderRadius:8,fontFamily:"Tahoma,sans-serif",fontSize:16,fontWeight:"bold",marginTop:8,boxShadow:"0 4px 16px rgba(0,0,0,0.5)" }}>
            ₹{milestone.toLocaleString("en-IN")} Milestone Reached!
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Context Menu ─────────────────────────────────────────────────────────────
interface CtxState { x:number; y:number; service:Service; }
function ContextMenu({ ctx, onClose, onStatusChange, onOpenDetails }: { ctx:CtxState; onClose:()=>void; onStatusChange:(id:string,s:string)=>void; onOpenDetails:(s:Service)=>void; }) {
  const [showStatus,setShowStatus]=useState(false);
  const ref=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const h=(e:MouseEvent)=>{ if(ref.current&&!ref.current.contains(e.target as Node))onClose(); };
    document.addEventListener("mousedown",h); return ()=>document.removeEventListener("mousedown",h);
  },[onClose]);
  const ms:React.CSSProperties={ position:"fixed",top:Math.min(ctx.y,window.innerHeight-300),left:Math.min(ctx.x,window.innerWidth-200),zIndex:999999,background:"#d4d0c8",border:"none",borderTop:"2px solid #fff",borderLeft:"2px solid #fff",borderRight:"2px solid #808080",borderBottom:"2px solid #808080",minWidth:190,padding:"2px",fontFamily:"Tahoma,sans-serif",fontSize:12,boxShadow:"4px 4px 8px rgba(0,0,0,0.4)" };
  const is:React.CSSProperties={ display:"flex",alignItems:"center",gap:8,padding:"5px 12px",cursor:"pointer" };
  const s=ctx.service;
  const Item=({icon,label,onClick,danger}:{icon:string;label:string;onClick:()=>void;danger?:boolean})=>(
    <div style={{ ...is,color:danger?"#cc0000":"black" }} onMouseEnter={e=>(e.currentTarget.style.background="#000080,e.currentTarget.style.color=danger?'#ff8080':'white'")} onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=danger?"#cc0000":"black";}} onClick={()=>{onClick();onClose();}}>
      <span>{icon}</span>{label}
    </div>
  );
  return (
    <div ref={ref} style={ms}>
      <div style={{ padding:"3px 12px 5px",fontSize:10,color:"#555",borderBottom:"1px solid #aaa",marginBottom:2 }}>{s.customer.name} — {s.serviceType}</div>
      <Item icon="📂" label="Open Details" onClick={()=>onOpenDetails(s)} />
      <Item icon="📱" label="Send WhatsApp" onClick={()=>{ const msg=encodeURIComponent(`नमस्ते ${s.customer.name},\n\nआपके *${s.serviceType}* का status: *${STATUS_LABELS[s.status]}*\n\n— RA Seva Point`); window.open(`https://wa.me/91${s.customer.mobile.replace(/\D/g,"").slice(-10)}?text=${msg}`,"_blank"); }} />
      <Item icon="⭐" label="Send Rating Request" onClick={()=>{ const msg=encodeURIComponent(`नमस्ते ${s.customer.name},\n\nRA Seva Point से *${s.serviceType}* का काम पूरा हो गया है।\nकृपया हमें Google पर Review दें:\n⭐ https://g.page/r/review\n\nधन्यवाद! — RA Seva Point`); window.open(`https://wa.me/91${s.customer.mobile.replace(/\D/g,"").slice(-10)}?text=${msg}`,"_blank"); }} />
      <Item icon="🖨️" label="Print Receipt" onClick={()=>window.print()} />
      <div style={{ position:"relative" }}>
        <div style={is} onMouseEnter={e=>{(e.currentTarget.style.background="#000080");(e.currentTarget.style.color="white");setShowStatus(true);}} onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="black";}}>
          <span>🔄</span>Change Status<span style={{ marginLeft:"auto" }}>▶</span>
        </div>
        {showStatus&&(
          <div style={{ position:"absolute",left:"100%",top:0,background:"#d4d0c8",borderTop:"2px solid #fff",borderLeft:"2px solid #fff",borderRight:"2px solid #808080",borderBottom:"2px solid #808080",minWidth:150,padding:2,zIndex:999999 }}>
            {STATUS_ORDER.map(st=>(
              <div key={st} style={{ ...is,background:s.status===st?STATUS_BG[st]:"transparent" }} onMouseEnter={e=>(e.currentTarget.style.background="#000080,e.currentTarget.style.color='white'")} onMouseLeave={e=>{e.currentTarget.style.background=s.status===st?STATUS_BG[st]:"transparent";}} onClick={()=>{onStatusChange(s.id,st);onClose();}}>
                {STATUS_LABELS[st]}{s.status===st&&<span style={{ marginLeft:"auto",fontSize:10 }}>✓</span>}
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{ borderTop:"1px solid #aaa",marginTop:2,paddingTop:2 }}>
        <Item icon="💳" label="Mark as Paid" onClick={async()=>{ await fetch(`/api/services/${s.id}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({paymentStatus:"PAID"})}); window.location.reload(); }} />
      </div>
    </div>
  );
}

// ─── Shortcuts Help ───────────────────────────────────────────────────────────
function ShortcutsHelp({ onClose }: { onClose:()=>void }) {
  const SHORTCUTS=[["N","New Service"],["K","Kanban View"],["L","List View"],["C","Calendar View"],["A","Analytics Panel"],["E","Export Excel"],["T","Daily Checklist"],["W","WA Daily Summary"],["?","Shortcuts Help"],["Esc","Close dialogs"],["/"," Focus Search"]];
  return (
    <div style={{ position:"fixed",inset:0,zIndex:99999,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center" }} onClick={onClose}>
      <div style={{ background:"#d4d0c8",borderTop:"2px solid #fff",borderLeft:"2px solid #fff",borderRight:"2px solid #808080",borderBottom:"2px solid #808080",width:320,fontFamily:"Tahoma,sans-serif",boxShadow:"4px 4px 16px rgba(0,0,0,0.4)" }} onClick={e=>e.stopPropagation()}>
        <div style={{ background:"linear-gradient(to right,#000080,#1084d0)",color:"white",padding:"4px 8px",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
          <span style={{ fontWeight:"bold",fontSize:12 }}>⌨ Keyboard Shortcuts</span>
          <button onClick={onClose} style={{ background:"#d4d0c8",borderTop:"2px solid #fff",borderLeft:"2px solid #fff",borderRight:"2px solid #808080",borderBottom:"2px solid #808080",border:"none",width:18,height:18,cursor:"pointer",fontSize:11,fontWeight:"bold" }}>✕</button>
        </div>
        <div style={{ padding:"12px 16px",display:"flex",flexDirection:"column",gap:6 }}>
          {SHORTCUTS.map(([key,label])=>(
            <div key={key} style={{ display:"flex",alignItems:"center",gap:10 }}>
              <kbd style={{ background:"#e8e8e8",borderTop:"2px solid #fff",borderLeft:"2px solid #fff",borderRight:"2px solid #808080",borderBottom:"2px solid #808080",padding:"1px 8px",fontFamily:"monospace",fontSize:12,minWidth:50,textAlign:"center" }}>{key}</kbd>
              <span style={{ fontSize:12 }}>{label}</span>
            </div>
          ))}
        </div>
        <div style={{ padding:"0 16px 12px" }}>
          <button onClick={onClose} style={{ width:"100%",padding:"5px",background:"#d4d0c8",fontFamily:"Tahoma,sans-serif",fontSize:12,cursor:"pointer",borderTop:"2px solid #fff",borderLeft:"2px solid #fff",borderRight:"2px solid #808080",borderBottom:"2px solid #808080" }}>Close (Esc)</button>
        </div>
      </div>
    </div>
  );
}

// ─── Calendar View ─────────────────────────────────────────────────────────────
function CalendarView({ services, onSelect }: { services:Service[]; onSelect:(s:Service)=>void; }) {
  const today=new Date(); const days=Array.from({length:7},(_,i)=>{ const d=new Date(today); d.setDate(today.getDate()+i); return d; });
  const getLabel=(d:Date)=>{
    if(d.toDateString()===today.toDateString())return"📅 Today";
    const tom=new Date(today); tom.setDate(today.getDate()+1);
    if(d.toDateString()===tom.toDateString())return"Tomorrow";
    return d.toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short"});
  };
  return (
    <div style={{ display:"flex",gap:8,overflowX:"auto",paddingBottom:8 }}>
      {days.map((d,idx)=>{
        const ds=d.toDateString(); const svcs=services.filter(s=>s.deadline&&new Date(s.deadline).toDateString()===ds);
        return (
          <div key={idx} style={{ minWidth:160,background:idx===0?"#e3f0ff":"#d4d0c8",border:"none",borderTop:idx===0?"2px solid #000080":"2px solid #fff",borderLeft:idx===0?"2px solid #000080":"2px solid #fff",borderRight:"2px solid #808080",borderBottom:"2px solid #808080",padding:"8px",flexShrink:0,fontFamily:"Tahoma,sans-serif" }}>
            <div style={{ fontWeight:"bold",fontSize:11,color:idx===0?"#000080":"#333",marginBottom:6,borderBottom:"1px solid #aaa",paddingBottom:4 }}>{getLabel(d)}</div>
            {svcs.length===0?<div style={{ fontSize:10,color:"#888",fontStyle:"italic" }}>No deadlines</div>:svcs.map(s=>(
              <div key={s.id} onClick={()=>onSelect(s)} style={{ background:STATUS_BG[s.status]||"white",borderTop:"2px solid #fff",borderLeft:"2px solid #fff",borderRight:"2px solid #808080",borderBottom:"2px solid #808080",padding:"4px 6px",marginBottom:3,cursor:"pointer",fontSize:11 }}>
                <div style={{ fontWeight:"bold" }}>{s.customer.name}</div>
                <div style={{ color:"#555",fontSize:10 }}>{s.serviceType}</div>
                <div style={{ color:"#000080",fontSize:10,fontWeight:"bold" }}>{formatCurrency(s.fees)}</div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

// ─── Kanban Board ─────────────────────────────────────────────────────────────
function KanbanBoard({ services, onSelect, onStatusChange, onContextMenu, cardColors, cardStars, pinnedCards, onColorChange, onStarChange, onTogglePin, onColumnExport }: {
  services:Service[]; onSelect:(s:Service)=>void; onStatusChange:(id:string,s:string)=>void;
  onContextMenu:(e:React.MouseEvent,s:Service)=>void;
  cardColors:Record<string,CardColor>; cardStars:Record<string,number>; pinnedCards:Set<string>;
  onColorChange:(id:string,c:CardColor)=>void; onStarChange:(id:string,n:number)=>void;
  onTogglePin:(id:string)=>void; onColumnExport:(status:string)=>void;
}) {
  const [hover,setHover]=useState<{x:number;y:number;service:Service}|null>(null);
  const [colorPickerId,setColorPickerId]=useState<string|null>(null);
  const [quickStatusId,setQuickStatusId]=useState<string|null>(null);
  const hoverTimer=useRef<ReturnType<typeof setTimeout>|null>(null);

  const handleDragStart=(e:React.DragEvent,id:string)=>e.dataTransfer.setData("serviceId",id);
  const handleDragOver=(e:React.DragEvent)=>e.preventDefault();
  const handleDrop=(e:React.DragEvent,status:string)=>{ e.preventDefault(); const id=e.dataTransfer.getData("serviceId"); if(id)onStatusChange(id,status); };
  const onHoverEnter=(e:React.MouseEvent,s:Service)=>{ const r=(e.currentTarget as HTMLElement).getBoundingClientRect(); hoverTimer.current=setTimeout(()=>setHover({x:r.right+8,y:r.top,service:s}),800); };
  const onHoverLeave=()=>{ if(hoverTimer.current)clearTimeout(hoverTimer.current); setHover(null); };

  const COLORS:CardColor[]=["","red","blue","green","yellow"];
  const COLOR_LABELS:Record<CardColor,string>={"":"⬜","red":"🔴","blue":"🔵","green":"🟢","yellow":"🟡"};

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {STATUS_ORDER.map(status=>{
        const cols=services.filter(s=>s.status===status).sort((a,b)=>{
          const ap=pinnedCards.has(a.id)?0:1; const bp=pinnedCards.has(b.id)?0:1;
          if(ap!==bp)return ap-bp;
          const as2=cardStars[a.id]||0; const bs2=cardStars[b.id]||0;
          if(bs2!==as2)return bs2-as2;
          return new Date(a.createdAt).getTime()-new Date(b.createdAt).getTime();
        });
        return (
          <div key={status} className="kanban-column shrink-0" onDragOver={handleDragOver} onDrop={e=>handleDrop(e,status)} style={{ minHeight:200 }}>
            {/* Column Header */}
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8 }}>
              <span className={`badge ${SERVICE_STATUS_COLORS[status]}`}>{STATUS_LABELS[status]}</span>
              <div style={{ display:"flex",alignItems:"center",gap:4 }}>
                <span style={{ fontSize:11,color:"var(--text-muted)",fontWeight:"bold" }}>{cols.length}</span>
                <button onClick={()=>onColumnExport(status)} title={`Export ${STATUS_LABELS[status]} to Excel`}
                  style={{ background:"none",border:"none",cursor:"pointer",fontSize:12,color:"var(--text-muted)",padding:"0 2px" }}>
                  <Download size={12}/>
                </button>
              </div>
            </div>

            {cols.length===0?(
              <div className="text-center py-8 text-xs" style={{ color:"var(--text-muted)" }}>No services</div>
            ):cols.map((s,idx)=>{
              const isOverdue=s.deadline&&new Date(s.deadline).getTime()<Date.now()&&!["APPROVED","DELIVERED","CANCELLED"].includes(s.status);
              const isDueSoon=s.deadline&&new Date(s.deadline).getTime()-Date.now()<86400000*2&&!isOverdue&&!["APPROVED","DELIVERED","CANCELLED"].includes(s.status);
              const daysOld=getDaysOld(s.createdAt);
              const isStalled=daysOld>5&&["PROCESSING","SUBMITTED"].includes(s.status);
              const isLossRisk=s.fees===0||daysOld>10;
              const isPinned=pinnedCards.has(s.id);
              const cardColor=cardColors[s.id]||"" as CardColor;
              const stars=cardStars[s.id]||0;
              const sla=getSLA(s.deadline);
              const ageingBg=getAgeingBg(daysOld);
              const cardBg=isOverdue?"#ffeaea":isDueSoon?"#fff7e6":COLOR_BG[cardColor]||ageingBg||"var(--bg-card)";
              const cardBorder=isOverdue?"2px solid #ff4d4f":isDueSoon?"2px solid #fa8c16":COLOR_BORDER[cardColor];

              return (
                <div key={s.id}
                  className="kanban-card cursor-grab active:cursor-grabbing"
                  style={{ background:cardBg,border:cardBorder,position:"relative",borderLeft:cardColor?`4px solid ${COLOR_LABELS[cardColor].includes("🔴")?"#cf1322":cardColor==="blue"?"#000080":cardColor==="green"?"#006600":cardColor==="yellow"?"#d4b800":"transparent"}`:undefined }}
                  draggable onDragStart={e=>handleDragStart(e,s.id)}
                  onClick={()=>{ if(quickStatusId===s.id||colorPickerId===s.id)return; onSelect(s); }}
                  onContextMenu={e=>{e.preventDefault();onContextMenu(e,s);}}
                  onMouseEnter={e=>onHoverEnter(e,s)} onMouseLeave={onHoverLeave}
                >
                  {/* Top bar: pin + color + stars */}
                  <div style={{ display:"flex",alignItems:"center",gap:4,marginBottom:4 }}>
                    {/* Pin */}
                    <button onClick={e=>{e.stopPropagation();onTogglePin(s.id);}}
                      style={{ background:"none",border:"none",cursor:"pointer",fontSize:10,padding:0,color:isPinned?"#d46b08":"#ccc",lineHeight:1 }}
                      title={isPinned?"Unpin":"Pin to top"}>
                      📌
                    </button>
                    {/* Color picker */}
                    <div style={{ position:"relative" }}>
                      <button onClick={e=>{e.stopPropagation();setColorPickerId(colorPickerId===s.id?null:s.id);}}
                        style={{ background:"none",border:"none",cursor:"pointer",fontSize:10,padding:0,lineHeight:1 }}
                        title="Color Label">
                        {COLOR_LABELS[cardColor]}
                      </button>
                      {colorPickerId===s.id&&(
                        <div onClick={e=>e.stopPropagation()} style={{ position:"absolute",top:16,left:0,zIndex:1000,background:"#d4d0c8",borderTop:"2px solid #fff",borderLeft:"2px solid #fff",borderRight:"2px solid #808080",borderBottom:"2px solid #808080",padding:4,display:"flex",gap:4 }}>
                          {COLORS.map(c=>(
                            <button key={c} onClick={()=>{onColorChange(s.id,c);setColorPickerId(null);}}
                              style={{ background:"none",border:cardColor===c?"2px solid #000":"1px solid #aaa",cursor:"pointer",fontSize:12,padding:"1px",borderRadius:2 }}>
                              {COLOR_LABELS[c]}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* Stars */}
                    <div onClick={e=>e.stopPropagation()} style={{ display:"flex",gap:1,marginLeft:"auto" }}>
                      {[1,2,3].map(n=>(
                        <button key={n} onClick={()=>onStarChange(s.id,stars===n?0:n)}
                          style={{ background:"none",border:"none",cursor:"pointer",fontSize:10,padding:0,color:n<=stars?"#d4b800":"#ddd",lineHeight:1 }}>
                          ★
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Oldest + Pinned tags */}
                  <div style={{ display:"flex",gap:3,marginBottom:3,flexWrap:"wrap" }}>
                    {isPinned&&<span style={{ fontSize:"8px",background:"#fff3e0",color:"#d46b08",border:"1px solid #ffd591",padding:"1px 3px",borderRadius:2,fontWeight:"bold" }}>📌 PINNED</span>}
                    {idx===0&&cols.length>1&&!isPinned&&<span style={{ fontSize:"8px",background:"#f9f0ff",color:"#722ed1",border:"1px solid #d3adf7",padding:"1px 3px",borderRadius:2 }}>⏳ OLDEST</span>}
                  </div>

                  {/* Customer name */}
                  <div className="font-bold text-sm mb-1" style={{ color:"var(--text-primary)",display:"flex",alignItems:"center",gap:4 }}>
                    {s.customer.name}
                    {isOverdue&&<span title="Overdue!" style={{ fontSize:12 }}>⚠️</span>}
                  </div>
                  <div className="text-xs mb-1 truncate" style={{ color:"var(--text-secondary)" }}>{s.serviceType}</div>

                  {/* Quick status toggle */}
                  {quickStatusId===s.id?(
                    <select autoFocus value={s.status} style={{ fontSize:11,width:"100%",marginBottom:4,border:"1px solid #aaa",borderRadius:3,padding:"2px" }}
                      onClick={e=>e.stopPropagation()}
                      onChange={e=>{onStatusChange(s.id,e.target.value);setQuickStatusId(null);}}
                      onBlur={()=>setQuickStatusId(null)}>
                      {STATUS_ORDER.map(st=><option key={st} value={st}>{STATUS_LABELS[st]}</option>)}
                    </select>
                  ):(
                    <button onClick={e=>{e.stopPropagation();setQuickStatusId(s.id);}}
                      style={{ fontSize:"9px",background:STATUS_BG[s.status]||"#f0f0f0",border:"1px solid #ccc",borderRadius:3,padding:"1px 5px",cursor:"pointer",marginBottom:4,width:"100%",textAlign:"left",fontFamily:"Tahoma,sans-serif" }}>
                      🔄 {STATUS_LABELS[s.status]}
                    </button>
                  )}

                  {/* Mini Badges */}
                  <div style={{ display:"flex",flexWrap:"wrap",gap:2,marginBottom:4 }}>
                    {isStalled&&<span style={{ fontSize:"8px",background:"#f9f0ff",color:"#722ed1",border:"1px solid #d3adf7",padding:"1px 3px",borderRadius:2,fontWeight:"bold" }}>🔴 Stalled {daysOld}d</span>}
                    {isLossRisk&&<span style={{ fontSize:"8px",background:"#fff1f0",color:"#cf1322",border:"1px solid #ffa39e",padding:"1px 3px",borderRadius:2,fontWeight:"bold" }}>💸 Loss Risk</span>}
                    {s.paymentStatus==="UNPAID"&&<span style={{ fontSize:"8px",background:"#fff7e6",color:"#d46b08",border:"1px solid #ffd591",padding:"1px 3px",borderRadius:2 }}>💰 Unpaid</span>}
                    {s.missingDocs&&<span style={{ fontSize:"8px",background:"#f0f5ff",color:"#2f54eb",border:"1px solid #adc6ff",padding:"1px 3px",borderRadius:2 }}>📎 Docs</span>}
                  </div>

                  {/* SLA Timer */}
                  {sla&&(
                    <div style={{ fontSize:"9px",fontWeight:"bold",color:sla.color,marginBottom:3,display:"flex",alignItems:"center",gap:3 }}>
                      <Clock size={9}/> {sla.text}
                    </div>
                  )}

                  {/* Fee + Date */}
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:2 }}>
                    <span style={{ fontSize:10,color:"var(--text-muted)" }}>{formatDate(s.createdAt)}</span>
                    <span style={{ fontSize:13,fontWeight:"bold",color:"var(--brand-primary)" }}>{formatCurrency(s.fees)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

      {/* Hover Preview */}
      {hover&&(
        <div style={{ position:"fixed",top:Math.min(hover.y,window.innerHeight-240),left:Math.min(hover.x,window.innerWidth-260),zIndex:99999,background:"var(--bg-card)",border:"2px solid var(--brand-primary)",borderRadius:8,padding:12,width:240,boxShadow:"0 8px 24px rgba(0,0,0,0.2)",pointerEvents:"none",fontSize:12,fontFamily:"Tahoma,sans-serif" }}>
          <div style={{ fontWeight:"bold",marginBottom:6,color:"var(--brand-primary)",display:"flex",alignItems:"center",gap:4 }}><Eye size={12}/> Quick Look</div>
          <div style={{ display:"flex",flexDirection:"column",gap:4 }}>
            <div><strong>Customer:</strong> {hover.service.customer.name}</div>
            <div><strong>Mobile:</strong> {hover.service.customer.mobile}</div>
            <div><strong>Service:</strong> {hover.service.serviceType}</div>
            <div><strong>Fees:</strong> {formatCurrency(hover.service.fees)}</div>
            <div><strong>Payment:</strong> <span style={{ color:hover.service.paymentStatus==="PAID"?"green":"red" }}>{hover.service.paymentStatus}</span></div>
            {hover.service.missingDocs&&<div style={{ color:"#d46b08" }}><strong>Missing:</strong> {hover.service.missingDocs}</div>}
            <div style={{ color:"#888",fontSize:10 }}>Age: {getDaysOld(hover.service.createdAt)} days | Stars: {"★".repeat(cardStars[hover.service.id]||0)}{"☆".repeat(3-(cardStars[hover.service.id]||0))}</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ServicesPage() {
  const [services,setServices]=useState<Service[]>([]);
  const [total,setTotal]=useState(0);
  const [loading,setLoading]=useState(true);
  const [view,setView]=useState<"kanban"|"list"|"calendar">("kanban");
  const [query,setQuery]=useState("");
  const [quickFilter,setQuickFilter]=useState("ALL");
  const [selectedService,setSelectedService]=useState<Service|null>(null);
  const [isNewOpen,setIsNewOpen]=useState(false);
  const [isDetailsOpen,setIsDetailsOpen]=useState(false);
  const [selectedIds,setSelectedIds]=useState<Set<string>>(new Set());
  const [bulkStatus,setBulkStatus]=useState("");
  const [isBulkUpdating,setIsBulkUpdating]=useState(false);
  const [callingNext,setCallingNext]=useState(false);
  const [liveToken,setLiveToken]=useState<string|null>(null);
  const [contextMenu,setContextMenu]=useState<CtxState|null>(null);
  const [showAnalytics,setShowAnalytics]=useState(false);
  const [showShortcuts,setShowShortcuts]=useState(false);
  const [showChecklist,setShowChecklist]=useState(false);
  const [dailyRevenue,setDailyRevenue]=useState<DayRevenue[]>([]);
  const [dailyTarget,setDailyTarget]=useState(2000);
  const [stalledDismissed,setStalledDismissed]=useState(false);
  const [duplicateAlert,setDuplicateAlert]=useState<string|null>(null);
  const [confetti,setConfetti]=useState<number|null>(null);
  const [streak,setStreak]=useState(1);
  const [lastMilestone,setLastMilestone]=useState(0);
  const [autoWA,setAutoWA]=useState(false);
  const [cardColors,setCardColors]=useState<Record<string,CardColor>>({});
  const [cardStars,setCardStars]=useState<Record<string,number>>({});
  const [pinnedCards,setPinnedCards]=useState<Set<string>>(new Set());
  const [savedFilters,setSavedFilters]=useState<SavedFilter[]>([]);
  const [saveFilterName,setSaveFilterName]=useState("");
  const [showSaveFilter,setShowSaveFilter]=useState(false);

  const searchRef=useRef<HTMLInputElement>(null);
  const toast=useToast();

  // ─── Load localStorage ─────────────────────────────────────────────────────
  useEffect(()=>{
    if(typeof window==="undefined")return;
    setDailyTarget(lsGet("ra_daily_target",2000));
    setAutoWA(lsGet("ra_auto_wa",false));
    setCardColors(lsGet("ra_card_colors",{}));
    setCardStars(lsGet("ra_card_stars",{}));
    setPinnedCards(new Set(lsGet<string[]>("ra_pinned_cards",[])));
    setSavedFilters(lsGet("ra_saved_filters",[]));
    setLastMilestone(lsGet("ra_last_milestone",0));
    // Streak
    const sd=lsGet<{lastDate:string;count:number}|null>("ra_streak",null);
    const today=new Date().toDateString(); const yesterday=new Date(); yesterday.setDate(yesterday.getDate()-1);
    if(!sd){ setStreak(1); lsSet("ra_streak",{lastDate:today,count:1}); }
    else if(sd.lastDate===today){ setStreak(sd.count); }
    else if(sd.lastDate===yesterday.toDateString()){ const n=sd.count+1; setStreak(n); lsSet("ra_streak",{lastDate:today,count:n}); }
    else { setStreak(1); lsSet("ra_streak",{lastDate:today,count:1}); }
  },[]);

  // ─── Fetch Services ────────────────────────────────────────────────────────
  const fetchServices=useCallback(async()=>{
    setLoading(true);
    try {
      const res=await fetch("/api/services?limit=200");
      const data=await res.json();
      const svcs:Service[]=data.services||[];
      setServices(svcs); setTotal(data.total||0);
      // Duplicate check
      const seen:Record<string,{name:string;date:string}[]>={};
      svcs.forEach(s=>{ const k=`${s.customer.id}__${s.serviceType}`; if(!seen[k])seen[k]=[]; seen[k].push({name:s.customer.name,date:s.createdAt}); });
      for(const k of Object.keys(seen)){
        const entries=seen[k]; if(entries.length<2)continue;
        const sorted=entries.sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime());
        const diff=Math.floor((new Date(sorted[0].date).getTime()-new Date(sorted[1].date).getTime())/(1000*60*60*24));
        if(diff<=30){ setDuplicateAlert(`⚠️ ${sorted[0].name} — "${k.split("__")[1]}" pichle 30 din mein ${entries.length} baar add hua!`); break; }
      }
    } catch { toast.error("Failed to load services"); }
    finally { setLoading(false); }
  },[]);

  // ─── Fetch Revenue ─────────────────────────────────────────────────────────
  const fetchRevenue=useCallback(async()=>{
    try {
      const res=await fetch("/api/reports/daily-closing");
      const data=await res.json();
      if(data.last7Days) setDailyRevenue(data.last7Days.map((d:any)=>({ day:new Date(d.date).toLocaleDateString("en-IN",{weekday:"short"}),revenue:d.income||0 })));
    } catch {
      const dayMap:Record<string,number>={};
      services.forEach(s=>{ const d=new Date(s.createdAt).toLocaleDateString("en-IN",{weekday:"short"}); dayMap[d]=(dayMap[d]||0)+s.fees; });
      setDailyRevenue(Object.entries(dayMap).map(([day,revenue])=>({day,revenue})));
    }
  },[services]);

  useEffect(()=>{ fetchServices(); },[fetchServices]);
  useEffect(()=>{ if(services.length>0)fetchRevenue(); },[services.length]);

  // ─── Tab Badge ────────────────────────────────────────────────────────────
  useEffect(()=>{
    const todayStart=new Date(); todayStart.setHours(0,0,0,0);
    const ov=services.filter(s=>s.deadline&&new Date(s.deadline)<todayStart&&!["APPROVED","DELIVERED","CANCELLED"].includes(s.status)).length;
    document.title=ov>0?`(${ov} Overdue) Services — RA Seva Point`:"Services — RA Seva Point";
    return()=>{ document.title="Services — RA Seva Point"; };
  },[services]);

  // ─── Milestone Confetti ────────────────────────────────────────────────────
  useEffect(()=>{
    if(!services.length)return;
    const total=services.reduce((s,x)=>s+x.fees,0);
    const reached=MILESTONES.filter(m=>total>=m);
    const highest=reached.length?Math.max(...reached):0;
    if(highest>lastMilestone){ setLastMilestone(highest); lsSet("ra_last_milestone",highest); setConfetti(highest); }
  },[services]);

  // ─── Keyboard Shortcuts ───────────────────────────────────────────────────
  useEffect(()=>{
    const h=(e:KeyboardEvent)=>{
      const tag=(e.target as HTMLElement).tagName;
      if(["INPUT","TEXTAREA","SELECT"].includes(tag))return;
      switch(e.key.toLowerCase()){
        case"n":setIsNewOpen(true);break; case"k":setView("kanban");break; case"l":setView("list");break;
        case"c":setView("calendar");break; case"a":setShowAnalytics(v=>!v);break; case"e":handleExportExcel();break;
        case"t":setShowChecklist(v=>!v);break; case"w":handleWASummary();break; case"?":setShowShortcuts(true);break;
        case"/":e.preventDefault();searchRef.current?.focus();break;
        case"escape":setIsNewOpen(false);setIsDetailsOpen(false);setShowShortcuts(false);setContextMenu(null);setShowChecklist(false);break;
      }
    };
    document.addEventListener("keydown",h); return()=>document.removeEventListener("keydown",h);
  },[]);

  // ─── Card Handlers ────────────────────────────────────────────────────────
  const handleColorChange=(id:string,color:CardColor)=>{ const u={...cardColors,[id]:color}; setCardColors(u); lsSet("ra_card_colors",u); };
  const handleStarChange=(id:string,n:number)=>{ const u={...cardStars,[id]:n}; setCardStars(u); lsSet("ra_card_stars",u); };
  const handleTogglePin=(id:string)=>{ const u=new Set(pinnedCards); if(u.has(id))u.delete(id);else u.add(id); setPinnedCards(u); lsSet("ra_pinned_cards",Array.from(u)); };

  // ─── Saved Filters ────────────────────────────────────────────────────────
  const handleSaveFilter=()=>{
    if(!saveFilterName.trim())return;
    const u=[...savedFilters.slice(0,4),{name:saveFilterName.trim(),filter:quickFilter,query}];
    setSavedFilters(u); lsSet("ra_saved_filters",u); setSaveFilterName(""); setShowSaveFilter(false);
    toast.success("Filter saved!");
  };
  const handleDeleteFilter=(i:number)=>{ const u=savedFilters.filter((_,j)=>j!==i); setSavedFilters(u); lsSet("ra_saved_filters",u); };

  // ─── Status Change ────────────────────────────────────────────────────────
  const handleStatusChange=async(id:string,newStatus:string)=>{
    const svc=services.find(x=>x.id===id);
    if(newStatus==="DELIVERED"&&svc&&svc.paymentStatus==="UNPAID"&&svc.fees>0){
      if(confirm(`${svc.customer.name} ka ₹${svc.fees} UNPAID hai.\nKhata (Udhaar) mein add karein?`)){
        try { await fetch("/api/income",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:`${svc.serviceType} — ${svc.customer.name}`,amount:svc.fees,category:"Udhaar",customerId:svc.customer.id})}); toast.success("Khata entry added!"); } catch { toast.error("Khata entry failed."); }
      }
      // Rating WA
      if(svc.customer.mobile){
        const sendRating=confirm("Customer ko Google Review ka WhatsApp bhejein?");
        if(sendRating){ const msg=encodeURIComponent(`नमस्ते ${svc.customer.name},\n\nRA Seva Point से *${svc.serviceType}* का काम पूरा हो गया। आपकी सेवा करके खुशी हुई! 😊\n\nकृपया हमें Google पर ⭐ Review दें:\nhttps://g.page/r/review\n\nधन्यवाद! — RA Seva Point`); window.open(`https://wa.me/91${svc.customer.mobile.replace(/\D/g,"").slice(-10)}?text=${msg}`,"_blank"); }
      }
    }
    try {
      setServices(prev=>prev.map(s=>s.id===id?{...s,status:newStatus}:s));
      const res=await fetch(`/api/services/${id}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:newStatus})});
      if(!res.ok)throw new Error();
      toast.success("Status updated");
      if((newStatus==="APPROVED"||newStatus==="DELIVERED")&&svc){
        const shouldNotify=autoWA?true:confirm(`WhatsApp customer ${svc.customer.name} ko bhejein?`);
        if(shouldNotify){ const msg=encodeURIComponent(`नमस्ते ${svc.customer.name},\n\nआपके *${svc.serviceType}* का status: *${STATUS_LABELS[newStatus]}*\n\n— RA Seva Point`); window.open(`https://wa.me/91${svc.customer.mobile.replace(/\D/g,"").slice(-10)}?text=${msg}`,"_blank"); }
      }
    } catch { toast.error("Status update failed"); fetchServices(); }
  };

  // ─── Export Excel ─────────────────────────────────────────────────────────
  const handleExportExcel=(statusFilter?:string)=>{
    const rows=(statusFilter?filtered.filter(s=>s.status===statusFilter):filtered).map(s=>({
      "Customer":s.customer.name,"Mobile":s.customer.mobile,"Service":s.serviceType,
      "Status":STATUS_LABELS[s.status],"Payment":s.paymentStatus,"Fees (₹)":s.fees,
      "Date":formatDate(s.createdAt),"Deadline":s.deadline?new Date(s.deadline).toLocaleDateString():"",
      "Missing Docs":s.missingDocs||"","Tracking":s.trackingId||"",
    }));
    const ws=XLSX.utils.json_to_sheet(rows); const wb=XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb,ws,statusFilter||"Services");
    XLSX.writeFile(wb,`services${statusFilter?"-"+statusFilter:""}-${new Date().toISOString().slice(0,10)}.xlsx`);
    toast.success("Excel downloaded!");
  };

  // ─── WA Summary ──────────────────────────────────────────────────────────
  const handleWASummary=()=>{
    const todayStr=new Date().toDateString();
    const todaySvcs=services.filter(s=>new Date(s.createdAt).toDateString()===todayStr);
    const todayRev=todaySvcs.reduce((s,x)=>s+x.fees,0);
    const todayStart=new Date(); todayStart.setHours(0,0,0,0);
    const ov=services.filter(s=>s.deadline&&new Date(s.deadline)<todayStart&&!["APPROVED","DELIVERED","CANCELLED"].includes(s.status)).length;
    const text=encodeURIComponent(`📊 *RA Seva Point — Daily Report*\n📅 ${new Date().toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"})}\n\n✅ Aaj ke naaye: ${todaySvcs.length}\n💰 Aaj ka collection: ₹${todayRev.toLocaleString("en-IN")}\n📦 Total active: ${total}\n✔️ Delivered: ${services.filter(s=>s.status==="DELIVERED").length}\n💳 Unpaid: ${services.filter(s=>s.paymentStatus==="UNPAID"&&s.status!=="CANCELLED").length}\n⚠️ Overdue: ${ov}\n🔥 Streak: ${streak} days\n\n— RA Seva Point`);
    window.open(`https://wa.me/?text=${text}`,"_blank");
  };

  // ─── Close Day ────────────────────────────────────────────────────────────
  const handleCloseDay=async()=>{
    const approved=services.filter(s=>s.status==="APPROVED");
    if(!approved.length){toast.error("Koi APPROVED service nahi hai.");return;}
    if(!confirm(`${approved.length} APPROVED services ko DELIVERED mark karein?`))return;
    try {
      await Promise.all(approved.map(s=>fetch(`/api/services/${s.id}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:"DELIVERED"})})));
      toast.success(`${approved.length} services DELIVERED!`); fetchServices();
    } catch { toast.error("Kuch updates fail hue, refresh karein."); }
  };

  // ─── Kiosk ────────────────────────────────────────────────────────────────
  const callNextToken=async()=>{
    setCallingNext(true);
    try {
      const res=await fetch("/api/kiosk/call-next",{method:"POST"});
      const data=await res.json();
      if(data.token){ setLiveToken(data.token); toast.success(`Calling: ${data.token}`); playBeep(); fetchServices(); setTimeout(()=>setLiveToken(null),6000); }
      else toast.error("No pending tokens");
    } catch { toast.error("Failed"); } finally { setCallingNext(false); }
  };

  // ─── Bulk ─────────────────────────────────────────────────────────────────
  const handleBulkUpdate=async()=>{
    if(!bulkStatus||!selectedIds.size)return; setIsBulkUpdating(true);
    try {
      const res=await fetch("/api/services/bulk",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({ids:Array.from(selectedIds),status:bulkStatus})});
      if(!res.ok)throw new Error(); toast.success(`${selectedIds.size} updated`); setSelectedIds(new Set()); setBulkStatus(""); fetchServices();
    } catch(e:any){ toast.error(e.message); } finally { setIsBulkUpdating(false); }
  };
  const handleBulkWA=()=>{
    const targets=filtered.filter(s=>selectedIds.size>0?selectedIds.has(s.id):(s.status==="PENDING"&&s.missingDocs));
    if(!targets.length){toast.error("Koi target nahi mila.");return;}
    toast.success(`${targets.length} messages bheja ja raha hai...`);
    targets.forEach((s,i)=>setTimeout(()=>{ const msg=encodeURIComponent(`नमस्ते ${s.customer.name},\n\n*${s.serviceType}* के लिए दस्तावेज़ बाकी: *${s.missingDocs||"आवश्यक दस्तावेज़"}*\n\n— RA Seva Point`); window.open(`https://wa.me/91${s.customer.mobile.replace(/\D/g,"").slice(-10)}?text=${msg}`,"_blank"); },i*600));
  };
  const toggleSelection=(id:string,e:React.MouseEvent)=>{ e.stopPropagation(); const u=new Set(selectedIds); if(u.has(id))u.delete(id);else u.add(id); setSelectedIds(u); };
  const toggleAll=(e:React.ChangeEvent<HTMLInputElement>)=>setSelectedIds(e.target.checked?new Set(filtered.map(s=>s.id)):new Set());

  // ─── Filtering ────────────────────────────────────────────────────────────
  const todayStart=useMemo(()=>{ const d=new Date(); d.setHours(0,0,0,0); return d; },[]);
  const todayEnd=useMemo(()=>{ const d=new Date(); d.setHours(23,59,59,999); return d; },[]);
  const baseFiltered=useMemo(()=>query?services.filter(s=>s.serviceType.toLowerCase().includes(query.toLowerCase())||s.customer.name.toLowerCase().includes(query.toLowerCase())||s.customer.mobile.includes(query)||(s.trackingId||"").toLowerCase().includes(query.toLowerCase())):services,[services,query]);
  const filtered=useMemo(()=>{
    if(quickFilter==="ALL")return baseFiltered;
    if(quickFilter==="UNPAID")return baseFiltered.filter(s=>s.paymentStatus==="UNPAID");
    if(quickFilter==="DUE_TODAY")return baseFiltered.filter(s=>s.deadline&&new Date(s.deadline)>=todayStart&&new Date(s.deadline)<=todayEnd);
    return baseFiltered.filter(s=>s.status===quickFilter);
  },[baseFiltered,quickFilter,todayStart,todayEnd]);

  // ─── Analytics ────────────────────────────────────────────────────────────
  const totalUnpaid=useMemo(()=>services.filter(s=>s.paymentStatus==="UNPAID"&&s.status!=="CANCELLED").reduce((sum,s)=>sum+s.fees,0),[services]);
  const dueTodayCount=useMemo(()=>services.filter(s=>s.deadline&&new Date(s.deadline)>=todayStart&&new Date(s.deadline)<=todayEnd).length,[services,todayStart,todayEnd]);
  const overdueCount=useMemo(()=>services.filter(s=>s.deadline&&new Date(s.deadline)<todayStart&&!["APPROVED","DELIVERED","CANCELLED"].includes(s.status)).length,[services,todayStart]);
  const stalledCount=useMemo(()=>services.filter(s=>getDaysOld(s.createdAt)>5&&["PROCESSING","SUBMITTED"].includes(s.status)).length,[services]);
  const completionRate=useMemo(()=>{ const total=services.filter(s=>s.status!=="CANCELLED").length; if(!total)return 0; return Math.round((services.filter(s=>s.status==="DELIVERED").length/total)*100); },[services]);
  const topCustomers=useMemo(()=>{
    const map:Record<string,{name:string;count:number;total:number}>={};
    services.forEach(s=>{ const k=s.customer.id; if(!map[k])map[k]={name:s.customer.name,count:0,total:0}; map[k].count++; map[k].total+=s.fees; });
    return Object.values(map).sort((a,b)=>b.count-a.count).slice(0,5);
  },[services]);
  const todayRevenue=useMemo(()=>services.filter(s=>new Date(s.createdAt).toDateString()===new Date().toDateString()).reduce((sum,s)=>sum+s.fees,0),[services]);

  return (
    <div className="page-shell page-shell-list" style={{ paddingBottom:56,paddingRight:showAnalytics?292:undefined }}>

      {/* Duplicate Alert */}
      {duplicateAlert&&(
        <div style={{ background:"#fff7e6",border:"1px solid #ffd591",borderRadius:6,padding:"7px 14px",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:12,color:"#d46b08",fontFamily:"Tahoma,sans-serif" }}>
          {duplicateAlert}
          <button onClick={()=>setDuplicateAlert(null)} style={{ background:"none",border:"none",cursor:"pointer",fontSize:16,color:"#d46b08" }}>✕</button>
        </div>
      )}

      {/* Stalled Banner */}
      {stalledCount>0&&!stalledDismissed&&(
        <div style={{ background:"#f9f0ff",border:"1px solid #d3adf7",borderRadius:6,padding:"7px 14px",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:12,color:"#722ed1",fontFamily:"Tahoma,sans-serif" }}>
          🔴 <strong>{stalledCount} services</strong> 5+ din se ruke hue hain!
          <div style={{ display:"flex",gap:6 }}>
            <button onClick={()=>{setStalledDismissed(true);setQuickFilter("PROCESSING");}} style={{ background:"#722ed1",color:"white",border:"none",borderRadius:4,padding:"2px 8px",cursor:"pointer",fontSize:11 }}>Dekho</button>
            <button onClick={()=>setStalledDismissed(true)} style={{ background:"none",border:"none",cursor:"pointer",fontSize:16,color:"#722ed1" }}>✕</button>
          </div>
        </div>
      )}

      {/* Revenue Info Bar */}
      <div style={{ background:"#000080",color:"white",padding:"5px 14px",marginBottom:8,display:"flex",gap:20,alignItems:"center",fontSize:12,fontFamily:"Tahoma,sans-serif",flexWrap:"wrap" }}>
        <span>📅 {new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long"})}</span>
        <span>💰 Aaj: <strong>₹{todayRevenue.toLocaleString("en-IN")}</strong></span>
        <span>🔥 Streak: <strong>{streak} days</strong></span>
        <span>✅ Completion: <strong>{completionRate}%</strong></span>
        {overdueCount>0&&<span style={{ color:"#ffaaaa" }}>⚠️ Overdue: <strong>{overdueCount}</strong></span>}
        <button onClick={()=>setShowChecklist(v=>!v)} style={{ marginLeft:"auto",background:"#1084d0",color:"white",border:"none",borderRadius:4,padding:"2px 10px",cursor:"pointer",fontSize:11,fontFamily:"Tahoma,sans-serif" }}>📋 Checklist (T)</button>
      </div>

      <PageHeader title="Services" subtitle={`${total} total services`} actions={<>
        <div className="flex rounded-xl p-1 gap-1" style={{ background:"var(--bg-secondary)",border:"1px solid var(--border-primary)" }}>
          <button className={`p-2 rounded-lg transition-all ${view==="kanban"?"gradient-brand text-white shadow-sm":"btn-ghost"}`} onClick={()=>setView("kanban")} title="Kanban (K)"><LayoutGrid size={16}/></button>
          <button className={`p-2 rounded-lg transition-all ${view==="list"?"gradient-brand text-white shadow-sm":"btn-ghost"}`} onClick={()=>setView("list")} title="List (L)"><List size={16}/></button>
          <button className={`p-2 rounded-lg transition-all ${view==="calendar"?"gradient-brand text-white shadow-sm":"btn-ghost"}`} onClick={()=>setView("calendar")} title="Calendar (C)"><Calendar size={16}/></button>
        </div>
        <button className="btn-primary" onClick={()=>setIsNewOpen(true)} title="N"><Plus size={16}/> New Service</button>
        <button onClick={handleCloseDay} className="legacy-button" style={{ padding:"6px 10px",fontSize:12,display:"flex",alignItems:"center",gap:4,background:"#006600",color:"white" }}><CheckSquare size={14}/> Close Day</button>
        <button onClick={()=>handleExportExcel()} className="legacy-button" style={{ padding:"6px 10px",fontSize:12,display:"flex",alignItems:"center",gap:4 }} title="E"><Download size={14}/> Export</button>
        <button onClick={handleWASummary} className="legacy-button" style={{ padding:"6px 10px",fontSize:12,display:"flex",alignItems:"center",gap:4,background:"#25D366",color:"white" }} title="W"><MessageCircle size={14}/> Summary</button>
        <label style={{ display:"flex",alignItems:"center",gap:4,fontSize:11,cursor:"pointer",fontFamily:"Tahoma,sans-serif" }}>
          <input type="checkbox" checked={autoWA} onChange={e=>{setAutoWA(e.target.checked);lsSet("ra_auto_wa",e.target.checked);}} style={{ width:12,height:12 }}/>
          Auto WA
        </label>
        <button onClick={()=>setShowShortcuts(true)} className="legacy-button" style={{ padding:"6px 8px",fontSize:12 }} title="?"><Keyboard size={14}/></button>
        <button className="legacy-button" style={{ padding:"6px 12px",fontSize:12,display:"flex",alignItems:"center",gap:6,background:liveToken?"#008000":"#d4d0c8",color:liveToken?"white":"black" }} onClick={callNextToken} disabled={callingNext}>
          {callingNext?<Loader2 size={14} className="animate-spin"/>:"🔔"} {liveToken||"Call Next"}
        </button>
        <a href="/display" target="_blank" rel="noopener noreferrer" className="legacy-button" style={{ padding:"6px 12px",fontSize:12,display:"flex",alignItems:"center",gap:6 }}>🖥️ Display Board</a>
      </>}/>

      {/* Search */}
      <div className="toolbar">
        <div className="search-field" style={{ flex:1 }}>
          <Search size={14}/>
          <input ref={searchRef} type="text" placeholder="Search by name, mobile, service, tracking ID... (/)" className="input-field" value={query} onChange={e=>setQuery(e.target.value)}/>
        </div>
      </div>

      {/* Mini Filter Chips */}
      <div style={{ display:"flex",flexWrap:"wrap",gap:6,padding:"8px 0 6px",alignItems:"center" }}>
        {QUICK_FILTERS.map(f=>{
          const isActive=quickFilter===f.key;
          const count=f.key==="UNPAID"?baseFiltered.filter(s=>s.paymentStatus==="UNPAID").length:f.key==="DUE_TODAY"?baseFiltered.filter(s=>s.deadline&&new Date(s.deadline)>=todayStart&&new Date(s.deadline)<=todayEnd).length:f.key==="ALL"?undefined:baseFiltered.filter(s=>s.status===f.key).length;
          return (
            <button key={f.key} onClick={()=>setQuickFilter(f.key)} style={{ padding:"4px 12px",borderRadius:20,fontSize:12,fontWeight:isActive?"bold":"normal",background:isActive?f.color:f.bg,color:isActive?"white":f.color,border:`1px solid ${f.color}`,cursor:"pointer",transition:"all 0.15s" }}>
              {f.label}{count!==undefined&&<span style={{ marginLeft:4,opacity:0.75 }}>({count})</span>}
            </button>
          );
        })}
        <button onClick={handleBulkWA} style={{ padding:"4px 12px",borderRadius:20,fontSize:12,background:"#25D366",color:"white",border:"1px solid #1da851",cursor:"pointer",marginLeft:"auto" }}>📱 Remind All</button>
      </div>

      {/* Saved Filters */}
      {(savedFilters.length>0||showSaveFilter)&&(
        <div style={{ display:"flex",flexWrap:"wrap",gap:6,padding:"4px 0 8px",alignItems:"center",borderBottom:"1px solid var(--border-primary)",marginBottom:6 }}>
          <span style={{ fontSize:11,color:"var(--text-muted)",fontWeight:"bold" }}>💾 Saved:</span>
          {savedFilters.map((f,i)=>(
            <div key={i} style={{ display:"flex",alignItems:"center",gap:0 }}>
              <button onClick={()=>{setQuickFilter(f.filter);setQuery(f.query);}} style={{ padding:"3px 8px",borderRadius:"4px 0 0 4px",fontSize:11,background:"#e3f0ff",color:"#000080",border:"1px solid #adc6ff",cursor:"pointer" }}>{f.name}</button>
              <button onClick={()=>handleDeleteFilter(i)} style={{ padding:"3px 5px",borderRadius:"0 4px 4px 0",fontSize:11,background:"#fff1f0",color:"#cf1322",border:"1px solid #ffa39e",borderLeft:"none",cursor:"pointer" }}>×</button>
            </div>
          ))}
          {showSaveFilter?(
            <>
              <input value={saveFilterName} onChange={e=>setSaveFilterName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSaveFilter()} placeholder="Filter naam..." style={{ fontSize:11,padding:"3px 8px",border:"1px solid #aaa",borderRadius:4,width:110 }} autoFocus/>
              <button onClick={handleSaveFilter} style={{ padding:"3px 10px",fontSize:11,background:"#000080",color:"white",border:"none",borderRadius:4,cursor:"pointer" }}>Save</button>
              <button onClick={()=>setShowSaveFilter(false)} style={{ padding:"3px 6px",fontSize:11,background:"none",border:"none",cursor:"pointer" }}>✕</button>
            </>
          ):(
            <button onClick={()=>setShowSaveFilter(true)} style={{ padding:"3px 8px",borderRadius:4,fontSize:11,background:"var(--bg-secondary)",color:"var(--text-muted)",border:"1px solid var(--border-primary)",cursor:"pointer" }}>+ Save Current Filter</button>
          )}
        </div>
      )}
      {!savedFilters.length&&!showSaveFilter&&(
        <button onClick={()=>setShowSaveFilter(true)} style={{ padding:"3px 8px",borderRadius:4,fontSize:11,background:"var(--bg-secondary)",color:"var(--text-muted)",border:"1px solid var(--border-primary)",cursor:"pointer",marginBottom:6,width:"fit-content" }}>💾 Save Current Filter</button>
      )}

      {/* Bulk Actions */}
      {selectedIds.size>0&&view==="list"&&(
        <div className="flex items-center gap-3 p-3 mb-4 rounded" style={{ background:"#000080",color:"white" }}>
          <span className="font-semibold text-sm">{selectedIds.size} selected</span>
          <select className="input-field" style={{ width:150,color:"black" }} value={bulkStatus} onChange={e=>setBulkStatus(e.target.value)}>
            <option value="">Change Status...</option>
            {STATUS_ORDER.map(s=><option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
          <button className="legacy-button" style={{ fontWeight:"bold" }} onClick={handleBulkUpdate} disabled={!bulkStatus||isBulkUpdating}>{isBulkUpdating?"Updating...":"Apply"}</button>
          <button onClick={()=>filtered.filter(s=>selectedIds.has(s.id)).forEach((s,i)=>setTimeout(()=>{ const msg=encodeURIComponent(`नमस्ते ${s.customer.name},\nStatus: *${STATUS_LABELS[s.status]}*\n— RA Seva Point`); window.open(`https://wa.me/91${s.customer.mobile.replace(/\D/g,"").slice(-10)}?text=${msg}`,"_blank"); },i*600))} style={{ padding:"4px 10px",background:"#25D366",color:"white",border:"none",borderRadius:4,cursor:"pointer",fontSize:12 }}>📱 WA All</button>
        </div>
      )}

      {/* Content */}
      {loading?(
        <div className="flex items-center justify-center h-48"><Loader2 size={28} className="animate-spin" style={{ color:"var(--brand-primary)" }}/></div>
      ):filtered.length===0?(
        <div className="empty-state">
          <Briefcase size={56} className="empty-state-icon"/>
          <div className="empty-state-title">No services found</div>
          <div className="empty-state-desc">Add first service or change filter</div>
          <button className="btn-primary mt-4" onClick={()=>setIsNewOpen(true)}><Plus size={16}/> New Service</button>
        </div>
      ):view==="kanban"?(
        <KanbanBoard services={filtered} onSelect={s=>{setSelectedService(s);setIsDetailsOpen(true);}} onStatusChange={handleStatusChange} onContextMenu={(e,s)=>setContextMenu({x:e.clientX,y:e.clientY,service:s})}
          cardColors={cardColors} cardStars={cardStars} pinnedCards={pinnedCards}
          onColorChange={handleColorChange} onStarChange={handleStarChange} onTogglePin={handleTogglePin}
          onColumnExport={status=>handleExportExcel(status)}/>
      ):view==="calendar"?(
        <CalendarView services={filtered} onSelect={s=>{setSelectedService(s);setIsDetailsOpen(true);}}/>
      ):(
        <div className="table-wrapper">
          <table className="data-table">
            <thead><tr>
              <th style={{ width:40 }}><input type="checkbox" checked={filtered.length>0&&selectedIds.size===filtered.length} onChange={toggleAll}/></th>
              <th>Customer</th><th>Service</th><th>Status</th><th>Payment</th><th>Fees</th><th>Stars</th><th>Age</th><th>Date</th><th></th>
            </tr></thead>
            <tbody>
              {filtered.map(s=>{
                const daysOld=getDaysOld(s.createdAt); const isStalled=daysOld>5&&["PROCESSING","SUBMITTED"].includes(s.status);
                const stars=cardStars[s.id]||0; const cardColor=cardColors[s.id]||"" as CardColor;
                return (
                  <tr key={s.id} className={`cursor-pointer ${selectedIds.has(s.id)?"bg-blue-50":""}`}
                    style={{ background:isStalled?"#faf0ff":undefined,borderLeft:cardColor?`4px solid ${cardColor==="red"?"#cf1322":cardColor==="blue"?"#000080":cardColor==="green"?"#006600":"#d4b800"}`:"" }}
                    onClick={()=>{setSelectedService(s);setIsDetailsOpen(true);}}
                    onContextMenu={e=>{e.preventDefault();setContextMenu({x:e.clientX,y:e.clientY,service:s});}}>
                    <td onClick={e=>toggleSelection(s.id,e)}><input type="checkbox" checked={selectedIds.has(s.id)} onChange={()=>{}}/></td>
                    <td><div className="font-semibold text-sm" style={{ color:"var(--text-primary)" }}>{s.customer.name}{pinnedCards.has(s.id)&&<span style={{ marginLeft:4,fontSize:10 }}>📌</span>}</div><div className="text-xs" style={{ color:"var(--text-muted)" }}>{s.customer.mobile}</div></td>
                    <td className="text-sm" style={{ color:"var(--text-secondary)" }}>{s.serviceType}</td>
                    <td><span className={`badge ${SERVICE_STATUS_COLORS[s.status]}`}>{s.status}</span>{isStalled&&<span style={{ marginLeft:4,fontSize:9,background:"#f9f0ff",color:"#722ed1",padding:"1px 3px",borderRadius:2 }}>🔴 Stalled</span>}</td>
                    <td><span className={`badge ${PAYMENT_STATUS_COLORS[s.paymentStatus]}`}>{s.paymentStatus}</span></td>
                    <td className="font-semibold text-sm" style={{ color:"var(--text-primary)" }}>{formatCurrency(s.fees)}{(s.fees===0||daysOld>10)&&<span style={{ marginLeft:4,fontSize:9,color:"#cf1322" }}>💸</span>}</td>
                    <td style={{ color:"#d4b800",fontSize:12 }}>{"★".repeat(stars)}{"☆".repeat(3-stars)}</td>
                    <td className="text-sm" style={{ color:daysOld>7?"#cf1322":"var(--text-muted)",fontWeight:daysOld>7?"bold":"normal" }}>{daysOld}d</td>
                    <td className="text-sm" style={{ color:"var(--text-muted)" }}>{formatDate(s.createdAt)}</td>
                    <td><ChevronRight size={16} style={{ color:"var(--text-muted)" }}/></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu&&<ContextMenu ctx={contextMenu} onClose={()=>setContextMenu(null)} onStatusChange={handleStatusChange} onOpenDetails={s=>{setSelectedService(s);setIsDetailsOpen(true);setContextMenu(null);}}/>}

      {/* Shortcuts */}
      {showShortcuts&&<ShortcutsHelp onClose={()=>setShowShortcuts(false)}/>}

      {/* Checklist */}
      {showChecklist&&<DailyChecklist onClose={()=>setShowChecklist(false)}/>}

      {/* Confetti */}
      {confetti!==null&&<Confetti milestone={confetti} onDone={()=>setConfetti(null)}/>}

      {/* Analytics Panel */}
      <ServicesAnalyticsPanel services={services} dailyRevenue={dailyRevenue} dailyTarget={dailyTarget} onTargetChange={t=>{setDailyTarget(t);lsSet("ra_daily_target",t);}} isOpen={showAnalytics} onToggle={()=>setShowAnalytics(v=>!v)} completionRate={completionRate} topCustomers={topCustomers} streak={streak}/>

      {/* Footer Analytics Bar */}
      <div style={{ position:"fixed",bottom:0,left:0,right:0,zIndex:9000,background:"var(--bg-secondary)",borderTop:"1px solid var(--border-primary)",padding:"5px 16px",display:"flex",alignItems:"center",gap:16,fontSize:12,color:"var(--text-muted)",fontFamily:"Tahoma,sans-serif" }}>
        <div style={{ display:"flex",alignItems:"center",gap:4 }}><Briefcase size={12}/><strong style={{ color:"var(--text-primary)" }}>{total}</strong> Total</div>
        <div style={{ display:"flex",alignItems:"center",gap:4,color:"#d46b08" }}><IndianRupee size={12}/> Unpaid: <strong>₹{totalUnpaid.toLocaleString("en-IN")}</strong></div>
        {dueTodayCount>0&&<div style={{ display:"flex",alignItems:"center",gap:4,color:"#1d39c4" }}><Clock size={12}/> Due Today: <strong>{dueTodayCount}</strong></div>}
        {overdueCount>0&&<div style={{ display:"flex",alignItems:"center",gap:4,color:"#cf1322" }}><AlertTriangle size={12}/> Overdue: <strong>{overdueCount}</strong></div>}
        {stalledCount>0&&<div style={{ display:"flex",alignItems:"center",gap:4,color:"#722ed1" }}><TrendingDown size={12}/> Stalled: <strong>{stalledCount}</strong></div>}
        {selectedIds.size>0&&<div style={{ color:"var(--brand-primary)",fontWeight:"bold" }}>✓ {selectedIds.size} selected</div>}
        <div style={{ marginLeft:"auto",fontSize:11 }}>Showing {filtered.length}/{services.length} &nbsp;|&nbsp;
          <button onClick={()=>setShowShortcuts(true)} style={{ background:"none",border:"none",cursor:"pointer",color:"var(--text-muted)",fontSize:11,fontFamily:"Tahoma,sans-serif" }}>⌨ Shortcuts (?)</button>
        </div>
      </div>

      <NewServiceDialog isOpen={isNewOpen} onClose={()=>setIsNewOpen(false)} onSuccess={fetchServices}/>
      <ServiceDetailsDialog isOpen={isDetailsOpen} onClose={()=>{setIsDetailsOpen(false);setSelectedService(null);}} serviceId={selectedService?.id||null} onSuccess={(shouldClose = true)=>{fetchServices(); if(shouldClose){setIsDetailsOpen(false);setSelectedService(null);}}}/>
    </div>
  );
}
