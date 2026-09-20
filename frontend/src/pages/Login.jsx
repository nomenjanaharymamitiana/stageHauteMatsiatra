import React, { useState } from 'react';
import { loginUser } from '../services/api';

export default function Login({ onLoginSuccess }) {
  const [im, setIm] = useState('');
  const [mdp, setMdp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await loginUser(im, mdp);
      // Stockage de la session utilisateur dans le navigateur
      localStorage.setItem('user', JSON.stringify(user));
      onLoginSuccess(user);
    } catch (err) {
      setError(
        err.response?.data?.detail || 'Identifiants invalides ou serveur indisponible.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>GED Haute Matsiatra</h2>
        <p style={styles.subtitle}>Espace de gestion documentaire</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>Matricule (IM) :</label>
            <input
              type="text"
              value={im}
              onChange={(e) => setIm(e.target.value)}
              placeholder="Ex: DAG001"
              required
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Mot de passe :</label>
            <input
              type="password"
              value={mdp}
              onChange={(e) => setMdp(e.target.value)}
              placeholder="••••••••"
              required
              style={styles.input}
            />
          </div>

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Vérification...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#f1f5f9',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  card: {
    width: '100%',
    maxWidth: '380px',
    padding: '32px',
    borderRadius: '12px',
    backgroundColor: '#ffffff',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  },
  title: {
    margin: 0,
    color: '#0f172a',
    fontSize: '22px',
    textAlign: 'center',
    fontWeight: '700',
  },
  subtitle: {
    color: '#64748b',
    fontSize: '14px',
    textAlign: 'center',
    marginTop: '6px',
    marginBottom: '24px',
  },
  field: { marginBottom: '18px' },
  label: {
    display: 'block',
    marginBottom: '6px',
    fontSize: '14px',
    color: '#334155',
    fontWeight: '500',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    boxSizing: 'border-box',
    fontSize: '14px',
  },
  button: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '15px',
    marginTop: '8px',
  },
  error: {
    padding: '10px 12px',
    backgroundColor: '#fef2f2',
    color: '#991b1b',
    border: '1px solid #fecaca',
    borderRadius: '6px',
    marginBottom: '18px',
    fontSize: '13px',
  },
};