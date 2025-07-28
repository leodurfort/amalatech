import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { User } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface OwnerAssignmentModalProps {
  open: boolean;
  onClose: () => void;
  counterpartyId: number;
  counterpartyName: string;
  currentOwnerIds: string[];
  users: User[];
  projectId: number;
}

export function OwnerAssignmentModal({
  open,
  onClose,
  counterpartyId,
  counterpartyName,
  currentOwnerIds,
  users,
  projectId
}: OwnerAssignmentModalProps) {
  const [selectedOwnerIds, setSelectedOwnerIds] = useState<string[]>(currentOwnerIds);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateOwnersMutation = useMutation({
    mutationFn: async (ownerIds: string[]) => {
      return await apiRequest(`/api/roadshow/${counterpartyId}/owners`, 'PATCH', { ownerIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/roadshow`] });
      toast({
        title: "Responsables mis à jour",
        description: `Les responsables de ${counterpartyName} ont été modifiés`,
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les responsables",
        variant: "destructive",
      });
    }
  });

  const handleOwnerToggle = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedOwnerIds(prev => [...prev, userId]);
    } else {
      setSelectedOwnerIds(prev => prev.filter(id => id !== userId));
    }
  };

  const handleSave = () => {
    updateOwnersMutation.mutate(selectedOwnerIds);
  };

  const getUserInitials = (user: User) => {
    const firstInitial = user.firstName?.charAt(0) || '';
    const lastInitial = user.lastName?.charAt(0) || '';
    return `${firstInitial}${lastInitial}`.toUpperCase();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-900">
            Modifier les responsables
          </DialogTitle>
          <p className="text-sm text-gray-600">
            Contrepartie : <span className="font-medium">{counterpartyName}</span>
          </p>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm font-medium text-gray-700">
            Sélectionner les responsables :
          </div>

          <div className="space-y-3 max-h-60 overflow-y-auto">
            {users.map((user) => {
              const isSelected = selectedOwnerIds.includes(user.id);
              return (
                <div
                  key={user.id}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50"
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => handleOwnerToggle(user.id, checked as boolean)}
                  />
                  <Badge
                    variant="outline"
                    className="bg-blue-50 text-blue-700 border-blue-200"
                  >
                    {getUserInitials(user)}
                  </Badge>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {user.email}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {selectedOwnerIds.length > 0 && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-sm font-medium text-blue-900 mb-2">
                Responsables sélectionnés ({selectedOwnerIds.length}) :
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedOwnerIds.map((userId) => {
                  const user = users.find(u => u.id === userId);
                  return user ? (
                    <Badge key={userId} className="bg-blue-100 text-blue-800">
                      {getUserInitials(user)}
                    </Badge>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={updateOwnersMutation.isPending}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateOwnersMutation.isPending}
            className="bg-[#0e355c] hover:bg-[#0a2a47]"
          >
            {updateOwnersMutation.isPending ? "Sauvegarde..." : "Enregistrer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}