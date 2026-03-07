import React, { useState } from "react";
import Card from "./ui/Card.jsx";
import Input from "./ui/Input.jsx";
import Button from "./ui/Button.jsx";

export default function AuthCard({ onLogin, onRegister, status }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");

  async function submit() {
    if (mode === "login") return onLogin({ email, password });
    return onRegister({ email, password, full_name: fullName || null });
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div className="text-base font-black">{mode === "login" ? "Welcome back" : "Create account"}</div>
        <Button variant="secondary" onClick={() => setMode(mode === "login" ? "register" : "login")}>
          {mode === "login" ? "Register" : "Login"}
        </Button>
      </div>

      <div className="mt-5 space-y-3">
        <Input placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} />
        {mode === "register" ? (
          <Input placeholder="Full name (optional)" value={fullName} onChange={(e)=>setFullName(e.target.value)} />
        ) : null}
        <Input placeholder="Password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />
        <Button onClick={submit} className="w-full">Continue</Button>
        {status ? <div className="text-xs text-white/70">{status}</div> : null}
      </div>
    </Card>
  );
}
