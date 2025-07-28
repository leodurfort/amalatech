import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar, Plus, Edit, Trash2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { TimelineEvent, InsertTimelineEvent } from "@shared/schema";

interface TimelineProps {
  dossierId: number;
}

export default function Timeline({ dossierId }: TimelineProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newEvent, setNewEvent] = useState({
    date: "",
    label: "",
    description: "",
  });
  const [editingEvent, setEditingEvent] = useState({
    date: "",
    label: "",
    description: "",
  });

  // Fetch timeline events
  const { data: events = [], isLoading } = useQuery({
    queryKey: [`/api/timeline/${dossierId}`],
  });

  // Create timeline event mutation
  const createEventMutation = useMutation({
    mutationFn: (data: InsertTimelineEvent) => apiRequest("/api/timeline", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/timeline/${dossierId}`] });
      setNewEvent({ date: "", label: "", description: "" });
      setIsAddingEvent(false);
      toast({
        title: "Événement ajouté",
        description: "L'événement a été ajouté à la timeline avec succès.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter l'événement.",
        variant: "destructive",
      });
    },
  });

  // Update timeline event mutation
  const updateEventMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertTimelineEvent> }) =>
      apiRequest(`/api/timeline/${id}`, "PATCH", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/timeline/${dossierId}`] });
      setEditingId(null);
      toast({
        title: "Événement modifié",
        description: "L'événement a été modifié avec succès.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de modifier l'événement.",
        variant: "destructive",
      });
    },
  });

  // Delete timeline event mutation
  const deleteEventMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/timeline/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/timeline/${dossierId}`] });
      toast({
        title: "Événement supprimé",
        description: "L'événement a été supprimé avec succès.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'événement.",
        variant: "destructive",
      });
    },
  });

  const handleAddEvent = () => {
    if (!newEvent.date || !newEvent.label) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir la date et le libellé.",
        variant: "destructive",
      });
      return;
    }

    createEventMutation.mutate({
      dossier_id: dossierId,
      date: new Date(newEvent.date),
      label: newEvent.label,
      description: newEvent.description || null,
    });
  };

  const handleEditEvent = (event: TimelineEvent) => {
    setEditingId(event.id);
    setEditingEvent({
      date: event.date ? format(new Date(event.date), "yyyy-MM-dd") : "",
      label: event.label,
      description: event.description || "",
    });
  };

  const handleSaveEdit = () => {
    if (!editingEvent.date || !editingEvent.label) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir la date et le libellé.",
        variant: "destructive",
      });
      return;
    }

    updateEventMutation.mutate({
      id: editingId!,
      data: {
        date: new Date(editingEvent.date),
        label: editingEvent.label,
        description: editingEvent.description || null,
      },
    });
  };

  const handleDeleteEvent = (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet événement ?")) {
      deleteEventMutation.mutate(id);
    }
  };

  const getEventTypeColor = (label: string) => {
    if (label.toLowerCase().includes('kick-off') || label.toLowerCase().includes('lancement')) {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }
    if (label.toLowerCase().includes('envoyé') || label.toLowerCase().includes('livré')) {
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    }
    if (label.toLowerCase().includes('vdr') || label.toLowerCase().includes('data room')) {
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    }
    if (label.toLowerCase().includes('réunion') || label.toLowerCase().includes('meeting')) {
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    }
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Timeline du Projet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sortedEvents = Array.isArray(events) ? [...events].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  ) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Timeline du Projet
            </CardTitle>
            <Button
              onClick={() => setIsAddingEvent(true)}
              size="sm"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Ajouter un événement
            </Button>
          </div>
        </CardHeader>
        
        {/* Add New Event Form */}
        {isAddingEvent && (
          <CardContent className="border-t">
            <div className="space-y-4">
              <h4 className="font-medium">Nouvel événement</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Date</label>
                  <Input
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Libellé</label>
                  <Input
                    placeholder="Ex: Kick-off Meeting, NDA envoyé..."
                    value={newEvent.label}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, label: e.target.value }))}
                    className="w-full"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Commentaire</label>
                <Textarea
                  placeholder="Détails de l'événement..."
                  value={newEvent.description}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleAddEvent}
                  disabled={createEventMutation.isPending}
                  size="sm"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {createEventMutation.isPending ? "Ajout..." : "Ajouter"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddingEvent(false);
                    setNewEvent({ date: "", label: "", description: "" });
                  }}
                  size="sm"
                >
                  <X className="h-4 w-4 mr-2" />
                  Annuler
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Timeline Events */}
      {sortedEvents.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 mb-4">Aucun événement dans la timeline</p>
            <Button
              onClick={() => setIsAddingEvent(true)}
              variant="outline"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Ajouter le premier événement
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
          
          <div className="space-y-6">
            {sortedEvents.map((event, index) => (
              <div key={event.id} className="relative flex items-start gap-4">
                {/* Timeline dot */}
                <div className="flex-shrink-0 w-4 h-4 bg-blue-500 rounded-full border-4 border-white dark:border-gray-900 relative z-10"></div>
                
                {/* Event card */}
                <Card className="flex-1">
                  <CardContent className="p-4">
                    {editingId === event.id ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium mb-2 block">Date</label>
                            <Input
                              type="date"
                              value={editingEvent.date}
                              onChange={(e) => setEditingEvent(prev => ({ ...prev, date: e.target.value }))}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-2 block">Libellé</label>
                            <Input
                              value={editingEvent.label}
                              onChange={(e) => setEditingEvent(prev => ({ ...prev, label: e.target.value }))}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">Commentaire</label>
                          <Textarea
                            value={editingEvent.description}
                            onChange={(e) => setEditingEvent(prev => ({ ...prev, description: e.target.value }))}
                            rows={3}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={handleSaveEdit}
                            disabled={updateEventMutation.isPending}
                            size="sm"
                          >
                            <Save className="h-4 w-4 mr-2" />
                            {updateEventMutation.isPending ? "Enregistrement..." : "Enregistrer"}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setEditingId(null)}
                            size="sm"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Annuler
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Badge className={getEventTypeColor(event.label)}>
                                {event.label}
                              </Badge>
                              <span className="text-sm text-gray-500">
                                {format(new Date(event.date), "dd MMMM yyyy", { locale: fr })}
                              </span>
                            </div>
                            {event.description && (
                              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                                {event.description}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditEvent(event)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteEvent(event.id)}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                              disabled={deleteEventMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}