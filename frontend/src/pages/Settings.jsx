import { useState, useEffect, useContext } from 'react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { 
    Settings as SettingsIcon, Sliders, Shield, Bell, Moon, Sun, 
    Database, Palette, Building2, Clock, Landmark, QrCode, Sparkles
} from 'lucide-react';

const Settings = () => {
    const { user } = useContext(AuthContext);
    const [subTab, setSubTab] = useState('branding'); // 'branding' | 'operations' | 'finance' | 'notifications' | 'hours'
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    // --- Tab 1: Branding State ---
    const [gymName, setGymName] = useState('GYM CRM PRO');
    const [tagline, setTagline] = useState('Elevate Your Fitness Operations');
    const [logoUrl, setLogoUrl] = useState('https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=80&auto=format&fit=crop&q=60');
    const [brandTheme, setBrandTheme] = useState('dark');

    // --- Tab 2: Operations & QR State ---
    const [sessionDuration, setSessionDuration] = useState(120); // mins
    const [scanCooldown, setScanCooldown] = useState(300); // secs
    const [qrRefreshRate, setQrRefreshRate] = useState(15); // secs
    const [checkInSound, setCheckInSound] = useState(true);

    // --- Tab 3: Finance & Tax State ---
    const [currency, setCurrency] = useState('INR');
    const [taxRate, setTaxRate] = useState(18); // GST %
    const [taxId, setTaxId] = useState('27AAAAA1111A1Z1'); // GSTIN
    const [razorpayEnabled, setRazorpayEnabled] = useState(true);
    const [razorpayKey, setRazorpayKey] = useState('rzp_test_xxxxxxxxx');

    // --- Tab 4: Notifications State ---
    const [emailAlerts, setEmailAlerts] = useState(true);
    const [smsAlerts, setSmsAlerts] = useState(false);
    const [pushAlerts, setPushAlerts] = useState(true);

    // --- Tab 5: Business Hours State ---
    const [hours, setHours] = useState({
        weekday: '06:00 AM - 10:00 PM',
        saturday: '07:00 AM - 08:00 PM',
        sunday: '08:00 AM - 02:00 PM'
    });

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const res = await API.get('/gyms/settings');
                const data = res.data;
                if (data) {
                    if (data.gymName) setGymName(data.gymName);
                    if (data.tagline) setTagline(data.tagline);
                    if (data.logoUrl) setLogoUrl(data.logoUrl);
                    if (data.brandTheme) setBrandTheme(data.brandTheme);
                    if (data.sessionDuration) setSessionDuration(data.sessionDuration);
                    if (data.scanCooldown) setScanCooldown(data.scanCooldown);
                    if (data.qrRefreshRate) setQrRefreshRate(data.qrRefreshRate);
                    if (data.checkInSound !== undefined) setCheckInSound(data.checkInSound);
                    if (data.currency) setCurrency(data.currency);
                    if (data.taxRate !== undefined) setTaxRate(data.taxRate);
                    if (data.taxId) setTaxId(data.taxId);
                    if (data.razorpayEnabled !== undefined) setRazorpayEnabled(data.razorpayEnabled);
                    if (data.razorpayKey) setRazorpayKey(data.razorpayKey);
                    if (data.emailAlerts !== undefined) setEmailAlerts(data.emailAlerts);
                    if (data.smsAlerts !== undefined) setSmsAlerts(data.smsAlerts);
                    if (data.pushAlerts !== undefined) setPushAlerts(data.pushAlerts);
                    if (data.hours) {
                        try {
                            const parsed = JSON.parse(data.hours);
                            setHours(parsed);
                        } catch (e) {
                            console.error("Error parsing hours", e);
                        }
                    }
                }
            } catch (err) {
                console.error('Error loading settings', err, err.response?.data);
                setError("Failed to load settings from server.");
            }
        };
        loadSettings();
    }, []);

    const handleSaveSettings = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');

        try {
            const payload = {
                gymName, tagline, logoUrl, brandTheme,
                sessionDuration, scanCooldown, qrRefreshRate, checkInSound,
                currency, taxRate, taxId, razorpayEnabled, razorpayKey,
                emailAlerts, smsAlerts, pushAlerts,
                hours: JSON.stringify(hours)
            };
            
            await API.put('/gyms/settings', payload);
            setLoading(false);
            setMessage('Configuration parameters saved successfully!');
        } catch (err) {
            setLoading(false);
            setError(err.response?.data?.message || 'Error saving settings to server');
        }
    };

    return (
        <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '2rem', alignItems: 'start' }}>
            {/* LEFT SUBNAV */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <div style={{ padding: '0.5rem 0.75rem', fontWeight: '800', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Settings Menu</div>
                
                <button 
                    onClick={() => setSubTab('branding')}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '10px',
                        border: 'none', background: subTab === 'branding' ? 'var(--bg-secondary)' : 'none',
                        color: subTab === 'branding' ? 'var(--primary)' : 'var(--text-secondary)',
                        fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s'
                    }}
                >
                    <Building2 size={16} /> Gym Branding
                </button>

                <button 
                    onClick={() => setSubTab('operations')}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '10px',
                        border: 'none', background: subTab === 'operations' ? 'var(--bg-secondary)' : 'none',
                        color: subTab === 'operations' ? 'var(--primary)' : 'var(--text-secondary)',
                        fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s'
                    }}
                >
                    <Sliders size={16} /> Operations & QR
                </button>

                <button 
                    onClick={() => setSubTab('finance')}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '10px',
                        border: 'none', background: subTab === 'finance' ? 'var(--bg-secondary)' : 'none',
                        color: subTab === 'finance' ? 'var(--primary)' : 'var(--text-secondary)',
                        fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s'
                    }}
                >
                    <Landmark size={16} /> Finance & Taxes
                </button>

                <button 
                    onClick={() => setSubTab('notifications')}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '10px',
                        border: 'none', background: subTab === 'notifications' ? 'var(--bg-secondary)' : 'none',
                        color: subTab === 'notifications' ? 'var(--primary)' : 'var(--text-secondary)',
                        fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s'
                    }}
                >
                    <Bell size={16} /> Notifications
                </button>

                <button 
                    onClick={() => setSubTab('hours')}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '10px',
                        border: 'none', background: subTab === 'hours' ? 'var(--bg-secondary)' : 'none',
                        color: subTab === 'hours' ? 'var(--primary)' : 'var(--text-secondary)',
                        fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s'
                    }}
                >
                    <Clock size={16} /> Business Hours
                </button>
            </div>

            {/* RIGHT SETTINGS PANEL */}
            <div className="card" style={{ padding: '2.5rem' }}>
                {message && (
                    <div style={{
                        background: 'rgba(46, 125, 50, 0.1)', border: '1px solid var(--success)',
                        color: 'var(--success)', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem', fontWeight: '600'
                    }}>
                        ✓ {message}
                    </div>
                )}
                {error && (
                    <div style={{
                        background: 'rgba(198, 40, 40, 0.1)', border: '1px solid var(--error)',
                        color: 'var(--error)', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem', fontWeight: '600'
                    }}>
                        ⚠ {error}
                    </div>
                )}

                <form onSubmit={handleSaveSettings}>
                    {/* branding tab */}
                    {subTab === 'branding' && (
                        <div>
                            <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Building2 color="var(--primary)" /> Gym Branding & Theme
                            </h3>

                            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: '2rem', background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
                                <img src={logoUrl} alt="logo preview" style={{ width: '80px', height: '80px', borderRadius: '16px', objectFit: 'cover', border: '2px solid var(--primary)' }} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '700', fontSize: '1rem' }}>{gymName || 'GYM NAME'}</div>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{tagline || 'Tagline'}</div>
                                </div>
                            </div>

                            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Gym/Organization Name</label>
                                <input type="text" className="form-control" value={gymName} onChange={(e) => setGymName(e.target.value)} required />
                            </div>

                            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Brand Tagline</label>
                                <input type="text" className="form-control" value={tagline} onChange={(e) => setTagline(e.target.value)} />
                            </div>

                            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Logo URL</label>
                                <input type="text" className="form-control" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} />
                            </div>

                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Global Theme Base</label>
                                <select className="form-control" value={brandTheme} onChange={(e) => setBrandTheme(e.target.value)}>
                                    <option value="dark">Amber Gold Dark (Recommended)</option>
                                    <option value="light">Amber Gold Light</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* operations & QR tab */}
                    {subTab === 'operations' && (
                        <div>
                            <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Sliders color="var(--primary)" /> Operations & QR Parameters
                            </h3>

                            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Max Session Duration (Minutes)</label>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: 0, marginBottom: '0.5rem' }}>FitPrime sessions are auto-expired after this period.</p>
                                <input type="number" className="form-control" value={sessionDuration} onChange={(e) => setSessionDuration(parseInt(e.target.value) || 0)} style={{ maxWidth: '160px' }} />
                            </div>

                            <div className="form-group" style={{ marginBottom: '1.25rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>QR Scan Cooldown (Seconds)</label>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: 0, marginBottom: '0.5rem' }}>Minimum delay required between successful checks.</p>
                                <input type="number" className="form-control" value={scanCooldown} onChange={(e) => setScanCooldown(parseInt(e.target.value) || 0)} style={{ maxWidth: '160px' }} />
                            </div>

                            <div className="form-group" style={{ marginBottom: '1.25rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>QR Code Auto-Refresh Interval (Seconds)</label>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: 0, marginBottom: '0.5rem' }}>Protects screens against snapshot sharing.</p>
                                <input type="number" className="form-control" value={qrRefreshRate} onChange={(e) => setQrRefreshRate(parseInt(e.target.value) || 0)} style={{ maxWidth: '160px' }} />
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                                <div>
                                    <label style={{ fontWeight: '600' }}>Play sound on check-in</label>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '0.25rem 0 0 0' }}>Validate QR scan events audibly.</p>
                                </div>
                                <input type="checkbox" style={{ width: '20px', height: '20px', accentColor: 'var(--primary)', cursor: 'pointer' }} checked={checkInSound} onChange={(e) => setCheckInSound(e.target.checked)} />
                            </div>
                        </div>
                    )}

                    {/* finance & tax tab */}
                    {subTab === 'finance' && (
                        <div>
                            <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Landmark color="var(--primary)" /> Financial Configuration
                            </h3>

                            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Local Currency</label>
                                <select className="form-control" value={currency} onChange={(e) => setCurrency(e.target.value)} style={{ maxWidth: '160px' }}>
                                    <option value="INR">Indian Rupee (₹)</option>
                                    <option value="USD">US Dollar ($)</option>
                                    <option value="EUR">Euro (€)</option>
                                </select>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                                <div className="form-group">
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Tax / GST Rate (%)</label>
                                    <input type="number" className="form-control" value={taxRate} onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)} />
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Tax ID / GSTIN</label>
                                    <input type="text" className="form-control" value={taxId} onChange={(e) => setTaxId(e.target.value)} />
                                </div>
                            </div>

                            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                    <div>
                                        <label style={{ fontWeight: '600' }}>Enable Razorpay Gateway</label>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '0.25rem 0 0 0' }}>Collect online membership renewals.</p>
                                    </div>
                                    <input type="checkbox" style={{ width: '20px', height: '20px', accentColor: 'var(--primary)', cursor: 'pointer' }} checked={razorpayEnabled} onChange={(e) => setRazorpayEnabled(e.target.checked)} />
                                </div>

                                {razorpayEnabled && (
                                    <div className="form-group">
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.85rem' }}>Razorpay Key ID</label>
                                        <input type="text" className="form-control" value={razorpayKey} onChange={(e) => setRazorpayKey(e.target.value)} />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* notifications tab */}
                    {subTab === 'notifications' && (
                        <div>
                            <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Bell color="var(--primary)" /> Notification Routing
                            </h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div>
                                        <label style={{ fontWeight: '600' }}>Send Email Alerts</label>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '0.25rem 0 0 0' }}>Send check-in alerts and dues receipts via SMTP.</p>
                                    </div>
                                    <input type="checkbox" style={{ width: '20px', height: '20px', accentColor: 'var(--primary)', cursor: 'pointer' }} checked={emailAlerts} onChange={(e) => setEmailAlerts(e.target.checked)} />
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                                    <div>
                                        <label style={{ fontWeight: '600' }}>Send SMS Notifications</label>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '0.25rem 0 0 0' }}>Deliver OTP requests and renewals via bulk gateway.</p>
                                    </div>
                                    <input type="checkbox" style={{ width: '20px', height: '20px', accentColor: 'var(--primary)', cursor: 'pointer' }} checked={smsAlerts} onChange={(e) => setSmsAlerts(e.target.checked)} />
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                                    <div>
                                        <label style={{ fontWeight: '600' }}>Enable Web Push Subscriptions</label>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '0.25rem 0 0 0' }}>Receive native browser notification banners.</p>
                                    </div>
                                    <input type="checkbox" style={{ width: '20px', height: '20px', accentColor: 'var(--primary)', cursor: 'pointer' }} checked={pushAlerts} onChange={(e) => setPushAlerts(e.target.checked)} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* business hours tab */}
                    {subTab === 'hours' && (
                        <div>
                            <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Clock color="var(--primary)" /> Business Hours
                            </h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <div className="form-group">
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Weekdays (Monday - Friday)</label>
                                    <input type="text" className="form-control" value={hours.weekday} onChange={(e) => setHours({ ...hours, weekday: e.target.value })} />
                                </div>
                                <div className="form-group" style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Saturdays</label>
                                    <input type="text" className="form-control" value={hours.saturday} onChange={(e) => setHours({ ...hours, saturday: e.target.value })} />
                                </div>
                                <div className="form-group" style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Sundays</label>
                                    <input type="text" className="form-control" value={hours.sunday} onChange={(e) => setHours({ ...hours, sunday: e.target.value })} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Submit */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2.5rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Saving Parameters...' : 'Save Settings'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Settings;
