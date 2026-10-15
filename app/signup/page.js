"use client";
import { useState } from "react";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState("");

  const strong =
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password);

  async function submit() {
    setMessage("");
    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    setMessage(data.message);
    if (res.ok) {
      setName(""); setEmail(""); setPassword("");
    }
  }

  return (
    <main className="min-h-screen bg-white text-black p-5 max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Create account</h1>

      <label className="block text-xl font-semibold mb-1">Name</label>
      <input
        className="w-full border-2 border-black rounded-lg p-4 text-xl mb-4"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <label className="block text-xl font-semibold mb-1">Email</label>
      <input
        type="email"
        className="w-full border-2 border-black rounded-lg p-4 text-xl mb-4"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <label className="block text-xl font-semibold mb-1">Password</label>
      <div className="flex gap-2 mb-1">
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

      <p className="text-lg mb-4">
        {password === ""
          ? "Use 8+ characters, 1 capital letter, 1 number."
          : strong
          ? "✅ Strong password"
          : "❌ Weak — add 8+ chars, 1 capital, 1 number."}
      </p>

      <button
        onClick={submit}
        disabled={!name || !email || !strong}
        className="w-full bg-green-700 text-white text-2xl font-bold rounded-lg p-4 disabled:bg-gray-400"
      >
        Sign up
      </button>

      {message && <p className="text-lg mt-4 font-semibold">{message}</p>}

      <p className="text-lg mt-6">
        Already have an account? <a href="/login" className="underline font-bold">Log in</a>
      </p>
    </main>
  );
}