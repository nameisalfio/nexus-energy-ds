import { useState } from 'react';

// Updated interface to include Role
interface LoginProps {
  onLoginSuccess: (token: string, username: string, role: string) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');      
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState(''); // Only for register
  const [role, setRole] = useState('USER');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login'; 
    
    let body: any = {};
    if (isRegister) {
        body = { username, email, password, role };
    } else {
        body = { email, password }; 
    }

    try {
      const res = await fetch(`http://localhost:8081${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const dataText = await res.text();
      if (!res.ok) throw new Error(dataText || "Auth failed");

      if (isRegister) {
        alert("Registration successful! Please login.");
        setIsRegister(false);
        setPassword('');
      } else {
        const jsonData = JSON.parse(dataText);
        
        // Decode token payload simply to get role if backend doesn't send it explicitly
        // Or assume backend sends it. 
        // For now, let's assume specific email is admin or default to USER if simple token.
        // Ideally, backend should return { token: "...", role: "..." }
        // If not, we can parse JWT. Let's do a basic check for now:
        
        // TEMPORARY: If we logged in, we fetch user details or assume based on memory
        // In a real app, parse the JWT payload: JSON.parse(atob(token.split('.')[1])).role
        
        let userRole = "USER";
        try {
            const payload = JSON.parse(atob(jsonData.token.split('.')[1]));
            // Spring Security often puts roles in 'roles' array or 'scope'
            if (payload.roles && payload.roles.includes('ROLE_ADMIN')) userRole = 'ADMIN';
            // Fallback check
            if (email.includes("admin")) userRole = "ADMIN"; 
        } catch(e) { /* ignore */ }

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
        <h2>{isRegister ? 'Create Account' : 'Energy Login'}</h2>
        
        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit}>
          
          <div className="form-group">
            <label>Email Address</label>
            <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="name@energy.com"
            />
          </div>

          {isRegister && (
            <div className="form-group">
                <label>Username</label>
                <input 
                type="text" 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                required 
                placeholder="Display Name"
                />
            </div>
          )}

          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
            />
          </div>

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
          <span onClick={() => { setIsRegister(!isRegister); setError(null); }}>
             {isRegister ? ' Login here' : ' Register here'}
          </span>
        </p>
      </div>
    </div>
  );
}