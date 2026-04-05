import React from 'react';

export default function Pagination({ pagination, onPageChange }) {
  if (!pagination || pagination.pages <= 1) return null;
  const { page, pages, total } = pagination;

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, flexWrap: 'wrap', gap: 8 }}>
      <span style={{ fontSize: '0.8rem', color: 'var(--text2)' }}>
        {total} total record{total !== 1 ? 's' : ''}
      </span>
      <div className="pagination">
        <button className="page-btn" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>← Prev</button>
        {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
          let p;
          if (pages <= 7) p = i + 1;
          else if (page <= 4) p = i + 1;
          else if (page >= pages - 3) p = pages - 6 + i;
          else p = page - 3 + i;
          return (
            <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => onPageChange(p)}>{p}</button>
          );
        })}
        <button className="page-btn" disabled={page >= pages} onClick={() => onPageChange(page + 1)}>Next →</button>
      </div>
    </div>
  );
}
