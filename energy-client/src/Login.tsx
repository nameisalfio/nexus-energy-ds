import { useState } from 'react';

interface LoginProps {
  onLoginSuccess: (token: string, username: string, role: string) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');      
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState(''); 
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login'; 
    const body = isRegister 
        ? { username, email, password } 
        : { email, password };

    try {
      const res = await fetch(`http://localhost:8081${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const dataText = await res.text();
      if (!res.ok) throw new Error(dataText || "Authentication failed");

      if (isRegister) {
        alert("Registration successful! Default role 'USER' assigned.");
        setIsRegister(false);
        setPassword('');
      } else {
        // Estrazione del ruolo dal JWT Token
        const jsonData = JSON.parse(dataText);
        let userRole = "USER";

        try {
            const tokenPayload = JSON.parse(atob(jsonData.token.split('.')[1]));
            userRole = tokenPayload.role || tokenPayload.authorities || "USER"; 
            console.log("Detected Role from Token:", userRole);
        } catch(e) {
            console.error("JWT Parsing Error", e);
        }

        onLoginSuccess(jsonData.token, email, userRole);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="brand-icon" style={{fontSize: '3rem', marginBottom: '1rem'}}>⚡</div>
        <h2>{isRegister ? 'Join Nexus Grid' : 'Login'}</h2>
        
        {error && <div className="error-msg" style={{color: '#ef4444', marginBottom: '1rem'}}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>

          {isRegister && (
            <div className="form-group">
                <label>Username</label>
                <input type="text" value={username} onChange={e => setUsername(e.target.value)} required />
            </div>
          )}

          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>

          <button type="submit" className="btn-login">
            {isRegister ? 'Register' : 'Sign In'}
          </button>
        </form>

        <p className="toggle-auth" style={{marginTop: '1rem', cursor: 'pointer', color: '#38bdf8'}} 
           onClick={() => { setIsRegister(!isRegister); setError(null); }}>
          {isRegister ? 'Already registered? Login' : 'Need an account? Register'}
        </p>
      </div>
    </div>
  );
}