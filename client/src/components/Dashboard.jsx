import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api.js';
import { currentMonth, monthLabel, shiftMonth } from '../lib/format.js';
import SummaryCards from './SummaryCards.jsx';
import CategoryBreakdown from './CategoryBreakdown.jsx';
import TransactionForm from './TransactionForm.jsx';
import TransactionList from './TransactionList.jsx';

export default function Dashboard() {
  const [month, setMonth] = useState(currentMonth());
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.categories().then((data) => setCategories(data.categories)).catch(() => {});
  }, []);

  // Each load gets a number; only the most recent one may update the screen, so a slow
  // response for a month you've already left can't overwrite the month you're viewing.
  const latestLoad = useRef(0);

  const load = useCallback(async () => {
    const loadId = ++latestLoad.current;
    setLoading(true);
    setError('');
    try {
      const [list, totals] = await Promise.all([api.transactions(month), api.summary(month)]);
      if (loadId !== latestLoad.current) return;
      setTransactions(list.transactions);
      setSummary(totals);
    } catch (err) {
      if (loadId !== latestLoad.current) return;
      setError(err.message);
    } finally {
      if (loadId === latestLoad.current) setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave(data) {
    if (editing) {
      await api.updateTransaction(editing.id, data);
      setEditing(null);
    } else {
      await api.createTransaction(data);
    }
    await load();
  }

  async function handleDelete(transaction) {
    if (!window.confirm(`Delete "${transaction.description || transaction.category}"?`)) return;
    try {
      await api.deleteTransaction(transaction.id);
      if (editing?.id === transaction.id) setEditing(null);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="dashboard">
      <div className="month-picker">
        <button type="button" aria-label="Previous month" onClick={() => setMonth((m) => shiftMonth(m, -1))}>
          ‹
        </button>
        <h1>{monthLabel(month)}</h1>
        <button type="button" aria-label="Next month" onClick={() => setMonth((m) => shiftMonth(m, 1))}>
          ›
        </button>
      </div>

      {error && <p className="error" role="alert">{error}</p>}

      <SummaryCards summary={summary} />

      <div className="columns">
        <section className="card">
          <h2>{editing ? 'Edit transaction' : 'Add a transaction'}</h2>
          <TransactionForm
            key={editing?.id ?? 'new'}
            categories={categories}
            initial={editing}
            onSubmit={handleSave}
            onCancel={editing ? () => setEditing(null) : undefined}
          />
        </section>

        <section className="card">
          <h2>Where it went</h2>
          <CategoryBreakdown byCategory={summary?.byCategory ?? []} />
        </section>
      </div>

      <section className="card">
        <h2>Transactions</h2>
        {loading ? (
          <p className="muted">Loading…</p>
        ) : (
          <TransactionList transactions={transactions} onEdit={setEditing} onDelete={handleDelete} />
        )}
      </section>
    </div>
  );
}
