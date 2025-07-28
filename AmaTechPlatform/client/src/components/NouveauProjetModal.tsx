import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
// import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { SaveIcon, CheckIcon, BuildingIcon, EuroIcon, UsersIcon, XIcon, ChevronDownIcon, PlusIcon, TrashIcon, CalendarIcon, FileTextIcon } from "lucide-react";
import { insertDossierSchema } from "@shared/schema";
import { z } from "zod";

// Simplified form schema for projet creation
const nouveauProjetSchema = z.object({
  nom_client: z.string().min(2, "Le nom du client est requis"),
  nom_code: z.string().optional(),
  type: z.enum(["Sell-side", "Buy-side"]),
  description: z.string().optional(),
  mandat_signe: z.boolean().optional(),
  date_signature: z.date().optional(),
  categories: z.array(z.string()).optional(),
  sous_type: z.string().optional(),
  statut: z.string().optional(),
  retainer: z.boolean().optional(),
  retainer_amount: z.number().optional(),
  flat_fee: z.boolean().optional(),
  flat_fee_amount: z.number().optional(),
  success_fee_amount: z.number().optional(),
  success_fee_type: z.enum(["VE", "VT"]).optional(),
  equipe_membres: z.array(z.string()).optional(),
});

type NouveauProjetForm = z.infer<typeof nouveauProjetSchema>;

interface AcceleratorTier {
  threshold: number;
  rate: number;
  type: "VE" | "VT";
}

interface NouveauProjetModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingDossier?: any;
}

export default function NouveauProjetModal({ isOpen, onClose, editingDossier }: NouveauProjetModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [acceleratorTiers, setAcceleratorTiers] = useState<AcceleratorTier[]>([]);
  // const [openTeamPopover, setOpenTeamPopover] = useState(false);
  const [teamSearchTerm, setTeamSearchTerm] = useState("");

  // Fetch users for team selection
  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
  });

  // Mock team members for demonstration
  const teamMembers = [
    { id: "1", name: "Zed Douze", email: "z.douze@amalaparters.com" },
    { id: "2", name: "Marc Dupont", email: "m.dupont@amalaparters.com" },
    { id: "3", name: "Sophie Martin", email: "s.martin@amalaparters.com" },
    { id: "4", name: "Alexandre Leroy", email: "a.leroy@amalaparters.com" },
    { id: "5", name: "Isabelle Moreau", email: "i.moreau@amalaparters.com" },
  ];

  // Categories from the screenshots
  const categories = [
    "Conso & Distribution", "Education", "GP-Led Coinvestment", "GP-Led Fundraising", 
    "GP-Led Secondary", "GP-Stake", "Green Services", "Industrie de spécialité",
    "Santé", "Services B2B", "Services B2C & Loisirs", "Services Tech", "Software"
  ];

  // Sous-types for Sell-side
  const sousTypesSellSide = ["M&A", "LBO", "Dual-track", "Debt"];
  const sousTypesBuySide = ["M&A", "LBO", "Buy & Build", "Carve-out"];

  const getDefaultValues = () => {
    if (editingDossier) {
      return {
        nom_client: editingDossier.nom_client || editingDossier.nom || "",
        nom_code: editingDossier.nom_code || "",
        type: editingDossier.type_mandat === "SELL_SIDE" ? "Sell-side" : "Buy-side",
        description: editingDossier.description || "",
        mandat_signe: editingDossier.mandat_signe || false,
        date_signature: editingDossier.date_signature ? new Date(editingDossier.date_signature) : undefined,
        categories: editingDossier.categories || [],
        sous_type: editingDossier.sous_type || "",
        statut: editingDossier.statut || "Actif",
        equipe_membres: editingDossier.equipe_interne || [],
        retainer: editingDossier.has_retainer || false,
        retainer_amount: editingDossier.retainer_montant || 0,
        flat_fee: editingDossier.has_flat_fee || false,
        flat_fee_amount: editingDossier.flat_fee_montant || 0,
        success_fee_amount: editingDossier.success_fee_montant || 0,
        success_fee_type: editingDossier.success_fee_base || "VE",
      };
    }
    return {
      nom_client: "",
      nom_code: "",
      type: "Sell-side",
      description: "",
      mandat_signe: false,
      date_signature: undefined,
      categories: [],
      sous_type: "",
      statut: "Actif",
      equipe_membres: [],
      retainer: false,
      retainer_amount: 0,
      flat_fee: false,
      flat_fee_amount: 0,
      success_fee_amount: 0,
      success_fee_type: "VE",
    };
  };

  const form = useForm<NouveauProjetForm>({
    resolver: zodResolver(nouveauProjetSchema),
    defaultValues: getDefaultValues(),
  });

  // Reset form when editingDossier changes
  useEffect(() => {
    const defaultValues = getDefaultValues();
    console.log("Resetting form with values:", defaultValues);
    console.log("editingDossier:", editingDossier);
    form.reset(defaultValues);
  }, [editingDossier]);

  const createProjetMutation = useMutation({
    mutationFn: async (data: NouveauProjetForm) => {
      const apiData = {
        nom: data.nom_client, // Use client name as project name
        nom_client: data.nom_client,
        nom_code: data.nom_code || null,
        type: data.type === "Sell-side" ? "CESSION" : data.type === "Buy-side" ? "ACQUISITION" : "CESSION",
        statut: data.statut || "ACTIF",
        type_mandat: data.type === "Sell-side" ? "SELL_SIDE" : "BUY_SIDE",
        mandat_signe: data.mandat_signe || false,
        date_signature: data.date_signature ? new Date(data.date_signature) : null,
        categories: data.categories || [],
        sous_type: data.sous_type || null,
        description: data.description || null,
        equipe_interne: data.equipe_membres || [],
        has_retainer: data.retainer || false,
        retainer_montant: data.retainer_amount || null,
        has_flat_fee: data.flat_fee || false,
        flat_fee_montant: data.flat_fee_amount || null,
        success_fee_montant: data.success_fee_amount || null,
        success_fee_base: data.success_fee_type || null,
        date_debut: new Date().toISOString(),
        etape_kanban: "PREPARATION",
      };
      
      const isEditing = !!editingDossier;
      const url = isEditing ? `/api/dossiers/${editingDossier.id}` : "/api/dossiers";
      const method = isEditing ? "PATCH" : "POST";
      
      const response = await fetch(url, {
        method,
        body: JSON.stringify(apiData),
        headers: { "Content-Type": "application/json" },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erreur lors de ${isEditing ? 'la modification' : 'la création'} du projet`);
      }
      
      return response.json();
    },
    onSuccess: (newDossier: any) => {
      const isEditing = !!editingDossier;
      toast({
        title: isEditing ? "Projet modifié avec succès" : "Projet créé avec succès",
        description: `Le projet "${newDossier.nom}" a été ${isEditing ? 'modifié' : 'créé'}.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/dossiers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      handleClose();
    },
    onError: (error: any) => {
      const isEditing = !!editingDossier;
      toast({
        title: `Erreur lors de ${isEditing ? 'la modification' : 'la création'}`,
        description: error.message || "Une erreur est survenue",
        variant: "destructive",
      });
    },
  });

  const saveDraft = async () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast({
        title: "Brouillon sauvegardé",
        description: "Vos modifications ont été sauvegardées automatiquement.",
      });
    }, 1000);
  };

  const onSubmit = (data: NouveauProjetForm) => {
    createProjetMutation.mutate(data);
  };

  const addAcceleratorTier = () => {
    if (acceleratorTiers.length < 5) {
      setAcceleratorTiers([...acceleratorTiers, { threshold: 0, rate: 0, type: "VE" }]);
    }
  };

  const removeAcceleratorTier = (index: number) => {
    setAcceleratorTiers(acceleratorTiers.filter((_, i) => i !== index));
  };

  const updateAcceleratorTier = (index: number, updates: Partial<AcceleratorTier>) => {
    const newTiers = [...acceleratorTiers];
    newTiers[index] = { ...newTiers[index], ...updates };
    setAcceleratorTiers(newTiers);
  };

  const filteredTeamMembers = teamMembers.filter(member =>
    member.name.toLowerCase().includes(teamSearchTerm.toLowerCase())
  );

  const selectedMembers = form.watch("equipe_membres") || [];

  const handleClose = () => {
    form.reset(getDefaultValues());
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        handleClose();
      }
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">
            {editingDossier ? "Gérer le projet" : "Nouveau projet"}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {editingDossier ? "Modifier les informations du mandat M&A" : "Créer un nouveau mandat M&A"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Informations générales */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <BuildingIcon className="h-5 w-5 mr-2 text-[#0e355c]" />
                  Informations générales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="nom_client"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom du client *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: TechCorp SAS"
                            {...field}
                            className="bg-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="nom_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom de code (optionnel)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: Projet Alpha"
                            value={field.value || ""}
                            onChange={field.onChange}
                            className="bg-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type de mandat *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-white">
                              <SelectValue placeholder="Sélectionner un type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Sell-side">Sell-side</SelectItem>
                            <SelectItem value="Buy-side">Buy-side</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Mandat signé */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="mandat_signe"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Mandat signé</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  {form.watch("mandat_signe") && (
                    <FormField
                      control={form.control}
                      name="date_signature"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date de signature</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              value={field.value ? field.value.toISOString().split('T')[0] : ""}
                              onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                              className="bg-white"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {/* Catégorie */}
                <FormField
                  control={form.control}
                  name="categories"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Catégorie (multi-select)</FormLabel>
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {categories.map((category) => (
                            <div key={category} className="flex items-center space-x-2">
                              <Checkbox
                                checked={field.value?.includes(category) || false}
                                onCheckedChange={(checked) => {
                                  const currentValue = field.value || [];
                                  if (checked) {
                                    field.onChange([...currentValue, category]);
                                  } else {
                                    field.onChange(currentValue.filter(cat => cat !== category));
                                  }
                                }}
                              />
                              <label className="text-sm">{category}</label>
                            </div>
                          ))}
                        </div>
                        {field.value && field.value.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-600">Sélectionnées:</p>
                            <div className="flex flex-wrap gap-1">
                              {field.value.map((cat) => (
                                <span key={cat} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                                  {cat}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Sous-type */}
                <FormField
                  control={form.control}
                  name="sous_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sous-type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Sélectionner un sous-type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(form.watch("type") === "Sell-side" ? sousTypesSellSide : sousTypesBuySide).map((type) => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Statut */}
                <FormField
                  control={form.control}
                  name="statut"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Statut</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Auto" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Actif">Actif</SelectItem>
                          <SelectItem value="Pause">Pause</SelectItem>
                          <SelectItem value="Cloturé">Cloturé</SelectItem>
                          <SelectItem value="Perdu">Perdu</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description du projet</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Description détaillée du mandat, contexte, objectifs..."
                          className="min-h-[80px] bg-white"
                          value={field.value || ""}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Mandat */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <FileTextIcon className="h-5 w-5 mr-2 text-[#0e355c]" />
                  Mandat
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Retainer */}
                <div className="space-y-3">
                  <FormField
                    control={form.control}
                    name="retainer"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel>Retainer</FormLabel>
                      </FormItem>
                    )}
                  />
                  {form.watch("retainer") && (
                    <FormField
                      control={form.control}
                      name="retainer_amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="flex items-center space-x-2">
                              <Input
                                type="number"
                                placeholder="Montant"
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
                                className="bg-white w-32"
                              />
                              <span className="text-sm text-gray-500">€</span>
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {/* Flat Fee */}
                <div className="space-y-3">
                  <FormField
                    control={form.control}
                    name="flat_fee"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel>Flat fee</FormLabel>
                      </FormItem>
                    )}
                  />
                  {form.watch("flat_fee") && (
                    <FormField
                      control={form.control}
                      name="flat_fee_amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="flex items-center space-x-2">
                              <Input
                                type="number"
                                placeholder="Montant"
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
                                className="bg-white w-32"
                              />
                              <span className="text-sm text-gray-500">€</span>
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {/* Success Fee */}
                <div className="space-y-3">
                  <FormLabel>Success fee</FormLabel>
                  <div className="flex items-center space-x-4">
                    <FormField
                      control={form.control}
                      name="success_fee_amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="flex items-center space-x-2">
                              <Input
                                type="number"
                                step="0.1"
                                placeholder="0.0"
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
                                className="bg-white w-20"
                              />
                              <span className="text-sm text-gray-500">%</span>
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="success_fee_type"
                      render={({ field }) => (
                        <FormItem>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-white w-20">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="VE">VE</SelectItem>
                              <SelectItem value="VT">VT</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Mécanisme accélérateur */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <FormLabel>Mécanisme accélérateur</FormLabel>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addAcceleratorTier}
                      disabled={acceleratorTiers.length >= 5}
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Ajouter
                    </Button>
                  </div>
                  {acceleratorTiers.map((tier, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        type="number"
                        placeholder="Seuil"
                        value={tier.threshold}
                        onChange={(e) => updateAcceleratorTier(index, { threshold: parseFloat(e.target.value) || 0 })}
                        className="bg-white w-24"
                      />
                      <span className="text-sm text-gray-500">€ :</span>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="Taux"
                        value={tier.rate}
                        onChange={(e) => updateAcceleratorTier(index, { rate: parseFloat(e.target.value) || 0 })}
                        className="bg-white w-20"
                      />
                      <span className="text-sm text-gray-500">%</span>
                      <Select
                        value={tier.type}
                        onValueChange={(value) => updateAcceleratorTier(index, { type: value as "VE" | "VT" })}
                      >
                        <SelectTrigger className="bg-white w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="VE">VE</SelectItem>
                          <SelectItem value="VT">VT</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAcceleratorTier(index)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Quick Simulator */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <FormLabel className="text-sm font-medium">Quick Simulateur fees</FormLabel>
                  <div className="flex items-center space-x-2 mt-2">
                    <Input
                      type="number"
                      placeholder="Valeur"
                      className="bg-white w-32"
                    />
                    <Select defaultValue="VE">
                      <SelectTrigger className="bg-white w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="VE">VE</SelectItem>
                        <SelectItem value="VT">VT</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button type="button" variant="outline" size="sm">Calculer</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Équipe projet */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <UsersIcon className="h-5 w-5 mr-2 text-[#0e355c]" />
                  Équipe projet
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="equipe_membres"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Membres de l'équipe</FormLabel>
                      <div className="space-y-2">
                        <div className="space-y-2">
                          <Input
                            placeholder="Rechercher un membre... (tapez Z pour Zed Douze)"
                            value={teamSearchTerm}
                            onChange={(e) => setTeamSearchTerm(e.target.value)}
                            className="bg-white"
                          />
                          {teamSearchTerm && (
                            <div className="max-h-32 overflow-y-auto bg-white border rounded-md">
                              {filteredTeamMembers.map((member) => (
                                <div
                                  key={member.id}
                                  className="p-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                                  onClick={() => {
                                    const currentValue = field.value || [];
                                    if (!currentValue.includes(member.id)) {
                                      field.onChange([...currentValue, member.id]);
                                    }
                                    setTeamSearchTerm("");
                                  }}
                                >
                                  <div className="flex flex-col">
                                    <span className="font-medium text-sm">{member.name}</span>
                                    <span className="text-xs text-gray-500">{member.email}</span>
                                  </div>
                                </div>
                              ))}
                              {filteredTeamMembers.length === 0 && (
                                <div className="p-2 text-sm text-gray-500">Aucun membre trouvé</div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Selected members */}
                        <div className="space-y-2">
                          {selectedMembers.map((memberId) => {
                            const member = teamMembers.find(m => m.id === memberId);
                            return member ? (
                              <div key={member.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                <div className="flex flex-col">
                                  <span className="font-medium text-sm">{member.name}</span>
                                  <span className="text-xs text-gray-500">{member.email}</span>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const newValue = selectedMembers.filter(id => id !== memberId);
                                    field.onChange(newValue);
                                  }}
                                >
                                  <XIcon className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : null;
                          })}
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Separator />

            {/* Actions */}
            <div className="flex items-center justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={saveDraft}
                disabled={isSaving}
              >
                <SaveIcon className="h-4 w-4 mr-2" />
                {isSaving ? "Sauvegarde..." : "Sauvegarder"}
              </Button>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                >
                  Fermer
                </Button>
                <Button
                  type="submit"
                  disabled={createProjetMutation.isPending}
                  className="bg-[#0e355c] hover:bg-[#0a2a45]"
                >
                  {createProjetMutation.isPending ? "Création..." : "Créer le projet"}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}