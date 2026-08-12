/**
 * Select — token-driven wrapper around .input-group / select.input classes (index.css).
 *
 * options: [{ value, label }] — or pass raw <option> children instead.
 */
const Select = ({
    label,
    id,
    error,
    hint,
    options,
    placeholder,
    className = '',
    containerClassName = '',
    children,
    ...rest
}) => {
    const selectId = id || rest.name;

    return (
        <div className={['input-group', containerClassName].filter(Boolean).join(' ')}>
            {label && <label htmlFor={selectId}>{label}</label>}
            <select
                id={selectId}
                className={['input', className].filter(Boolean).join(' ')}
                style={error ? { borderColor: 'var(--danger)' } : undefined}
                aria-invalid={!!error}
                {...rest}
            >
                {placeholder && <option value="">{placeholder}</option>}
                {options
                    ? options.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                              {opt.label}
                          </option>
                      ))
                    : children}
            </select>
            {error && (
                <p style={{ color: 'var(--danger)', fontSize: '0.78rem', marginTop: '0.35rem' }}>{error}</p>
            )}
            {!error && hint && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.35rem' }}>{hint}</p>
            )}
        </div>
    );
};

export default Select;
