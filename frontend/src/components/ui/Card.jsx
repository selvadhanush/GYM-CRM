/**
 * Card — token-driven wrapper around the existing .card class (index.css).
 * Dumb, presentational only — no business logic or API calls.
 */
const Card = ({ as: Tag = 'div', className = '', style = {}, children, ...rest }) => {
    return (
        <Tag className={['card', className].filter(Boolean).join(' ')} style={style} {...rest}>
            {children}
        </Tag>
    );
};

export default Card;
