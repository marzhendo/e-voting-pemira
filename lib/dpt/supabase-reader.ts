export interface PaginatedQueryResult<T> {
  data: T[] | null;
  error: { message?: string; code?: string } | null;
}

/**
 * Reads every page from a Supabase/PostgREST query beyond the default 1,000-row cap.
 */
export async function fetchAllPaginatedRows<T>(
  fetchPage: (from: number, to: number) => PromiseLike<PaginatedQueryResult<T>>,
  pageSize = 1000
): Promise<T[]> {
  const safePageSize = Math.max(1, pageSize);
  const allRows: T[] = [];
  const MAX_PAGES = 100;

  for (let page = 0; page < MAX_PAGES; page++) {
    const from = page * safePageSize;
    const to = from + safePageSize - 1;
    const { data, error } = await fetchPage(from, to);

    if (error) {
      throw new Error(error.message || 'Gagal membaca halaman data dari basis data.');
    }

    if (!data || data.length === 0) {
      break;
    }

    allRows.push(...data);

    if (data.length < safePageSize) {
      break;
    }
  }

  return allRows;
}
