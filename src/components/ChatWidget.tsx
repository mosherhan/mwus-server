"use client";
import { useState, useEffect, useRef } from "react";
import ProactiveHint from "./ProactiveHint";
// import LeadForm from "./LeadForm"; // ← THIS is the only new line vs old ChatWidget

interface Message { role: "user" | "assistant"; content: string; }

const WHATSAPP_NUMBER = "919999999999"; // ← change this to your number
const WHATSAPP_BASE = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hi! I found you through MakeWithUs and I'd like to know more.")}`;

const C = {
  bg:"#1a1a2e", surface:"#16213e", header:"#12122a", input:"#0d0d1f",
  accent:"#7c3aed", accentL:"#8b5cf6", white:"#ffffff",
  text:"rgba(255,255,255,0.88)", muted:"rgba(255,255,255,0.55)",
  border:"rgba(124,58,237,0.25)", wa:"#25D366",
};

const PAGE_SESSION = Math.random().toString(36).slice(2);

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

const WaIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

export default function ChatWidget() {
  const [isOpen,    setIsOpen]    = useState(false);
  const [messages,  setMessages]  = useState<Message[]>([]);
  const [input,     setInput]     = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping,  setIsTyping]  = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceOk,   setVoiceOk]   = useState(false);

  const messagesEndRef  = useRef<HTMLDivElement>(null);
  const inputRef        = useRef<HTMLInputElement>(null);
  const recognitionRef  = useRef<SpeechRecognition | null>(null);

  // ── Voice support check ──────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window !== "undefined" &&
      (window.SpeechRecognition || window.webkitSpeechRecognition)) {
      setVoiceOk(true);
    }
  }, []);

  // ── Session management: clear chat on fresh page load ───────────────────────
  useEffect(() => {
    const last = sessionStorage.getItem("mwu_session");
    if (last !== PAGE_SESSION) {
      sessionStorage.setItem("mwu_session", PAGE_SESSION);
      sessionStorage.removeItem("mwu_msgs");
      setMessages([]);
    } else {
      try {
        const s = sessionStorage.getItem("mwu_msgs");
        if (s) setMessages(JSON.parse(s));
      } catch { setMessages([]); }
    }
  }, []);

  // ── Persist messages within same session (dev hot reload) ───────────────────
  useEffect(() => {
    if (messages.length > 0)
      sessionStorage.setItem("mwu_msgs", JSON.stringify(messages));
  }, [messages]);

  // ── Auto-scroll to bottom on new messages ───────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // ── Focus input when chat opens ─────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 120);
  }, [isOpen]);

  // ── Voice input ─────────────────────────────────────────────────────────────
  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    recognitionRef.current = rec;
    rec.lang = "en-IN";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onstart  = () => setIsListening(true);
    rec.onresult = (e: SpeechRecognitionEvent) => {
      const t = e.results[0][0].transcript;
      setInput(p => p ? p + " " + t : t);
    };
    rec.onerror = () => setIsListening(false);
    rec.onend   = () => setIsListening(false);
    rec.start();
  };
  const stopListening = () => { recognitionRef.current?.stop(); setIsListening(false); };
  const toggleVoice   = () => { if (isListening) stopListening(); else startListening(); };

  // ── Send message ─────────────────────────────────────────────────────────────
  const sendMessage = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || isLoading) return;

  
    const userMsg: Message = { role: "user", content: msg };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setIsLoading(true);
    setIsTyping(true);

    try {
      const res  = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updated }),
      });
      const data = await res.json();
      setIsTyping(false);

      if (!res.ok) {
        setMessages(p => [...p, { role: "assistant", content: ` ${data.error || "Error"}` }]);
        return;
      }

      // Add AI reply to chat
      setMessages(p => [...p, { role: "assistant", content: data.reply }]);

     
    } catch {
      setIsTyping(false);
      setMessages(p => [...p, { role: "assistant", content: " Cannot connect. Is Ollama running?" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };



  const clearChat = () => {
    setMessages([]);
 
    sessionStorage.removeItem("mwu_msgs");
  };

  const prompts = [
    "What services do you offer?",
    "Tell me about your pricing",
    "How do I get started?",
  ];

  // ── RENDER ───────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Proactive hint bubble — shows after 4s idle */}
      <ProactiveHint onOpen={() => setIsOpen(true)} />

      {/* WhatsApp floating button */}
      <a href={WHATSAPP_BASE} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"
        style={{ position:"fixed", bottom:"102px", right:"24px", zIndex:9997, width:"48px", height:"48px", borderRadius:"50%", background:C.wa, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 16px rgba(37,211,102,0.45)", transition:"transform 0.2s", textDecoration:"none", color:"#fff" }}
        onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.1)")}
        onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}>
        <WaIcon size={26} />
      </a>

      {/* AI chat floating button */}
      <button onClick={() => setIsOpen(!isOpen)} aria-label="Toggle chat"
        style={{ position:"fixed", bottom:"24px", right:"24px", zIndex:9999, width:"54px", height:"54px", borderRadius:"50%", background:`linear-gradient(135deg,${C.accent},${C.accentL})`, border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 20px rgba(124,58,237,0.5)", transition:"transform 0.2s", fontSize:"20px", color:"#fff" }}
        onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(1.08)")}
        onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(1)")}>
        {isOpen ? "✕" : "✦"}
      </button>

      {/* Chat window */}
      {isOpen && (
        <div style={{ position:"fixed", bottom:"90px", right:"24px", zIndex:9998, width:"420px", height:"600px", borderRadius:"20px", background:C.surface, border:`1px solid ${C.border}`, display:"flex", flexDirection:"column", overflow:"hidden", boxShadow:"0 12px 48px rgba(0,0,0,0.55)" }}>

          {/* Header */}
          <div style={{ background:C.header, padding:"14px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
              <div style={{ width:"38px", height:"38px", borderRadius:"50%", background:`linear-gradient(135deg,${C.accent},${C.accentL})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"16px", color:"#fff", flexShrink:0 }}>✦</div>
              <div>
                <p style={{ margin:0, color:C.white, fontWeight:500, fontSize:"14px" }}>MakeWithUs AI</p>
                <div style={{ display:"flex", alignItems:"center", gap:"5px", marginTop:"2px" }}>
                  <span style={{ width:"6px", height:"6px", borderRadius:"50%", background:C.wa, display:"inline-block" }} />
                  <p style={{ margin:0, color:C.muted, fontSize:"11px" }}>
                    {isTyping ? "Typing..." : "Online"}
                  </p>
                </div>
              </div>
            </div>
            <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
              <a href={WHATSAPP_BASE} target="_blank" rel="noopener noreferrer"
                style={{ background:C.wa, border:"none", borderRadius:"8px", padding:"5px 10px", display:"flex", alignItems:"center", gap:"4px", fontSize:"11px", color:"#fff", fontWeight:500, textDecoration:"none", fontFamily:"inherit" }}>
                <WaIcon size={13} /> WhatsApp
              </a>
              <button onClick={clearChat}
                style={{ background:"rgba(255,255,255,0.07)", border:`1px solid ${C.border}`, color:C.muted, fontSize:"11px", cursor:"pointer", padding:"5px 10px", borderRadius:"8px", fontFamily:"inherit" }}>
                Clear
              </button>
            </div>
          </div>

          {/* Messages area */}
          <div style={{ flex:1, overflowY:"auto", padding:"16px", display:"flex", flexDirection:"column", gap:"12px", background:C.bg }}>

            {/* Empty state */}
            {messages.length === 0 && (
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", gap:"11px" }}>
                <div style={{ width:"54px", height:"54px", borderRadius:"50%", background:`linear-gradient(135deg,${C.accent},${C.accentL})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"24px", color:"#fff" }}>✦</div>
                <p style={{ margin:0, fontSize:"15px", fontWeight:500, color:C.white }}>Hey! How can I help you?</p>
                <p style={{ margin:0, fontSize:"12px", color:C.muted, textAlign:"center", lineHeight:1.6 }}>
                  Ask about services, pricing, or how<br />we can grow your business.
                </p>
                {voiceOk && <p style={{ margin:0, fontSize:"11px", color:C.accentL }}> Voice input supported — tap the mic to speak</p>}
                <div style={{ display:"flex", flexDirection:"column", gap:"7px", width:"100%", marginTop:"4px" }}>
                  {prompts.map(p => (
                    <button key={p} onClick={() => sendMessage(p)}
                      style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:"10px", padding:"10px 14px", fontSize:"13px", cursor:"pointer", color:C.text, textAlign:"left", fontFamily:"inherit", transition:"border-color 0.15s" }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = C.accentL)}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}>
                      {p}
                    </button>
                  ))}
                </div>
                <a href={WHATSAPP_BASE} target="_blank" rel="noopener noreferrer"
                  style={{ marginTop:"4px", display:"flex", alignItems:"center", gap:"6px", background:"rgba(37,211,102,0.1)", border:"1px solid rgba(37,211,102,0.3)", borderRadius:"10px", padding:"10px 14px", width:"100%", color:C.wa, fontSize:"13px", fontWeight:500, textDecoration:"none", fontFamily:"inherit", boxSizing:"border-box" }}>
                  <WaIcon size={15} /> Talk to us on WhatsApp
                </a>
              </div>
            )}

            {/* Message bubbles */}
            {messages.map((msg, i) => (
              <div key={i} style={{ display:"flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                {msg.role === "assistant" && (
                  <div style={{ width:"28px", height:"28px", borderRadius:"50%", background:`linear-gradient(135deg,${C.accent},${C.accentL})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"12px", color:"#fff", flexShrink:0, marginRight:"8px", marginTop:"2px" }}>✦</div>
                )}
                <div style={{ maxWidth:"78%", padding:"10px 14px", borderRadius: msg.role === "user" ? "14px 14px 3px 14px" : "14px 14px 14px 3px", background: msg.role === "user" ? `linear-gradient(135deg,${C.accent},${C.accentL})` : C.surface, color: msg.role === "user" ? "#fff" : C.text, fontSize:"13px", lineHeight:"1.65", border: msg.role === "assistant" ? `1px solid ${C.border}` : "none", whiteSpace:"pre-wrap" }}>
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Typing dots */}
            {isTyping && (
              <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                <div style={{ width:"28px", height:"28px", borderRadius:"50%", background:`linear-gradient(135deg,${C.accent},${C.accentL})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"12px", color:"#fff", flexShrink:0 }}>✦</div>
                <div style={{ padding:"10px 14px", borderRadius:"14px 14px 14px 3px", background:C.surface, border:`1px solid ${C.border}`, display:"flex", gap:"4px", alignItems:"center" }}>
                  {[0, 1, 2].map(n => (
                    <span key={n} style={{ width:"6px", height:"6px", borderRadius:"50%", background:C.accentL, display:"inline-block", animation:`mwuBounce 1.2s ease-in-out ${n * 0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            )}
           
            {/* Auto-scroll anchor */}
            <div ref={messagesEndRef} />
          </div>

          {/* Input bar */}
          <div style={{ padding:"12px 14px", background:C.header, borderTop:`1px solid ${C.border}`, display:"flex", gap:"8px", alignItems:"center", flexShrink:0 }}>
            {voiceOk && (
              <button onClick={toggleVoice} title={isListening ? "Stop" : "Speak"}
                style={{ width:"36px", height:"36px", borderRadius:"50%", border:"none", background: isListening ? "rgba(239,68,68,0.85)" : "rgba(124,58,237,0.2)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"background 0.2s", boxShadow: isListening ? "0 0 0 4px rgba(239,68,68,0.2)" : "none", animation: isListening ? "mwuPulse 1.2s ease-in-out infinite" : "none" }}>
                {isListening
                  ? <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><rect x="5" y="5" width="14" height="14" rx="2" /></svg>
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill={C.accentL}><path d="M12 1a4 4 0 0 1 4 4v7a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke={C.accentL} strokeWidth="2" fill="none" strokeLinecap="round" /><line x1="12" y1="19" x2="12" y2="23" stroke={C.accentL} strokeWidth="2" strokeLinecap="round" /><line x1="8" y1="23" x2="16" y2="23" stroke={C.accentL} strokeWidth="2" strokeLinecap="round" /></svg>
                }
              </button>
            )}
            <input ref={inputRef} type="text" value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={isListening ? " Listening..." : "Ask anything..."}
              disabled={isLoading}
              style={{ flex:1, border:`1px solid ${isListening ? "rgba(239,68,68,0.5)" : C.border}`, borderRadius:"22px", padding:"9px 15px", fontSize:"13px", outline:"none", background:C.input, color:C.white, fontFamily:"inherit", transition:"border-color 0.15s" }}
              onFocus={e => (e.currentTarget.style.borderColor = C.accentL)}
              onBlur={e  => (e.currentTarget.style.borderColor = isListening ? "rgba(239,68,68,0.5)" : C.border)}
            />
            <button onClick={() => sendMessage()} disabled={isLoading || !input.trim()}
              style={{ width:"36px", height:"36px", borderRadius:"50%", background: isLoading || !input.trim() ? "rgba(124,58,237,0.25)" : `linear-gradient(135deg,${C.accent},${C.accentL})`, border:"none", cursor: isLoading || !input.trim() ? "not-allowed" : "pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"15px", color:"#fff", flexShrink:0, transition:"background 0.2s" }}>
              ➤
            </button>
          </div>

          {isListening && (
            <div style={{ background:"rgba(239,68,68,0.12)", borderTop:"1px solid rgba(239,68,68,0.2)", padding:"6px 14px", fontSize:"11px", color:"#f87171", textAlign:"center", flexShrink:0 }}>
             Listening... tap the mic to stop
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes mwuBounce { 0%,100%{transform:translateY(0);opacity:.4} 50%{transform:translateY(-4px);opacity:1} }
        @keyframes mwuPulse  { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,.4)} 50%{box-shadow:0 0 0 6px rgba(239,68,68,0)} }
      `}</style>
    </>
  );
}
