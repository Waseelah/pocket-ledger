import { useEffect, useState } from 'react';
import { api } from './api.js';
import AuthForm from './components/AuthForm.jsx';
import Dashboard from './components/Dashboard.jsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    api
      .me()
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setCheckingSession(false));
  }, []);

  async function handleLogout() {
    await api.logout().catch(() => {});
    setUser(null);
  }

  if (checkingSession) {
    return <p className="centered muted">Loading…</p>;
  }

  return (
    <div className="app">
      <header className="topbar">
        <span className="brand">Pocket Ledger</span>
        {user && (
          <span className="topbar-right">
            <span className="muted">{user.email}</span>
            <button type="button" className="link-button" onClick={handleLogout}>
              Log out
            </button>
          </span>
        )}
      </header>
      <main>{user ? <Dashboard /> : <AuthForm onAuthenticated={setUser} />}</main>
    </div>
  );
}
