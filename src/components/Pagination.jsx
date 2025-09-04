import React from "react";

export default function Pagination({ currentPage, totalPages, onPageChange }) {
    const pages = [];
    for (let i = 1; i <= Math.min(totalPages, 5); i++) {
        pages.push(i);
    }
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, margin: '24px 0' }}>
            {pages.map((page) => (
                <button
                    key={page}
                    style={{
                        background: page === currentPage ? '#7c3aed' : '#fff',
                        color: page === currentPage ? '#fff' : '#7c3aed',
                        border: '1px solid #7c3aed',
                        borderRadius: 6,
                        padding: '4px 12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                    }}
                    onClick={() => onPageChange(page)}
                >
                    {page}
                </button>
            ))}
            {totalPages > 5 && <span style={{ margin: '0 8px' }}>...</span>}
            {totalPages > 5 && (
                <button
                    style={{ background: '#fff', color: '#7c3aed', border: '1px solid #7c3aed', borderRadius: 6, padding: '4px 12px', fontWeight: 600, cursor: 'pointer' }}
                    onClick={() => onPageChange(totalPages)}
                >
                    {totalPages}
                </button>
            )}
        </div>
    );
} 