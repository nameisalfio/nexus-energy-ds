import { useEffect, useState, type ChangeEvent } from 'react';
import './App.css';
import type { SystemReport, WeeklyStat } from './types';

const API_BASE = "http://localhost:8081/api";

function App() {
  const [report, setReport] = useState<SystemReport | null>(null);
  const [weekly, setWeekly] = useState<WeeklyStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

      if (!resReport.ok || !resWeekly.ok) throw new Error("Server error");

      setReport(await resReport.json());
      setWeekly(await resWeekly.json());
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const formData = new FormData();
    formData.append("file", e.target.files[0]);

    try {
      const res = await fetch(`${API_BASE}/ingest-dataset`, { method: "POST", body: formData });
      if (res.ok) {
        alert("Dataset Loaded!");
        fetchData();
      }
    } catch (err) {
      alert("Upload Failed");
    }
  };

  if (loading) return <div className="container">Loading Dashboard...</div>;
  if (error) return <div className="container" style={{color: 'red'}}>Connection Error: {error}</div>;

  return (
    <div className="container">
      {/* HEADER */}
      <header className="header">
        <div className="brand">
          <span className="brand-icon">⚡</span>
          <div>
            <h1>Energy Monitor</h1>
            <span style={{color: '#94a3b8', fontSize: '0.9rem'}}>Enterprise Dashboard</span>
          </div>
        </div>
        <div className="actions">
          <label className="upload-btn">
            📂 Upload CSV
            <input type="file" onChange={handleUpload} accept=".csv" style={{display: 'none'}} />
          </label>
        </div>
      </header>

      {report && (
        <>
          {/* KPI CARDS (TOP ROW) */}
          <div className="kpi-grid">
            <div className="card">
              <div className="card-label">Avg Temperature</div>
              <div className="card-value">{report.stats.averageTemperature.toFixed(1)} <span className="card-unit">°C</span></div>
            </div>
            <div className="card">
              <div className="card-label">Total Energy</div>
              <div className="card-value">{report.stats.totalEnergyConsumption.toFixed(0)} <span className="card-unit">kWh</span></div>
            </div>
            <div className="card">
              <div className="card-label">Peak Load</div>
              <div className="card-value">{report.stats.peakLoad.toFixed(2)} <span className="card-unit">kWh</span></div>
            </div>
            <div className="card">
              <div className="card-label">Data Points</div>
              <div className="card-value">{report.stats.totalRecords}</div>
            </div>
          </div>

          {/* MAIN LAYOUT: LEFT (DATA) | RIGHT (AI) */}
          <div className="dashboard-layout">
            
            {/* LEFT COLUMN */}
            <div className="main-content">
              
              <h2>📊 Weekly Consumption</h2>
              <div className="weekly-row">
                {weekly.map((s, i) => (
                  <div key={i} className="day-card">
                    <div style={{color: '#94a3b8', fontSize: '0.8rem', marginBottom: '5px'}}>{s.day}</div>
                    <div style={{fontWeight: 'bold', color: '#38bdf8'}}>{s.avgConsumption.toFixed(1)}</div>
                  </div>
                ))}
              </div>

              <h2>📝 Live Data Log</h2>
              <div className="table-container">
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Temp</th>
                        <th>Hum</th>
                        <th>Occ</th>
                        <th>HVAC</th>
                        <th>Load (kWh)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.recentReadings.map(r => (
                        <tr key={r.id}>
                          <td>{new Date(r.timestamp).toLocaleString(undefined, {month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit'})}</td>
                          <td>{r.temperature.toFixed(1)}°</td>
                          <td>{r.humidity.toFixed(0)}%</td>
                          <td>{r.occupancy}</td>
                          <td>
                            <span className={`badge ${r.hvacStatus === 'On' ? 'b-on' : 'b-off'}`}>{r.hvacStatus}</span>
                          </td>
                          <td style={{color: '#fbbf24', fontWeight: 'bold'}}>{r.consumption.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN (AI SIDEBAR) */}
            <div className="sidebar">
              <div className="ai-panel" style={{borderColor: report.aiInsights.anomalyDetected ? '#ef4444' : '#10b981'}}>
                <div className="ai-header">
                  <strong>🧠 AI Digital Twin</strong>
                  <span className="status-dot" style={{backgroundColor: report.aiInsights.anomalyDetected ? '#ef4444' : '#10b981'}}></span>
                </div>
                
                <div className="ai-body">
                  <div className="ai-metric">
                    <span className="metric-label">AI Prediction</span>
                    <span className="metric-val" style={{color: '#38bdf8'}}>{report.aiInsights.expectedValue.toFixed(2)} kWh</span>
                  </div>
                  
                  <div className="ai-metric">
                    <span className="metric-label">Real Value</span>
                    <span className="metric-val" style={{color: '#fff'}}>{report.aiInsights.actualValue.toFixed(2)} kWh</span>
                  </div>

                  <div className="ai-metric">
                    <span className="metric-label">Deviation</span>
                    <span className="metric-val" style={{color: report.aiInsights.anomalyDetected ? '#ef4444' : '#10b981'}}>
                      {report.aiInsights.deviationPercent.toFixed(1)}%
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