/**
 * Skeleton Loader Components
 * Usage: <Skeleton width="100%" height={16} /> or <SkeletonCard />
 */

export const Skeleton = ({ width = '100%', height = 16, borderRadius = 8, style = {} }) => (
    <div
        className="skeleton"
        style={{ width, height, borderRadius, ...style }}
    />
);

export const SkeletonText = ({ lines = 3, lastWidth = '60%' }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {Array.from({ length: lines }).map((_, i) => (
            <Skeleton
                key={i}
                width={i === lines - 1 ? lastWidth : '100%'}
                height={14}
            />
        ))}
    </div>
);

export const SkeletonKpiCard = () => (
    <div className="kpi-card" style={{ '--kpi-color': 'var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Skeleton width={100} height={12} />
            <Skeleton width={36} height={36} borderRadius={8} />
        </div>
        <Skeleton width={80} height={32} />
        <Skeleton width={120} height={11} />
    </div>
);

export const SkeletonRow = ({ cols = 5 }) => (
    <tr>
        {Array.from({ length: cols }).map((_, i) => (
            <td key={i}>
                <Skeleton width={i === 0 ? '70%' : '55%'} height={14} />
            </td>
        ))}
    </tr>
);

export const SkeletonTable = ({ rows = 6, cols = 5 }) => (
    <div className="table-container">
        <table>
            <thead>
                <tr>
                    {Array.from({ length: cols }).map((_, i) => (
                        <th key={i}><Skeleton width={80} height={11} /></th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {Array.from({ length: rows }).map((_, i) => (
                    <SkeletonRow key={i} cols={cols} />
                ))}
            </tbody>
        </table>
    </div>
);

export default Skeleton;
