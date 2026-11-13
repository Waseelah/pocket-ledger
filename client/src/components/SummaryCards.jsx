import { formatMoney } from '../lib/format.js';

export default function SummaryCards({ summary }) {
  const income = summary?.incomeCents ?? 0;
  const spent = summary?.expenseCents ?? 0;
  const net = summary?.netCents ?? 0;

  return (
    <div className="summary">
      <div className="card stat">
        <span className="muted">Money in</span>
        <strong className="income">{formatMoney(income)}</strong>
      </div>
      <div className="card stat">
        <span className="muted">Money out</span>
        <strong className="expense">{formatMoney(spent)}</strong>
      </div>
      <div className="card stat">
        <span className="muted">{net >= 0 ? 'Left over' : 'Overspent'}</span>
        <strong className={net >= 0 ? 'income' : 'expense'}>{formatMoney(Math.abs(net))}</strong>
      </div>
    </div>
  );
}
