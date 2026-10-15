"use client";
import { useState } from "react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState("");

  async function submit() {
    setMessage("");
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setMessage(data.message);
  }

  return (
    <main className="min-h-screen bg-white text-black p-5 max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Log in</h1>

      <label className="block text-xl font-semibold mb-1">Email</label>
      <input
        type="email"
        className="w-full border-2 border-black rounded-lg p-4 text-xl mb-4"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <label className="block text-xl font-semibold mb-1">Password</label>
      <div className="flex gap-2 mb-6">
        <input
          type={show ? "text" : "password"}
          className="flex-1 border-2 border-black rounded-lg p-4 text-xl"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          onClick={() => setShow(!show)}
          className="bg-black text-white text-lg font-bold rounded-lg px-4"
        >
          {show ? "Hide" : "Show"}
        </button>
      </div>

      <button
        onClick={submit}
        disabled={!email || !password}
        className="w-full bg-green-700 text-white text-2xl font-bold rounded-lg p-4 disabled:bg-gray-400"
      >
        Log in
      </button>

      {message && <p className="text-lg mt-4 font-semibold">{message}</p>}

      <p className="text-lg mt-6">
        No account yet? <a href="/signup" className="underline font-bold">Sign up</a>
      </p>
    </main>
  );
}