import { useState } from 'react';

interface User { id: number; username: string; email: string; role: string; }

export default function AdminPanel({ token, onUpload, onReset }: any) {
    const [users, setUsers] = useState<User[]>([]);
    const [viewUsers, setViewUsers] = useState(false);

    const fetchUsers = async () => {
        const res = await fetch('http://localhost:8081/api/admin/users', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) setUsers(await res.json());
    };

    const handleDeleteUser = async (id: number) => {
        if(!confirm("Delete user?")) return;
        await fetch(`http://localhost:8081/api/admin/users/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        fetchUsers();
    };

    return (
        <div className="admin-panel-container" style={{padding: '20px', background: '#1e293b', marginTop: '20px', borderRadius: '8px', border: '1px solid #3b82f6'}}>
            <h3 style={{color: '#3b82f6', marginTop: 0}}>🛠️ Admin Control Center</h3>
            
            <div style={{display: 'flex', gap: '15px', flexWrap: 'wrap'}}>
                {/* DATASET MANAGEMENT */}
                <div style={{borderRight: '1px solid #334155', paddingRight: '20px'}}>
                    <h4>Data Management</h4>
                    <div style={{display: 'flex', gap: '10px'}}>
                        <label className="btn btn-primary" style={{cursor:'pointer', background: '#0f172a', border: '1px solid #3b82f6'}}>
                            📤 Upload New CSV
                            <input type="file" onChange={onUpload} accept=".csv" style={{display: 'none'}} />
                        </label>
                        <button className="btn btn-danger" style={{background: '#ef4444'}} onClick={onReset}>
                            🗑️ Clear Database
                        </button>
                    </div>
                </div>

                {/* USER MANAGEMENT */}
                <div style={{flex: 1}}>
                    <h4>User Management</h4>
                    <button className="btn" onClick={() => { setViewUsers(!viewUsers); if(!viewUsers) fetchUsers(); }}>
                        {viewUsers ? 'Hide Registered Users' : '👥 Show Registered Users'}
                    </button>
                    
                    {viewUsers && (
                        <div style={{marginTop: '10px', maxHeight: '200px', overflowY: 'auto', background: '#0f172a', padding: '10px'}}>
                            <table style={{width: '100%', textAlign: 'left', fontSize: '0.85rem'}}>
                                <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Action</th></tr></thead>
                                <tbody>
                                    {users.map(u => (
                                        <tr key={u.id} style={{borderBottom: '1px solid #334155'}}>
                                            <td>{u.username}</td>
                                            <td>{u.email}</td>
                                            <td><span style={{color: u.role === 'ADMIN' ? '#fbbf24' : '#fff'}}>{u.role}</span></td>
                                            <td>
                                                {u.role !== 'ADMIN' && (
                                                    <button onClick={() => handleDeleteUser(u.id)} style={{color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer'}}>✖</button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}