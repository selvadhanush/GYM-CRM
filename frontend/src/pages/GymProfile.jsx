import { useState, useEffect, useContext } from 'react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { ImagePlus, Trash2, ArrowLeft, ArrowRight, Save, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

const GymProfile = () => {
    const { user } = useContext(AuthContext);
    const [gym, setGym] = useState(null);
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchGymData = async () => {
        try {
            setLoading(true);
            const { data } = await API.get('/gyms/partnered');
            const myGym = data.find(g => g.id === user?.gymId || g._id === user?.gymId);
            if (myGym) {
                setGym(myGym);
                setImages(myGym.images || []);
            }
        } catch (err) {
            console.error('Failed to fetch gym', err);
            setError('Failed to load gym data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.gymId) {
            fetchGymData();
        }
    }, [user]);

    const handleUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        if (images.length + files.length > 5) {
            setError(`You can only have up to 5 images. You are trying to add ${files.length} to your existing ${images.length}.`);
            return;
        }

        const formData = new FormData();
        files.forEach(file => formData.append('images', file));

        try {
            setUploading(true);
            setError('');
            const { data } = await API.post('/gyms/images', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setImages(data.images);
            setSuccess('Images uploaded successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to upload images');
        } finally {
            setUploading(false);
            // Reset input
            e.target.value = null;
        }
    };

    const handleDelete = (indexToDelete) => {
        setImages(images.filter((_, index) => index !== indexToDelete));
    };

    const moveImage = (index, direction) => {
        if ((direction === -1 && index === 0) || (direction === 1 && index === images.length - 1)) return;
        const newImages = [...images];
        const temp = newImages[index];
        newImages[index] = newImages[index + direction];
        newImages[index + direction] = temp;
        setImages(newImages);
    };

    const saveChanges = async () => {
        try {
            setSaving(true);
            setError('');
            const { data } = await API.put('/gyms/images', { images });
            setImages(data.images);
            setSuccess('Changes saved successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save changes');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                <Loader2 className="spinner" size={40} style={{ animation: 'spin 1s linear infinite' }} />
            </div>
        );
    }

    if (!gym) {
        return <div className="card"><p>Gym not found.</p></div>;
    }

    return (
        <div className="fade-in">
            <div className="page-header">
                <div>
                    <h2>Gym Profile</h2>
                    <p>Manage your gym's gallery. You can upload up to 5 images.</p>
                </div>
            </div>

            {error && (
                <div className="alert alert-danger" style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <AlertCircle size={18} /> {error}
                </div>
            )}

            {success && (
                <div className="alert alert-success" style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center', backgroundColor: '#d1fae5', color: '#065f46', padding: '1rem', borderRadius: '8px' }}>
                    <CheckCircle size={18} /> {success}
                </div>
            )}

            <div className="card glass-card" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3>{gym.name} Gallery</h3>
                    <div className="gallery-actions">
                        <input 
                            type="file" 
                            id="image-upload" 
                            multiple 
                            accept="image/*" 
                            style={{ display: 'none' }}
                            onChange={handleUpload}
                            disabled={uploading || images.length >= 5}
                        />
                        <label htmlFor="image-upload" className="btn btn-secondary" style={{ cursor: images.length >= 5 ? 'not-allowed' : 'pointer', opacity: images.length >= 5 ? 0.5 : 1 }}>
                            {uploading ? <Loader2 size={18} className="spinner" /> : <ImagePlus size={18} />} 
                            Upload Image
                        </label>
                        <button className="btn btn-primary" onClick={saveChanges} disabled={saving}>
                            {saving ? <Loader2 size={18} className="spinner" /> : <Save size={18} />} 
                            Save Order
                        </button>
                    </div>
                </div>

                <div className="gallery-grid">
                    {images.map((url, index) => (
                        <div key={index} className="gallery-item-wrapper">
                            <div className="gallery-item">
                                <img src={url} alt={`Gym Image ${index + 1}`} />
                                <div className="gallery-overlay">
                                    <div className="gallery-controls">
                                        <button onClick={() => moveImage(index, -1)} disabled={index === 0} title="Move Left">
                                            <ArrowLeft size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(index)} className="delete-btn" title="Delete">
                                            <Trash2 size={16} />
                                        </button>
                                        <button onClick={() => moveImage(index, 1)} disabled={index === images.length - 1} title="Move Right">
                                            <ArrowRight size={16} />
                                        </button>
                                    </div>
                                    <span className="gallery-index">Image {index + 1}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {images.length === 0 && (
                        <div className="empty-gallery">
                            <ImagePlus size={48} opacity={0.3} />
                            <p>No images uploaded yet.</p>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Click Upload Image to add some.</span>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="card">
                <h3>Gym Details</h3>
                <div style={{ marginTop: '1.5rem', display: 'grid', gap: '1rem' }}>
                    <div><strong>Name:</strong> {gym.name}</div>
                    <div><strong>Address:</strong> {gym.address || 'Not specified'}</div>
                    <div><strong>Phone:</strong> {gym.phone || 'Not specified'}</div>
                    <div><strong>Email:</strong> {gym.email || 'Not specified'}</div>
                    <div><strong>Status:</strong> <span className="badge badge-success">{gym.status}</span></div>
                </div>
            </div>
        </div>
    );
};

export default GymProfile;
