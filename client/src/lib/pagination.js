export const LISTING_PAGE_SIZE = 48;

export function getPageFromSearchParams(params) {
  const raw = Number.parseInt(params.get("page") || "1", 10);
  return Number.isFinite(raw) && raw > 0 ? raw : 1;
}

export function getTotalPages(total, pageSize = LISTING_PAGE_SIZE) {
  if (!total || total <= 0) return 0;
  return Math.ceil(total / pageSize);
}

export function getVisiblePages(currentPage, totalPages, maxVisible = 5) {
  if (totalPages <= 0) return [];

  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  let start = currentPage - Math.floor(maxVisible / 2);
  let end = start + maxVisible - 1;

  if (start < 1) {
    start = 1;
    end = maxVisible;
  }

  if (end > totalPages) {
    end = totalPages;
    start = totalPages - maxVisible + 1;
  }

  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}
