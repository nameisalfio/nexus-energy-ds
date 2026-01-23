import { useEffect, useState, type ChangeEvent } from 'react';
import './App.css';
import Login from './Login';
import type { SystemReport, WeeklyStat, Reading } from './types';

const API_BASE = "http://localhost:8081/api";

function App() {
  // AUTH STATE
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [username, setUsername] = useState<string | null>(localStorage.getItem('username'));

  // DATA STATE
  const [report, setReport] = useState<SystemReport | null>(null);
  const [weekly, setWeekly] = useState<WeeklyStat[]>([]);
  const [liveReadings, setLiveReadings] = useState<Reading[]>([]);
  
  // UI STATE (Queste sono le variabili che causavano errore se inutilizzate)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [simulating, setSimulating] = useState(false);

  // LOGOUT FUNCTION
  const handleLogout = () => {
    if(token) {
        fetch(`${API_BASE}/auth/logout`, { 
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        }).catch(err => console.warn("Logout error", err));
    }
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setToken(null);
    setUsername(null);
    setReport(null);
    setLiveReadings([]);
    setError(null);
  };

  // ACTIONS CON TOKEN
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

  // FETCH DATA
  const fetchData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      
      const [resReport, resWeekly] = await Promise.all([
        secureFetch(`${API_BASE}/full-report`),
        secureFetch(`${API_BASE}/stats/weekly`)
      ]);

      if (!resReport.ok) throw new Error("Server not ready or DB empty");

      const data = await resReport.json();
      data.recentReadings = [];
      
      setReport(data);
      setWeekly(await resWeekly.json());
      setLoading(false);
    } catch (err: any) {
      console.warn("Fetch warning:", err);
      setError(err.message || "Failed to load data");
      setLoading(false);
    }
  };

  // INITIAL LOAD
  useEffect(() => {
    if (token) fetchData();
  }, [token]);

  // SSE STREAMING
  useEffect(() => {
    if (!simulating || !token) return;

    console.log("Connecting SSE...");
    const eventSource = new EventSource(`${API_BASE}/stream`); 

    eventSource.addEventListener("update", (event) => {
      const update: SystemReport = JSON.parse(event.data);
      
      if (update.recentReadings && update.recentReadings.length > 0) {
        const newReading = update.recentReadings[0];
        
        setLiveReadings(prev => {
          if (prev.find(r => r.id === newReading.id)) return prev;
          return [newReading, ...prev].slice(0, 30);
        });
      }
      
      setReport(prev => {
        if (!prev) return update;
        return { ...prev, stats: update.stats, aiInsights: update.aiInsights };
      });
    });

    eventSource.onerror = () => eventSource.close();
    return () => eventSource.close();
  }, [simulating, token]);

  const handleStartSim = async () => {
    try {
      setLiveReadings([]); 
      await secureFetch(`${API_BASE}/simulation/start`, { method: 'POST' });
      setSimulating(true);
    } catch (e) { alert("Error starting"); }
  };

  const handleStopSim = async () => {
    try {
      await secureFetch(`${API_BASE}/simulation/stop`, { method: 'POST' });
      setSimulating(false);
    } catch (e) { alert("Error stopping"); }
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
        
        if (res.ok) {
            alert("Dataset Loaded!");
            fetchData();
        } else {
            alert("Upload Failed");
        }
    } catch (err) { alert("Network Error"); } 
    finally { setLoading(false); }
  };


  // --- 1. LOGIN SCREEN ---
  if (!token) {
      return <Login onLoginSuccess={(tk, user) => {
          localStorage.setItem('token', tk);
          localStorage.setItem('username', user);
          setToken(tk);
          setUsername(user);
      }} />;
  }

  // --- 2. LOADING SCREEN (Uso della variabile 'loading') ---
  if (loading && !report) {
      return (
        <div className="container" style={{display:'flex', justifyContent:'center', alignItems:'center', height:'100vh'}}>
            <h2>🔄 Connecting to Energy System...</h2>
        </div>
      );
  }

  // --- 3. ERROR SCREEN (Uso della variabile 'error') ---
  if (error && !report) {
    return (
        <div className="container error">
            <h2>System Offline</h2>
            <p>{error}</p>
            <div style={{marginTop: '20px'}}>
                <label className="upload-btn">
                    📂 Load CSV to Start
                    <input type="file" onChange={handleUpload} accept=".csv" style={{display: 'none'}} />
                </label>
                <button className="btn btn-stop" onClick={handleLogout} style={{marginLeft:'10px'}}>Logout</button>
            </div>
        </div>
    );
  }

  // --- 4. MAIN APP ---
  return (
    <div className="container">
      <header className="header">
        <div className="brand">
          <span className="brand-icon">⚡</span>
          <div>
            <h1>Energy Monitor</h1>
            <span style={{color: '#94a3b8', fontSize: '0.9rem'}}>User: {username}</span>
          </div>
        </div>
        
        <div className="actions">
          {!simulating ? (
            <button className="btn btn-start" onClick={handleStartSim}>▶ Start Live</button>
          ) : (
            <button className="btn btn-stop" onClick={handleStopSim}>⏹ Stop</button>
          )}
          
          <label className="upload-btn">
            📂 Load
            <input type="file" onChange={handleUpload} accept=".csv" style={{display: 'none'}} />
          </label>

          <button className="btn btn-stop" onClick={handleLogout} style={{background: '#334155'}}>
            Logout
          </button>
        </div>
      </header>

      {report ? (
        <>
           {/* KPI GRID */}
           <div className="kpi-grid">
              <div className="card"><div className="card-label">Avg Temp</div><div className="card-value">{report.stats.averageTemperature.toFixed(1)}°</div></div>
              <div className="card"><div className="card-label">Total Energy</div><div className="card-value">{report.stats.totalEnergyConsumption.toLocaleString(undefined, {maximumFractionDigits:0})} <span className="card-unit">kWh</span></div></div>
              <div className="card"><div className="card-label">Peak Load</div><div className="card-value">{report.stats.peakLoad.toFixed(2)} <span className="card-unit">kWh</span></div></div>
              <div className="card"><div className="card-label">Live Records</div><div className="card-value">{report.stats.totalRecords.toLocaleString()}</div></div>
           </div>

           <div className="dashboard-layout">
              <div className="main-content">
                {/* WEEKLY */}
                <h2>📊 Weekly Trends</h2>
                <div className="weekly-row">
                  {weekly && weekly.length > 0 ? weekly.map((s, i) => (
                    <div key={i} className="day-card">
                      <div style={{color: '#94a3b8', fontSize: '0.8rem', marginBottom: '5px'}}>{s.day ? s.day.substring(0,3) : 'N/A'}</div>
                      <div style={{fontWeight: 'bold', color: '#38bdf8'}}>{s.avgConsumption ? s.avgConsumption.toFixed(1) : 0}</div>
                    </div>
                  )) : <p style={{color: '#64748b'}}>No data yet.</p>}
                </div>

                {/* TABLE */}
                <h2>🔴 Live Sensor Feed</h2>
                <div className="table-container">
                  <div className="table-scroll">
                    <table>
                      <thead><tr><th>Time</th><th>Temp</th><th>Hum</th><th>Area</th><th>Occ</th><th>HVAC</th><th>Light</th><th>Renew</th><th>Day</th><th>Holiday</th><th>Load</th></tr></thead>
                      <tbody>
                        {liveReadings.map(r => (
                            <tr key={r.id} className="fade-in-row">
                              <td style={{whiteSpace:'nowrap'}}>{new Date(r.timestamp).toLocaleTimeString()}</td>
                              <td>{r.temperature.toFixed(1)}°</td>
                              <td>{r.humidity.toFixed(0)}%</td>
                              <td>{r.squareFootage.toFixed(0)}</td>
                              <td>{r.occupancy}</td>
                              <td><span className={`badge ${r.hvacUsage === 'On' ? 'b-on' : 'b-off'}`}>{r.hvacUsage}</span></td>
                              <td><span className={`badge ${r.lightingUsage === 'On' ? 'b-on' : 'b-off'}`}>{r.lightingUsage}</span></td>
                              <td>{r.renewableEnergy.toFixed(2)}</td>
                              <td>{r.dayOfWeek.substring(0,3)}</td>
                              <td>{r.holiday === 'Yes' ? <span className="badge b-holiday">YES</span> : <span style={{opacity:0.3}}>No</span>}</td>
                              <td style={{color: '#fbbf24', fontWeight: 'bold'}}>{r.energyConsumption.toFixed(2)}</td>
                            </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* AI SIDEBAR */}
              <div className="sidebar">
                 <div className="ai-panel" style={{borderColor: report.aiInsights.anomalyDetected ? '#ef4444' : '#10b981'}}>
                    <div className="ai-header">
                      <strong>🧠 AI Digital Twin</strong>
                      <span className="status-dot" style={{backgroundColor: report.aiInsights.anomalyDetected ? '#ef4444' : '#10b981'}}></span>
                    </div>
                    <div className="ai-body">
                      <div className="ai-metric"><span className="metric-label">AI Expected</span><span className="metric-val" style={{color: '#38bdf8'}}>{report.aiInsights.expectedValue?.toFixed(2)}</span></div>
                      <div className="ai-metric"><span className="metric-label">Real Value</span><span className="metric-val" style={{color: '#fff'}}>{simulating && liveReadings.length > 0 ? liveReadings[0].energyConsumption.toFixed(2) : report.aiInsights.actualValue?.toFixed(2)}</span></div>
                      <div className="ai-metric"><span className="metric-label">Deviation</span><span className="metric-val" style={{color: report.aiInsights.anomalyDetected ? '#ef4444' : '#10b981'}}>{report.aiInsights.deviationPercent > 0 ? '+' : ''}{report.aiInsights.deviationPercent?.toFixed(1)}%</span></div>
                      <div className="suggestion-box" style={{borderColor: report.aiInsights.anomalyDetected ? '#ef4444' : '#38bdf8', color: report.aiInsights.anomalyDetected ? '#ef4444' : '#38bdf8', background: report.aiInsights.anomalyDetected ? 'rgba(239,68,68,0.1)' : 'rgba(56,189,248,0.1)'}}>{report.aiInsights.optimizationSuggestion}</div>
                    </div>
                 </div>
              </div>
           </div>
        </>
      ) : (
        <div className="container" style={{textAlign:'center', marginTop:'100px'}}>
            <h2>Welcome, {username}</h2>
            <p style={{color:'#94a3b8'}}>Please upload a dataset.</p>
            <br/>
            <label className="upload-btn" style={{fontSize:'1.2rem', padding:'15px 30px'}}>
            📂 Upload CSV
            <input type="file" onChange={handleUpload} accept=".csv" style={{display: 'none'}} />
          </label>
        </div>
      )}
    </div>
  );
}

export default App;