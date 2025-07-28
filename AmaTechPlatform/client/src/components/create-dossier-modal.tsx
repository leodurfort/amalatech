import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DossierType, DossierStatut } from "@shared/schema";

const dossierFormSchema = z.object({
  nom: z.string().min(1, "Le nom du dossier est requis"),
  type: z.enum(["CESSION", "ACQUISITION", "LEVEE"] as const),
  statut: z.enum(["ACTIF", "CLOTURE", "PERDU", "PAUSE"] as const).default("ACTIF"),
  description: z.string().optional(),
  equipe_interne: z.string().optional(),
});

type DossierFormData = z.infer<typeof dossierFormSchema>;

interface CreateDossierModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDossierCreated: () => void;
}

export default function CreateDossierModal({ 
  open, 
  onOpenChange, 
  onDossierCreated 
}: CreateDossierModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<DossierFormData>({
    resolver: zodResolver(dossierFormSchema),
    defaultValues: {
      nom: "",
      type: "CESSION",
      statut: "ACTIF",
      description: "",
      equipe_interne: "",
    },
  });

  const createDossierMutation = useMutation({
    mutationFn: async (data: DossierFormData) => {
      const equipeArray = data.equipe_interne 
        ? data.equipe_interne.split(",").map(name => name.trim()).filter(Boolean)
        : [];

      return apiRequest("POST", "/api/dossiers", {
        nom: data.nom,
        type: data.type,
        statut: data.statut,
        description: data.description,
        equipe_interne: equipeArray,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dossiers"] });
      toast({
        title: "Dossier créé",
        description: "Le dossier a été créé avec succès.",
      });
      form.reset();
      onDossierCreated();
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer le dossier.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: DossierFormData) => {
    createDossierMutation.mutate(data);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Créer un Nouveau Dossier</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="nom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom du dossier *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Cession TechCorp" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type de mandat</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="CESSION">Cession</SelectItem>
                        <SelectItem value="ACQUISITION">Acquisition</SelectItem>
                        <SelectItem value="LEVEE">Levée de fonds</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="statut"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Statut</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ACTIF">Actif</SelectItem>
                        <SelectItem value="PAUSE">En pause</SelectItem>
                        <SelectItem value="CLOTURE">Clôturé</SelectItem>
                        <SelectItem value="PERDU">Perdu</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Description du mandat, secteur d'activité, particularités..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="equipe_interne"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Équipe interne</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Jean Dupont, Marie Martin (séparés par des virgules)"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={createDossierMutation.isPending}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={createDossierMutation.isPending}
                className="bg-primary-500 hover:bg-primary-600"
              >
                {createDossierMutation.isPending ? "Création..." : "Créer le Dossier"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}