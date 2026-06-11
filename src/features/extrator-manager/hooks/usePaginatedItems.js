"use client";

import { useState } from "react";

export function usePaginatedItems(items, pageSize = 5) {
  const [page, setPage] = useState(1);
  const totalItems = items?.length || 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const normalizedPage = Math.min(page, totalPages);
  const startIndex = (normalizedPage - 1) * pageSize;

  return {
    items: (items || []).slice(startIndex, startIndex + pageSize),
    page: normalizedPage,
    pageSize,
    setPage,
    totalItems,
    totalPages,
  };
}
