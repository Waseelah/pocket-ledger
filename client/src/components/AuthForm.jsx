import { useState } from 'react';
import { api } from '../api.js';
import { validateAuthForm } from '../lib/validateForm.js';

export default function AuthForm({ onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isRegister = mode === 'register';

  function update(field) {
    return (event) => setValues((v) => ({ ...v, [field]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');
    const found = validateAuthForm(values, mode);
    setErrors(found);
    if (Object.keys(found).length) return;

    setSubmitting(true);
    try {
      const call = isRegister ? api.register : api.login;
      const data = await call(values.email.trim(), values.password);
      onAuthenticated(data.user);
    } catch (err) {
      setErrors(err.fieldErrors);
      if (!Object.keys(err.fieldErrors).length) setMessage(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="card auth-card">
      <h1>{isRegister ? 'Create your account' : 'Welcome back'}</h1>
      <p className="muted">
        {isRegister
          ? 'Track what comes in, what goes out, and where it goes.'
          : 'Log in to see this month at a glance.'}
      </p>

      <form onSubmit={handleSubmit} noValidate>
        <label>
          Email
          <input type="email" autoComplete="email" value={values.email} onChange={update('email')} />
          {errors.email && <span className="error">{errors.email}</span>}
        </label>

        <label>
          Password
          <input
            type="password"
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            value={values.password}
            onChange={update('password')}
          />
          {errors.password && <span className="error">{errors.password}</span>}
        </label>

        {message && <p className="error" role="alert">{message}</p>}

        <button type="submit" className="primary" disabled={submitting}>
          {submitting ? 'One moment…' : isRegister ? 'Sign up' : 'Log in'}
        </button>
      </form>

      <p className="muted switch">
        {isRegister ? 'Already have an account?' : 'New here?'}{' '}
        <button
          type="button"
          className="link-button"
          onClick={() => {
            setMode(isRegister ? 'login' : 'register');
            setErrors({});
            setMessage('');
          }}
        >
          {isRegister ? 'Log in' : 'Create an account'}
        </button>
      </p>
    </section>
  );
}
