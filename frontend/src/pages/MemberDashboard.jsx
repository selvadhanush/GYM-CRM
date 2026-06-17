import { useState, useEffect, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import API from '../services/api';

const MemberDashboard = () => {
    const [plan, setPlan] = useState(null);
    const [attendance, setAttendance] = useState([]);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [qrFullscreen, setQrFullscreen] = useState(false);
    const [paying, setPaying] = useState(false);
    const [paymentModal, setPaymentModal] = useState(false);
    const [customAmount, setCustomAmount] = useState('');
    const qrRef = useRef(null);

    const fetchMemberData = async () => {
        try {
            const [planRes, attRes, payRes] = await Promise.all([
                API.get('/member-portal/plan'),
                API.get('/member-portal/attendance'),
                API.get('/member-portal/payments')
            ]);
            setPlan(planRes.data);
            setAttendance(attRes.data);
            setPayments(payRes.data);
        } catch (error) {
            console.error('Error fetching member data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMemberData();

        // Load Razorpay script
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);

    const amountDue = plan ? (plan.planPrice - plan.paidAmount) : 0;

    const openPaymentModal = () => {
        setCustomAmount(amountDue.toString());
        setPaymentModal(true);
    };

    const handlePayment = async () => {
        const amount = parseFloat(customAmount);
        if (!amount || amount <= 0 || amount > amountDue) {
            alert(`Please enter a valid amount between ₹1 and ₹${amountDue}`);
            return;
        }

        setPaymentModal(false);
        setPaying(true);
        try {
            // 1. Create Order with the custom partial amount
            const { data: order } = await API.post('/member-portal/payment/create-order', { amount });

            if (order.is_mock) {
                // Bypass Razorpay popup for mock orders
                try {
                    const verifyRes = await API.post('/member-portal/payment/verify', {
                        razorpay_order_id: order.id,
                        razorpay_payment_id: `pay_mock_${Math.random().toString(36).substring(2, 11)}`,
                        razorpay_signature: 'mock_signature',
                        amount_paid: amount
                    });
                    const remaining = verifyRes.data.remainingDue || 0;
                    if (remaining > 0) {
                        alert(`✅ [MOCK PAYMENT] Payment of ₹${amount} successful!\n💳 Remaining due: ₹${remaining}`);
                    } else {
                        alert('✅ [MOCK PAYMENT] Payment successful! Your dues are fully cleared.');
                    }
                    fetchMemberData(); // Refresh UI
                } catch (err) {
                    alert('Mock payment verification failed.');
                }
                return;
            }

            // 2. Open Razorpay Popup
            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID || '',
                amount: order.amount,
                currency: order.currency,
                name: "GYM-CRM",
                description: `Payment for ${plan?.planId?.name}`,
                order_id: order.id,
                handler: async function (response) {
                    try {
                        // 3. Verify Payment — send the actual amount paid
                        const verifyRes = await API.post('/member-portal/payment/verify', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            amount_paid: amount
                        });
                        const remaining = verifyRes.data.remainingDue || 0;
                        if (remaining > 0) {
                            alert(`✅ Payment of ₹${amount} successful!\n💳 Remaining due: ₹${remaining}`);
                        } else {
                            alert('✅ Payment successful! Your dues are fully cleared.');
                        }
                        fetchMemberData(); // Refresh UI
                    } catch (err) {
                        alert('Payment verification failed.');
                    }
                },
                prefill: {
                    name: plan?.name,
                    email: plan?.email,
                    contact: plan?.phone
                },
                theme: {
                    color: "#6366f1"
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (error) {
            console.error('Payment initiation failed:', error);
            alert(error.response?.data?.message || 'Failed to initiate payment.');
        } finally {
            setPaying(false);
        }
    };

    const downloadQR = () => {
        const canvas = qrRef.current?.querySelector('canvas');
        if (!canvas) return;
        const url = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `${plan?.name || 'member'}-QR.png`;
        link.href = url;
        link.click();
    };

    if (loading) return <div className="spinner"></div>;

    const daysLeft = plan ? Math.ceil((new Date(plan.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)) : 0;
    const memberId = plan?._id || '';
    // amountDue is already computed above

    return (
        <div className="fade-in">
            <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
                Welcome back, {plan?.name}! 👋
            </h1>

            {/* Top row: Plan + Balance + QR */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>

                {/* Plan Card */}
                <div className="glass" style={{ padding: '1.5rem', borderRadius: '16px', borderLeft: `6px solid ${plan?.status === 'Frozen' ? 'var(--primary-color)' : 'var(--primary-hover)'}` }}>
                    <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Plan</h3>
                    <p style={{ fontSize: '1.5rem', fontWeight: '800', margin: '0.5rem 0' }}>{plan?.planId?.name || 'No Plan'}</p>
                    {plan?.status === 'Frozen' && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'var(--primary-muted)', color: 'var(--primary-color)', padding: '0.3rem 0.75rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: '700', marginBottom: '0.75rem' }}>
                            ❄️ Membership Frozen
                        </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            Expires: {new Date(plan?.expiryDate).toLocaleDateString()}
                        </span>
                        <span style={{
                            background: plan?.status === 'Frozen' ? 'var(--primary-light)' : daysLeft > 7 ? 'var(--success-light)' : 'var(--danger-light)',
                            color: plan?.status === 'Frozen' ? 'var(--primary-color)' : daysLeft > 7 ? 'var(--success-color)' : 'var(--danger-color)',
                            padding: '0.25rem 0.75rem', borderRadius: '9999px',
                            fontSize: '0.75rem', fontWeight: '700'
                        }}>
                            {plan?.status === 'Frozen' ? '❄️ Paused' : daysLeft > 0 ? `${daysLeft} Days Left` : 'Expired'}
                        </span>
                    </div>
                </div>

                {/* Due Balance */}
                <div className="glass" style={{ padding: '1.5rem', borderRadius: '16px', borderLeft: '6px solid var(--accent-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                        <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Due Balance</h3>
                        <p style={{
                            fontSize: '1.5rem', fontWeight: '800', margin: '0.5rem 0',
                            color: amountDue > 0 ? 'var(--danger-color)' : 'var(--success-color)'
                        }}>
                            ₹{amountDue}
                        </p>
                        {amountDue > 0 && (
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                                Paid ₹{plan?.paidAmount} of ₹{plan?.planPrice}
                            </p>
                        )}
                    </div>
                    <div>
                        {amountDue > 0 && (
                            <button
                                onClick={openPaymentModal}
                                disabled={paying}
                                className="btn btn-primary"
                                style={{ width: '100%', marginTop: '1rem', background: 'var(--accent-color)' }}
                            >
                                {paying ? 'Processing...' : `💳 Pay Now`}
                            </button>
                        )}
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Total Paid: ₹{plan?.paidAmount}</p>
                    </div>
                </div>

                {/* QR Code Card */}
                <div className="glass" style={{
                    padding: '1.5rem', borderRadius: '16px',
                    borderLeft: '6px solid #10b981',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem'
                }}>
                    <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', alignSelf: 'flex-start' }}>
                        My Attendance QR
                    </h3>
                    <div ref={qrRef} style={{
                        background: '#fff', padding: '12px', borderRadius: '12px',
                        cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
                    }} onClick={() => setQrFullscreen(true)} title="Click to enlarge">
                        <QRCodeCanvas
                            value={memberId}
                            size={130}
                            level="H"
                            includeMargin={false}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                        <button
                            onClick={() => setQrFullscreen(true)}
                            className="btn btn-secondary"
                            style={{ flex: 1, fontSize: '0.8rem', padding: '0.5rem', background: 'rgba(16,185,129,0.1)', color: '#10b981' }}
                        >
                            🔍 Fullscreen
                        </button>
                        <button
                            onClick={downloadQR}
                            className="btn btn-secondary"
                            style={{ flex: 1, fontSize: '0.8rem', padding: '0.5rem', background: 'rgba(99,102,241,0.1)', color: 'var(--primary-color)' }}
                        >
                            ⬇️ Download
                        </button>
                    </div>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textAlign: 'center', margin: 0 }}>
                        Show this QR to gym staff to mark attendance
                    </p>
                </div>
            </div>

            {/* History Tables */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <a href="/member-classes" style={{ textDecoration: 'none' }}>
                    <div className="glass" style={{
                        padding: '1.25rem 1.5rem', borderRadius: '14px',
                        borderLeft: '5px solid #f59e0b', cursor: 'pointer',
                        transition: 'transform 0.2s', display: 'flex', alignItems: 'center', gap: '1rem'
                    }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        <span style={{ fontSize: '2rem' }}>🏋️</span>
                        <div>
                            <div style={{ fontWeight: '800', fontSize: '0.95rem' }}>Browse Classes</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Yoga, Zumba, HIIT &amp; more</div>
                        </div>
                    </div>
                </a>
            </div>

            {/* History Tables */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
                {/* Attendance History */}
                <div className="card">
                    <h3 style={{ marginBottom: '1rem' }}>Recent Attendance</h3>
                    {attendance.length > 0 ? (
                        <table className="table">
                            <thead>
                                <tr><th>Date</th><th>Status</th></tr>
                            </thead>
                            <tbody>
                                {attendance.slice(0, 5).map(att => (
                                    <tr key={att._id}>
                                        <td>{new Date(att.date).toLocaleDateString()}</td>
                                        <td><span className="badge badge-active">Present</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : <p style={{ color: 'var(--text-secondary)' }}>No attendance records yet.</p>}
                </div>

                {/* Payment History */}
                <div className="card">
                    <h3 style={{ marginBottom: '1rem' }}>Payment History</h3>
                    {payments.length > 0 ? (
                        <table className="table">
                            <thead>
                                <tr><th>Date</th><th>Amount</th><th>Method</th></tr>
                            </thead>
                            <tbody>
                                {payments.slice(0, 5).map(pay => (
                                    <tr key={pay._id}>
                                        <td>{new Date(pay.date).toLocaleDateString()}</td>
                                        <td style={{ fontWeight: '700' }}>₹{pay.amount}</td>
                                        <td>{pay.method}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : <p style={{ color: 'var(--text-secondary)' }}>No payments recorded yet.</p>}
                </div>
            </div>

            {/* Partial Payment Modal */}
            {paymentModal && (
                <div
                    onClick={() => setPaymentModal(false)}
                    style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 2000
                    }}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{
                            background: 'var(--card-bg, #1e1e2e)', borderRadius: '20px',
                            padding: '2rem', width: '100%', maxWidth: '420px',
                            boxShadow: '0 20px 80px rgba(0,0,0,0.5)',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}
                    >
                        <h3 style={{ marginBottom: '0.5rem', fontSize: '1.2rem', fontWeight: '800' }}>💳 Make a Payment</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                            Total Due: <strong style={{ color: 'var(--danger-color)' }}>₹{amountDue}</strong>
                        </p>

                        {/* Quick Amount Buttons */}
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                            {[
                                { label: '25%', val: Math.ceil(amountDue * 0.25) },
                                { label: '50%', val: Math.ceil(amountDue * 0.5) },
                                { label: '75%', val: Math.ceil(amountDue * 0.75) },
                                { label: 'Full', val: amountDue },
                            ].map(opt => (
                                <button
                                    key={opt.label}
                                    onClick={() => setCustomAmount(opt.val.toString())}
                                    className="btn"
                                    style={{
                                        flex: 1, fontSize: '0.8rem', padding: '0.4rem 0.6rem',
                                        background: parseFloat(customAmount) === opt.val ? 'var(--primary-color)' : 'rgba(99,102,241,0.1)',
                                        color: parseFloat(customAmount) === opt.val ? '#fff' : 'var(--primary-color)',
                                        border: '1px solid var(--primary-color)',
                                        borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s'
                                    }}
                                >
                                    {opt.label}<br />
                                    <span style={{ fontSize: '0.7rem' }}>₹{opt.val}</span>
                                </button>
                            ))}
                        </div>

                        {/* Custom Amount Input */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
                                Enter Amount (₹1 – ₹{amountDue})
                            </label>
                            <input
                                type="number"
                                className="input"
                                value={customAmount}
                                min={1}
                                max={amountDue}
                                onChange={e => setCustomAmount(e.target.value)}
                                style={{ width: '100%', fontSize: '1.2rem', fontWeight: '700', textAlign: 'center' }}
                                placeholder={`Max ₹${amountDue}`}
                            />
                            {parseFloat(customAmount) > 0 && parseFloat(customAmount) < amountDue && (
                                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.4rem', textAlign: 'center' }}>
                                    ₹{(amountDue - parseFloat(customAmount)).toFixed(0)} will remain as due after this payment
                                </p>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button
                                onClick={() => setPaymentModal(false)}
                                className="btn btn-secondary"
                                style={{ flex: 1 }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePayment}
                                className="btn btn-primary"
                                style={{ flex: 2, background: 'var(--accent-color)' }}
                                disabled={!customAmount || parseFloat(customAmount) <= 0 || parseFloat(customAmount) > amountDue}
                            >
                                Pay ₹{parseFloat(customAmount) > 0 ? parseFloat(customAmount) : '—'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Fullscreen QR Modal */}
            {qrFullscreen && (
                <div
                    onClick={() => setQrFullscreen(false)}
                    style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        zIndex: 2000, gap: '1.5rem', cursor: 'pointer'
                    }}
                >
                    <p style={{ color: '#fff', fontSize: '0.875rem', opacity: 0.6 }}>Tap anywhere to close</p>
                    <div style={{ background: '#fff', padding: '24px', borderRadius: '20px', boxShadow: '0 20px 80px rgba(0,0,0,0.5)' }}
                        onClick={e => e.stopPropagation()}>
                        <QRCodeCanvas value={memberId} size={280} level="H" includeMargin={false} />
                    </div>
                    <p style={{ color: '#fff', fontWeight: '700', fontSize: '1.1rem', margin: 0 }}>{plan?.name}</p>
                    <p style={{ color: '#aaa', fontSize: '0.8rem', margin: 0 }}>Show this to gym staff to mark attendance</p>
                    <button onClick={downloadQR} className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
                        ⬇️ Download QR
                    </button>
                </div>
            )}
        </div>
    );
};

export default MemberDashboard;
