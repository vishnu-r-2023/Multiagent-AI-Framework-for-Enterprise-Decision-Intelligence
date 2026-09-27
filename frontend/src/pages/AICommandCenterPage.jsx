import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { askPerformIqAi } from "../services/aiApi";

const EXAMPLES = [
  "Give me an executive summary of my organization.",
  "Which department needs the most attention?",
  "Why is employee performance changing?",
  "Analyze sales performance.",
  "Compare sales and employee performance.",
  "Identify the biggest business risks.",
];

const renderAnswer = (answer) => <ReactMarkdown
  remarkPlugins={[remarkGfm]}
  components={{
    h1: ({ children }) => <h2 className="ai-answer-heading ai-answer-heading-large">{children}</h2>,
    h2: ({ children }) => <h3 className="ai-answer-heading">{children}</h3>,
    h3: ({ children }) => <h4 className="ai-answer-heading ai-answer-heading-small">{children}</h4>,
    p: ({ children }) => <p className="ai-answer-copy">{children}</p>,
    ul: ({ children }) => <ul className="ai-answer-list">{children}</ul>,
    ol: ({ children }) => <ol className="ai-answer-list">{children}</ol>,
    li: ({ children }) => <li>{children}</li>,
    blockquote: ({ children }) => <blockquote className="ai-answer-quote">{children}</blockquote>,
    table: ({ children }) => <div className="ai-answer-table-wrap"><table className="ai-answer-table">{children}</table></div>,
    th: ({ children }) => <th>{children}</th>,
    td: ({ children }) => <td>{children}</td>,
  }}
>
  {String(answer || "")}
</ReactMarkdown>;

function AICommandCenterPage() {
  const [question, setQuestion] = useState("");
  const [conversation, setConversation] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const latest = useMemo(() => [...conversation].reverse().find((item) => item.type === "response")?.payload || null, [conversation]);

  const submitQuestion = async (event) => {
    event?.preventDefault();
    const message = question.trim();
    if (!message || isLoading) return;
    setError("");
    setConversation((items) => [...items, { type: "question", message }]);
    setQuestion("");
    setIsLoading(true);
    try {
      const payload = await askPerformIqAi(message, conversation);
      setConversation((items) => [...items, { type: "response", payload }]);
    } catch (requestError) {
      setError(requestError.message || "AI analysis is currently unavailable.");
    } finally {
      setIsLoading(false);
    }
  };

  const shownAgents = latest?.agentsUsed || ["Orchestrator Agent", "Specialist agents", "Data Analyst Agent", "Executive Insight Agent"];

  return <section className="ai-command-page px-4 pb-10 pt-5 sm:px-6 lg:px-8">
    <div className="ai-command-hero">
      <div><p className="ai-eyebrow"><span className="material-symbols-outlined">neurology</span> Local multi-agent intelligence</p><h2>AI Command Center</h2><p>Ask a business question and PerformIQ routes it through deterministic analytics agents before creating an executive-ready response.</p></div>
      <div className={`ai-runtime-badge ${latest?.metadata?.aiStatus === "online" ? "ai-runtime-online" : ""}`}><span className="material-symbols-outlined">memory</span>{latest?.metadata?.aiStatus === "online" ? `Local AI online · ${latest.metadata.model}` : "Local AI optional · analytics fallback ready"}</div>
    </div>
    <div className="ai-command-grid">
      <div className="ai-chat-panel">
        <div className="ai-panel-heading"><div><p className="ai-section-kicker">Conversation</p><h3>Ask PerformIQ</h3></div><span className="ai-privacy-note"><span className="material-symbols-outlined">shield_lock</span> Active dataset only</span></div>
        <div className="ai-conversation" aria-live="polite">
          {!conversation.length && !isLoading && <div className="ai-empty-state"><span className="material-symbols-outlined">forum</span><p>Your response will distinguish verified dataset findings from unavailable information.</p></div>}
          {conversation.map((item, index) => item.type === "question" ? <div className="ai-user-message" key={`question-${index}`}>{item.message}</div> : <article className="ai-response" key={`response-${index}`}>{renderAnswer(item.payload.answer)}</article>)}
          {isLoading && <div className="ai-thinking"><span className="material-symbols-outlined">progress_activity</span> Orchestrator is running selected agents…</div>}
        </div>
        {error && <div className="ai-error"><span className="material-symbols-outlined">cloud_off</span>{error}</div>}
        <form className="ai-composer" onSubmit={submitQuestion}><textarea value={question} onChange={(event) => setQuestion(event.target.value)} maxLength={1200} rows={3} placeholder="e.g. Why has employee performance declined this quarter?" aria-label="Question for PerformIQ AI" /><div><span>{question.length}/1200</span><button type="submit" disabled={!question.trim() || isLoading}><span className="material-symbols-outlined">arrow_upward</span> Analyze</button></div></form>
      </div>
      <aside className="ai-side-panel">
        <div className="ai-side-card"><p className="ai-section-kicker">Suggested questions</p><div className="ai-prompt-list">{EXAMPLES.map((prompt) => <button key={prompt} type="button" onClick={() => setQuestion(prompt)}>{prompt}<span className="material-symbols-outlined">north_east</span></button>)}</div></div>
        <div className="ai-side-card"><p className="ai-section-kicker">Agent workflow</p><div className="ai-agent-flow">{shownAgents.map((agent, index) => <div key={agent} className={latest ? "ai-agent-complete" : ""}><span className="material-symbols-outlined">{latest ? "check_circle" : "radio_button_unchecked"}</span><span>{agent}</span>{index < shownAgents.length - 1 && <i />}</div>)}</div></div>
        {latest && <div className="ai-side-card"><p className="ai-section-kicker">Key insights</p><ul className="ai-insight-list">{latest.insights.slice(0, 4).map((insight) => <li key={insight}>{insight}</li>)}</ul><p className="ai-section-kicker ai-recommendation-title">Recommended actions</p><ul className="ai-insight-list">{latest.recommendations.map((recommendation) => <li key={recommendation}>{recommendation}</li>)}</ul></div>}
      </aside>
    </div>
  </section>;
}

export default AICommandCenterPage;
