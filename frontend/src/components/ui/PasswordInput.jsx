import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const PasswordInput = ({
    value,
    onChange,
    placeholder = 'Enter password',
    required = false,
    className = 'input',
    style = {},
    name = 'password',
    id
}) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
            <input
                id={id}
                name={name}
                type={showPassword ? 'text' : 'password'}
                className={className}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                required={required}
                style={{ width: '100%', paddingRight: '2.75rem', ...style }}
            />
            <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                style={{
                    position: 'absolute',
                    right: '0.75rem',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0.25rem',
                    borderRadius: '6px',
                    transition: 'color 0.2s',
                    zIndex: 2
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
        </div>
    );
};

export default PasswordInput;
