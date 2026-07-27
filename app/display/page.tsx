"use client";
import { useState, useEffect } from "react";

interface QueueItem {
  id: string;
  tokenNumber: number;
  status: string;
  serviceType: string;
  customer: { name: string };
  createdAt: string;
}

interface QueueData {
  serving: QueueItem | null;
  waiting: QueueItem[];
  totalPending: number;
  estimatedWaitMinutes: number;
}

export default function DisplayPage() {
  const [queue, setQueue] = useState<QueueData>({ serving: null, waiting: [], totalPending: 0, estimatedWaitMinutes: 0 });
  const [time, setTime] = useState(new Date());
  const [blink, setBlink] = useState(true);

  const fetchQueue = async () => {
    try {
      const res = await fetch('/api/kiosk/queue');
      const data = await res.json();
      setQueue(data);
    } catch {}
  };

  useEffect(() => {
    fetchQueue();
    const queueTimer = setInterval(fetchQueue, 5000); // refresh every 5s
    const clockTimer = setInterval(() => setTime(new Date()), 1000);
    const blinkTimer = setInterval(() => setBlink(b => !b), 800);
    return () => { clearInterval(queueTimer); clearInterval(clockTimer); clearInterval(blinkTimer); };
  }, []);

  const tokenLabel = (n: number) => `T${String(n).padStart(3, '0')}`;

  const raised: React.CSSProperties = {
    borderTop: '3px solid #ffffff',
    borderLeft: '3px solid #ffffff',
    borderRight: '3px solid #404040',
    borderBottom: '3px solid #404040',
  };
  const inset: React.CSSProperties = {
    borderTop: '3px solid #404040',
    borderLeft: '3px solid #404040',
    borderRight: '3px solid #ffffff',
    borderBottom: '3px solid #ffffff',
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#008080', fontFamily: 'Tahoma, sans-serif' }}>

      {/* Title Bar */}
      <div style={{ background: 'linear-gradient(to right, #000080, #1084d0)', padding: '8px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ color: 'white', fontWeight: 'bold', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>🏪</span> RA Seva Point — Live Queue Display
        </div>
        <div style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', letterSpacing: '2px' }}>
          {time.toLocaleTimeString()}
        </div>
      </div>

      <div className="flex-1 p-6 flex flex-col gap-6">

        {/* NOW SERVING */}
        <div style={{ background: '#d4d0c8', ...raised }}>
          <div style={{ background: 'linear-gradient(to right, #008000, #00a000)', padding: '6px 12px' }}>
            <span style={{ color: 'white', fontWeight: 'bold', fontSize: '16px', letterSpacing: '2px', textTransform: 'uppercase' }}>
              🔔 Now Serving
            </span>
          </div>
          <div style={{ padding: '20px', textAlign: 'center' }}>
            {queue.serving ? (
              <>
                <div style={{
                  fontSize: '100px', fontFamily: 'Courier New, monospace', fontWeight: 'bold',
                  color: blink ? '#000080' : '#003080',
                  lineHeight: 1, textShadow: '4px 4px 0px rgba(0,0,0,0.15)',
                  transition: 'color 0.2s'
                }}>
                  {tokenLabel(queue.serving.tokenNumber)}
                </div>
                <div style={{ fontSize: '20px', color: '#333', marginTop: '8px' }}>
                  {queue.serving.customer.name} — {queue.serving.serviceType}
                </div>
              </>
            ) : (
              <div style={{ fontSize: '40px', color: '#888', padding: '20px' }}>
                — No Active Token —
              </div>
            )}
          </div>
        </div>

        {/* NEXT IN QUEUE */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
          {queue.waiting.slice(0, 8).map((item, i) => (
            <div key={item.id} style={{ background: '#d4d0c8', ...raised, padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
                {i === 0 ? '👉 Next' : `#${i + 1}`}
              </div>
              <div style={{ fontSize: '36px', fontFamily: 'Courier New', fontWeight: 'bold', color: i === 0 ? '#008000' : '#404040' }}>
                {tokenLabel(item.tokenNumber)}
              </div>
              <div style={{ fontSize: '11px', color: '#666', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.serviceType}
              </div>
            </div>
          ))}

          {queue.waiting.length === 0 && !queue.serving && (
            <div style={{ gridColumn: '1/-1', background: '#d4d0c8', ...raised, padding: '24px', textAlign: 'center', color: '#888' }}>
              Queue is empty. No pending requests.
            </div>
          )}
        </div>

        {/* Stats Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {[
            { label: 'Waiting', value: queue.totalPending, color: '#000080' },
            { label: 'Est. Wait', value: `~${queue.estimatedWaitMinutes} min`, color: '#885500' },
            { label: 'Auto-Refresh', value: '5s', color: '#008000' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: '#d4d0c8', ...raised, padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color }}>{value}</div>
              <div style={{ fontSize: '12px', color: '#555', textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</div>
            </div>
          ))}
        </div>

      </div>

      {/* Status Bar */}
      <div style={{ background: '#d4d0c8', borderTop: '2px solid #808080', padding: '3px 10px', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
        <span>RA Seva Point — Queue Management System</span>
        <span>Auto-refreshing every 5 seconds</span>
        <span>Display Board Mode</span>
      </div>
    </div>
  );
}
