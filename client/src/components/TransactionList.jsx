import { formatMoney, shortDate } from '../lib/format.js';

export default function TransactionList({ transactions, onEdit, onDelete }) {
  if (!transactions.length) {
    return <p className="muted">Nothing logged for this month yet. Add your first transaction above.</p>;
  }

  return (
    <ul className="transactions">
      {transactions.map((t) => (
        <li key={t.id}>
          <span className="muted date">{shortDate(t.occurredOn)}</span>
          <span className="what">
            <span>{t.description || t.category}</span>
            {t.description && <span className="muted tag">{t.category}</span>}
          </span>
          <span className={t.type === 'income' ? 'income amount' : 'expense amount'}>
            {t.type === 'income' ? '+' : '−'}
            {formatMoney(t.amountCents)}
          </span>
          <span className="row-actions">
            <button type="button" className="link-button" onClick={() => onEdit(t)}>
              Edit
            </button>
            <button type="button" className="link-button danger" onClick={() => onDelete(t)}>
              Delete
            </button>
          </span>
        </li>
      ))}
    </ul>
  );
}
