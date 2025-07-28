import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, TrendingUp, Users } from 'lucide-react';

interface WeeklyEvent {
  counterpartyId: number;
  counterpartyName: string;
  type: string;
  label: string;
  content: string;
  event_date: string;
  meta: any;
  created_by: string;
}

interface WeeklySummaryProps {
  projectId: number;
}

export function WeeklySummary({ projectId }: WeeklySummaryProps) {
  // Get current week and year
  const now = new Date();
  const currentWeek = getISOWeek(now);
  const currentYear = now.getFullYear();

  const [selectedWeek, setSelectedWeek] = useState(currentWeek);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const { data, isLoading } = useQuery({
    queryKey: [`/api/projects/${projectId}/roadshow/summary`, selectedWeek, selectedYear],
    queryFn: () => fetch(`/api/projects/${projectId}/roadshow/summary?week=${selectedWeek}&year=${selectedYear}`)
      .then(res => res.json()),
  });

  const formatEvent = (event: WeeklyEvent): string => {
    const date = new Date(event.event_date).toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit' 
    });
    
    switch (event.type) {
      case 'teaser': return `${date} — Envoi teaser`;
      case 'nda': return `${date} — NDA envoyé`;
      case 'im': return `${date} — IM envoyé`;
      case 'bp': return `${date} — BP envoyé`;
      case 'ioi': return `${date} — IOI reçue`;
      case 'meeting': return `${date} — Réunion prévue`;
      case 'followup': return `${date} — Relance${event.label ? ` ${event.label}` : ''}`;
      case 'interaction': return `${date} — Interaction${event.content ? ` : ${event.content}` : ''}`;
      case 'status_change': return `${date} — Statut changé → ${event.meta?.newStatus || 'N/A'}`;
      case 'extra_send': return `${date} — Envoi complémentaire`;
      default: return `${date} — ${event.label || event.type}`;
    }
  };

  const groupedEvents = useMemo(() => {
    const byCounterparty: Record<string, WeeklyEvent[]> = {};
    data?.events?.forEach((event: WeeklyEvent) => {
      // Backend returns counterpartyName in the weekly summary endpoint
      const name = (event as any).counterpartyName || "Contrepartie inconnue";
      
      if (!byCounterparty[name]) {
        byCounterparty[name] = [];
      }
      byCounterparty[name].push(event);
    });
    
    // Sort events within each counterparty by date
    Object.keys(byCounterparty).forEach(name => {
      byCounterparty[name].sort((a, b) => {
        return new Date(a.event_date).getTime() - new Date(b.event_date).getTime();
      });
    });
    
    return byCounterparty;
  }, [data]);

  const totalEvents = data?.events?.length || 0;
  const totalCounterparties = Object.keys(groupedEvents).length;

  // Generate week options
  const weekOptions = Array.from({ length: 52 }, (_, i) => i + 1);
  const yearOptions = [currentYear - 1, currentYear, currentYear + 1];

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">Semaine</span>
            <Select value={selectedWeek.toString()} onValueChange={(value) => setSelectedWeek(Number(value))}>
              <SelectTrigger className="w-16 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {weekOptions.map((week) => (
                  <SelectItem key={week} value={week.toString()}>
                    {week}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Année</span>
            <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(Number(value))}>
              <SelectTrigger className="w-20 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="text-sm text-gray-500">
          Période: S{selectedWeek} {selectedYear}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total événements</p>
                <p className="text-2xl font-bold text-gray-900">{totalEvents}</p>
              </div>
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Contreparties actives</p>
                <p className="text-2xl font-bold text-gray-900">{totalCounterparties}</p>
              </div>
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Events by Counterparty */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Événements par contrepartie</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Chargement...</span>
            </div>
          ) : Object.keys(groupedEvents).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun événement trouvé pour cette semaine</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedEvents).map(([counterpartyName, events]) => (
                <div key={counterpartyName} className="border border-gray-200 p-4 rounded-lg bg-gray-50/50">
                  <div className="flex items-center space-x-2 mb-3">
                    <h3 className="font-semibold text-gray-900">{counterpartyName}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {events.length} événement{events.length > 1 ? 's' : ''}
                    </Badge>
                  </div>
                  <ul className="list-disc ml-6 text-sm space-y-1">
                    {events.map((event, index) => (
                      <li key={index} className="text-gray-700">{formatEvent(event)}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Helper function to get ISO week number
function getISOWeek(date: Date): number {
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
}