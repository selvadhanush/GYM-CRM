/**
 * Badge — token-driven wrapper around .badge / .badge-* classes (index.css).
 *
 * variant: 'active' | 'expired' | 'frozen' | 'pending' | 'info'
 * Common aliases are mapped so callers can use plain semantic names too:
 *   'success' -> active, 'error'/'danger' -> expired, 'warning' -> pending
 */
const VARIANT_ALIASES = {
    success: 'active',
    error: 'expired',
    danger: 'expired',
    warning: 'pending',
};

const Badge = ({ variant = 'info', icon: Icon = null, className = '', children, ...rest }) => {
    const resolved = VARIANT_ALIASES[variant] || variant;
    const classes = ['badge', `badge-${resolved}`, className].filter(Boolean).join(' ');

    return (
        <span className={classes} {...rest}>
            {Icon && <Icon size={13} />}
            {children}
        </span>
    );
};

export default Badge;
