import { useEffect, useState, type ChangeEvent } from 'react';
import './App.css';
import type { SystemReport, WeeklyStat, Reading } from './types';

const API_BASE = "http://localhost:8081/api";

function App() {
  // STATI DATI
  const [report, setReport] = useState<SystemReport | null>(null);
  const [weekly, setWeekly] = useState<WeeklyStat[]>([]);
  const [liveReadings, setLiveReadings] = useState<Reading[]>([]);
  
  // STATI UI
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [simulating, setSimulating] = useState(false);

  // 1. INITIAL FETCH
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resReport, resWeekly] = await Promise.all([
        fetch(`${API_BASE}/full-report`),
        fetch(`${API_BASE}/stats/weekly`)
      ]);

      if (!resReport.ok || !resWeekly.ok) throw new Error("Server Error or DB not ready");

      const data = await resReport.json();
      data.recentReadings = []; // Nascondi storico iniziale
      
      setReport(data);
      setWeekly(await resWeekly.json());
      setError(null); // Reset errore se successo
      setLoading(false);
    } catch (err: any) {
      console.warn("Fetch warning:", err);
      // FIX: Usiamo setError così TypeScript compila. 
      // Questo mostrerà "System Offline" nel div container, non un alert popup.
      setError("Backend non raggiungibile (o DB vuoto).");
      setLoading(false);
    }
  };

  // 2. REAL-TIME STREAMING (SSE)
  useEffect(() => {
    if (!simulating) return;

    console.log("Connecting SSE...");
    const eventSource = new EventSource(`${API_BASE}/stream`);

    eventSource.addEventListener("update", (event) => {
      const update: SystemReport = JSON.parse(event.data);
      const newReading = update.recentReadings[0];
      
      setLiveReadings(prev => [newReading, ...prev].slice(0, 15));
      
      setReport(prev => {
        if (!prev) return update;
        return {
          ...prev,
          stats: update.stats,
          aiInsights: update.aiInsights,
          recentReadings: [] 
        };
      });

      fetch(`${API_BASE}/stats/weekly`)
        .then(res => res.json())
        .then(data => setWeekly(data))
        .catch(err => console.warn("Weekly fetch error", err));
    });

    eventSource.onerror = () => {
      console.log("SSE Closed");
      eventSource.close();
    };

    return () => eventSource.close();
  }, [simulating]);

  // 3. AZIONI UTENTE
  const handleStartSim = async () => {
    try {
      setLiveReadings([]); 
      await fetch(`${API_BASE}/simulation/start`, { method: 'POST' });
      setSimulating(true);
    } catch (e) { alert("Error starting simulation"); }
  };

  const handleStopSim = async () => {
    try {
      await fetch(`${API_BASE}/simulation/stop`, { method: 'POST' });
      setSimulating(false);
    } catch (e) { alert("Error stopping simulation"); }
  };

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const formData = new FormData();
    formData.append("file", e.target.files[0]);

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/ingest-dataset`, { method: "POST", body: formData });
      if (res.ok) {
        alert("Dataset Loaded! System ready.");
        fetchData(); 
      } else {
        alert("Upload Failed");
        setLoading(false);
      }
    } catch (err) {
      alert("Network Error");
      setLoading(false);
    }
  };

  // RENDER
  if (loading && !report) return <div className="container"><h2>Initializing System...</h2></div>;
  
  // Mostra errore solo se non abbiamo dati da mostrare
  if (error && !report) return (
      <div className="container error">
          <h2>System Offline</h2>
          <p>{error}</p>
          <p style={{fontSize: '0.9rem', color: '#94a3b8'}}>Carica un CSV o controlla che il server Docker sia attivo.</p>
          <br/>
          {/* Permettiamo comunque l'upload anche in caso di errore iniziale */}
          <label className="upload-btn">
            📂 Upload CSV to Fix
            <input type="file" onChange={handleUpload} accept=".csv" style={{display: 'none'}} />
          </label>
      </div>
  );

  return (
    <div className="container">
      {/* HEADER */}
      <header className="header">
        <div className="brand">
          <span className="brand-icon">⚡</span>
          <div>
            <h1>Energy Monitor</h1>
            <span style={{color: '#94a3b8', fontSize: '0.9rem'}}>Real-Time AI System</span>
          </div>
        </div>
        
        <div className="actions">
          {!simulating ? (
            <button className="btn btn-start" onClick={handleStartSim}>▶ Start Live</button>
          ) : (
            <button className="btn btn-stop" onClick={handleStopSim}>⏹ Stop</button>
          )}
          <label className="upload-btn">
            📂 Load Data
            <input type="file" onChange={handleUpload} accept=".csv" style={{display: 'none'}} />
          </label>
        </div>
      </header>

      {report && (
        <>
           {/* KPI ROW */}
           <div className="kpi-grid">
              <div className="card">
                <div className="card-label">Avg Temperature</div>
                <div className="card-value">{report.stats.averageTemperature.toFixed(1)}°</div>
              </div>
              <div className="card">
                <div className="card-label">Total Energy</div>
                <div className="card-value">{report.stats.totalEnergyConsumption.toLocaleString(undefined, {maximumFractionDigits:0})} <span className="card-unit">kWh</span></div>
              </div>
              <div className="card">
                <div className="card-label">Peak Load</div>
                <div className="card-value">{report.stats.peakLoad.toFixed(2)} <span className="card-unit">kWh</span></div>
              </div>
              <div className="card">
                <div className="card-label">Live Records</div>
                <div className="card-value">{report.stats.totalRecords.toLocaleString()}</div>
              </div>
           </div>

           <div className="dashboard-layout">
              {/* LEFT COL */}
              <div className="main-content">
                
                {/* WEEKLY STATS */}
                <h2>📊 Weekly Trends</h2>
                <div className="weekly-row">
                  {weekly && weekly.length > 0 ? weekly.map((s, i) => (
                    <div key={i} className="day-card">
                      <div style={{color: '#94a3b8', fontSize: '0.8rem', marginBottom: '5px'}}>{s.day.substring(0,3)}</div>
                      <div style={{fontWeight: 'bold', color: '#38bdf8'}}>{s.avgConsumption.toFixed(1)}</div>
                    </div>
                  )) : <p style={{color: '#64748b'}}>No data yet.</p>}
                </div>

                {/* LIVE TABLE */}
                <h2>🔴 Live Sensor Feed</h2>
                <div className="table-container">
                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>Time</th><th>Temp</th><th>Hum</th><th>Area</th><th>Occ</th><th>HVAC</th><th>Light</th><th>Renew</th><th>Day</th><th>Holiday</th><th>Load (kWh)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {liveReadings.length === 0 ? (
                          <tr><td colSpan={11} style={{textAlign:'center', padding:'30px', color:'#64748b'}}>Waiting for stream...</td></tr>
                        ) : (
                          liveReadings.map(r => (
                            <tr key={r.id} className="fade-in-row">
                              <td style={{whiteSpace:'nowrap'}}>{new Date(r.timestamp).toLocaleTimeString()}</td>
                              <td>{r.temperature.toFixed(1)}°</td>
                              <td>{r.humidity.toFixed(0)}%</td>
                              <td>{r.squareFootage.toFixed(0)}</td>
                              <td>{r.occupancy}</td>
                              
                              <td><span className={`badge ${r.hvacStatus === 'On' ? 'b-on' : 'b-off'}`}>{r.hvacStatus}</span></td>
                              <td><span className={`badge ${r.lightingStatus === 'On' ? 'b-on' : 'b-off'}`}>{r.lightingStatus}</span></td>
                              
                              <td>{r.renewableEnergy.toFixed(2)}</td>
                              <td>{r.dayOfWeek.substring(0,3)}</td>
                              
                              <td>
                                {r.holiday === 'Yes' ? <span className="badge b-holiday">YES</span> : <span style={{opacity:0.3}}>No</span>}
                              </td>
                              
                              <td style={{color: '#fbbf24', fontWeight: 'bold', fontSize: '1.1rem'}}>
                                {r.consumption.toFixed(2)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* RIGHT COL (AI) */}
              <div className="sidebar">
                 <div className="ai-panel" style={{borderColor: report.aiInsights.anomalyDetected ? '#ef4444' : '#10b981'}}>
                    <div className="ai-header">
                      <strong>🧠 AI Digital Twin</strong>
                      <span className="status-dot" style={{backgroundColor: report.aiInsights.anomalyDetected ? '#ef4444' : '#10b981'}}></span>
                    </div>
                    <div className="ai-body">
                      
                      <div className="ai-metric">
                        <span className="metric-label">AI Expected</span>
                        <span className="metric-val" style={{color: '#38bdf8'}}>{report.aiInsights.expectedValue?.toFixed(2) || 0}</span>
                      </div>
                      
                      <div className="ai-metric">
                        <span className="metric-label">Real Value</span>
                        <span className="metric-val" style={{color: '#fff'}}>
                           {simulating && liveReadings.length > 0 ? liveReadings[0].consumption.toFixed(2) : report.aiInsights.actualValue?.toFixed(2) || 0}
                        </span>
                      </div>

                      <div className="ai-metric">
                        <span className="metric-label">Deviation</span>
                        <span className="metric-val" style={{
                            color: report.aiInsights.anomalyDetected ? '#ef4444' : '#10b981'
                        }}>
                            {report.aiInsights.deviationPercent > 0 ? '+' : ''}
                            {report.aiInsights.deviationPercent?.toFixed(1)}%
                        </span>
                      </div>

                      <div className="suggestion-box" style={{
                        borderColor: report.aiInsights.anomalyDetected ? '#ef4444' : '#38bdf8',
                        color: report.aiInsights.anomalyDetected ? '#ef4444' : '#38bdf8',
                        background: report.aiInsights.anomalyDetected ? 'rgba(239,68,68,0.1)' : 'rgba(56,189,248,0.1)'
                      }}>
                        {report.aiInsights.optimizationSuggestion}
                      </div>
                    </div>
                 </div>
              </div>
           </div>
        </>
      )}
    </div>
  );
}

export default App;