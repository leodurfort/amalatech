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

const interactionFormSchema = z.object({
  type: z.string().min(1, "Le type d'interaction est requis"),
  date: z.string().min(1, "La date est requise"),
  notes: z.string().min(1, "Les notes sont requises"),
});

type InteractionFormData = z.infer<typeof interactionFormSchema>;

const INTERACTION_TYPES = [
  { value: "appel", label: "Appel téléphonique" },
  { value: "email", label: "Email" },
  { value: "reunion", label: "Réunion" },
  { value: "nda", label: "Envoi NDA" },
  { value: "teaser", label: "Envoi Teaser" },
  { value: "autre", label: "Autre" },
];

interface InteractionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: number | null;
  dossierId?: number | null;
  onInteractionAdded: () => void;
}

export default function InteractionModal({ 
  open, 
  onOpenChange, 
  companyId,
  dossierId,
  onInteractionAdded 
}: InteractionModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InteractionFormData>({
    resolver: zodResolver(interactionFormSchema),
    defaultValues: {
      type: "",
      date: new Date().toISOString().slice(0, 16), // Current datetime for datetime-local input
      notes: "",
    },
  });

  const createInteractionMutation = useMutation({
    mutationFn: async (data: InteractionFormData) => {
      if (!companyId) throw new Error("ID de société manquant");

      return apiRequest("POST", "/api/interactions", {
        dossier_id: dossierId || 1, // Using the specified dossier
        societe_id: companyId,
        contact_id: null, // We could enhance this to select a specific contact
        type: data.type,
        date: new Date(data.date).toISOString(),
        notes: data.notes,
        auteur: "Jean Dupont", // In a real app, this would come from authentication
      });
    },
    onSuccess: () => {
      if (dossierId) {
        queryClient.invalidateQueries({ queryKey: [`/api/roadshow/${dossierId}`] });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/interactions"] });
      toast({
        title: "Interaction enregistrée",
        description: "L'interaction a été ajoutée avec succès.",
      });
      form.reset();
      onInteractionAdded();
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'enregistrer l'interaction.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InteractionFormData) => {
    createInteractionMutation.mutate(data);
  };

  // Reset form when modal opens/closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
    }
    onOpenChange(newOpen);
  };

  if (!companyId) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nouvelle Interaction</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type d'interaction</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {INTERACTION_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date et heure</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Détails de l'interaction, points clés abordés..."
                      rows={4}
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
                disabled={createInteractionMutation.isPending}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={createInteractionMutation.isPending}
                className="bg-primary-500 hover:bg-primary-600"
              >
                {createInteractionMutation.isPending ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
