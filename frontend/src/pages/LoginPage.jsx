import { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const LoginPage = ({ onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let response;
      if (isRegister) {
        response = await axios.post(`${API_BASE_URL}/auth/register`, {
          username,
          password,
        });
      } else {
        const params = new URLSearchParams();
        params.append('username', username);
        params.append('password', password);
        response = await axios.post(`${API_BASE_URL}/auth/login`, params, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
      }
      onLogin(response.data.access_token);
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') {
        setError(detail);
      } else if (Array.isArray(detail)) {
        setError(detail.map((d) => d.msg).join(', '));
      } else {
        setError('Erreur de connexion au serveur');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h1 style={styles.title}>Suivi de transformation</h1>
        <p style={styles.subtitle}>
          {isRegister ? 'Créer un compte' : 'Se connecter'}
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div>
            <label style={styles.label}>Nom d'utilisateur</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={styles.input}
              required
              minLength={3}
              autoComplete="username"
            />
          </div>
          <div>
            <label style={styles.label}>Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              required
              minLength={8}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
            />
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button type="submit" style={styles.button} disabled={loading}>
            {loading
              ? 'Chargement...'
              : isRegister
                ? 'Créer le compte'
                : 'Se connecter'}
          </button>
        </form>

        <p style={styles.toggle}>
          {isRegister ? 'Déjà un compte ?' : 'Pas encore de compte ?'}{' '}
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            style={styles.toggleBtn}
          >
            {isRegister ? 'Se connecter' : "S'inscrire"}
          </button>
        </p>
      </div>
    </div>
  );
};

const styles = {
  wrapper: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    fontFamily: 'Arial, sans-serif',
    padding: '20px',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    padding: '40px',
    width: '100%',
    maxWidth: '400px',
  },
  title: {
    margin: '0 0 4px 0',
    fontSize: '24px',
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    margin: '0 0 24px 0',
    fontSize: '15px',
    color: '#777',
    textAlign: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    color: '#555',
    marginBottom: '4px',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '15px',
    boxSizing: 'border-box',
  },
  button: {
    padding: '12px',
    backgroundColor: '#4f46e5',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px',
  },
  error: {
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '14px',
  },
  toggle: {
    textAlign: 'center',
    marginTop: '16px',
    fontSize: '14px',
    color: '#666',
  },
  toggleBtn: {
    background: 'none',
    border: 'none',
    color: '#4f46e5',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '14px',
    padding: 0,
  },
};

export default LoginPage;
