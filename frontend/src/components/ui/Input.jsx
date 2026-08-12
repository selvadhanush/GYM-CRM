/**
 * Input — token-driven wrapper around .input-group / .input classes (index.css).
 * Renders a labeled text input with optional error/hint text.
 */
const Input = ({
    label,
    id,
    error,
    hint,
    className = '',
    containerClassName = '',
    ...rest
}) => {
    const inputId = id || rest.name;

    return (
        <div className={['input-group', containerClassName].filter(Boolean).join(' ')}>
            {label && <label htmlFor={inputId}>{label}</label>}
            <input
                id={inputId}
                className={['input', className].filter(Boolean).join(' ')}
                style={error ? { borderColor: 'var(--danger)' } : undefined}
                aria-invalid={!!error}
                {...rest}
            />
            {error && (
                <p style={{ color: 'var(--danger)', fontSize: '0.78rem', marginTop: '0.35rem' }}>{error}</p>
            )}
            {!error && hint && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.35rem' }}>{hint}</p>
            )}
        </div>
    );
};

export default Input;
