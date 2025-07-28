import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Users, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { Dossier } from "@shared/schema";

interface ProjectHeaderProps {
  dossier: Dossier;
  isAdmin?: boolean;
  onEdit?: () => void;
}

export default function ProjectHeader({ dossier, isAdmin = false, onEdit }: ProjectHeaderProps) {
  const getStatusColor = (statut: string) => {
    switch (statut) {
      case "ACTIF": return "bg-green-100 text-green-800";
      case "CLOTURE": return "bg-blue-100 text-blue-800";
      case "FAILED": return "bg-red-100 text-red-800";
      case "STAND_BY": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeLabel = (type: string) => {
    return type === "CESSION" ? "Sell-side" : "Buy-side";
  };

  const formatTeam = (equipe: string[] | null) => {
    if (!equipe || equipe.length === 0) return "Non assigné";
    return equipe.join(", ");
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Titre principal */}
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">
              {dossier.nom_client || dossier.nom || "Projet sans nom"}
            </h1>
            <Badge className={getStatusColor(dossier.statut)}>
              {dossier.statut}
            </Badge>
          </div>

          {/* Code projet */}
          {dossier.nom_code && (
            <p className="text-sm text-gray-600 mb-2">
              Code: <span className="font-medium">{dossier.nom_code}</span>
            </p>
          )}

          {/* Informations mandat */}
          <div className="flex items-center gap-6 text-sm text-gray-600 mb-3">
            <span className="flex items-center gap-1">
              <span className="font-medium">Type:</span> {getTypeLabel(dossier.type)}
            </span>
            {dossier.sous_type && (
              <span className="flex items-center gap-1">
                <span className="font-medium">Sous-type:</span> {dossier.sous_type}
              </span>
            )}
            {dossier.date_debut_projet && (
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span className="font-medium">Début:</span>
                {format(new Date(dossier.date_debut_projet), "dd MMM yyyy", { locale: fr })}
              </span>
            )}
          </div>

          {/* Équipe */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="w-4 h-4" />
            <span className="font-medium">Équipe:</span>
            <span>{formatTeam(dossier.equipe_interne)}</span>
          </div>

          {/* Description */}
          {dossier.description && (
            <p className="text-sm text-gray-600 mt-2 max-w-2xl">
              {dossier.description}
            </p>
          )}
        </div>

        {/* Actions Admin */}
        {isAdmin && (
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={onEdit}
            >
              Modifier
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Actions <ChevronDown className="w-4 h-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  Changer statut
                </DropdownMenuItem>
                <DropdownMenuItem>
                  Dupliquer projet
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-600">
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </div>
  );
}