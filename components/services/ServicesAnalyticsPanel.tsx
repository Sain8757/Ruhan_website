"use client";

import React, { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  RadialBarChart, RadialBar,
} from "recharts";

interface Service {
  id: string;
  serviceType: string;
  status: string;
  fees: number;
  paymentStatus: string;
  createdAt: string;
  deadline?: string | null;
  customer: { id: string; name: string; mobile: string };
}

interface DayRevenue { day: string; revenue: number; }
interface TopCustomer { name: string; count: number; total: number; }

interface Props {
  services: Service[];
  dailyRevenue: DayRevenue[];
  dailyTarget: number;
  onTargetChange: (t: number) => void;
  isOpen: boolean;
  onToggle: () => void;
  completionRate: number;
  topCustomers: TopCustomer[];
  streak: number;
}

const PIE_COLORS = [
  "#000080","#1084d0","#00596b","#006600","#722ed1",
  "#d46b08","#cf1322","#25D366","#fa8c16","#13c2c2",
];
const F: React.CSSProperties = { fontFamily: "Tahoma, sans-serif" };
const R: React.CSSProperties = {
  borderTop:"2px solid #fff",borderLeft:"2px solid #fff",
  borderRight:"2px solid #808080",borderBottom:"2px solid #808080",
};

// ─── Revenue Bar Chart ────────────────────────────────────────────────────────
function RevenueChart({ data }: { data: DayRevenue[] }) {
  return (
    <div style={F}>
      <div style={{ fontWeight:"bold",fontSize:12,marginBottom:8,color:"#000080" }}>📈 Last 7 Days Revenue</div>
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={data} margin={{ top:2,right:4,left:-20,bottom:0 }}>
          <XAxis dataKey="day" tick={{ fontSize:10 }} />
          <YAxis tick={{ fontSize:10 }} />
          <Tooltip formatter={(v) => [`₹${Number(v||0).toLocaleString("en-IN")}`, "Revenue"]} contentStyle={{ fontSize:11 }} />
          <Bar dataKey="revenue" fill="#000080" radius={[3,3,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Pie Chart ────────────────────────────────────────────────────────────────
function ServiceTypePie({ services }: { services: Service[] }) {
  const data = useMemo(() => {
    const counts: Record<string, number> = {};
    services.forEach(s => { counts[s.serviceType] = (counts[s.serviceType]||0)+1; });
    return Object.entries(counts).map(([name,value]) => ({ name,value })).sort((a,b) => b.value-a.value).slice(0,8);
  }, [services]);
  if (!data.length) return null;
  return (
    <div style={F}>
      <div style={{ fontWeight:"bold",fontSize:12,marginBottom:8,color:"#000080" }}>🗂️ Service Mix</div>
      <ResponsiveContainer width="100%" height={150}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" outerRadius={55} dataKey="value"
            label={({ name,percent }) => `${(name??"").slice(0,9)} ${((percent??0)*100).toFixed(0)}%`}
            labelLine={false} fontSize={9}>
            {data.map((_,i) => <Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]} />)}
          </Pie>
          <Tooltip contentStyle={{ fontSize:11 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Daily Target ─────────────────────────────────────────────────────────────
function DailyTargetBar({ services, target, onTargetChange }: { services:Service[]; target:number; onTargetChange:(t:number)=>void; }) {
  const today = new Date().toDateString();
  const todayRevenue = services.filter(s => new Date(s.createdAt).toDateString()===today).reduce((sum,s) => sum+s.fees, 0);
  const pct = target>0 ? Math.min(100,Math.round((todayRevenue/target)*100)) : 0;
  const color = pct>=100?"#006600":pct>=60?"#d46b08":"#cf1322";
  return (
    <div style={F}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6 }}>
        <div style={{ fontWeight:"bold",fontSize:12,color:"#000080" }}>🎯 Daily Target</div>
        <div style={{ display:"flex",alignItems:"center",gap:4 }}>
          <span style={{ fontSize:10,color:"#555" }}>₹</span>
          <input type="number" value={target} min={0} onChange={e => onTargetChange(parseInt(e.target.value)||0)}
            style={{ width:65,fontSize:11,border:"1px solid #aaa",padding:"1px 4px" }} />
        </div>
      </div>
      <div style={{ background:"#aaa",height:16,position:"relative",overflow:"hidden",borderTop:"2px solid #808080",borderLeft:"2px solid #808080",borderRight:"2px solid #fff",borderBottom:"2px solid #fff" }}>
        <div style={{ background:color,width:`${pct}%`,height:"100%",transition:"width 0.5s" }} />
        <span style={{ position:"absolute",inset:0,textAlign:"center",fontSize:10,fontWeight:"bold",color:pct>40?"white":"#333",lineHeight:"16px" }}>
          ₹{todayRevenue.toLocaleString("en-IN")} / ₹{target.toLocaleString("en-IN")} ({pct}%)
        </span>
      </div>
    </div>
  );
}

// ─── Completion Rate Gauge ────────────────────────────────────────────────────
function CompletionGauge({ rate }: { rate: number }) {
  const color = rate>=80?"#006600":rate>=50?"#d46b08":"#cf1322";
  const data = [{ name:"done", value:rate, fill:color }, { name:"left", value:100-rate, fill:"#e0e0e0" }];
  return (
    <div style={F}>
      <div style={{ fontWeight:"bold",fontSize:12,marginBottom:4,color:"#000080" }}>✅ Completion Rate</div>
      <div style={{ display:"flex",alignItems:"center",gap:8 }}>
        <ResponsiveContainer width={80} height={80}>
          <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="100%" data={data} startAngle={180} endAngle={-180}>
            <RadialBar dataKey="value" />
          </RadialBarChart>
        </ResponsiveContainer>
        <div>
          <div style={{ fontSize:28,fontWeight:"bold",color,lineHeight:1 }}>{rate}%</div>
          <div style={{ fontSize:10,color:"#555" }}>services on time</div>
        </div>
      </div>
    </div>
  );
}

// ─── Top 5 Customers ──────────────────────────────────────────────────────────
function TopCustomers({ customers }: { customers: TopCustomer[] }) {
  if (!customers.length) return null;
  const max = customers[0]?.count || 1;
  return (
    <div style={F}>
      <div style={{ fontWeight:"bold",fontSize:12,marginBottom:8,color:"#000080" }}>🏆 Top Customers</div>
      <div style={{ display:"flex",flexDirection:"column",gap:4 }}>
        {customers.map((c,i) => (
          <div key={i} style={{ display:"flex",alignItems:"center",gap:6 }}>
            <span style={{ fontSize:11,minWidth:14,color:"#000080",fontWeight:"bold" }}>#{i+1}</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:11,fontWeight:"bold",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{c.name}</div>
              <div style={{ height:6,background:"#e0e0e0",marginTop:2,borderRadius:2 }}>
                <div style={{ height:"100%",background:["#000080","#1084d0","#00596b","#006600","#722ed1"][i],width:`${(c.count/max)*100}%`,borderRadius:2 }} />
              </div>
            </div>
            <div style={{ textAlign:"right",fontSize:10,color:"#555",flexShrink:0 }}>
              <div style={{ fontWeight:"bold" }}>{c.count} svc</div>
              <div>₹{c.total.toLocaleString("en-IN")}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Peak Heatmap ─────────────────────────────────────────────────────────────
function PeakHourHeatmap({ services }: { services: Service[] }) {
  const DAYS=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const SLOTS=["6-11am","11-2pm","2-5pm","5-9pm"];
  const grid = useMemo(() => {
    const counts:number[][] = Array.from({length:7},()=>Array(4).fill(0));
    services.forEach(s => {
      const d=new Date(s.createdAt); const day=d.getDay(); const hour=d.getHours();
      let slot=3;
      if(hour<11)slot=0; else if(hour<14)slot=1; else if(hour<17)slot=2;
      counts[day][slot]++;
    });
    return counts;
  },[services]);
  const maxVal=Math.max(...grid.flat(),1);
  const heat=(v:number)=>{
    const t=v/maxVal;
    if(t===0)return"#f5f5f5"; if(t<0.25)return"#c6e3f7"; if(t<0.5)return"#6baed6"; if(t<0.75)return"#2171b5"; return"#000080";
  };
  return (
    <div style={F}>
      <div style={{ fontWeight:"bold",fontSize:12,marginBottom:8,color:"#000080" }}>🔥 Peak Hours</div>
      <div style={{ display:"grid",gridTemplateColumns:"36px repeat(7,1fr)",gap:2 }}>
        <div/>{DAYS.map(d=><div key={d} style={{ textAlign:"center",fontSize:9,color:"#555",fontWeight:"bold" }}>{d}</div>)}
        {SLOTS.map((slot,si)=>(
          <React.Fragment key={slot}>
            <div style={{ fontSize:9,color:"#555",display:"flex",alignItems:"center" }}>{slot}</div>
            {DAYS.map((_,di)=>(
              <div key={di} title={`${DAYS[di]} ${slot}: ${grid[di][si]}`}
                style={{ background:heat(grid[di][si]),borderRadius:2,height:18,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:grid[di][si]>maxVal*0.5?"white":"#333" }}>
                {grid[di][si]>0?grid[di][si]:""}
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// ─── Daily Streak ─────────────────────────────────────────────────────────────
function StreakBadge({ streak }: { streak: number }) {
  return (
    <div style={{ ...F, display:"flex",alignItems:"center",gap:10,background:"#fffde7",border:"1px solid #f0c060",...R,padding:"8px 10px" }}>
      <div style={{ fontSize:28 }}>🔥</div>
      <div>
        <div style={{ fontSize:18,fontWeight:"bold",color:"#d46b08",lineHeight:1 }}>{streak} Days</div>
        <div style={{ fontSize:10,color:"#555" }}>Kaam ka streak</div>
      </div>
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────
export default function ServicesAnalyticsPanel({ services, dailyRevenue, dailyTarget, onTargetChange, isOpen, onToggle, completionRate, topCustomers, streak }: Props) {
  if (!isOpen) {
    return (
      <button onClick={onToggle}
        style={{ position:"fixed",right:16,top:80,zIndex:8000,background:"#000080",color:"white",border:"none",borderRadius:"50%",width:40,height:40,cursor:"pointer",fontSize:18,boxShadow:"0 4px 12px rgba(0,0,128,0.35)",display:"flex",alignItems:"center",justifyContent:"center" }}
        title="Analytics Panel (A)">📊</button>
    );
  }
  return (
    <div style={{ position:"fixed",right:0,top:0,bottom:0,width:280,zIndex:8000,background:"#d4d0c8",borderLeft:"3px solid #808080",borderTop:"3px solid #fff",overflowY:"auto",display:"flex",flexDirection:"column",gap:12,padding:"10px 10px 60px",...F }}>
      <div style={{ background:"linear-gradient(to right,#000080,#1084d0)",color:"white",padding:"5px 8px",display:"flex",justifyContent:"space-between",alignItems:"center",margin:"-10px -10px 0",flexShrink:0 }}>
        <span style={{ fontWeight:"bold",fontSize:12 }}>📊 Analytics Panel</span>
        <button onClick={onToggle} style={{ background:"#d4d0c8",...R,border:"none",width:18,height:18,cursor:"pointer",fontSize:11,fontWeight:"bold",lineHeight:1 }}>✕</button>
      </div>

      <StreakBadge streak={streak} />
      <hr style={{ border:"none",borderTop:"1px solid #808080" }} />
      <DailyTargetBar services={services} target={dailyTarget} onTargetChange={onTargetChange} />
      <hr style={{ border:"none",borderTop:"1px solid #808080" }} />
      <CompletionGauge rate={completionRate} />
      <hr style={{ border:"none",borderTop:"1px solid #808080" }} />
      <RevenueChart data={dailyRevenue} />
      <hr style={{ border:"none",borderTop:"1px solid #808080" }} />
      <TopCustomers customers={topCustomers} />
      <hr style={{ border:"none",borderTop:"1px solid #808080" }} />
      <ServiceTypePie services={services} />
      <hr style={{ border:"none",borderTop:"1px solid #808080" }} />
      <PeakHourHeatmap services={services} />
    </div>
  );
}
