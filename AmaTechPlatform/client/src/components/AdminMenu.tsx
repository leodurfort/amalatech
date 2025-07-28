import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
// useLocation retiré - navigation directe utilisée
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MoreVerticalIcon, EditIcon, RefreshCwIcon, TrashIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface AdminMenuProps {
  dossier: any;
  onEdit: () => void;
}

export default function AdminMenu({ dossier, onEdit }: AdminMenuProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  // Navigation directe pour éviter les conflits de routage

  const statusOptions = [
    { value: "Actif", label: "Actif", icon: "🟢" },
    { value: "Closed", label: "Closed", icon: "🔵" },
    { value: "Stand-by", label: "Stand-by", icon: "🟡" },
    { value: "Failed", label: "Failed", icon: "🔴" },
  ];

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const response = await fetch(`/api/dossiers/${dossier.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut: newStatus }),
      });
      if (!response.ok) throw new Error("Erreur lors de la mise à jour du statut");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Statut mis à jour",
        description: `Le statut du mandat "${dossier.nom}" a été mis à jour avec succès.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/dossiers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
    },
  });

  const updateStatut = (statut: string) => {
    updateStatusMutation.mutate(statut);
  };

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/dossiers/${dossier.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Erreur lors de la suppression");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Mandat supprimé",
        description: `Le mandat "${dossier.nom}" a été supprimé définitivement.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/dossiers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setShowDeleteDialog(false);
      // Redirect to dashboard after successful deletion
      window.location.href = "/";
    },
    onError: (error: any) => {
      toast({
        title: "Erreur de suppression",
        description: "Impossible de supprimer le mandat. Veuillez réessayer.",
        variant: "destructive",
      });
      setShowDeleteDialog(false); // Close dialog even on error
    },
  });

  const openConfirmDeleteModal = () => {
    setShowDeleteDialog(true);
  };

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm"
            className="h-8 w-8 p-0 hover:bg-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVerticalIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem 
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
          >
            <EditIcon className="h-4 w-4 mr-2" />
            ✏️ Modifier le projet
          </DropdownMenuItem>
          
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <RefreshCwIcon className="h-4 w-4 mr-2" />
              🔄 Changer le statut
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {statusOptions.map((option) => (
                <DropdownMenuItem 
                  key={option.value}
                  onClick={(e) => {
                    e.stopPropagation();
                    updateStatut(option.value);
                  }}
                >
                  {option.icon} {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={(e) => {
              e.stopPropagation();
              openConfirmDeleteModal();
            }}
            className="text-red-600"
          >
            <TrashIcon className="h-4 w-4 mr-2" />
            🗑️ Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>



      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <Dialog open={showDeleteDialog} onOpenChange={(open) => {
          if (!open) setShowDeleteDialog(false);
        }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le mandat</DialogTitle>
            <DialogDescription>
              Voulez-vous vraiment supprimer ce mandat ?<br />
              Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 text-sm text-gray-600">
            <p className="mb-2">Cette action supprimera définitivement :</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Le dossier M&A</li>
              <li>Toutes les sociétés du deal</li>
              <li>Tous les contacts</li>
              <li>Toutes les interactions</li>
              <li>Les données de roadshow</li>
            </ul>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Annuler
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Suppression..." : "Supprimer définitivement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      )}
    </>
  );
}