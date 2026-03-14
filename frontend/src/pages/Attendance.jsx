import { useState, useEffect, useCallback } from 'react';
import { getMembers, markAttendance, getTodayAttendance, getMemberAttendance } from '../services/apiService';
import Modal from '../components/Modal';
import QRScanner from '../components/QRScanner';

const Attendance = () => {
    const [members, setMembers] = useState([]);
    const [todayList, setTodayList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMember, setSelectedMember] = useState('');
    const [message, setMessage] = useState({ text: '', type: '' });
    const [selectedMemberHistory, setSelectedMemberHistory] = useState(null);
    const [isScannerOpen, setIsScannerOpen] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [membersData, attendanceData] = await Promise.all([
                getMembers('Active'),
                getTodayAttendance()
            ]);
            setMembers(membersData.members || []);
            setTodayList(attendanceData);
        } catch (error) {
            console.error('Error fetching attendance data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAttendance = async (memberId = null) => {
        const idToMark = memberId || selectedMember;
        if (!idToMark) return;

        try {
            await markAttendance({ memberId: idToMark });
            setMessage({ text: 'Attendance marked successfully!', type: 'success' });
            setSelectedMember('');
            if (isScannerOpen) setIsScannerOpen(false);
            fetchData();
        } catch (error) {
            setMessage({ text: error.response?.data?.message || 'Error marking attendance', type: 'error' });
        }
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    };

    const handleScanSuccess = useCallback((decodedText) => {
        console.log(`Scan successful: ${decodedText}`);
        // The decoded text should be the member ID
        handleMarkAttendance(decodedText);
    }, [handleMarkAttendance]);

    const handleScanError = (error) => {
        // console.warn(`Code scan error = ${error}`);
    };

    const viewHistory = async (memberId) => {
        try {
            const history = await getMemberAttendance(memberId);
            const member = members.find(m => m._id === memberId) || todayList.find(a => a.memberId?._id === memberId)?.memberId;
            setSelectedMemberHistory({ memberName: member?.name, history });
        } catch (error) {
            alert('Error fetching attendance history');
        }
    };

    if (loading) return <div className="spinner"></div>;

    return (
        <div>
            <h2 style={{ marginBottom: '2rem' }}>Attendance Tracking</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
                <div className="card">
                    <h3 style={{ marginBottom: '1rem' }}>Manual Check-In</h3>
                    {message.text && (
                        <div style={{
                            padding: '0.75rem',
                            borderRadius: '8px',
                            marginBottom: '1rem',
                            background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: message.type === 'success' ? 'var(--success-color)' : 'var(--danger-color)',
                            fontWeight: '600',
                            textAlign: 'center'
                        }}>
                            {message.text}
                        </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <select
                            className="input"
                            value={selectedMember}
                            onChange={(e) => setSelectedMember(e.target.value)}
                        >
                            <option value="">Select Member</option>
                            {members.map(m => <option key={m._id} value={m._id}>{m.name} ({m.phone})</option>)}
                        </select>
                        <button className="btn btn-primary" onClick={() => handleMarkAttendance()} disabled={!selectedMember}>Mark Check-In</button>
                    </div>
                </div>

                <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>QR Attendance</h3>
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Scan member QR code to mark attendance automatically.</p>
                        <button
                            className={`btn ${isScannerOpen ? 'btn-danger' : 'btn-primary'}`}
                            style={{ width: '100%', maxWidth: '200px' }}
                            onClick={() => setIsScannerOpen(!isScannerOpen)}
                        >
                            {isScannerOpen ? 'Stop Scanner' : '📱 Start QR Scanner'}
                        </button>
                    </div>
                </div>
            </div>

            {isScannerOpen && (
                <div className="card" style={{ marginBottom: '2rem', textAlign: 'center' }}>
                    <h3 style={{ marginBottom: '1rem' }}>Scanning...</h3>
                    <QRScanner onScanSuccess={handleScanSuccess} onScanError={handleScanError} />
                </div>
            )}

            <div className="card" style={{ padding: 0 }}>
                <h3 style={{ padding: '1.5rem', paddingBottom: '0.5rem' }}>Today's Attendance</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Member</th>
                            <th>Phone</th>
                            <th>Check-In Time</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {todayList.length > 0 ? todayList.map(a => (
                            <tr key={a._id}>
                                <td>{a.memberId?.name}</td>
                                <td>{a.memberId?.phone}</td>
                                <td style={{ fontWeight: '600' }}>{a.checkInTime}</td>
                                <td>
                                    <button className="btn" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', border: '1px solid var(--border-color)' }} onClick={() => viewHistory(a.memberId?._id)}>History</button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No attendance marked today.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={!!selectedMemberHistory} onClose={() => setSelectedMemberHistory(null)} title={`Attendance History - ${selectedMemberHistory?.memberName}`}>
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {selectedMemberHistory?.history.length > 0 ? (
                        <table style={{ boxShadow: 'none' }}>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedMemberHistory.history.map(a => (
                                    <tr key={a._id}>
                                        <td>{new Date(a.date).toLocaleDateString()}</td>
                                        <td style={{ fontWeight: '600' }}>{a.checkInTime}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p>No attendance records found.</p>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default Attendance;
