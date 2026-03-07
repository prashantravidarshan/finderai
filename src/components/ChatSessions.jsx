import React from "react";
import Card from "./ui/Card.jsx";
import Button from "./ui/Button.jsx";
import Select from "./ui/Select.jsx";

export default function ChatSessions({ conversations, activeId, onSelect, onNew, onTestOpenAI, onLogout }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div className="text-sm font-bold tracking-wide">Chats</div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onTestOpenAI}>Test OpenAI</Button>
          <Button variant="secondary" onClick={onNew}>New</Button>
          <Button variant="secondary" onClick={onLogout}>Logout</Button>
        </div>
      </div>

      <div className="mt-3 grid gap-2">
        <Select value={activeId || ""} onChange={(e)=>onSelect(e.target.value || null)}>
          <option value="">(current)</option>
          {(conversations || []).map((c) => (
            <option key={c.conversation_id} value={c.conversation_id}>
              {c.conversation_id.slice(0, 8)}… · {c.last_time}
            </option>
          ))}
        </Select>
        <div className="text-xs text-white/50">
          Dropdown me old chats reopen kar sakte ho.
        </div>
      </div>
    </Card>
  );
}
