import { useEffect, useState, type ChangeEvent } from 'react';
import './App.css';
import Login from './Login';
import type { SystemReport, WeeklyStat, Reading } from './types';

const API_BASE = "http://localhost:8081/api";

function App() {
  // --- AUTH STATE ---
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [username, setUsername] = useState<string | null>(localStorage.getItem('username'));
  const [role, setRole] = useState<string | null>(localStorage.getItem('role'));

  // --- DATA STATE ---
  const [report, setReport] = useState<SystemReport | null>(null);
  const [weekly, setWeekly] = useState<WeeklyStat[]>([]);
  const [liveReadings, setLiveReadings] = useState<Reading[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  
  // --- UI STATE ---
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [showUserMgmt, setShowUserMgmt] = useState(false);

  const isAdmin = role === 'ADMIN';

  const handleLogout = () => {
    if(token) {
        fetch(`${API_BASE}/auth/logout`, { 
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        }).catch(err => console.warn("Logout error", err));
    }
    localStorage.clear();
    setToken(null); setUsername(null); setRole(null);
    setReport(null); setWeekly([]); setLiveReadings([]);
    setSimulating(false);
  };

  const secureFetch = async (url: string, options: RequestInit = {}) => {
      const headers = { 
          ...options.headers, 
          'Authorization': `Bearer ${token}` 
      };
      const res = await fetch(url, { ...options, headers });
      if (res.status === 403) {
          handleLogout();
          throw new Error("Session expired");
      }
      return res;
  };

  const fetchData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const [resReport, resWeekly] = await Promise.all([
        secureFetch(`${API_BASE}/full-report`),
        secureFetch(`${API_BASE}/stats/weekly`)
      ]);

      if (resReport.ok) setReport(await resReport.json());
      if (resWeekly.ok) setWeekly(await resWeekly.json());
    } catch (err: any) {
      setError(err.message || "Sync failed");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await secureFetch(`${API_BASE}/auth/users`);
      if (res.ok) setUsers(await res.json());
    } catch (err: any) { 
      setError("Could not load users"); 
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (email: string, currentRole: string) => {
    const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
    try {
      const res = await secureFetch(`${API_BASE}/auth/users/change-role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newRole })
      });
      if (res.ok) fetchUsers();
    } catch (err) { alert("Role update failed"); }
  };

  useEffect(() => {
    if (token) fetchData();
  }, [token]);

  useEffect(() => {
    if (!simulating || !token) return;
    const eventSource = new EventSource(`${API_BASE}/stream`); 
    eventSource.addEventListener("update", (event) => {
      const update: SystemReport = JSON.parse(event.data);
      const newReading = update.recentReadings[0];
      if (newReading) setLiveReadings(prev => [newReading, ...prev].slice(0, 30));
      setReport(prev => prev ? { ...prev, stats: update.stats, aiInsights: update.aiInsights } : update);
      
      secureFetch(`${API_BASE}/stats/weekly`)
        .then(res => res.json())
        .then(data => setWeekly(data))
        .catch(console.error);
    });
    eventSource.onerror = () => eventSource.close();
    return () => eventSource.close();
  }, [simulating, token]);

  const handleStartSim = async () => {
    try {
      setLiveReadings([]); 
      await secureFetch(`${API_BASE}/simulation/start`, { method: 'POST' });
      setSimulating(true);
    } catch (e) { alert("Start failed"); }
  };

  const handleStopSim = async () => {
    try {
      await secureFetch(`${API_BASE}/simulation/stop`, { method: 'POST' });
      setSimulating(false);
    } catch (e) { alert("Stop failed"); }
  };

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const formData = new FormData();
    formData.append("file", e.target.files[0]);
    setLoading(true);
    try {
        const res = await fetch(`${API_BASE}/ingest-dataset`, { 
            method: "POST", 
            body: formData,
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) { alert("Dataset Ingested!"); fetchData(); }
    } catch (err) { setError("Upload error"); } 
    finally { setLoading(false); }
  };

  if (!token) {
    return <Login onLoginSuccess={(tk, user, r) => {
        localStorage.setItem('token', tk);
        localStorage.setItem('username', user);
        localStorage.setItem('role', r);
        setToken(tk); setUsername(user); setRole(r);
    }} />;
  }

  return (
    <div className="container">
      {loading && <div className="loading-spinner">Processing...</div>}

      <header className="header">
        <div className="brand">
          <span className="brand-icon">⚡</span>
          <div>
            <h1>Nexus Energy Portal</h1>
            <span style={{color: '#94a3b8', fontSize: '0.8rem'}}>User: {username} ({role})</span>
          </div>
        </div>
        
        <div className="actions">
          {isAdmin && (
            <>
              {!simulating ? (
                <button className="btn btn-start" onClick={handleStartSim}>▶ Start Live</button>
              ) : (
                <button className="btn btn-stop" onClick={handleStopSim}>⏹ Stop</button>
              )}
              
              <label className="upload-btn">
                📂 Load CSV
                <input type="file" onChange={handleUpload} accept=".csv" style={{display: 'none'}} />
              </label>

              <button className="btn" style={{background: '#6366f1'}} onClick={() => {
                  setShowUserMgmt(!showUserMgmt);
                  if (!showUserMgmt) fetchUsers();
              }}>
                {showUserMgmt ? '📊 Monitor' : '👥 Users'}
              </button>
            </>
          )}
          <button className="btn btn-logout" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {error && <div className="error-notice" style={{color:'#ef4444', padding:'10px'}}>{error}</div>}

      {showUserMgmt && isAdmin ? (
        <section className="card fade-in">
            <h3>User Management</h3>
            <div className="table-container">
              <table>
                <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Action</th></tr></thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr key={i}>
                      <td>{u.username}</td>
                      <td>{u.email}</td>
                      <td><span className={`pill ${u.role === 'ADMIN' ? 'p-on' : 'p-off'}`}>{u.role}</span></td>
                      <td><button className="premium-btn" style={{fontSize: '0.7rem'}} onClick={() => handleRoleChange(u.email, u.role)}>Switch Role</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        </section>
      ) : (
        report && (
          <>
            <div className="kpi-grid">
              <div className="card"><div className="card-label">Avg Temp</div><div className="card-value">{report.stats.averageTemperature.toFixed(1)}°</div></div>
              <div className="card"><div className="card-label">Total Energy</div><div className="card-value">{report.stats.totalEnergyConsumption.toLocaleString()} <span className="card-unit">kWh</span></div></div>
              <div className="card"><div className="card-label">Peak Load</div><div className="card-value">{report.stats.peakLoad.toFixed(2)} <span className="card-unit">kWh</span></div></div>
              <div className="card"><div className="card-label">Live Records</div><div className="card-value">{report.stats.totalRecords}</div></div>
            </div>

            <div className="dashboard-layout">
              <div className="main-content">
                <h2>📊 Weekly Trends</h2>
                <div className="weekly-row">
                  {weekly.map((s, i) => (
                    <div key={i} className="day-card">
                      <div style={{fontSize:'0.8rem', color:'#94a3b8'}}>{s.day}</div>
                      <div style={{fontWeight:'bold', color:'#38bdf8'}}>{s.avgConsumption.toFixed(1)}</div>
                    </div>
                  ))}
                </div>
                <h2>🔴 Live Sensor Feed</h2>
                <div className="table-container">
                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>Time</th>
                          <th>Temp</th>
                          <th>Hum</th>
                          <th>Area (sqft)</th>
                          <th>Occ</th>
                          <th>HVAC</th>
                          <th>Light</th>
                          <th>Renew</th>
                          <th>Day</th>
                          <th>Holiday</th>
                          <th>Load (kWh)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {liveReadings.length > 0 ? liveReadings.map((r, i) => (
                          <tr key={r.id || i} className="fade-in-row">
                            <td style={{ whiteSpace: 'nowrap' }}>{new Date(r.timestamp).toLocaleTimeString()}</td>
                            <td>{r.temperature.toFixed(1)}°</td>
                            <td>{r.humidity.toFixed(0)}%</td>
                            <td>{r.squareFootage.toFixed(0)}</td>
                            <td>{r.occupancy}</td>
                            <td>
                              <span className={`badge ${r.hvacUsage === 'On' ? 'b-on' : 'b-off'}`}>
                                {r.hvacUsage}
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${r.lightingUsage === 'On' ? 'b-on' : 'b-off'}`}>
                                {r.lightingUsage}
                              </span>
                            </td>
                            <td>{r.renewableEnergy.toFixed(2)}</td>
                            <td>{r.dayOfWeek.substring(0, 3)}</td>
                            <td>
                              {r.holiday === 'Yes' ? 
                                <span className="badge b-holiday">YES</span> : 
                                <span style={{ opacity: 0.3 }}>No</span>
                              }
                            </td>
                            <td style={{ color: '#fbbf24', fontWeight: 'bold' }}>
                              {r.energyConsumption.toFixed(2)}
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={11} style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                              No active telemetry detected.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* 🧠 Reinserito il pannello AI Sidecar */}
              <aside className="sidebar">
                <div className="ai-panel" style={{borderColor: report.aiInsights.anomalyDetected ? '#ef4444' : '#10b981'}}>
                  <div className="ai-header">
                    <strong>🧠 AI Digital Twin</strong>
                    <span className="status-dot" style={{backgroundColor: report.aiInsights.anomalyDetected ? '#ef4444' : '#10b981'}}></span>
                  </div>
                  <div className="ai-body">
                    <div className="ai-metric">
                      <span className="metric-label">AI Expected</span>
                      <span className="metric-val" style={{color: '#38bdf8'}}>{report.aiInsights.expectedValue?.toFixed(2)}</span>
                    </div>
                    <div className="ai-metric">
                      <span className="metric-label">Real Value</span>
                      <span className="metric-val" style={{color: '#fff'}}>
                        {simulating && liveReadings.length > 0 ? liveReadings[0].energyConsumption.toFixed(2) : report.aiInsights.actualValue?.toFixed(2)}
                      </span>
                    </div>
                    <div className="ai-metric">
                      <span className="metric-label">Deviation</span>
                      <span className="metric-val" style={{color: report.aiInsights.anomalyDetected ? '#ef4444' : '#10b981'}}>
                        {report.aiInsights.deviationPercent?.toFixed(1)}%
                      </span>
                    </div>
                    <div className="suggestion-box" style={{
                      borderColor: report.aiInsights.anomalyDetected ? '#ef4444' : '#38bdf8',
                      background: report.aiInsights.anomalyDetected ? 'rgba(239,68,68,0.1)' : 'rgba(56,189,248,0.1)'
                    }}>
                      {report.aiInsights.optimizationSuggestion}
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </>
        )
      )}
    </div>
  );
}

export default App;