import type { CVTemplate } from '@cv-generator/shared';

export function useTemplateList() {
  return {
    data: [] as CVTemplate[],
    isLoading: false,
    error: null,
  };
}
