import { useState } from 'react';

interface LoginProps {
  onLoginSuccess: (token: string, username: string) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('USER'); // Default role
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    const body: any = { username, password, email };
    
    // Se ci stiamo registrando, inviamo anche il ruolo
    if (isRegister) {
        body.role = role;
    }

    try {
      const res = await fetch(`http://localhost:8081${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.text(); // Leggiamo come testo per gestire stringhe semplici o JSON

      if (!res.ok) throw new Error(data || "Auth failed");

      if (isRegister) {
        alert("Registration successful! Please login.");
        setIsRegister(false); // Torna al login
      } else {
        // Login Success: il backend ritorna un JSON { token: "..." }
        const jsonData = JSON.parse(data);
        onLoginSuccess(jsonData.token, username);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="brand-icon" style={{fontSize: '3rem', marginBottom: '1rem'}}>⚡</div>
        <h2>{isRegister ? 'Create Account' : 'Welcome Back'}</h2>
        
        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input 
              type="text" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              required 
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                    required
            />
            </div>

          {/* Selettore Ruolo (Solo in Registrazione) */}
          {isRegister && (
            <div className="form-group">
              <label>Role</label>
              <select value={role} onChange={e => setRole(e.target.value)}>
                <option value="USER">User (Viewer)</option>
                <option value="ADMIN">Admin (Manager)</option>
              </select>
            </div>
          )}

          <button type="submit" className="btn-login">
            {isRegister ? 'Register' : 'Login'}
          </button>
        </form>

        <p className="toggle-auth">
          {isRegister ? 'Already have an account?' : "Don't have an account?"} 
          <span onClick={() => setIsRegister(!isRegister)}>
             {isRegister ? ' Login here' : ' Register here'}
          </span>
        </p>
      </div>
    </div>
  );
}