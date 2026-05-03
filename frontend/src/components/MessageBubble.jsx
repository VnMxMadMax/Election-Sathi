import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * MessageBubble — renders a single chat message.
 *
 * AI messages render Markdown (bold, bullets, numbered lists).
 * User messages render as plain text (no markdown parsing needed).
 *
 * @param {Object} props
 * @param {"user"|"ai"} props.role
 * @param {string} props.content
 * @param {string} [props.phase]  — shown as HUD label on AI messages
 */
export default function MessageBubble({ role, content, phase }) {
  const isUser = role === "user";

  return (
    <div
      className={`flex w-full mb-4 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {/* AI Avatar */}
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-plasma/20 border border-plasma/40 flex items-center justify-center mr-3 mt-1">
          <span className="text-plasma text-xs">🗳️</span>
        </div>
      )}

      <div className={`flex flex-col max-w-[78%] ${isUser ? "items-end" : "items-start"}`}>
        {/* HUD phase label on AI messages */}
        {!isUser && phase && (
          <span className="hud-bracket mb-1 ml-1">[ {phaseLabel(phase)} ]</span>
        )}

        <div
          className={`
            rounded-3xl px-5 py-4 relative
            ${isUser
              ? "msg-user bg-plasma/25 border border-plasma/40 text-ghost"
              : "msg-ai glass text-ghost"
            }
          `}
        >
          {isUser ? (
            <p className="text-sm leading-relaxed" style={{ fontFamily: "Sora, sans-serif" }}>
              {content}
            </p>
          ) : (
            <div className="markdown-content text-sm">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-graphite-light border border-white/10 flex items-center justify-center ml-3 mt-1">
          <span className="text-xs">👤</span>
        </div>
      )}
    </div>
  );
}

function phaseLabel(phase) {
  const labels = {
    intro: "Welcome",
    pre_election: "Pre-Election",
    campaigning: "Campaigning",
    voting_day: "Voting Day",
    counting: "Counting & Results",
    participation: "Your Role",
    done: "Complete",
  };
  return labels[phase] ?? phase;
}
