import { MessageSquare, Calendar, Phone, Mail } from 'lucide-react';
import React from 'react';
import { Link } from '@tanstack/react-router';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useSensor,
  useSensors,
  PointerSensor,
  DragOverEvent,
  UniqueIdentifier,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { LeadStatus } from '@/types/crm';
import type { Lead } from '@/types/crm';

interface LeadKanbanViewProps {
  leads: Lead[];
  onLeadStatusChange?: (leadId: string, newStatus: LeadStatus) => void;
}

interface SortableLeadCardProps {
  lead: Lead;
  isDragging?: boolean;
}

const SortableLeadCard: React.FC<SortableLeadCardProps> = ({
  lead,
  isDragging,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getLeadCardBorderColor = (score: number): string => {
    if (score > 0.7) {
      return 'border-l-red-500';
    }
    if (score > 0.4) {
      return 'border-l-yellow-500';
    }
    return 'border-l-green-500';
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Link to={`/crm/leads/${lead.id}`} className='block'>
        <Card
          className={`border-l-4 ${getLeadCardBorderColor(lead.aiPriorityScore)} cursor-pointer hover:bg-gray-50 transition-colors`}
        >
          <CardHeader className='p-4 pb-2'>
            <div className='font-medium'>{lead.name}</div>
            <div className='text-sm text-muted-foreground'>
              {lead.preferences?.destination &&
                `Trip to ${lead.preferences.destination}`}
            </div>
          </CardHeader>

          <CardContent className='p-4 pt-0 text-xs space-y-2'>
            {lead.budget && (
              <div className='flex items-center'>
                <span className='text-muted-foreground mr-1'>Budget:</span>
                <span>${lead.budget.toLocaleString()}</span>
              </div>
            )}

            {lead.travelDates?.start && (
              <div className='flex items-center'>
                <Calendar className='h-3 w-3 mr-1 text-muted-foreground' />
                <span>
                  {new Date(lead.travelDates.start).toLocaleDateString()}
                  {lead.travelDates.end &&
                    ` - ${new Date(lead.travelDates.end).toLocaleDateString()}`}
                </span>
              </div>
            )}

            <div className='flex flex-wrap gap-1 pt-1'>
              {lead.tags.slice(0, 3).map(tag => (
                <Badge key={tag} variant='secondary' className='text-xs'>
                  {tag}
                </Badge>
              ))}
              {lead.tags.length > 3 && (
                <Badge variant='outline' className='text-xs'>
                  +{lead.tags.length - 3}
                </Badge>
              )}
            </div>
          </CardContent>

          <Separator />

          <CardFooter className='p-2 flex justify-between'>
            <span className='text-xs text-muted-foreground'>
              Priority: {Math.round(lead.aiPriorityScore * 100)}
            </span>
            <div className='flex space-x-1'>
              <Button
                variant='ghost'
                size='sm'
                className='h-7 w-7 p-0'
                onClick={e => {
                  e.stopPropagation();
                  // Handle message action
                }}
              >
                <MessageSquare className='h-3.5 w-3.5' />
                <span className='sr-only'>Message</span>
              </Button>

              <Button
                variant='ghost'
                size='sm'
                className='h-7 w-7 p-0'
                onClick={e => {
                  e.stopPropagation();
                  // Handle call action
                }}
              >
                <Phone className='h-3.5 w-3.5' />
                <span className='sr-only'>Call</span>
              </Button>

              <Button
                variant='ghost'
                size='sm'
                className='h-7 w-7 p-0'
                onClick={e => {
                  e.stopPropagation();
                  // Handle email action
                }}
              >
                <Mail className='h-3.5 w-3.5' />
                <span className='sr-only'>Email</span>
              </Button>
            </div>
          </CardFooter>
        </Card>
      </Link>
    </div>
  );
};

interface DroppableColumnProps {
  id: LeadStatus;
  children: React.ReactNode;
  label: string;
  count: number;
  isOver?: boolean;
}

const DroppableColumn: React.FC<DroppableColumnProps> = ({
  id,
  children,
  label,
  count,
  isOver,
}) => {
  const { setNodeRef } = useDroppable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`w-72 flex-shrink-0 ${isOver ? 'bg-gray-50 rounded-lg' : ''}`}
    >
      <div className='mb-3 flex items-center'>
        <h3 className='font-medium text-sm'>{label}</h3>
        <Badge variant='secondary' className='ml-2'>
          {count}
        </Badge>
      </div>
      <div className='space-y-3'>{children}</div>
    </div>
  );
};

const LeadKanbanView: React.FC<LeadKanbanViewProps> = ({
  leads,
  onLeadStatusChange,
}) => {
  const [activeId, setActiveId] = React.useState<UniqueIdentifier | null>(null);
  const [activeLead, setActiveLead] = React.useState<Lead | null>(null);
  const [overStatus, setOverStatus] = React.useState<LeadStatus | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Group leads by status
  const leadsByStatus: Record<LeadStatus, Lead[]> = {
    [LeadStatus.NEW]: [],
    [LeadStatus.CONTACTED]: [],
    [LeadStatus.QUALIFIED]: [],
    [LeadStatus.PROPOSAL]: [],
    [LeadStatus.NEGOTIATION]: [],
    [LeadStatus.BOOKED]: [],
    [LeadStatus.LOST]: [],
  };

  leads.forEach(lead => {
    if (leadsByStatus[lead.status]) {
      leadsByStatus[lead.status].push(lead);
    }
  });

  // Define the statuses to display in the kanban board
  const displayStatuses = [
    LeadStatus.NEW,
    LeadStatus.CONTACTED,
    LeadStatus.QUALIFIED,
    LeadStatus.PROPOSAL,
    LeadStatus.NEGOTIATION,
  ];

  const getStatusLabel = (status: LeadStatus): string => {
    switch (status) {
      case LeadStatus.NEW:
        return 'New Leads';
      case LeadStatus.CONTACTED:
        return 'Contacted';
      case LeadStatus.QUALIFIED:
        return 'Qualified';
      case LeadStatus.PROPOSAL:
        return 'Proposal';
      case LeadStatus.NEGOTIATION:
        return 'Negotiation';
      default:
        return status;
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id);
    const draggedLead = leads.find(lead => lead.id === active.id);
    if (draggedLead) {
      setActiveLead(draggedLead);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) {
      setOverStatus(null);
      return;
    }

    const overStatus = over.id as LeadStatus;
    setOverStatus(overStatus);

    const activeLead = leads.find(lead => lead.id === active.id);
    if (activeLead && activeLead.status !== overStatus) {
      onLeadStatusChange?.(activeLead.id, overStatus);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    setActiveLead(null);
    setOverStatus(null);
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className='overflow-x-auto pb-4'>
        <div className='flex space-x-4 min-w-max'>
          {displayStatuses.map(status => (
            <DroppableColumn
              key={status}
              id={status}
              label={getStatusLabel(status)}
              count={leadsByStatus[status]?.length || 0}
              isOver={overStatus === status}
            >
              <SortableContext
                items={leadsByStatus[status].map(lead => lead.id)}
                strategy={verticalListSortingStrategy}
              >
                {leadsByStatus[status]?.map(lead => (
                  <SortableLeadCard
                    key={lead.id}
                    lead={lead}
                    isDragging={activeId === lead.id}
                  />
                ))}
              </SortableContext>

              {leadsByStatus[status]?.length === 0 && (
                <div className='border border-dashed rounded-md p-4 text-center text-muted-foreground text-sm'>
                  No leads in this stage
                </div>
              )}
            </DroppableColumn>
          ))}
        </div>
      </div>

      <DragOverlay>
        {activeLead && <SortableLeadCard lead={activeLead} isDragging />}
      </DragOverlay>
    </DndContext>
  );
};

export default LeadKanbanView;
