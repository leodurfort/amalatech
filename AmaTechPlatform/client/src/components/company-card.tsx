import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format, isAfter } from "date-fns";
import { fr } from "date-fns/locale";
import { User, Mail, Calendar, ExternalLink, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { RoadshowItemWithDetails } from "@shared/schema";

interface CompanyCardProps {
  item: RoadshowItemWithDetails;
  borderColor: string;
  onAddInteraction: (companyId: number) => void;
  onRefresh: () => void;
}

export default function CompanyCard({ item, borderColor, onAddInteraction, onRefresh }: CompanyCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if follow-up is overdue
  const isOverdue = item.prochaine_relance && isAfter(new Date(), new Date(item.prochaine_relance));

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      return apiRequest("PUT", `/api/roadshow/${item.id}`, {
        statut: newStatus
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roadshow/1"] });
      toast({
        title: "Statut mis à jour",
        description: "Le statut de la société a été mis à jour avec succès.",
      });
      onRefresh();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut.",
        variant: "destructive",
      });
    }
  });

  const getActionButton = () => {
    const baseClasses = "text-primary-500 hover:text-primary-600 text-xs font-medium";
    
    switch (item.statut) {
      case "non_contacte":
        return (
          <Button
            variant="ghost"
            size="sm"
            className={baseClasses}
            onClick={() => onAddInteraction(item.societe.id)}
          >
            Contacter
          </Button>
        );
      case "nda_envoye":
        return (
          <Button
            variant="ghost"
            size="sm"
            className={baseClasses}
            onClick={() => updateStatusMutation.mutate("nda_signe")}
            disabled={updateStatusMutation.isPending}
          >
            Marquer NDA Signé
          </Button>
        );
      case "nda_signe":
        return (
          <Button
            variant="ghost"
            size="sm"
            className={baseClasses}
            onClick={() => onAddInteraction(item.societe.id)}
          >
            Envoyer Teaser
          </Button>
        );
      case "ioi_recu":
        return (
          <Button
            variant="ghost"
            size="sm"
            className={baseClasses}
            onClick={() => onAddInteraction(item.societe.id)}
          >
            Voir Détails
          </Button>
        );
      default:
        return null;
    }
  };

  const getStatusDisplay = () => {
    if (item.dernier_contact) {
      const date = format(new Date(item.dernier_contact), "dd MMM", { locale: fr });
      return `Dernier contact: ${date}`;
    }
    
    switch (item.statut) {
      case "non_contacte":
        return "Aucun contact";
      case "nda_envoye":
        return "NDA envoyé";
      case "nda_signe":
        return "NDA signé";
      case "ioi_recu":
        return "IOI reçu";
      case "abandonne":
        return "Abandonné";
      default:
        return "Statut inconnu";
    }
  };

  return (
    <div className={`bg-white rounded-lg border ${borderColor} p-4 hover:shadow-md transition-shadow cursor-pointer ${item.statut === "abandonne" ? "opacity-75" : ""}`}>
      <div className="flex items-start justify-between mb-3">
        <h4 className="font-medium text-slate-800">{item.societe.nom}</h4>
        <span className="text-xs text-slate-500">{item.societe.secteur}</span>
      </div>
      
      <div className="space-y-2 text-sm text-slate-600">
        {item.contact && (
          <>
            <div className="flex items-center space-x-2">
              <User className="w-3 h-3" />
              <span>{item.contact.nom_complet}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Mail className="w-3 h-3" />
              <span className="truncate">{item.contact.email}</span>
            </div>
          </>
        )}
        <div className="flex items-center space-x-2">
          <Calendar className="w-3 h-3" />
          <span>{getStatusDisplay()}</span>
        </div>
        {item.societe.site_web && (
          <div className="flex items-center space-x-2">
            <ExternalLink className="w-3 h-3" />
            <a 
              href={item.societe.site_web} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary-500 hover:text-primary-600 text-xs truncate"
            >
              Site web
            </a>
          </div>
        )}
      </div>
      
      <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center">
        {isOverdue ? (
          <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full font-medium flex items-center">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Relance due
          </span>
        ) : (
          <span className="text-xs text-slate-500">
            {item.created_at && format(new Date(item.created_at), "dd MMM", { locale: fr })}
          </span>
        )}
        {getActionButton()}
      </div>
      
      {item.notes_internes && (
        <div className="mt-2 pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-500 truncate">{item.notes_internes}</p>
        </div>
      )}
    </div>
  );
}
