import EmptyState from './EmptyState';

/**
 * Table — token-driven wrapper around .table-container / table classes (index.css).
 * Automatically collapses to stacked cards on narrow screens (< 640px) via the
 * existing .responsive-table-cards pattern — no per-page media query needed.
 *
 * columns: [{ key, label, render?: (row) => node, align?: 'left'|'right'|'center' }]
 * data:    array of row objects
 * rowKey:  string field name or (row) => string
 */
const Table = ({
    columns,
    data = [],
    rowKey = 'id',
    loading = false,
    emptyIcon,
    emptyTitle = 'No records found',
    emptyDescription = 'There is nothing to show here yet.',
    className = '',
}) => {
    const getKey = (row, idx) => (typeof rowKey === 'function' ? rowKey(row) : row[rowKey] ?? idx);

    if (!loading && data.length === 0) {
        return (
            <div className="table-container">
                <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />
            </div>
        );
    }

    return (
        <div className={['table-container', 'responsive-table-cards', className].filter(Boolean).join(' ')}>
            <table>
                <thead>
                    <tr>
                        {columns.map((col) => (
                            <th key={col.key} style={{ textAlign: col.align || 'left' }}>
                                {col.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, idx) => (
                        <tr key={getKey(row, idx)}>
                            {columns.map((col) => (
                                <td key={col.key} data-label={col.label} style={{ textAlign: col.align || 'left' }}>
                                    {col.render ? col.render(row) : row[col.key]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Table;
