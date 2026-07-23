"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { X, Key } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid username or password. Please try again.");
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="legacy-tab-content" style={{ 
      minHeight: '100vh', 
      width: '100%', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      backgroundColor: '#008080', 
      fontFamily: "'Tahoma', 'MS Sans Serif', sans-serif" 
    }}>
      <div style={{
          width: '450px',
          backgroundColor: '#d4d0c8',
          borderTop: '2px solid #fff',
          borderLeft: '2px solid #fff',
          borderRight: '2px solid #404040',
          borderBottom: '2px solid #404040',
          boxShadow: '1px 1px 4px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          fontSize: '11px',
          color: 'black'
      }}>
        {/* Title Bar */}
        <div style={{
            background: 'linear-gradient(to right, #0a246a 0%, #a6caf0 100%)',
            color: 'white',
            fontWeight: 'bold',
            padding: '3px 2px 3px 4px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            userSelect: 'none',
            margin: '2px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Key size={14} color="#ffd700" style={{ filter: 'drop-shadow(1px 1px 1px #000)' }} />
            Enter Network Password
          </div>
          <div style={{ display: 'flex', gap: '2px' }}>
            <button className="legacy-btn-close" type="button" onClick={() => {}} title="Close">
              <X size={12} strokeWidth={3} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div style={{ padding: '16px', display: 'flex', gap: '16px' }}>
          
          <div style={{ width: '48px', display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #008080, #004040)', border: '2px solid #fff', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Key size={20} color="#ffd700" />
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: '16px', fontSize: '11px' }}>
              Type your user name and password to log on to the RA Seva Point network.
            </div>

            {error && (
              <div style={{ marginBottom: '12px', padding: '4px 8px', backgroundColor: '#ffcccc', border: '1px solid #cc0000', color: '#cc0000', fontSize: '11px' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* Username */}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <label style={{ width: '90px' }}>User name:</label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{ flex: 1 }}
                />
              </div>

              {/* Password */}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <label style={{ width: '90px' }}>Password:</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ flex: 1 }}
                />
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                <button
                  type="submit"
                  disabled={loading}
                  className="legacy-button"
                  style={{ width: '80px', fontWeight: 'bold' }}
                >
                  {loading ? "Please wait" : "OK"}
                </button>
                <button
                  type="button"
                  className="legacy-button"
                  style={{ width: '80px' }}
                  onClick={() => { setEmail(""); setPassword(""); setError(""); }}
                >
                  Cancel
                </button>
              </div>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
