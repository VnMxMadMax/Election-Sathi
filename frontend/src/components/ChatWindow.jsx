import { useState, useRef, useEffect, useCallback } from "react";
import { gsap } from "gsap";
import { Send, RotateCcw, Globe, Zap } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";

// Phases for the progress tracker
const PHASES = [
  { id: "intro", label: "Start", icon: "🌐" },
  { id: "pre_election", label: "Pre-Election", icon: "📋" },
  { id: "campaigning", label: "Campaigns", icon: "📢" },
  { id: "voting_day", label: "Voting", icon: "🗳️" },
  { id: "counting", label: "Results", icon: "📊" },
  { id: "participation", label: "Your Role", icon: "✊" },
  { id: "done", label: "Complete", icon: "✅" },
];

const PHASE_ORDER = PHASES.map((p) => p.id);

// Session ID persisted to sessionStorage so refreshes keep context
function getOrCreateSessionId() {
  let id = sessionStorage.getItem("civic_session_id");
  if (!id) {
    id = uuidv4();
    sessionStorage.setItem("civic_session_id", id);
  }
  return id;
}

/**
 * ChatWindow — main chat interface component.
 * Manages: session state, message history, API calls, phase tracking, animations.
 */
export default function ChatWindow() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentPhase, setCurrentPhase] = useState("intro");
  const [country, setCountry] = useState(null);
  const [sessionId] = useState(getOrCreateSessionId);
  const [error, setError] = useState(null);
  const [hasStarted, setHasStarted] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const chatContainerRef = useRef(null);
  const headerRef = useRef(null);

  // ── GSAP Intro Animation ──────────────────────────────────────────────
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(headerRef.current, {
        y: -40,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
      });
      gsap.from(chatContainerRef.current, {
        y: 40,
        opacity: 0,
        duration: 1,
        delay: 0.2,
        ease: "power3.out",
      });
    });
    return () => ctx.revert();
  }, []);

  // ── Auto-scroll to latest message ────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // ── Focus input on mount ──────────────────────────────────────────────
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // ── API Call ──────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (text) => {
      if (!text.trim() || isLoading) return;

      const userMsg = { role: "user", content: text.trim(), phase: currentPhase };
      setMessages((prev) => [...prev, userMsg]);
      setInputValue("");
      setIsLoading(true);
      setError(null);
      if (!hasStarted) setHasStarted(true);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId, message: text.trim() }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.detail ?? `Server error: ${response.status}`);
        }

        const data = await response.json();

        setMessages((prev) => [
          ...prev,
          { role: "ai", content: data.reply, phase: data.phase },
        ]);
        setCurrentPhase(data.phase ?? "intro");
        setCountry(data.country ?? null);
      } catch (err) {
        setError(err.message);
        setMessages((prev) => [
          ...prev,
          {
            role: "ai",
            content:
              "⚠️ I ran into a connection issue. Please check that the backend is running and try again.",
            phase: currentPhase,
          },
        ]);
      } finally {
        setIsLoading(false);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    },
    [isLoading, currentPhase, sessionId, hasStarted]
  );

  // ── Greeting Trigger ──────────────────────────────────────────────────
  const startConversation = useCallback(async () => {
    if (hasStarted) return;
    await sendMessage("Hello, I want to learn about election processes.");
  }, [hasStarted, sendMessage]);

  // ── Session Reset ─────────────────────────────────────────────────────
  const resetSession = useCallback(async () => {
    try {
      await fetch("/api/session/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });
    } catch {
      // Ignore reset errors
    }
    sessionStorage.removeItem("civic_session_id");
    window.location.reload();
  }, [sessionId]);

  // ── Input Handler ─────────────────────────────────────────────────────
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  const currentPhaseIndex = PHASE_ORDER.indexOf(currentPhase);

  return (
    <div className="flex flex-col h-screen relative overflow-hidden topo-bg">
      {/* Floating background text */}
      <div className="bg-float-text">CIVIC</div>

      {/* ── Header / Navbar ─────────────────────────────────────────── */}
      <header
        ref={headerRef}
        className="relative z-10 flex items-center justify-between px-6 py-4 glass border-b border-plasma/10"
      >
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-plasma/20 border border-plasma/40 flex items-center justify-center plasma-glow">
            <Globe size={16} className="text-plasma" />
          </div>
          <div>
            <h1
              className="text-lg font-bold text-ghost leading-none"
              style={{ fontFamily: "Sora, sans-serif" }}
            >
              CivicGuide
            </h1>
            <span
              className="text-xs text-plasma/60"
              style={{ fontFamily: "Fira Code, monospace" }}
            >
              [ election intelligence ]
            </span>
          </div>
        </div>

        {/* Phase Progress */}
        <div className="hidden md:flex items-center gap-2">
          {PHASES.map((phase, idx) => (
            <div key={phase.id} className="flex items-center gap-1">
              <div
                className={`phase-dot ${
                  idx === currentPhaseIndex
                    ? "active"
                    : idx < currentPhaseIndex
                    ? "completed"
                    : ""
                }`}
                title={phase.label}
              />
              {idx < PHASES.length - 1 && (
                <div
                  className={`w-4 h-px ${
                    idx < currentPhaseIndex
                      ? "bg-plasma/40"
                      : "bg-graphite-light"
                  }`}
                />
              )}
            </div>
          ))}
          <span className="ml-3 text-xs text-ghost/50" style={{ fontFamily: "Fira Code, monospace" }}>
            {PHASES[currentPhaseIndex]?.icon} {PHASES[currentPhaseIndex]?.label}
          </span>
        </div>

        {/* Country + Reset */}
        <div className="flex items-center gap-3">
          {country && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-plasma/10 border border-plasma/25">
              <span className="text-xs text-plasma" style={{ fontFamily: "Fira Code, monospace" }}>
                📍 {country}
              </span>
            </div>
          )}
          <button
            id="reset-session-btn"
            onClick={resetSession}
            className="w-8 h-8 rounded-xl bg-graphite-light/60 border border-white/10 flex items-center justify-center hover:border-plasma/40 hover:bg-plasma/10 transition-all duration-200"
            title="Start over"
            aria-label="Reset conversation"
          >
            <RotateCcw size={14} className="text-ghost/50" />
          </button>
        </div>
      </header>

      {/* ── Chat Messages Area ───────────────────────────────────────── */}
      <main
        ref={chatContainerRef}
        className="relative z-10 flex-1 overflow-y-auto px-4 md:px-8 lg:px-16 py-6"
        role="log"
        aria-label="Conversation history"
        aria-live="polite"
      >
        <div className="max-w-3xl mx-auto">
          {/* Welcome State — shown before conversation starts */}
          {!hasStarted && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full min-h-[50vh] text-center">
              <div className="w-20 h-20 rounded-3xl bg-plasma/15 border border-plasma/30 flex items-center justify-center mb-6 plasma-glow">
                <span className="text-4xl">🗳️</span>
              </div>
              <h2
                className="text-3xl md:text-4xl font-bold text-ghost mb-3"
                style={{ fontFamily: "Instrument Serif, serif", fontStyle: "italic" }}
              >
                Understand Your Vote.
              </h2>
              <p className="text-ghost/50 mb-8 max-w-md text-sm leading-relaxed">
                CivicGuide explains how elections work in any country — step by step,
                in plain language. No politics. Just facts.
              </p>
              <button
                id="start-conversation-btn"
                onClick={startConversation}
                className="magnetic-btn flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-plasma text-white font-semibold text-sm"
                style={{ fontFamily: "Sora, sans-serif" }}
              >
                <span>
                  <Zap size={16} />
                </span>
                <span>Start Learning</span>
              </button>

              {/* Feature chips */}
              <div className="flex flex-wrap gap-2 mt-8 justify-center">
                {[
                  "🌍 Any Country",
                  "📋 Step-by-Step",
                  "🔒 Politically Neutral",
                  "🎯 Beginner-Friendly",
                ].map((chip) => (
                  <span
                    key={chip}
                    className="px-3 py-1.5 rounded-full bg-graphite-light/60 border border-white/8 text-xs text-ghost/50"
                    style={{ fontFamily: "Fira Code, monospace" }}
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg, i) => (
            <MessageBubble
              key={i}
              role={msg.role}
              content={msg.content}
              phase={msg.role === "ai" ? msg.phase : undefined}
            />
          ))}

          {/* Typing Indicator */}
          {isLoading && <TypingIndicator />}

          {/* Error Toast */}
          {error && !isLoading && (
            <div className="flex justify-center mb-4">
              <div className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono">
                ⚠️ {error}
              </div>
            </div>
          )}

          {/* Quick Reply chips (shown after AI responds) */}
          {!isLoading && messages.length > 0 && messages[messages.length - 1]?.role === "ai" && (
            <div className="flex flex-wrap gap-2 mb-4 ml-11">
              {getQuickReplies(currentPhase).map((reply) => (
                <button
                  key={reply}
                  id={`quick-reply-${reply.replace(/\s+/g, "-").toLowerCase()}`}
                  onClick={() => sendMessage(reply)}
                  className="px-3 py-1.5 rounded-full bg-graphite-light/60 border border-plasma/20 text-xs text-plasma hover:bg-plasma/15 hover:border-plasma/50 transition-all duration-200"
                  style={{ fontFamily: "Fira Code, monospace" }}
                >
                  {reply}
                </button>
              ))}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* ── Input Area ──────────────────────────────────────────────── */}
      <footer className="relative z-10 px-4 md:px-8 lg:px-16 py-4 glass border-t border-plasma/10">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                id="chat-input"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  hasStarted
                    ? "Ask a question or type 'next' to continue..."
                    : "Click 'Start Learning' to begin..."
                }
                disabled={isLoading || !hasStarted}
                rows={1}
                className={`
                  chat-input w-full px-5 py-3.5 rounded-2xl resize-none
                  bg-graphite-light/60 border border-white/10
                  text-ghost text-sm placeholder-ghost/30
                  transition-all duration-200
                  ${!hasStarted ? "opacity-40 cursor-not-allowed" : ""}
                `}
                style={{
                  fontFamily: "Sora, sans-serif",
                  maxHeight: "120px",
                  overflowY: "auto",
                }}
                aria-label="Chat input"
              />
            </div>

            <button
              id="send-message-btn"
              onClick={() => sendMessage(inputValue)}
              disabled={isLoading || !inputValue.trim() || !hasStarted}
              className={`
                magnetic-btn flex-shrink-0 w-12 h-12 rounded-2xl
                flex items-center justify-center
                ${
                  inputValue.trim() && !isLoading && hasStarted
                    ? "bg-plasma border border-plasma/60 text-white"
                    : "bg-graphite-light border border-white/10 text-ghost/30 cursor-not-allowed"
                }
              `}
              aria-label="Send message"
            >
              <span>
                <Send size={16} />
              </span>
            </button>
          </div>

          {/* Footer meta */}
          <div className="flex items-center justify-between mt-2 px-1">
            <span className="text-xs text-ghost/25" style={{ fontFamily: "Fira Code, monospace" }}>
              Enter to send · Shift+Enter for new line
            </span>
            <span className="text-xs text-ghost/25" style={{ fontFamily: "Fira Code, monospace" }}>
              {/* Pulsing system status */}
              <span className="inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-slow" />
                System Operational
              </span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

/**
 * Returns contextual quick-reply chips based on the current phase.
 * Helps beginners know what to say next.
 */
function getQuickReplies(phase) {
  const replies = {
    intro: [],
    pre_election: ["Tell me more", "Next topic →"],
    campaigning: ["Give me an example", "Next topic →"],
    voting_day: ["What ID do I need?", "Next topic →"],
    counting: ["What if results are disputed?", "Next topic →"],
    participation: ["How do I register?", "Next topic →"],
    done: ["Ask another question", "Start over"],
  };
  return replies[phase] ?? ["Next topic →"];
}
