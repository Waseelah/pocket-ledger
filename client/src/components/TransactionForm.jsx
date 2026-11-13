import { useState } from 'react';
import { centsToInput, today } from '../lib/format.js';
import { validateTransactionForm } from '../lib/validateForm.js';

function startingValues(initial) {
  if (!initial) {
    return { type: 'expense', amount: '', category: '', description: '', occurredOn: today() };
  }
  return {
    type: initial.type,
    amount: centsToInput(initial.amountCents),
    category: initial.category,
    description: initial.description,
    occurredOn: initial.occurredOn,
  };
}

export default function TransactionForm({ categories, initial, onSubmit, onCancel }) {
  const [values, setValues] = useState(() => startingValues(initial));
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  function update(field) {
    return (event) => setValues((v) => ({ ...v, [field]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');
    const found = validateTransactionForm(values, categories);
    setErrors(found);
    if (Object.keys(found).length) return;

    setSaving(true);
    try {
      await onSubmit({ ...values, amount: values.amount.trim(), description: values.description.trim() });
      if (!initial) setValues(startingValues(null));
    } catch (err) {
      setErrors(err.fieldErrors || {});
      if (!err.fieldErrors || !Object.keys(err.fieldErrors).length) setMessage(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="transaction-form">
      <div className="type-toggle" role="radiogroup" aria-label="Type">
        {['expense', 'income'].map((type) => (
          <button
            key={type}
            type="button"
            role="radio"
            aria-checked={values.type === type}
            className={values.type === type ? `selected ${type}` : ''}
            onClick={() => setValues((v) => ({ ...v, type }))}
          >
            {type === 'expense' ? 'Money out' : 'Money in'}
          </button>
        ))}
      </div>

      <label>
        Amount (CAD)
        <input inputMode="decimal" placeholder="0.00" value={values.amount} onChange={update('amount')} />
        {errors.amount && <span className="error">{errors.amount}</span>}
      </label>

      <label>
        Category
        <select value={values.category} onChange={update('category')}>
          <option value="">Choose one…</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        {errors.category && <span className="error">{errors.category}</span>}
      </label>

      <label>
        Date
        <input type="date" value={values.occurredOn} onChange={update('occurredOn')} />
        {errors.occurredOn && <span className="error">{errors.occurredOn}</span>}
      </label>

      <label>
        <span>
          Note <span className="muted">(optional)</span>
        </span>
        <input maxLength={200} value={values.description} onChange={update('description')} />
        {errors.description && <span className="error">{errors.description}</span>}
      </label>

      {message && <p className="error" role="alert">{message}</p>}

      <div className="form-actions">
        <button type="submit" className="primary" disabled={saving}>
          {saving ? 'Saving…' : initial ? 'Save changes' : 'Add'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
