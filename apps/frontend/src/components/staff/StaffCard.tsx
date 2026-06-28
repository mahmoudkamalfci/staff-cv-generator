import { Link } from 'react-router-dom';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { getInitials } from '@/lib/utils';
import type { Staff } from '@cv-generator/shared';

export interface StaffCardProps {
  member: Staff;
  canEdit: boolean;
  canDelete: boolean;
  onDelete: (id: string, name: string) => void;
}

export function StaffCard({ member, canEdit, canDelete, onDelete }: StaffCardProps) {
  return (
    <Card className="shadow-none border border-border bg-card hover:bg-muted/30 transition-colors duration-150">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <Avatar className="w-12 h-12">
            <AvatarImage src={member.photoUrl ?? undefined} alt={member.name} />
            <AvatarFallback className="bg-secondary text-primary font-bold">
              {getInitials(member.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground truncate">{member.name}</p>
            <p className="text-sm text-muted-foreground truncate">{member.jobTitle}</p>
            <Badge variant="secondary" className="mt-1 text-xs">
              {member.yearsExperience} yr{member.yearsExperience !== 1 ? 's' : ''} exp
            </Badge>
          </div>
        </div>

        <div className="flex gap-2 mt-4 justify-end">
          <Button
            variant="ghost"
            size="icon"
            title="View profile"
            aria-label={`View profile of ${member.name}`}
            className="h-10 w-10"
            asChild
          >
            <Link to={`/staff/${member.id}`}>
              <Eye className="w-4 h-4" />
            </Link>
          </Button>
          {canEdit && (
            <Button
              variant="ghost"
              size="icon"
              title="Edit"
              aria-label={`Edit profile of ${member.name}`}
              className="h-10 w-10"
              asChild
            >
              <Link to={`/staff/${member.id}/edit`}>
                <Pencil className="w-4 h-4" />
              </Link>
            </Button>
          )}
          {canDelete && (
            <Button
              variant="ghost"
              size="icon"
              title="Delete"
              aria-label={`Delete ${member.name}`}
              className="text-destructive hover:bg-destructive/10 h-10 w-10"
              onClick={() => onDelete(member.id, member.name)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
