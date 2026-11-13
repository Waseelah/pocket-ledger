import { formatMoney } from '../lib/format.js';

export default function CategoryBreakdown({ byCategory }) {
  if (!byCategory.length) {
    return <p className="muted">No spending yet this month.</p>;
  }

  return (
    <ul className="breakdown">
      {byCategory.map((item) => (
        <li key={item.category}>
          <div className="breakdown-label">
            <span>{item.category}</span>
            <span className="muted">
              {formatMoney(item.cents)} · {item.share}%
            </span>
          </div>
          <div className="bar" aria-hidden="true">
            <div className="bar-fill" style={{ width: `${item.share}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
