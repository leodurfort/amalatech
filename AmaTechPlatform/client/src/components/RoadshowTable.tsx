import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Calendar, Users, Clock, FileText, Mail, Phone, MessageCircle, RotateCcw, Send, CheckCircle } from "lucide-react";
import type { RoadshowCounterparty, InsertRoadshowCounterparty, RoadshowContact, RoadshowEvent, RoadshowPhase2, User } from "@shared/schema";

interface RoadshowTableProps {
  projectId: number;
}

export function RoadshowTable({ projectId }: RoadshowTableProps) {
  const { toast } = useToast();
  const [isAddingCounterparty, setIsAddingCounterparty] = useState(false);
  const [editingCounterparty, setEditingCounterparty] = useState<RoadshowCounterparty | null>(null);
  const [contactModal, setContactModal] = useState<{ counterpartyId: number; contact?: RoadshowContact } | null>(null);
  const [interactionDrawer, setInteractionDrawer] = useState<{ counterpartyId: number; counterpartyName: string } | null>(null);
  const [followupModal, setFollowupModal] = useState<{ counterpartyId: number; counterpartyName: string } | null>(null);
  const [newInteraction, setNewInteraction] = useState({ content: "", event_date: new Date().toISOString().split('T')[0] });
  
  const [newCounterparty, setNewCounterparty] = useState<Partial<InsertRoadshowCounterparty>>({
    name: "",
    status: "Waiting",
    owner_id: ""
  });

  // Fetch roadshow counterparties
  const { data: counterparties = [], isLoading } = useQuery<RoadshowCounterparty[]>({
    queryKey: [`/api/projects/${projectId}/roadshow`],
  });

  // Fetch users for owner selection
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  // Fetch roadshow events for interactions drawer
  const { data: interactions = [] } = useQuery<RoadshowEvent[]>({
    queryKey: [`/api/roadshow/${interactionDrawer?.counterpartyId}/events`],
    enabled: !!interactionDrawer,
  });

  // Fetch roadshow contacts
  const { data: contacts = [] } = useQuery<RoadshowContact[]>({
    queryKey: [`/api/roadshow/${contactModal?.counterpartyId}/contacts`],
    enabled: !!contactModal,
  });

  // Note: Phase2 queries temporairement désactivées pour éviter les erreurs de hooks

  // Create counterparty mutation
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
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter la contrepartie.",
        variant: "destructive",
      });
    },
  });

  // Update counterparty mutation
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
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de modifier la contrepartie.",
        variant: "destructive",
      });
    },
  });

  // Create contact mutation
  const createContactMutation = useMutation({
    mutationFn: (data: { counterparty_id: number; full_name: string; email: string }) =>
      apiRequest(`/api/roadshow/${data.counterparty_id}/contact`, "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/roadshow/${contactModal?.counterpartyId}/contacts`] });
      setContactModal(null);
      toast({
        title: "Contact ajouté",
        description: "Le contact a été ajouté avec succès.",
      });
    },
  });

  // Create event (interaction, teaser, etc.) mutation
  const createEventMutation = useMutation({
    mutationFn: (data: { counterparty_id: number; type: string; label?: string; content?: string; event_date: string }) =>
      apiRequest(`/api/roadshow/${data.counterparty_id}/event`, "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/roadshow`] });
      queryClient.invalidateQueries({ queryKey: [`/api/roadshow/${interactionDrawer?.counterpartyId}/events`] });
      setInteractionDrawer(null);
      setFollowupModal(null);
      setNewInteraction({ content: "", event_date: new Date().toISOString().split('T')[0] });
      toast({
        title: "Événement enregistré",
        description: "L'événement a été enregistré avec succès.",
      });
    },
  });

  const handleAddCounterparty = () => {
    if (!newCounterparty.name) {
      toast({
        title: "Champ requis",
        description: "Veuillez saisir le nom de la contrepartie.",
        variant: "destructive",
      });
      return;
    }
    createCounterpartyMutation.mutate(newCounterparty as InsertRoadshowCounterparty);
  };

  const handleUpdateCounterparty = (id: number, data: Partial<InsertRoadshowCounterparty>) => {
    updateCounterpartyMutation.mutate({ id, data });
  };

  const handleCreateEvent = (counterpartyId: number, type: string, eventData: { label?: string; content?: string; event_date: string }) => {
    createEventMutation.mutate({
      counterparty_id: counterpartyId,
      type,
      ...eventData
    });
  };

  const handleCreateInteraction = () => {
    if (!interactionDrawer || !newInteraction.content) return;
    
    handleCreateEvent(interactionDrawer.counterpartyId, 'interaction', {
      content: newInteraction.content,
      event_date: newInteraction.event_date
    });
  };

  const handleDateChange = (counterpartyId: number, eventType: string, date: string) => {
    handleCreateEvent(counterpartyId, eventType, { event_date: date });
  };

  const getLatestEventDate = (counterpartyId: number, eventType: string) => {
    // Cette fonction devrait être améliorée avec des queries dédiées
    return "-";
  };

  const getFollowupCount = (counterpartyId: number) => {
    if (!interactions || !Array.isArray(interactions)) return 0;
    return interactions.filter(i => i.type === 'followup' && i.counterparty_id === counterpartyId).length;
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      "Live": { color: "bg-green-500", text: "Live" },
      "Waiting": { color: "bg-gray-400", text: "En attente" },
      "No-go": { color: "bg-gray-600", text: "No-go" }
    };
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap["Waiting"];
    
    return (
      <Badge className={`${statusInfo.color} text-white`}>
        {statusInfo.text}
      </Badge>
    );
  };

  const getUserName = (userId: string | null) => {
    if (!userId) return "-";
    const user = users.find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : userId;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Chargement des contreparties...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Roadshow</h2>
          <p className="text-gray-600">Gestion des contreparties et suivi des interactions</p>
        </div>
        <Button 
          onClick={() => setIsAddingCounterparty(true)}
          className="bg-[#0e355c] hover:bg-[#0a2a47]"
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une contrepartie
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-green-600">
            {counterparties.filter(c => c.status === "Live").length}
          </div>
          <div className="text-sm text-gray-600">Live</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-gray-600">
            {counterparties.filter(c => c.status === "Waiting").length}
          </div>
          <div className="text-sm text-gray-600">En attente</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-gray-700">
            {counterparties.filter(c => c.status === "No-go").length}
          </div>
          <div className="text-sm text-gray-600">No-go</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-900">Statut</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-900">Contrepartie</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-900">Owner</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-900">Contact</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-900">Interactions</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-900">Teaser</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-900">Relances</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-900">Prochaine</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-900">NDA</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-900">IM</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-900">BP</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-900">Meetings</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-900">Phase 2</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {Array.isArray(counterparties) && counterparties.map((counterparty) => (
                <tr key={counterparty.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2">
                    {getStatusBadge(counterparty.status || "Waiting")}
                  </td>
                  <td className="px-3 py-2 font-medium text-gray-900">
                    {counterparty.name}
                  </td>
                  <td className="px-3 py-2 text-gray-600 text-xs">
                    {counterparty.owner_id ? getUserName(counterparty.owner_id) : "-"}
                  </td>
                  <td className="px-3 py-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setContactModal({ counterpartyId: counterparty.id })}
                      className="h-8 w-8 p-0"
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                  </td>
                  <td className="px-3 py-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setInteractionDrawer({ counterpartyId: counterparty.id, counterpartyName: counterparty.name })}
                      className="h-8 w-8 p-0"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      type="date"
                      className="w-28 h-8 text-xs"
                      onChange={(e) => e.target.value && handleDateChange(counterparty.id, 'teaser', e.target.value)}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFollowupModal({ counterpartyId: counterparty.id, counterpartyName: counterparty.name })}
                      className="h-8 px-2 text-xs"
                    >
                      #{getFollowupCount(counterparty.id)}
                    </Button>
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      type="date"
                      value={counterparty.next_followup_date || ""}
                      className="w-28 h-8 text-xs"
                      onChange={(e) => handleUpdateCounterparty(counterparty.id, { next_followup_date: e.target.value })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      type="date"
                      className="w-28 h-8 text-xs"
                      onChange={(e) => e.target.value && handleDateChange(counterparty.id, 'nda', e.target.value)}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      type="date"
                      className="w-28 h-8 text-xs"
                      onChange={(e) => e.target.value && handleDateChange(counterparty.id, 'im', e.target.value)}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      type="date"
                      className="w-28 h-8 text-xs"
                      onChange={(e) => e.target.value && handleDateChange(counterparty.id, 'bp', e.target.value)}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDateChange(counterparty.id, 'meeting', new Date().toISOString().split('T')[0])}
                      className="h-8 w-8 p-0"
                    >
                      <Calendar className="h-4 w-4" />
                    </Button>
                  </td>
                  <td className="px-3 py-2">
                    <Switch
                      checked={false} // TODO: Link to phase2 data
                      onCheckedChange={(checked) => {
                        // TODO: Update phase2 status
                      }}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingCounterparty(counterparty)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {counterparties.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            Aucune contrepartie trouvée. Ajoutez votre première contrepartie pour commencer.
          </div>
        )}
      </div>

      {/* Contact Modal */}
      <Dialog open={!!contactModal} onOpenChange={() => setContactModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un contact</DialogTitle>
            <DialogDescription>
              Ajoutez les informations de contact pour cette contrepartie.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom complet
              </label>
              <Input placeholder="Prénom Nom" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <Input type="email" placeholder="contact@entreprise.com" />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setContactModal(null)}>
                Annuler
              </Button>
              <Button className="bg-[#0e355c] hover:bg-[#0a2a47]">
                Ajouter
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Interactions Sheet */}
      <Sheet open={!!interactionDrawer} onOpenChange={() => setInteractionDrawer(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Interactions - {interactionDrawer?.counterpartyName}</SheetTitle>
            <SheetDescription>
              Historique des interactions et ajout de nouvelles notes.
            </SheetDescription>
          </SheetHeader>
          <div className="p-4 space-y-4">
            {/* Historique */}
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Historique</h4>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {Array.isArray(interactions) ? interactions.filter(i => i.type === 'interaction').map((interaction) => (
                  <div key={interaction.id} className="p-2 bg-gray-50 rounded text-sm">
                    <div className="text-xs text-gray-500">{interaction.event_date}</div>
                    <div>{interaction.content}</div>
                  </div>
                )) : (
                  <div className="text-sm text-gray-500">Aucune interaction trouvée</div>
                )}
              </div>
            </div>
            
            {/* Nouvelle interaction */}
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Nouvelle interaction</h4>
              <Input
                type="date"
                value={newInteraction.event_date}
                onChange={(e) => setNewInteraction(prev => ({ ...prev, event_date: e.target.value }))}
              />
              <Textarea
                placeholder="Note d'interaction..."
                value={newInteraction.content}
                onChange={(e) => setNewInteraction(prev => ({ ...prev, content: e.target.value }))}
              />
              <Button 
                onClick={handleCreateInteraction}
                disabled={!newInteraction.content}
                className="bg-[#0e355c] hover:bg-[#0a2a47]"
              >
                Ajouter l'interaction
              </Button>
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
              Historique des relances et ajout d'une nouvelle relance.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de la relance
              </label>
              <Input type="date" defaultValue={new Date().toISOString().split('T')[0]} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Note (optionnel)
              </label>
              <Textarea placeholder="Détails de la relance..." />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setFollowupModal(null)}>
                Annuler
              </Button>
              <Button 
                onClick={() => {
                  if (followupModal) {
                    const count = getFollowupCount(followupModal.counterpartyId) + 1;
                    handleCreateEvent(followupModal.counterpartyId, 'followup', {
                      label: `Relance #${count}`,
                      event_date: new Date().toISOString().split('T')[0]
                    });
                  }
                }}
                className="bg-[#0e355c] hover:bg-[#0a2a47]"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Ajouter la relance
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
                placeholder="Nom de la société"
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
                  onClick={() => {
                    if (editingCounterparty) {
                      handleUpdateCounterparty(editingCounterparty.id, {
                        name: editingCounterparty.name,
                        status: editingCounterparty.status,
                        owner_id: editingCounterparty.owner_id
                      });
                    }
                  }}
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
    </div>
  );
}