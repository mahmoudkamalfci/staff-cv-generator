import type { Staff } from '@cv-generator/shared';

export function useStaffList() {
  return {
    data: [] as Staff[],
    isLoading: false,
    error: null,
  };
}
