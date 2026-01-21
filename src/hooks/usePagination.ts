import { useState } from 'react';
export function usePagination(totalItems: number, itemsPerPage = 12) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const nextPage = () => setCurrentPage(p => Math.min(p + 1, totalPages));
  const prevPage = () => setCurrentPage(p => Math.max(p - 1, 1));
  return { currentPage, totalPages, nextPage, prevPage, setCurrentPage };
}
