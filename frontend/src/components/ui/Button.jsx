import { Loader2 } from 'lucide-react';

/**
 * Button — token-driven primitive wrapping the existing .btn / .btn-* classes
 * defined in index.css (Warm Amber-Gold Design System).
 *
 * variant: 'primary' | 'secondary' | 'ghost' | 'danger'
 * size:    'sm' | 'md' | 'lg'
 */
const SIZE_STYLES = {
    sm: { minHeight: '36px', padding: '0.4rem 0.9rem', fontSize: '0.78rem' },
    md: {},
    lg: { minHeight: '50px', padding: '0.8rem 1.75rem', fontSize: '0.92rem' },
};

const Button = ({
    variant = 'primary',
    size = 'md',
    icon: Icon = null,
    iconPosition = 'left',
    loading = false,
    fullWidth = false,
    disabled = false,
    className = '',
    style = {},
    children,
    ...rest
}) => {
    const classes = ['btn', `btn-${variant}`, className].filter(Boolean).join(' ');

    return (
        <button
            className={classes}
            disabled={disabled || loading}
            style={{
                ...SIZE_STYLES[size],
                width: fullWidth ? '100%' : undefined,
                opacity: disabled ? 0.6 : undefined,
                cursor: disabled || loading ? 'not-allowed' : 'pointer',
                ...style,
            }}
            {...rest}
        >
            {loading ? (
                <Loader2 size={16} className="spin" />
            ) : (
                Icon && iconPosition === 'left' && <Icon size={16} />
            )}
            {children}
            {!loading && Icon && iconPosition === 'right' && <Icon size={16} />}
        </button>
    );
};

export default Button;
