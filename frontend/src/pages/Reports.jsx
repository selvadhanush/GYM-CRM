import { useState } from 'react';
import API from '../services/api';

const Reports = () => {
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());

    const downloadReport = async (type) => {
        try {
            const response = await API.get(`/reports/${type}?month=${month}&year=${year}`, {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${type}_report_${month}_${year}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error(`Error downloading ${type} report:`, error);
        }
    };

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    return (
        <div className="fade-in">
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.875rem', fontWeight: '700' }}>Export Reports</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Select a month and year to download CSV reports.</p>
            </div>

            <div className="glass" style={{ padding: '2rem', borderRadius: '16px', maxWidth: '600px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                    <div className="input-group">
                        <label>Month</label>
                        <select className="input" value={month} onChange={(e) => setMonth(e.target.value)}>
                            {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                        </select>
                    </div>
                    <div className="input-group">
                        <label>Year</label>
                        <input type="number" className="input" value={year} onChange={(e) => setYear(e.target.value)} />
                    </div>
                </div>

                <div style={{ display: 'grid', gap: '1rem' }}>
                    <button onClick={() => downloadReport('revenue')} className="btn btn-primary" style={{ justifyContent: 'space-between', padding: '1rem' }}>
                        <span>💰 Monthly Revenue Report</span>
                        <span>⬇️</span>
                    </button>
                    <button onClick={() => downloadReport('expenses')} className="btn btn-primary" style={{ justifyContent: 'space-between', padding: '1rem', background: 'var(--accent-color)' }}>
                        <span>📉 Monthly Expense Report</span>
                        <span>⬇️</span>
                    </button>
                    {/* Future: Attendance report */}
                </div>
            </div>
        </div>
    );
};

export default Reports;
