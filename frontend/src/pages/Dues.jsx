import { useState, useEffect } from 'react';
import API from '../services/api';
import Modal from '../components/Modal';

const Dues = () => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMember, setSelectedMember] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [paymentData, setPaymentData] = useState({
        amount: '',
        method: 'Cash',
        date: new Date().toISOString().split('T')[0]
    });

    const fetchDues = async () => {
        try {
            // We'll fetch all members and filter for those with dues > 0
            // In a larger app, we'd have a specific /api/members/dues endpoint
            const { data } = await API.get('/members?limit=100');
            const membersWithDues = data.members.filter(m => (m.planPrice - m.paidAmount) > 0);
            setMembers(membersWithDues);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching dues:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDues();
    }, []);

    const handlePayment = async (e) => {
        e.preventDefault();
        try {
            await API.post('/payments', {
                memberId: selectedMember._id,
                ...paymentData
            });
            setShowModal(false);
            fetchDues(); // Refresh the list
        } catch (error) {
            console.error('Error processing payment:', error);
        }
    };

    const openPaymentModal = (member) => {
        setSelectedMember(member);
        setPaymentData({
            amount: member.planPrice - member.paidAmount, // Default to full due amount
            method: 'Cash',
            date: new Date().toISOString().split('T')[0]
        });
        setShowModal(true);
    };

    return (
        <div className="fade-in">
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: 'var(--text-primary)' }}>Due Management</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Track and collect outstanding balances from members.</p>
            </div>

            <div className="glass" style={{ padding: '1.5rem', borderRadius: '12px' }}>
                <table className="table">
                    <thead>
                        <tr>
                            <th>Member Name</th>
                            <th>Phone</th>
                            <th>Plan Price</th>
                            <th>Paid</th>
                            <th>Balance Due</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {members.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                                    No outstanding dues found.
                                </td>
                            </tr>
                        ) : (
                            members.map((member) => (
                                <tr key={member._id}>
                                    <td style={{ fontWeight: '600' }}>{member.name}</td>
                                    <td>{member.phone}</td>
                                    <td>${member.planPrice}</td>
                                    <td style={{ color: 'var(--accent-color)' }}>${member.paidAmount}</td>
                                    <td style={{ color: 'var(--danger-color)', fontWeight: '700' }}>
                                        ${member.planPrice - member.paidAmount}
                                    </td>
                                    <td>
                                        <button
                                            onClick={() => openPaymentModal(member)}
                                            className="btn btn-primary"
                                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                                        >
                                            Collect Payment
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <Modal show={showModal} onClose={() => setShowModal(false)} title={`Collect Payment - ${selectedMember?.name}`}>
                <form onSubmit={handlePayment}>
                    <div className="input-group">
                        <label>Amount Due: ${selectedMember ? (selectedMember.planPrice - selectedMember.paidAmount) : 0}</label>
                        <input
                            type="number"
                            className="input"
                            required
                            max={selectedMember ? (selectedMember.planPrice - selectedMember.paidAmount) : undefined}
                            value={paymentData.amount}
                            onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                        />
                    </div>
                    <div className="input-group">
                        <label>Payment Method</label>
                        <select
                            className="input"
                            value={paymentData.method}
                            onChange={(e) => setPaymentData({ ...paymentData, method: e.target.value })}
                        >
                            <option value="Cash">Cash</option>
                            <option value="UPI">UPI</option>
                            <option value="Card">Card</option>
                        </select>
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                        Confirm Payment
                    </button>
                </form>
            </Modal>
        </div>
    );
};

export default Dues;
