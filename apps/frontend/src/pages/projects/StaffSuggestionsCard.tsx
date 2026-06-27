import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Plus } from 'lucide-react';
import { useStaffSuggestions } from '@/hooks/useStaff';
import type { Staff } from '@cv-generator/shared';

interface StaffSuggestionsCardProps {
  technologies: string[];
  onAddStaff: (staffId: string) => void;
  assignedStaffIds: string[];
}

export function StaffSuggestionsCard({ technologies, onAddStaff, assignedStaffIds }: StaffSuggestionsCardProps) {
  const { mutate, data: suggestions, isPending } = useStaffSuggestions();
  
  const handleFetch = () => {
    if (technologies.length > 0) mutate(technologies);
  };

  return (
    <Card className="sticky top-6 shadow-card h-fit">
      <CardHeader>
        <CardTitle className="text-base flex justify-between items-center">
          Staff Suggestions
          <Button variant="outline" size="sm" onClick={handleFetch} disabled={isPending || technologies.length === 0}>
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {technologies.length === 0 && (
          <p className="text-sm text-muted-foreground">Add technologies to see suggestions.</p>
        )}
        {suggestions?.map((staff) => (
          <div key={staff.id} className="flex justify-between items-start border-b border-border pb-3 last:border-0 last:pb-0">
            <div>
              <p className="font-medium text-sm">{staff.name}</p>
              <p className="text-xs text-muted-foreground mb-2">{staff.jobTitle}</p>
              <div className="flex flex-wrap gap-1">
                {staff.matchedSkills.map(skill => (
                  <span key={skill} className="text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              disabled={assignedStaffIds.includes(staff.id)}
              onClick={() => onAddStaff(staff.id)}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        ))}
        {suggestions?.length === 0 && (
          <p className="text-sm text-muted-foreground">No matching staff found.</p>
        )}
      </CardContent>
    </Card>
  );
}
