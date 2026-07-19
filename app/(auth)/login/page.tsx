"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

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
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f7f9fc] font-sans">
      <div className="w-full max-w-[500px] bg-white p-8 shadow-sm border border-gray-200">
        
        {/* Header */}
        <div className="border-b border-gray-200 pb-2 mb-2">
          <h1 className="text-[26px] text-gray-800 font-medium">Login</h1>
        </div>
        
        {/* Mandatory Text */}
        <div className="flex justify-end mb-6">
          <div className="flex items-center text-sm text-gray-700">
            <span className="w-1.5 h-1.5 bg-red-600 rounded-full mr-1.5 inline-block"></span>
            indicates mandatory fields
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          
          {/* Username */}
          <div className="mb-5">
            <label className="flex items-center text-[15px] text-gray-800 mb-1.5">
              Username 
              <span className="w-1.5 h-1.5 bg-red-600 rounded-full ml-1 inline-block"></span>
            </label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter Username"
              className="w-full px-3 py-2.5 bg-white border border-gray-300 text-[15px] text-gray-800 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 shadow-sm"
            />
          </div>

          {/* Password */}
          <div className="mb-6">
            <label className="flex items-center text-[15px] text-gray-800 mb-1.5">
              Password
              <span className="w-1.5 h-1.5 bg-red-600 rounded-full ml-1 inline-block"></span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter Password"
              className="w-full px-3 py-2.5 bg-white border border-gray-300 text-[15px] text-gray-800 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 shadow-sm"
            />
          </div>

          {/* Login Button */}
          <div className="mb-6">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-2.5 bg-[#2c497f] hover:bg-[#203a68] text-white font-medium text-[15px] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? "LOGGING IN..." : "LOGIN"}
            </button>
          </div>

          {/* Footer Links */}
          <div className="flex items-center justify-between mt-8 pt-4">
            <button type="button" className="text-[#2575b6] hover:underline text-[15px]">
              Forgot Username
            </button>
            <button type="button" className="text-[#2575b6] hover:underline text-[15px]">
              Forgot Password
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
