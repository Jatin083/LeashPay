/** The request path as a pulsing line: you, the agent, the policy engine, PayPal, you again. */
const NODES = [
  { label: "You", sub: "ask for something" },
  { label: "Claude agent", sub: "searches, proposes" },
  { label: "Policy engine", sub: "checks every rule" },
  { label: "PayPal", sub: "order with checked total" },
  { label: "You", sub: "approve and pay" },
];

export default function FlowDiagram() {
  return (
    <div className="flow" role="img" aria-label="You ask the Claude agent, the agent proposes a cart, the policy engine checks it, PayPal creates the order, and you approve the payment.">
      <style>{`
        .flow { position: relative; display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; }
        .flow-line { position: absolute; left: 10%; right: 10%; top: 27px; height: 2px; background: var(--line); border-radius: 3px; overflow: hidden; }
        .flow-pulse { position: absolute; top: 0; left: 0; width: 18%; height: 100%; background: linear-gradient(90deg, transparent, var(--accent), transparent); animation: flow-run 3.2s cubic-bezier(.45,0,.25,1) infinite; }
        .flow-node { position: relative; text-align: center; }
        .flow-dot { width: 56px; height: 56px; margin: 0 auto; border-radius: 999px; display: grid; place-items: center; background: var(--white); border: 1px solid var(--line); font-weight: 500; font-size: 15px; }
        .flow-node.is-key .flow-dot { background: var(--t-hot); color: var(--t-hot-ink); border-color: var(--t-hot); }
        @keyframes flow-run { from { transform: translateX(-100%); } to { transform: translateX(560%); } }
        @media (max-width: 760px) {
          .flow { grid-template-columns: 1fr; gap: 18px; }
          .flow-line { left: 27px; right: auto; top: 28px; bottom: 28px; width: 3px; height: auto; }
          .flow-pulse { width: 100%; height: 18%; background: linear-gradient(180deg, transparent, var(--accent), transparent); animation-name: flow-run-y; }
          .flow-node { display: flex; align-items: center; gap: 16px; text-align: left; }
          .flow-dot { margin: 0; flex: none; }
          @keyframes flow-run-y { from { transform: translateY(-100%); } to { transform: translateY(560%); } }
        }
      `}</style>
      <div className="flow-line" aria-hidden="true">
        <div className="flow-pulse" />
      </div>
      {NODES.map((node, i) => (
        <div key={i} className={`flow-node${i === 2 ? " is-key" : ""}`}>
          <div className="flow-dot" aria-hidden="true">
            {i + 1}
          </div>
          <div>
            <p style={{ margin: "14px 0 0", fontWeight: 700 }}>{node.label}</p>
            <p className="small muted" style={{ margin: "2px 0 0" }}>
              {node.sub}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
