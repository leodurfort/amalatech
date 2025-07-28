import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Calendar, Mail, MessageCircle, Clock, UserPlus, Trash2 } from "lucide-react";
import type { RoadshowCounterparty, InsertRoadshowCounterparty, User, RoadshowContact, RoadshowEvent, InsertRoadshowContact, InsertRoadshowEvent } from "@shared/schema";
import { OwnerAssignmentModal } from "./OwnerAssignmentModal";

interface RoadshowTableSimpleProps {
  projectId: number;
}

export function RoadshowTableSimple({ projectId }: RoadshowTableSimpleProps) {
  const { toast } = useToast();
  const [isAddingCounterparty, setIsAddingCounterparty] = useState(false);
  const [editingCounterparty, setEditingCounterparty] = useState<RoadshowCounterparty | null>(null);
  
  // Contact Modal State
  const [contactModal, setContactModal] = useState<{ counterpartyId: number } | null>(null);
  const [newContact, setNewContact] = useState<Partial<InsertRoadshowContact>>({
    full_name: "",
    email: ""
  });
  
  // Interaction Drawer State
  const [interactionDrawer, setInteractionDrawer] = useState<{ counterpartyId: number; counterpartyName: string } | null>(null);
  const [newInteraction, setNewInteraction] = useState({
    content: "",
    event_date: new Date().toISOString().split('T')[0]
  });
  
  // Followup Modal State
  const [followupModal, setFollowupModal] = useState<{ counterpartyId: number; counterpartyName: string } | null>(null);
  const [newFollowup, setNewFollowup] = useState({
    content: "",
    event_date: new Date().toISOString().split('T')[0]
  });

  // Meeting Modal State
  const [meetingModal, setMeetingModal] = useState<{ counterpartyId: number } | null>(null);
  const [newMeeting, setNewMeeting] = useState({
    content: "",
    event_date: new Date().toISOString().split('T')[0]
  });

  // Owner assignment modal state
  const [ownerModalOpen, setOwnerModalOpen] = useState(false);
  const [selectedCounterpartyForOwner, setSelectedCounterpartyForOwner] = useState<RoadshowCounterparty | null>(null);

  // Edit modes for date fields
  const [editModes, setEditModes] = useState<{[key: string]: boolean}>({});
  
  // Phase 2 state management
  const [phase2States, setPhase2States] = useState<{[counterpartyId: number]: boolean}>({});
  
  // Local counters for real-time updates
  const [localInteractionCounts, setLocalInteractionCounts] = useState<{[counterpartyId: number]: number}>({});
  const [localEventDates, setLocalEventDates] = useState<{[key: string]: string}>({});
  
  const [newCounterparty, setNewCounterparty] = useState<Partial<InsertRoadshowCounterparty>>({
    name: "",
    status: "Waiting",
    owner_id: ""
  });

  // Fetch data with safe defaults
  const { data: counterparties = [], isLoading } = useQuery<RoadshowCounterparty[]>({
    queryKey: [`/api/projects/${projectId}/roadshow`],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  // Fetch contacts for contact modal
  const { data: contacts = [] } = useQuery<RoadshowContact[]>({
    queryKey: [`/api/roadshow-counterparty/${contactModal?.counterpartyId}/contacts`],
    enabled: !!contactModal,
    onSuccess: (data) => {
      console.log("Contacts reçus:", data);
    }
  });

  // Fetch all events for all counterparties (needed for table display)
  const { data: allEvents = [] } = useQuery<RoadshowEvent[]>({
    queryKey: [`/api/projects/${projectId}/roadshow-events`],
    enabled: counterparties.length > 0,
  });

  // Fetch events for interaction drawer
  const { data: events = [] } = useQuery<RoadshowEvent[]>({
    queryKey: [`/api/roadshow-counterparty/${interactionDrawer?.counterpartyId}/events`],
    enabled: !!interactionDrawer,
  });

  // Fetch followup events for followup modal
  const { data: followupEvents = [] } = useQuery<RoadshowEvent[]>({
    queryKey: [`/api/roadshow-counterparty/${followupModal?.counterpartyId}/events`],
    enabled: !!followupModal,
  });

  // Fetch meeting events for meeting modal
  const { data: meetingEvents = [] } = useQuery<RoadshowEvent[]>({
    queryKey: [`/api/roadshow-counterparty/${meetingModal?.counterpartyId}/events`],
    enabled: !!meetingModal,
  });

  // Mutations
  const createCounterpartyMutation = useMutation({
    mutationFn: (data: InsertRoadshowCounterparty) => 
      apiRequest(`/api/projects/${projectId}/roadshow`, "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/roadshow`] });
      setNewCounterparty({ name: "", status: "Waiting", owner_id: "" });
      setIsAddingCounterparty(false);
      toast({
        title: "Contrepartie ajoutée",
        description: "La contrepartie a été ajoutée avec succès.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter la contrepartie.",
        variant: "destructive",
      });
    },
  });

  const updateCounterpartyMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertRoadshowCounterparty> }) =>
      apiRequest(`/api/roadshow/${id}`, "PATCH", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/roadshow`] });
      setEditingCounterparty(null);
      toast({
        title: "Contrepartie modifiée",
        description: "La contrepartie a été modifiée avec succès.",
      });
    },
  });

  // Contact mutations
  const createContactMutation = useMutation({
    mutationFn: (data: InsertRoadshowContact) => 
      apiRequest(`/api/roadshow-counterparty/${contactModal!.counterpartyId}/contacts`, "POST", data),
    onSuccess: (result) => {
      console.log("Contact created successfully:", result);
      queryClient.invalidateQueries({ queryKey: [`/api/roadshow-counterparty/${contactModal!.counterpartyId}/contacts`] });
      setContactModal(null);
      setNewContact({ full_name: "", email: "" });
      toast({
        title: "Contact ajouté",
        description: "Le contact a été ajouté avec succès.",
      });
    },
    onError: (error) => {
      console.error("Error creating contact:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le contact. Veuillez réessayer.",
        variant: "destructive",
      });
    },
  });

  // Event mutations  
  const createEventMutation = useMutation({
    mutationFn: (data: InsertRoadshowEvent) => 
      apiRequest(`/api/roadshow-counterparty/${data.counterparty_id}/events`, "POST", data),
    onSuccess: (result, variables) => {
      // Always invalidate queries for real-time sync
      queryClient.invalidateQueries({ queryKey: [`/api/roadshow-counterparty/${variables.counterparty_id}/events`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/roadshow`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/roadshow-events`] });
      
      // Reset form states
      setNewInteraction({ content: "", event_date: new Date().toISOString().split('T')[0] });
      setNewFollowup({ content: "", event_date: new Date().toISOString().split('T')[0] });
      
      // Show success toast based on event type
      const eventTypeNames = {
        interaction: "Interaction",
        teaser: "Teaser", 
        nda: "NDA",
        im: "IM",
        bp: "BP",
        meeting: "Meeting",
        followup: "Relance"
      };
      
      // Auto-calculate next followup for relances (5 days later)
      if (followupModal) {
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + 5);
        updateCounterpartyMutation.mutate({
          id: followupModal.counterpartyId,
          data: { next_followup_date: nextDate.toISOString().split('T')[0] }
        });
        setFollowupModal(null);
        toast({
          title: "Relance programmée",
          description: "La relance a été ajoutée. Prochaine relance dans 5 jours.",
        });
      } else {
        setInteractionDrawer(null);
        toast({
          title: `${eventTypeNames[variables.type as keyof typeof eventTypeNames] || "Événement"} enregistré`,
          description: "L'événement a été ajouté avec succès.",
        });
      }
    },
  });

  const phase2Mutation = useMutation({
    mutationFn: ({ counterpartyId, phase2_ok }: { counterpartyId: number; phase2_ok: boolean }) =>
      apiRequest(`/api/roadshow-counterparty/${counterpartyId}/phase2`, "POST", { phase2_ok }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/roadshow`] });
      toast({
        title: "Phase 2 mise à jour",
        description: "La phase 2 a été mise à jour avec succès.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la phase 2.",
        variant: "destructive",
      });
    },
  });

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: number) => {
      return apiRequest(`/api/roadshow/events/${eventId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/roadshow`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/roadshow-events`] });
      if (interactionDrawer?.counterpartyId) {
        queryClient.invalidateQueries({ queryKey: [`/api/roadshow-counterparty/${interactionDrawer.counterpartyId}/events`] });
      }
      if (followupModal?.counterpartyId) {
        queryClient.invalidateQueries({ queryKey: [`/api/roadshow-counterparty/${followupModal.counterpartyId}/events`] });
      }
      if (meetingModal?.counterpartyId) {
        queryClient.invalidateQueries({ queryKey: [`/api/roadshow-counterparty/${meetingModal.counterpartyId}/events`] });
      }
      toast({ description: "Élément supprimé" });
    }
  });

  // Delete contact mutation
  const deleteContactMutation = useMutation({
    mutationFn: async (contactId: number) => {
      return apiRequest(`/api/roadshow/contacts/${contactId}`, "DELETE");
    },
    onSuccess: () => {
      if (contactModal?.counterpartyId) {
        queryClient.invalidateQueries({ queryKey: [`/api/roadshow-counterparty/${contactModal.counterpartyId}/contacts`] });
      }
      toast({ description: "Contact supprimé" });
    }
  });

  // Helper functions
  const handleAddCounterparty = () => {
    if (!newCounterparty.name) {
      toast({
        title: "Erreur",
        description: "Le nom de la contrepartie est requis.",
        variant: "destructive",
      });
      return;
    }
    createCounterpartyMutation.mutate(newCounterparty as InsertRoadshowCounterparty);
  };

  const handleUpdateCounterparty = (id: number, data: Partial<InsertRoadshowCounterparty>) => {
    updateCounterpartyMutation.mutate({ id, data });
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      Live: "bg-green-100 text-green-800",
      "En attente": "bg-yellow-100 text-yellow-800", 
      "No-go": "bg-red-100 text-red-800"
    };
    return <Badge className={colors[status as keyof typeof colors] || colors["En attente"]}>{status}</Badge>;
  };

  const handleStatusChange = async (counterpartyId: number, newStatus: string) => {
    try {
      console.log(`Changing status for counterparty ${counterpartyId} to: "${newStatus}"`);
      
      // Map UI values to DB values
      const statusMapping = {
        'Live': 'Live',
        'Attente': 'Waiting', 
        'No-go': 'No-go'
      };
      
      const dbStatus = statusMapping[newStatus as keyof typeof statusMapping] || newStatus;
      console.log(`Mapped status: "${newStatus}" -> "${dbStatus}"`);
      
      const response = await apiRequest(`/api/roadshow/${counterpartyId}/status`, "POST", { newStatus: dbStatus });
      console.log("Status change response:", response);
      
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/roadshow`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/roadshow-events`] });
      
      toast({
        title: "Statut mis à jour",
        description: `Le statut a été changé vers : ${newStatus}`,
      });
    } catch (error) {
      console.error("Status change error:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
    }
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : userId;
  };

  const getUserInitials = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return userId.substring(0, 2).toUpperCase();
    const firstInitial = user.firstName?.charAt(0) || '';
    const lastInitial = user.lastName?.charAt(0) || '';
    return `${firstInitial}${lastInitial}`.toUpperCase();
  };

  const handlePhase2DateUpdate = (counterpartyId: number, field: 'dataroom_sent_at' | 'binding_offer_at', date: string) => {
    updatePhase2Mutation.mutate({
      counterpartyId,
      phase2_ok: true,
      [field]: date
    });
    
    const fieldLabel = field === 'dataroom_sent_at' ? 'Dataroom' : 'Binding offer';
    toast({
      title: "Date enregistrée",
      description: `${fieldLabel} programmé pour le ${date}`,
    });
  };

  // Helper functions for new features  
  const getInteractionCount = (counterpartyId: number) => {
    // Use local counter if available, otherwise compute from events
    if (localInteractionCounts[counterpartyId] !== undefined) {
      return localInteractionCounts[counterpartyId];
    }
    const interactionEvents = allEvents.filter(e => e.counterparty_id === counterpartyId && e.type === 'interaction');
    return interactionEvents.length;
  };

  const getLastEventDate = (counterpartyId: number, eventType: string) => {
    const key = `${counterpartyId}-${eventType}`;
    
    // Check local state first for immediate updates
    if (localEventDates[key]) {
      return localEventDates[key];
    }
    
    // Fall back to server data
    const eventsList = allEvents.filter(e => e.counterparty_id === counterpartyId && e.type === eventType);
    if (eventsList.length === 0) return null;
    const lastEvent = eventsList.sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime())[0];
    return lastEvent.event_date;
  };

  const getMeetingCount = (counterpartyId: number) => {
    const meetingEvents = allEvents.filter(e => e.counterparty_id === counterpartyId && e.type === 'meeting');
    return meetingEvents.length;
  };

  const getLastTeaserDate = (counterpartyId: number) => {
    return getLastEventDate(counterpartyId, 'teaser') || "";
  };

  const getLastFollowupDate = (counterpartyId: number) => {
    return getLastEventDate(counterpartyId, 'followup') || "-";
  };

  const getNextFollowupDate = (counterpartyId: number) => {
    const counterparty = counterparties.find(cp => cp.id === counterpartyId);
    return counterparty?.next_followup_date || "-";
  };

  const handleAddContact = () => {
    if (!contactModal) {
      console.error("ContactModal state is null");
      toast({
        title: "Erreur",
        description: "Aucune contrepartie sélectionnée.",
        variant: "destructive",
      });
      return;
    }

    console.log(`Adding contact for counterparty ${contactModal.counterpartyId}:`, newContact);
    console.log("Contact modal state:", contactModal);

    if (!newContact.full_name || !newContact.email) {
      toast({
        title: "Erreur",
        description: "Le nom et l'email sont requis.",
        variant: "destructive",
      });
      return;
    }
    
    createContactMutation.mutate({
      ...newContact,
      counterparty_id: contactModal.counterpartyId
    } as InsertRoadshowContact);
  };

  const handleAddInteraction = () => {
    if (!newInteraction.content) {
      toast({
        title: "Erreur",
        description: "Le contenu de l'interaction est requis.",
        variant: "destructive",
      });
      return;
    }
    
    // Immediately update local counter
    handleInteractionAdded(interactionDrawer!.counterpartyId);
    
    createEventMutation.mutate({
      counterparty_id: interactionDrawer!.counterpartyId,
      type: "interaction",
      content: newInteraction.content,
      event_date: newInteraction.event_date
    });
  };

  const handleAddFollowup = () => {
    if (!newFollowup.content) {
      toast({
        title: "Erreur",
        description: "Le contenu de la relance est requis.",
        variant: "destructive",
      });
      return;
    }
    
    createEventMutation.mutate({
      counterparty_id: followupModal!.counterpartyId,
      type: "followup", 
      content: newFollowup.content,
      event_date: newFollowup.event_date
    });
  };

  const handleAddMeeting = () => {
    if (!newMeeting.content) {
      toast({
        title: "Erreur",
        description: "Le contenu du meeting est requis.",
        variant: "destructive",
      });
      return;
    }
    
    createEventMutation.mutate({
      counterparty_id: meetingModal!.counterpartyId,
      type: "meeting", 
      content: newMeeting.content,
      event_date: newMeeting.event_date
    });
    
    setMeetingModal(null);
    setNewMeeting({ content: "", event_date: new Date().toISOString().split('T')[0] });
  };

  const handleTeaserDateChange = (counterpartyId: number, date: string) => {
    createEventMutation.mutate({
      counterparty_id: counterpartyId,
      type: "teaser",
      content: "Teaser envoyé",
      event_date: date
    });
  };

  const handleEventDateChange = (counterpartyId: number, eventType: string, date: string, content: string) => {
    // Immediately update local state for instant UI feedback
    const key = `${counterpartyId}-${eventType}`;
    setLocalEventDates(prev => ({ ...prev, [key]: date }));
    setEditModes(prev => ({ ...prev, [key]: false }));
    
    // Then sync with backend
    createEventMutation.mutate({
      counterparty_id: counterpartyId,
      type: eventType as any,
      content: content,
      event_date: date
    });
  };

  const toggleEditMode = (counterpartyId: number, eventType: string) => {
    const key = `${counterpartyId}-${eventType}`;
    setEditModes(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleTogglePhase2 = (counterpartyId: number, checked: boolean) => {
    // Update local state immediately for instant UI feedback
    setPhase2States(prev => ({ ...prev, [counterpartyId]: checked }));
    
    // Then sync with backend
    phase2Mutation.mutate({ counterpartyId, phase2_ok: checked });
  };

  const handleInteractionAdded = (counterpartyId: number) => {
    // Immediately increment local counter
    setLocalInteractionCounts(prev => ({
      ...prev,
      [counterpartyId]: (prev[counterpartyId] || getInteractionCount(counterpartyId)) + 1
    }));
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  // Render date field with edit mode
  const renderDateField = (counterpartyId: number, eventType: string, currentDate: string | null) => {
    const key = `${counterpartyId}-${eventType}`;
    const isEditing = editModes[key];
    
    if (!currentDate && !isEditing) {
      return (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-gray-400 hover:text-gray-600"
          onClick={() => toggleEditMode(counterpartyId, eventType)}
        >
          + Ajouter
        </Button>
      );
    }
    
    if (isEditing) {
      return (
        <Input
          type="date"
          className="w-32 h-8 text-xs"
          defaultValue={currentDate || ''}
          onBlur={(e) => {
            if (e.target.value && e.target.value !== currentDate) {
              const content = eventType === 'teaser' ? 'Teaser envoyé' :
                             eventType === 'nda' ? 'NDA envoyé' :
                             eventType === 'im' ? 'IM envoyé' :
                             eventType === 'bp' ? 'BP envoyé' : 'Document envoyé';
              handleEventDateChange(counterpartyId, eventType, e.target.value, content);
            } else {
              setEditModes(prev => ({ ...prev, [key]: false }));
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const target = e.target as HTMLInputElement;
              if (target.value && target.value !== currentDate) {
                const content = eventType === 'teaser' ? 'Teaser envoyé' :
                               eventType === 'nda' ? 'NDA envoyé' :
                               eventType === 'im' ? 'IM envoyé' :
                               eventType === 'bp' ? 'BP envoyé' : 'Document envoyé';
                handleEventDateChange(counterpartyId, eventType, target.value, content);
                toast({
                  title: "Date enregistrée",
                  description: `${content} le ${target.value}`,
                });
              }
            } else if (e.key === 'Escape') {
              setEditModes(prev => ({ ...prev, [key]: false }));
            }
          }}
        />
      );
    }
    
    return (
      <div className="flex items-center space-x-2">
        <span className="text-xs text-gray-700">{formatDate(currentDate)}</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => toggleEditMode(counterpartyId, eventType)}
        >
          <Edit className="h-3 w-3" />
        </Button>
      </div>
    );
  };

  // Sort counterparties: Live > Waiting > No-go
  const sortedCounterparties = [...counterparties].sort((a, b) => {
    const order = { Live: 0, Waiting: 1, "No-go": 2 };
    return (order[a.status as keyof typeof order] || 1) - (order[b.status as keyof typeof order] || 1);
  });

  if (isLoading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Roadshow</h3>
          <p className="text-sm text-gray-600">Gestion des contreparties et suivi des étapes</p>
        </div>
        <Button
          onClick={() => setIsAddingCounterparty(true)}
          className="bg-[#0e355c] hover:bg-[#0a2a47]"
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une contrepartie
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="text-2xl font-bold text-green-600">
            {sortedCounterparties.filter(cp => cp.status === "Live").length}
          </div>
          <div className="text-sm text-green-700">Live</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <div className="text-2xl font-bold text-yellow-600">
            {sortedCounterparties.filter(cp => cp.status === "Waiting").length}
          </div>
          <div className="text-sm text-yellow-700">Attente</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="text-2xl font-bold text-red-600">
            {sortedCounterparties.filter(cp => cp.status === "No-go").length}
          </div>
          <div className="text-sm text-red-700">No-go</div>
        </div>
      </div>

      {/* Professional Roadshow Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 w-36">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span>Statut</span>
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 w-56">
                  Contrepartie
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 w-48">
                  Responsables
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 w-28">
                  Contact
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 w-32">
                  Interactions
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 w-28">
                  Teaser
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 w-28">
                  NDA
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 w-28">
                  IM
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 w-28">
                  BP
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 w-28">
                  IOI
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 w-32">
                  Meetings
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 w-32">
                  Relances
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 w-32">
                  Relance prog.
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 w-48">
                  Phase 2
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 w-24">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedCounterparties.map((counterparty, index) => (
                <tr key={counterparty.id} className={`hover:bg-blue-50 transition-colors duration-150 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <td className="px-6 py-4">
                    <Select
                      value={counterparty.status === 'Live' ? 'Live' : 
                             counterparty.status === 'Waiting' ? 'Attente' : 
                             counterparty.status === 'No-go' ? 'No-go' : 'Attente'}
                      onValueChange={(value) => handleStatusChange(counterparty.id, value)}
                    >
                      <SelectTrigger className="w-28 h-9 text-sm border-2 hover:border-blue-300 focus:border-blue-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Live">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm"></div>
                            <span className="font-medium">Live</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="Attente">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-yellow-500 rounded-full shadow-sm"></div>
                            <span className="font-medium">Attente</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="No-go">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full shadow-sm"></div>
                            <span className="font-medium">No-go</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900 text-base">
                      {counterparty.name}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex flex-wrap gap-2">
                        {(counterparty as any).ownerIds && (counterparty as any).ownerIds.length > 0 ? (
                          (counterparty as any).ownerIds.map((ownerId: string) => (
                            <span key={ownerId} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200 shadow-sm">
                              {getUserInitials(ownerId)}
                            </span>
                          ))
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-500 border border-gray-200">
                            n.a.
                          </span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-blue-100 rounded-full"
                        onClick={() => {
                          setSelectedCounterpartyForOwner(counterparty);
                          setOwnerModalOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4 text-blue-600" />
                      </Button>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 px-3 hover:bg-blue-50 hover:border-blue-300 border-2"
                      onClick={() => {
                        console.log(`Contact button clicked for counterparty ${counterparty.id} (${counterparty.name})`);
                        setContactModal({ counterpartyId: counterparty.id });
                      }}
                    >
                      <Mail className="h-4 w-4 mr-1" />
                      <span className="text-sm font-medium">Mail</span>
                    </Button>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 hover:bg-blue-100 rounded-full"
                        onClick={() => setInteractionDrawer({ counterpartyId: counterparty.id, counterpartyName: counterparty.name })}
                      >
                        <MessageCircle className="h-4 w-4 text-blue-600" />
                      </Button>
                      <div className="inline-flex items-center justify-center w-8 h-8 bg-green-100 text-green-800 rounded-full font-bold text-xs shadow-sm">
                        {getInteractionCount(counterparty.id)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      {renderDateField(counterparty.id, 'teaser', getLastEventDate(counterparty.id, 'teaser'))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      {renderDateField(counterparty.id, 'nda', getLastEventDate(counterparty.id, 'nda'))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      {renderDateField(counterparty.id, 'im', getLastEventDate(counterparty.id, 'im'))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      {renderDateField(counterparty.id, 'bp', getLastEventDate(counterparty.id, 'bp'))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      {renderDateField(counterparty.id, 'ioi', getLastEventDate(counterparty.id, 'ioi'))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 hover:bg-blue-100 rounded-full"
                        onClick={() => setMeetingModal({ counterpartyId: counterparty.id })}
                      >
                        <Calendar className="h-4 w-4 text-blue-600" />
                      </Button>
                      <div className="inline-flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-800 rounded-full font-bold text-xs shadow-sm">
                        {getMeetingCount(counterparty.id)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 hover:bg-blue-100 rounded-full"
                        onClick={() => setFollowupModal({ counterpartyId: counterparty.id, counterpartyName: counterparty.name })}
                      >
                        <Clock className="h-4 w-4 text-blue-600" />
                      </Button>
                      <div className="text-xs text-gray-600 font-medium">
                        {getLastFollowupDate(counterparty.id) || "Aucune"}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="text-sm text-gray-700">
                      {counterparty.next_followup_date ? (
                        <div className="flex items-center justify-center space-x-1">
                          <Calendar className="h-3 w-3 text-blue-500" />
                          <span>{new Date(counterparty.next_followup_date).toLocaleDateString('fr-FR')}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">–</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <input 
                          type="checkbox" 
                          className="h-4 w-4 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500"
                          checked={phase2States[counterparty.id] || false}
                          onChange={(e) => handleTogglePhase2(counterparty.id, e.target.checked)}
                        />
                        <span className="text-sm font-semibold text-gray-700">Phase 2</span>
                      </div>
                      {phase2States[counterparty.id] && (
                        <div className="space-y-2 ml-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-600 w-16 font-medium">📁 Data:</span>
                            <Input
                              type="date"
                              className="w-32 h-7 text-xs border-2 hover:border-blue-300 focus:border-blue-500"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const target = e.target as HTMLInputElement;
                                  if (target.value) {
                                    handlePhase2DateUpdate(counterparty.id, 'dataroom_sent_at', target.value);
                                  }
                                }
                              }}
                              onBlur={(e) => {
                                if (e.target.value) {
                                  handlePhase2DateUpdate(counterparty.id, 'dataroom_sent_at', e.target.value);
                                }
                              }}
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-600 w-16 font-medium">📄 Binding:</span>
                            <Input
                              type="date"
                              className="w-32 h-7 text-xs border-2 hover:border-blue-300 focus:border-blue-500"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const target = e.target as HTMLInputElement;
                                  if (target.value) {
                                    handlePhase2DateUpdate(counterparty.id, 'binding_offer_at', target.value);
                                  }
                                }
                              }}
                              onBlur={(e) => {
                                if (e.target.value) {
                                  handlePhase2DateUpdate(counterparty.id, 'binding_offer_at', e.target.value);
                                }
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-blue-50 hover:border-blue-300 border-2 rounded-full"
                      onClick={() => setEditingCounterparty(counterparty)}
                    >
                      <Edit className="h-4 w-4 text-blue-600" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {sortedCounterparties.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Aucune contrepartie ajoutée pour le moment.
          </div>
        )}
      </div>

      {/* Add Counterparty Dialog */}
      <Dialog open={isAddingCounterparty} onOpenChange={setIsAddingCounterparty}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une contrepartie</DialogTitle>
            <DialogDescription>
              Ajoutez une nouvelle contrepartie au roadshow.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom de la contrepartie
              </label>
              <Input
                value={newCounterparty.name || ""}
                onChange={(e) => setNewCounterparty(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nom de l'entreprise"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Statut
              </label>
              <Select
                value={newCounterparty.status || "Waiting"}
                onValueChange={(value) => setNewCounterparty(prev => ({ ...prev, status: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Live">Live</SelectItem>
                  <SelectItem value="Waiting">En attente</SelectItem>
                  <SelectItem value="No-go">No-go</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Owner
              </label>
              <Select
                value={newCounterparty.owner_id || ""}
                onValueChange={(value) => setNewCounterparty(prev => ({ ...prev, owner_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un owner" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.firstName} {user.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsAddingCounterparty(false)}>
                Annuler
              </Button>
              <Button 
                onClick={handleAddCounterparty}
                disabled={createCounterpartyMutation.isPending}
                className="bg-[#0e355c] hover:bg-[#0a2a47]"
              >
                {createCounterpartyMutation.isPending ? "Ajout..." : "Ajouter"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Counterparty Dialog */}
      <Dialog open={!!editingCounterparty} onOpenChange={() => setEditingCounterparty(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la contrepartie</DialogTitle>
            <DialogDescription>
              Modifiez les informations de la contrepartie.
            </DialogDescription>
          </DialogHeader>
          {editingCounterparty && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de la contrepartie
                </label>
                <Input
                  value={editingCounterparty.name}
                  onChange={(e) => setEditingCounterparty(prev => 
                    prev ? { ...prev, name: e.target.value } : null
                  )}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Statut
                </label>
                <Select
                  value={editingCounterparty.status || "Waiting"}
                  onValueChange={(value) => setEditingCounterparty(prev => 
                    prev ? { ...prev, status: value as any } : null
                  )}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Live">Live</SelectItem>
                    <SelectItem value="Waiting">En attente</SelectItem>
                    <SelectItem value="No-go">No-go</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Owner
                </label>
                <Select
                  value={editingCounterparty.owner_id || ""}
                  onValueChange={(value) => setEditingCounterparty(prev => 
                    prev ? { ...prev, owner_id: value } : null
                  )}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un owner" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.firstName} {user.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setEditingCounterparty(null)}>
                  Annuler
                </Button>
                <Button 
                  onClick={() => handleUpdateCounterparty(editingCounterparty.id, editingCounterparty)}
                  disabled={updateCounterpartyMutation.isPending}
                  className="bg-[#0e355c] hover:bg-[#0a2a47]"
                >
                  {updateCounterpartyMutation.isPending ? "Modification..." : "Modifier"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Contact Modal */}
      <Dialog open={!!contactModal} onOpenChange={() => setContactModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gestion des contacts</DialogTitle>
            <DialogDescription>
              Ajouter et gérer les contacts pour cette contrepartie.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Existing contacts */}
            {contacts.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Contacts existants</h4>
                <div className="space-y-2">
                  {contacts.map((contact) => (
                    <div key={contact.id} className="p-2 bg-gray-50 rounded text-sm flex justify-between items-start">
                      <div>
                        <div className="font-medium">{contact.full_name}</div>
                        <div className="text-gray-600">{contact.email}</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                        onClick={() => deleteContactMutation.mutate(contact.id)}
                        disabled={deleteContactMutation.isPending}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Add new contact */}
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-900 mb-2">Ajouter un contact</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Nom complet</label>
                  <Input
                    value={newContact.full_name || ""}
                    onChange={(e) => setNewContact(prev => ({ ...prev, full_name: e.target.value }))}
                    placeholder="Prénom Nom"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                  <Input
                    type="email"
                    value={newContact.email || ""}
                    onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@example.com"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <Button variant="outline" size="sm" onClick={() => setContactModal(null)}>
                  Fermer
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleAddContact}
                  disabled={createContactMutation.isPending}
                  className="bg-[#0e355c] hover:bg-[#0a2a47]"
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  {createContactMutation.isPending ? "Ajout..." : "Ajouter"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Interaction Drawer */}
      <Sheet open={!!interactionDrawer} onOpenChange={() => setInteractionDrawer(null)}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Interactions - {interactionDrawer?.counterpartyName}</SheetTitle>
          </SheetHeader>
          
          <div className="space-y-4 mt-6">
            {/* Interaction history */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Historique des interactions</h4>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {events.filter(e => e.type === 'interaction').map((event) => (
                  <div key={event.id} className="p-3 bg-gray-50 rounded text-sm flex justify-between items-start">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">{event.event_date}</div>
                      <div>{event.content}</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                      onClick={() => deleteEventMutation.mutate(event.id)}
                      disabled={deleteEventMutation.isPending}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {events.filter(e => e.type === 'interaction').length === 0 && (
                  <div className="text-sm text-gray-500 text-center py-4">
                    Aucune interaction enregistrée
                  </div>
                )}
              </div>
            </div>
            
            {/* Add new interaction */}
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-900 mb-3">Nouvelle interaction</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                  <Input
                    type="date"
                    value={newInteraction.event_date}
                    onChange={(e) => setNewInteraction(prev => ({ ...prev, event_date: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                  <Textarea
                    value={newInteraction.content}
                    onChange={(e) => setNewInteraction(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Détails de l'interaction..."
                    rows={3}
                  />
                </div>
                <Button 
                  onClick={handleAddInteraction}
                  disabled={createEventMutation.isPending}
                  className="w-full bg-[#0e355c] hover:bg-[#0a2a47]"
                >
                  {createEventMutation.isPending ? "Ajout..." : "Ajouter l'interaction"}
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Followup Modal */}
      <Dialog open={!!followupModal} onOpenChange={() => setFollowupModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Relances - {followupModal?.counterpartyName}</DialogTitle>
            <DialogDescription>
              Ajouter une relance avec calcul automatique de la prochaine date (5 jours).
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Followup history */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Relances précédentes</h4>
              <div className="max-h-32 overflow-y-auto space-y-2">
                {followupEvents.filter(e => e.type === 'followup').map((event) => (
                  <div key={event.id} className="p-2 bg-blue-50 rounded text-sm flex justify-between items-start">
                    <div>
                      <div className="text-xs text-blue-600 mb-1">{event.event_date}</div>
                      <div className="text-blue-800">{event.content}</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                      onClick={() => deleteEventMutation.mutate(event.id)}
                      disabled={deleteEventMutation.isPending}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {followupEvents.filter(e => e.type === 'followup').length === 0 && (
                  <div className="text-sm text-gray-500 text-center py-2">
                    Aucune relance enregistrée
                  </div>
                )}
              </div>
            </div>
            
            {/* Add new followup */}
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-900 mb-3">Nouvelle relance</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Date de la relance</label>
                  <Input
                    type="date"
                    value={newFollowup.event_date}
                    onChange={(e) => setNewFollowup(prev => ({ ...prev, event_date: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                  <Textarea
                    value={newFollowup.content}
                    onChange={(e) => setNewFollowup(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Détails de la relance..."
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setFollowupModal(null)}>
                    Annuler
                  </Button>
                  <Button 
                    onClick={handleAddFollowup}
                    disabled={createEventMutation.isPending}
                    className="bg-[#0e355c] hover:bg-[#0a2a47]"
                  >
                    <Clock className="h-4 w-4 mr-1" />
                    {createEventMutation.isPending ? "Ajout..." : "Programmer relance (+5j)"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Meeting Modal */}
      <Dialog open={!!meetingModal} onOpenChange={() => setMeetingModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Meetings</DialogTitle>
            <DialogDescription>
              Gérer les meetings avec cette contrepartie.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Meeting history */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Meetings précédents</h4>
              <div className="max-h-32 overflow-y-auto space-y-2">
                {meetingEvents.filter(e => e.type === 'meeting').map((event) => (
                  <div key={event.id} className="p-2 bg-purple-50 rounded text-sm flex justify-between items-start">
                    <div>
                      <div className="text-xs text-purple-600 mb-1">{event.event_date}</div>
                      <div className="text-purple-800">{event.content}</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                      onClick={() => deleteEventMutation.mutate(event.id)}
                      disabled={deleteEventMutation.isPending}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {meetingEvents.filter(e => e.type === 'meeting').length === 0 && (
                  <div className="text-sm text-gray-500 text-center py-2">
                    Aucun meeting enregistré
                  </div>
                )}
              </div>
            </div>
            
            {/* Add new meeting */}
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-900 mb-3">Nouveau meeting</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Date du meeting</label>
                  <Input
                    type="date"
                    value={newMeeting.event_date}
                    onChange={(e) => setNewMeeting(prev => ({ ...prev, event_date: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                  <Textarea
                    value={newMeeting.content}
                    onChange={(e) => setNewMeeting(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Détails du meeting..."
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setMeetingModal(null)}>
                    Annuler
                  </Button>
                  <Button 
                    onClick={handleAddMeeting}
                    disabled={createEventMutation.isPending}
                    className="bg-[#0e355c] hover:bg-[#0a2a47]"
                  >
                    <Calendar className="h-4 w-4 mr-1" />
                    {createEventMutation.isPending ? "Ajout..." : "Ajouter le meeting"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Owner Assignment Modal */}
      {selectedCounterpartyForOwner && (
        <OwnerAssignmentModal
          open={ownerModalOpen}
          onClose={() => {
            setOwnerModalOpen(false);
            setSelectedCounterpartyForOwner(null);
          }}
          counterpartyId={selectedCounterpartyForOwner.id}
          counterpartyName={selectedCounterpartyForOwner.name}
          currentOwnerIds={(selectedCounterpartyForOwner as any).ownerIds || []}
          users={users}
          projectId={projectId}
        />
      )}
    </div>
  );
}