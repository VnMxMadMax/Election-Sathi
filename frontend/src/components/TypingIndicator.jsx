/**
 * TypingIndicator — animated 3-dot bouncing indicator shown while AI is responding.
 * Styled with Vapor Clinic plasma colors.
 */
export default function TypingIndicator() {
  return (
    <div className="flex items-center mb-4 justify-start">
      {/* AI Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-plasma/20 border border-plasma/40 flex items-center justify-center mr-3">
        <span className="text-plasma text-xs">🗳️</span>
      </div>

      <div className="glass rounded-3xl px-5 py-4 plasma-glow">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="typing-dot inline-block w-2 h-2 rounded-full bg-plasma"
            />
          ))}
          <span
            className="ml-2 text-xs text-plasma/60"
            style={{ fontFamily: "Fira Code, monospace" }}
          >
            analyzing...
          </span>
        </div>
      </div>
    </div>
  );
}
