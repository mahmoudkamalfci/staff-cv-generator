import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { CVData } from '@cv-generator/shared';

export function useCVData(staffId: string, templateId: string) {
  return useQuery({
    queryKey: ['cv', staffId, templateId],
    queryFn: () => api.get<CVData>(`/cv/${staffId}/${templateId}`).then((r) => r.data),
    enabled: !!staffId && !!templateId,
    staleTime: 0, // Always fresh — generates audit log on backend
  });
}
