import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import {
    getEquipments,
    createEquipment,
    updateEquipment,
    deleteEquipment,
    getMaintenanceLogs,
    createMaintenanceLog,
    deleteMaintenanceLog
} from '../services/apiService';
import Modal from '../components/Modal';
import { Wrench, PlusCircle, CheckCircle, AlertTriangle, Calendar, ShieldAlert, Edit, Trash2 } from 'lucide-react';

const Equipments = () => {
    const { user } = useContext(AuthContext);
    const isAdmin = user?.role === 'admin';

    const [equipments, setEquipments] = useState([]);
    const [maintenanceLogs, setMaintenanceLogs] = useState([]);
    const [activeTab, setActiveTab] = useState('list');
    const [loading, setLoading] = useState(true);

    // Filters
    const [statusFilter, setStatusFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');

    // Modals
    const [isEqModalOpen, setIsEqModalOpen] = useState(false);
    const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
    const [editingEq, setEditingEq] = useState(null);
    const [selectedEqForMaintenance, setSelectedEqForMaintenance] = useState(null);

    // Form States
    const [eqForm, setEqForm] = useState({
        name: '',
        type: '',
        purchaseDate: '',
        warrantyExpiry: '',
        serviceSchedule: 'Monthly',
        status: 'Active'
    });

    const [maintenanceForm, setMaintenanceForm] = useState({
        serviceDate: new Date().toISOString().split('T')[0],
        cost: '0',
        description: '',
        technicianName: '',
        nextServiceDate: '',
        updateEquipmentStatus: 'Active'
    });

    useEffect(() => {
        fetchEquipmentsData();
        fetchMaintenanceLogsData();
    }, [statusFilter, typeFilter]);

    const fetchEquipmentsData = async () => {
        setLoading(true);
        try {
            const data = await getEquipments({ status: statusFilter, type: typeFilter });
            setEquipments(data);
        } catch (error) {
            console.error('Error fetching equipments:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMaintenanceLogsData = async () => {
        try {
            const data = await getMaintenanceLogs();
            setMaintenanceLogs(data);
        } catch (error) {
            console.error('Error fetching maintenance logs:', error);
        }
    };

    const handleOpenCreateModal = () => {
        setEditingEq(null);
        setEqForm({
            name: '',
            type: '',
            purchaseDate: '',
            warrantyExpiry: '',
            serviceSchedule: 'Monthly',
            status: 'Active'
        });
        setIsEqModalOpen(true);
    };

    const handleOpenEditModal = (eq) => {
        setEditingEq(eq);
        setEqForm({
            name: eq.name,
            type: eq.type || '',
            purchaseDate: eq.purchaseDate ? eq.purchaseDate.split('T')[0] : '',
            warrantyExpiry: eq.warrantyExpiry ? eq.warrantyExpiry.split('T')[0] : '',
            serviceSchedule: eq.serviceSchedule || 'Monthly',
            status: eq.status || 'Active'
        });
        setIsEqModalOpen(true);
    };

    const handleOpenMaintenanceModal = (eq) => {
        setSelectedEqForMaintenance(eq);
        setMaintenanceForm({
            serviceDate: new Date().toISOString().split('T')[0],
            cost: '0',
            description: '',
            technicianName: '',
            nextServiceDate: '',
            updateEquipmentStatus: 'Active'
        });
        setIsMaintenanceModalOpen(true);
    };

    const handleSaveEquipment = async (e) => {
        e.preventDefault();
        try {
            if (editingEq) {
                await updateEquipment(editingEq._id, eqForm);
                alert('Equipment details updated successfully!');
            } else {
                await createEquipment(eqForm);
                alert('New Equipment added successfully!');
            }
            setIsEqModalOpen(false);
            fetchEquipmentsData();
        } catch (error) {
            alert('Failed to save equipment');
        }
    };

    const handleDeleteEq = async (id) => {
        if (window.confirm('Are you sure you want to delete this equipment and all its maintenance records?')) {
            try {
                await deleteEquipment(id);
                alert('Equipment deleted');
                fetchEquipmentsData();
                fetchMaintenanceLogsData();
            } catch (error) {
                alert('Failed to delete equipment');
            }
        }
    };

    const handleSaveMaintenanceLog = async (e) => {
        e.preventDefault();
        try {
            await createMaintenanceLog({
                equipmentId: selectedEqForMaintenance._id,
                ...maintenanceForm,
                cost: Number(maintenanceForm.cost)
            });
            alert('Maintenance log recorded successfully');
            setIsMaintenanceModalOpen(false);
            fetchEquipmentsData();
            fetchMaintenanceLogsData();
        } catch (error) {
            alert('Failed to record maintenance log');
        }
    };

    const handleDeleteLog = async (id) => {
        if (window.confirm('Are you sure you want to delete this maintenance log?')) {
            try {
                await deleteMaintenanceLog(id);
                alert('Maintenance log removed');
                fetchMaintenanceLogsData();
            } catch (error) {
                alert('Failed to delete log');
            }
        }
    };

    // Calculate Summary Stats
    const totalEqCount = equipments.length;
    const activeCount = equipments.filter(e => e.status === 'Active').length;
    const maintenanceCount = equipments.filter(e => e.status === 'Under Maintenance').length;
    const brokenCount = equipments.filter(e => e.status === 'Broken' || e.status === 'Retired').length;

    return (
        <div className="fade-in">
            {/* Header */}
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ fontWeight: '800', marginBottom: '0.25rem' }}>⚙️ Gym Equipments & Maintenance</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Monitor inventory, track warranty status, and schedule repairs</p>
                </div>
                {isAdmin && (
                    <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }} onClick={handleOpenCreateModal}>
                        <PlusCircle size={16} /> Add Equipment
                    </button>
                )}
            </div>

            {/* Stats Dashboard */}
            {activeTab === 'list' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
                    <div className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '1.25rem' }}>
                        <div style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', padding: '0.75rem', borderRadius: '12px' }}>
                            <Wrench size={24} />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600' }}>TOTAL ASSETS</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: '800' }}>{totalEqCount} Items</div>
                        </div>
                    </div>
                    <div className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '1.25rem' }}>
                        <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '0.75rem', borderRadius: '12px' }}>
                            <CheckCircle size={24} />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600' }}>OPERATIONAL</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: '800' }}>{activeCount} Active</div>
                        </div>
                    </div>
                    <div className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '1.25rem' }}>
                        <div style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '0.75rem', borderRadius: '12px' }}>
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600' }}>IN SERVICE</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: '800' }}>{maintenanceCount} In Repair</div>
                        </div>
                    </div>
                    <div className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '1.25rem' }}>
                        <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.75rem', borderRadius: '12px' }}>
                            <ShieldAlert size={24} />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600' }}>OUT OF ORDER</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: '800' }}>{brokenCount} Broken</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="tabs" style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
                <button
                    className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`}
                    onClick={() => setActiveTab('list')}
                    style={{ padding: '0.75rem 1.25rem', border: 'none', background: 'none', borderBottom: activeTab === 'list' ? '3px solid var(--primary-color)' : 'none', fontWeight: '700', color: activeTab === 'list' ? 'var(--primary-color)' : 'var(--text-secondary)' }}
                >
                    Equipments List
                </button>
                <button
                    className={`tab-btn ${activeTab === 'maintenance' ? 'active' : ''}`}
                    onClick={() => setActiveTab('maintenance')}
                    style={{ padding: '0.75rem 1.25rem', border: 'none', background: 'none', borderBottom: activeTab === 'maintenance' ? '3px solid var(--primary-color)' : 'none', fontWeight: '700', color: activeTab === 'maintenance' ? 'var(--primary-color)' : 'var(--text-secondary)' }}
                >
                    Maintenance Logs
                </button>
            </div>

            {/* Content Tabs */}
            {activeTab === 'list' && (
                <div>
                    {/* Filters Row */}
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                        <select
                            className="input"
                            style={{ flex: '1', minWidth: '150px' }}
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="">All Statuses</option>
                            <option value="Active">Active</option>
                            <option value="Under Maintenance">Under Maintenance</option>
                            <option value="Broken">Broken</option>
                            <option value="Retired">Retired</option>
                        </select>
                        <select
                            className="input"
                            style={{ flex: '1', minWidth: '150px' }}
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                        >
                            <option value="">All Types</option>
                            <option value="Cardio">Cardio</option>
                            <option value="Strength">Strength</option>
                            <option value="Free Weights">Free Weights</option>
                            <option value="Accessories">Accessories</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    {loading ? (
                        <div className="spinner"></div>
                    ) : (
                        <div className="card">
                            <h3 style={{ marginBottom: '1.25rem', fontSize: '1rem', fontWeight: '700' }}>📋 Active Inventory</h3>
                            {equipments.length === 0 ? (
                                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>No equipment matched filters.</p>
                            ) : (
                                <div className="table-container">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Equipment Name</th>
                                                <th>Type</th>
                                                <th>Purchase Date</th>
                                                <th>Warranty Expiry</th>
                                                <th>Service Interval</th>
                                                <th>Status</th>
                                                {isAdmin && <th>Actions</th>}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {equipments.map(eq => {
                                                const isWarrantyExpired = eq.warrantyExpiry && new Date(eq.warrantyExpiry) < new Date();
                                                return (
                                                    <tr key={eq._id}>
                                                        <td style={{ fontWeight: '600' }}>{eq.name}</td>
                                                        <td>{eq.type || '—'}</td>
                                                        <td>{eq.purchaseDate ? new Date(eq.purchaseDate).toLocaleDateString() : '—'}</td>
                                                        <td>
                                                            {eq.warrantyExpiry ? (
                                                                <span style={{ color: isWarrantyExpired ? '#ef4444' : 'inherit', fontWeight: isWarrantyExpired ? '700' : 'normal' }}>
                                                                    {new Date(eq.warrantyExpiry).toLocaleDateString()} {isWarrantyExpired && '(Expired)'}
                                                                </span>
                                                            ) : '—'}
                                                        </td>
                                                        <td>{eq.serviceSchedule || '—'}</td>
                                                        <td>
                                                            <span className={`badge ${
                                                                eq.status === 'Active' ? 'badge-active' :
                                                                eq.status === 'Under Maintenance' ? 'badge-pending' :
                                                                'badge-expired'
                                                            }`}>
                                                                {eq.status}
                                                            </span>
                                                        </td>
                                                        {isAdmin && (
                                                            <td>
                                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                                    <button
                                                                        className="btn btn-secondary"
                                                                        style={{ padding: '0.3rem 0.5rem' }}
                                                                        onClick={() => handleOpenMaintenanceModal(eq)}
                                                                        title="Log Maintenance"
                                                                    >
                                                                        <Wrench size={14} />
                                                                    </button>
                                                                    <button
                                                                        className="btn"
                                                                        style={{ padding: '0.3rem 0.5rem', border: '1px solid var(--border-color)' }}
                                                                        onClick={() => handleOpenEditModal(eq)}
                                                                    >
                                                                        <Edit size={14} />
                                                                    </button>
                                                                    <button
                                                                        className="btn btn-danger"
                                                                        style={{ padding: '0.3rem 0.5rem' }}
                                                                        onClick={() => handleDeleteEq(eq._id)}
                                                                    >
                                                                        <Trash2 size={14} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        )}
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'maintenance' && (
                <div className="card">
                    <h3 style={{ marginBottom: '1.25rem', fontSize: '1rem', fontWeight: '700' }}>🛠️ Service History & Maintenance Logs</h3>
                    {maintenanceLogs.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>No maintenance records found.</p>
                    ) : (
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Equipment</th>
                                        <th>Service Date</th>
                                        <th>Repair Cost</th>
                                        <th>Details</th>
                                        <th>Technician</th>
                                        <th>Next Service</th>
                                        {isAdmin && <th>Actions</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {maintenanceLogs.map(log => (
                                        <tr key={log._id}>
                                            <td style={{ fontWeight: '600' }}>{log.equipmentName}</td>
                                            <td>{new Date(log.serviceDate).toLocaleDateString()}</td>
                                            <td style={{ fontWeight: '700', color: 'var(--primary-color)' }}>
                                                ₹{log.cost ? log.cost.toLocaleString() : '0'}
                                            </td>
                                            <td style={{ maxWidth: '250px', whiteSpace: 'normal', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                {log.description || '—'}
                                            </td>
                                            <td>{log.technicianName || '—'}</td>
                                            <td>
                                                {log.nextServiceDate ? new Date(log.nextServiceDate).toLocaleDateString() : '—'}
                                            </td>
                                            {isAdmin && (
                                                <td>
                                                    <button
                                                        className="btn btn-danger"
                                                        style={{ padding: '0.3rem 0.5rem' }}
                                                        onClick={() => handleDeleteLog(log._id)}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Equipment Upsert Modal */}
            <Modal isOpen={isEqModalOpen} onClose={() => setIsEqModalOpen(false)} title={editingEq ? 'Edit Equipment Details' : 'Add New Gym Equipment'}>
                <form onSubmit={handleSaveEquipment}>
                    <div className="input-group">
                        <label>Equipment Name *</label>
                        <input
                            className="input"
                            type="text"
                            value={eqForm.name}
                            onChange={(e) => setEqForm({ ...eqForm, name: e.target.value })}
                            required
                            placeholder="e.g. LifeFitness Treadmill T5"
                        />
                    </div>
                    <div className="input-group">
                        <label>Type / Category</label>
                        <select
                            className="input"
                            value={eqForm.type}
                            onChange={(e) => setEqForm({ ...eqForm, type: e.target.value })}
                        >
                            <option value="">-- Choose Category --</option>
                            <option value="Cardio">Cardio</option>
                            <option value="Strength">Strength</option>
                            <option value="Free Weights">Free Weights</option>
                            <option value="Accessories">Accessories</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="input-group">
                            <label>Purchase Date</label>
                            <input
                                className="input"
                                type="date"
                                value={eqForm.purchaseDate}
                                onChange={(e) => setEqForm({ ...eqForm, purchaseDate: e.target.value })}
                            />
                        </div>
                        <div className="input-group">
                            <label>Warranty Expiry</label>
                            <input
                                className="input"
                                type="date"
                                value={eqForm.warrantyExpiry}
                                onChange={(e) => setEqForm({ ...eqForm, warrantyExpiry: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Service Schedule Interval</label>
                        <select
                            className="input"
                            value={eqForm.serviceSchedule}
                            onChange={(e) => setEqForm({ ...eqForm, serviceSchedule: e.target.value })}
                        >
                            <option value="Monthly">Monthly</option>
                            <option value="Bi-Monthly">Bi-Monthly</option>
                            <option value="Quarterly">Quarterly</option>
                            <option value="Semi-Annually">Semi-Annually</option>
                            <option value="Annually">Annually</option>
                        </select>
                    </div>

                    <div className="input-group">
                        <label>Equipment Status</label>
                        <select
                            className="input"
                            value={eqForm.status}
                            onChange={(e) => setEqForm({ ...eqForm, status: e.target.value })}
                        >
                            <option value="Active">Active</option>
                            <option value="Under Maintenance">Under Maintenance</option>
                            <option value="Broken">Broken</option>
                            <option value="Retired">Retired</option>
                        </select>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                        {editingEq ? 'Update Details' : 'Add Item'}
                    </button>
                </form>
            </Modal>

            {/* Record Maintenance Log Modal */}
            <Modal isOpen={isMaintenanceModalOpen} onClose={() => setIsMaintenanceModalOpen(false)} title={`Log Maintenance: ${selectedEqForMaintenance?.name}`}>
                <form onSubmit={handleSaveMaintenanceLog}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="input-group">
                            <label>Service Date *</label>
                            <input
                                className="input"
                                type="date"
                                value={maintenanceForm.serviceDate}
                                onChange={(e) => setMaintenanceForm({ ...maintenanceForm, serviceDate: e.target.value })}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <label>Next Service Date</label>
                            <input
                                className="input"
                                type="date"
                                value={maintenanceForm.nextServiceDate}
                                onChange={(e) => setMaintenanceForm({ ...maintenanceForm, nextServiceDate: e.target.value })}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="input-group">
                            <label>Repair Cost (₹) *</label>
                            <input
                                className="input"
                                type="number"
                                value={maintenanceForm.cost}
                                onChange={(e) => setMaintenanceForm({ ...maintenanceForm, cost: e.target.value })}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <label>Technician Name</label>
                            <input
                                className="input"
                                type="text"
                                value={maintenanceForm.technicianName}
                                onChange={(e) => setMaintenanceForm({ ...maintenanceForm, technicianName: e.target.value })}
                                placeholder="e.g. John Doe (Service Inc.)"
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Service Description & Work Done</label>
                        <textarea
                            className="input"
                            value={maintenanceForm.description}
                            onChange={(e) => setMaintenanceForm({ ...maintenanceForm, description: e.target.value })}
                            rows={3}
                            placeholder="e.g. Replaced worn belt, lubricated bearings, and recalibrated computer console."
                            style={{ resize: 'vertical' }}
                        />
                    </div>

                    <div className="input-group">
                        <label>Update Equipment Status To</label>
                        <select
                            className="input"
                            value={maintenanceForm.updateEquipmentStatus}
                            onChange={(e) => setMaintenanceForm({ ...maintenanceForm, updateEquipmentStatus: e.target.value })}
                        >
                            <option value="Active">Active (Operational)</option>
                            <option value="Under Maintenance">Under Maintenance (Stay in repair)</option>
                            <option value="Broken">Broken</option>
                        </select>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                        Submit Maintenance Log
                    </button>
                </form>
            </Modal>
        </div>
    );
};

export default Equipments;
