import { useState } from "react";
import { PlusIcon, MinusIcon } from "lucide-react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TrancheRow {
  min: number | null;
  max: number | null;
  percent: number;
}

interface EconomicConditionsCardProps {
  form: any;
  userRole?: string;
}

export default function EconomicConditionsCard({ form, userRole }: EconomicConditionsCardProps) {
  const retainer = form.watch("retainer");
  const flatFee = form.watch("flat_fee");
  const successFeeMode = form.watch("success_fee_mode") || "simple";
  const successFeePourcentage = form.watch("success_fee_pourcentage") || 0;
  const successFeeBase = form.watch("success_fee_base") || "VE";
  const tranches = form.watch("tranches") || [];
  const pipelinePonderation = form.watch("pipeline_ponderation") || 100;
  const valeurOperation = form.watch("valeur_operation") || 0;
  const retainerAmount = form.watch("retainer_amount") || 0;
  const flatFeeAmount = form.watch("flat_fee_amount") || 0;

  const addTranche = () => {
    if (tranches.length < 5) {
      // Calculer les valeurs par défaut pour éviter les chevauchements
      const lastMax = tranches.length > 0 ? 
        Math.max(...tranches.map((t: TrancheRow) => t.max || 0).filter(Boolean)) : 0;
      const defaultMin = lastMax > 0 ? lastMax : 0;
      const defaultMax = defaultMin + 10000000; // +10M€ par défaut
      
      const newTranches = [...tranches, { 
        min: defaultMin > 0 ? defaultMin : null,
        max: defaultMax,
        percent: 0
      }];
      form.setValue("tranches", newTranches);
    }
  };

  const removeTranche = (index: number) => {
    const newTranches = tranches.filter((_: any, i: number) => i !== index);
    form.setValue("tranches", newTranches);
  };

  const updateTranche = (index: number, field: keyof TrancheRow, value: any) => {
    const newTranches = [...tranches];
    newTranches[index] = { ...newTranches[index], [field]: value };
    form.setValue("tranches", newTranches);
  };

  // Calcul des fees avec mode simple ou progressif
  const calculateFees = () => {
    if (valeurOperation <= 0) return { total: 0, details: {} };
    
    const valeurPonderee = (valeurOperation * pipelinePonderation) / 100;
    let totalFees = 0;
    const details: any = {};

    // Retainer
    if (retainer && retainerAmount > 0) {
      totalFees += retainerAmount;
      details.retainer = retainerAmount;
    }

    // Flat fee
    if (flatFee && flatFeeAmount > 0) {
      totalFees += flatFeeAmount;
      details.flatFee = flatFeeAmount;
    }

    // Success fee selon le mode
    if (successFeeMode === "simple") {
      // Mode simple : pourcentage fixe
      if (successFeePourcentage > 0) {
        const successFee = (valeurPonderee * successFeePourcentage) / 100;
        totalFees += successFee;
        details.successFee = {
          mode: "simple",
          base: successFeeBase,
          pourcentage: successFeePourcentage,
          montant: successFee
        };
      }
    } else if (successFeeMode === "progressive") {
      // Mode progressif : tranches
      const sortedTranches = [...tranches].sort((a: TrancheRow, b: TrancheRow) => {
        const aMin = a.min || 0;
        const bMin = b.min || 0;
        return aMin - bMin;
      });

      let successFeeTotal = 0;
      const trancheDetails: any[] = [];

      sortedTranches.forEach((tranche: TrancheRow) => {
        const min = tranche.min || 0;
        const max = tranche.max;
        
        if (tranche.percent > 0 && valeurPonderee > min) {
          const applicableMax = max ? Math.min(valeurPonderee, max) : valeurPonderee;
          const applicableValue = applicableMax - min;
          
          if (applicableValue > 0) {
            const trancheFee = (applicableValue * tranche.percent) / 100;
            successFeeTotal += trancheFee;
            trancheDetails.push({
              tranche: max ? 
                `${min.toLocaleString('fr-FR')} € - ${max.toLocaleString('fr-FR')} €` :
                `Au-dessus de ${min.toLocaleString('fr-FR')} €`,
              pourcentage: tranche.percent,
              valeurApplicable: applicableValue,
              fee: trancheFee
            });
          }
        }
      });

      totalFees += successFeeTotal;
      details.successFee = {
        mode: "progressive",
        total: successFeeTotal,
        details: trancheDetails
      };
    }

    return { total: totalFees, details };
  };

  const feesCalculation = calculateFees();
  const totalFeesEstimes = feesCalculation.total;
  const feesDetails = feesCalculation.details;
  const valeurPonderee = valeurOperation > 0 ? (valeurOperation * pipelinePonderation) / 100 : 0;

  return (
    <div className="border-t pt-6 space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">
        Conditions économiques (Admin uniquement)
      </h3>

      {/* Retainer */}
      <div className="space-y-3">
        <FormField
          control={form.control}
          name="retainer"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel className="font-normal">Retainer</FormLabel>
            </FormItem>
          )}
        />
        {retainer && (
          <FormField
            control={form.control}
            name="retainer_amount"
            render={({ field }) => (
              <FormItem className="max-w-xs">
                <FormLabel>Montant du retainer (€)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="50000" 
                    {...field} 
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
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
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel className="font-normal">Flat Fee</FormLabel>
            </FormItem>
          )}
        />
        {flatFee && (
          <FormField
            control={form.control}
            name="flat_fee_amount"
            render={({ field }) => (
              <FormItem className="max-w-xs">
                <FormLabel>Montant du flat fee (€)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="100000" 
                    {...field} 
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>

      {/* Mode de calcul Success Fee */}
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="success_fee_mode"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-medium">Mode de calcul Success Fee</FormLabel>
              <FormControl>
                <div className="flex space-x-6 mt-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      value="simple"
                      checked={field.value === "simple"}
                      onChange={() => field.onChange("simple")}
                      className="h-4 w-4 text-blue-600"
                    />
                    <span className="text-sm font-medium">Success Fee simple</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      value="progressive"
                      checked={field.value === "progressive"}
                      onChange={() => field.onChange("progressive")}
                      className="h-4 w-4 text-blue-600"
                    />
                    <span className="text-sm font-medium">Mécanisme accélérateur (progressif)</span>
                  </label>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Mode Simple */}
        {successFeeMode === "simple" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-gray-50">
            <FormField
              control={form.control}
              name="success_fee_pourcentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Success Fee (%)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="1.5" 
                      step="0.1"
                      max="100"
                      {...field} 
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="success_fee_base"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Base de calcul</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="VE ou VT" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="VE">VE (Valeur d'Entreprise)</SelectItem>
                      <SelectItem value="VT">VT (Valeur Transaction)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* Mode Progressif */}
        {successFeeMode === "progressive" && (
          <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
            <div className="flex items-center justify-between">
              <FormLabel className="text-base font-medium">Tranches progressives</FormLabel>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addTranche}
                disabled={tranches.length >= 5}
                className="flex items-center gap-2"
              >
                <PlusIcon className="h-4 w-4" />
                Ajouter une tranche
              </Button>
            </div>
            
            {tranches.map((tranche: TrancheRow, index: number) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end p-4 border rounded-lg bg-white">
                <div>
                  <label className="text-sm font-medium">Montant minimum (€)</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={tranche.min || ""}
                    onChange={(e) => updateTranche(index, "min", e.target.value ? Number(e.target.value) : null)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Laisser vide pour "depuis 0"
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Montant maximum (€)</label>
                  <Input
                    type="number"
                    placeholder="Illimité"
                    value={tranche.max || ""}
                    onChange={(e) => updateTranche(index, "max", e.target.value ? Number(e.target.value) : null)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Laisser vide pour "illimité"
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Pourcentage (%)</label>
                  <Input
                    type="number"
                    placeholder="1.5"
                    step="0.1"
                    max="100"
                    value={tranche.percent}
                    onChange={(e) => updateTranche(index, "percent", Number(e.target.value))}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    % appliqué à cette tranche
                  </p>
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => removeTranche(index)}
                  className="flex items-center gap-2"
                >
                  <MinusIcon className="h-4 w-4" />
                  Supprimer
                </Button>
              </div>
            ))}

            {/* Résumé des tranches */}
            {tranches.length > 0 && (
              <div className="bg-blue-50 p-3 rounded-md text-xs">
                <div className="font-medium text-blue-900 mb-2">Configuration actuelle :</div>
                {tranches.map((tranche: TrancheRow, index: number) => {
                  const min = tranche.min || 0;
                  const max = tranche.max;
                  return (
                    <div key={index} className="text-blue-700">
                      {max ? 
                        `${min.toLocaleString('fr-FR')} € - ${max.toLocaleString('fr-FR')} €` :
                        `Au-dessus de ${min.toLocaleString('fr-FR')} €`} 
                      : {tranche.percent}%
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>



      {/* Valeur de l'opération */}
      <FormField
        control={form.control}
        name="valeur_operation"
        render={({ field }) => (
          <FormItem className="max-w-sm">
            <FormLabel>Valeur de l'opération (€)</FormLabel>
            <FormControl>
              <Input 
                type="number" 
                placeholder="30000000" 
                {...field} 
                onChange={(e) => field.onChange(Number(e.target.value))}
              />
            </FormControl>
            <p className="text-xs text-muted-foreground">
              Utilisée pour le calcul des fees
            </p>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Pipeline Weighting */}
      <FormField
        control={form.control}
        name="pipeline_ponderation"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Pondération pipeline (%)</FormLabel>
            <FormControl>
              <Input 
                type="number" 
                placeholder="80" 
                min="0"
                max="100"
                {...field} 
                onChange={(e) => field.onChange(Number(e.target.value))}
              />
            </FormControl>
            <p className="text-xs text-muted-foreground">
              Permet d'ajuster la valeur retenue pour calculer les fees
            </p>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Output complet des fees - Force l'affichage */}
      {(valeurOperation > 0 || successFeePourcentage > 0) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
          <h4 className="font-semibold text-gray-900">Calcul des fees</h4>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Valeur opération :</span>
              <span className="font-medium">{valeurOperation.toLocaleString('fr-FR')} €</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Pondération pipeline ({pipelinePonderation}%) :</span>
              <span className="font-medium">{valeurPonderee.toLocaleString('fr-FR')} €</span>
            </div>
            
            <hr className="border-gray-300" />
            
            {feesDetails.retainer && (
              <div className="flex justify-between">
                <span>Retainer :</span>
                <span className="font-medium">+{feesDetails.retainer.toLocaleString('fr-FR')} €</span>
              </div>
            )}
            
            {feesDetails.flatFee && (
              <div className="flex justify-between">
                <span>Flat fee :</span>
                <span className="font-medium">+{feesDetails.flatFee.toLocaleString('fr-FR')} €</span>
              </div>
            )}
            
            {feesDetails.successFee && (
              <div className="space-y-1">
                {feesDetails.successFee.mode === "simple" ? (
                  <div className="flex justify-between">
                    <span>Success fee ({feesDetails.successFee.pourcentage}% sur {feesDetails.successFee.base}) :</span>
                    <span className="font-medium">+{feesDetails.successFee.montant.toLocaleString('fr-FR')} €</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between font-medium">
                      <span>Success fee (progressif) :</span>
                      <span>+{feesDetails.successFee.total.toLocaleString('fr-FR')} €</span>
                    </div>
                    {feesDetails.successFee.details.map((detail: any, index: number) => (
                      <div key={index} className="flex justify-between text-xs text-gray-600 ml-4">
                        <span>{detail.tranche} ({detail.pourcentage}%) :</span>
                        <span>+{detail.fee.toLocaleString('fr-FR')} €</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
            
            <hr className="border-gray-300" />
            
            <div className="flex justify-between text-base font-bold">
              <span>Total des fees estimés :</span>
              <span>{totalFeesEstimes.toLocaleString('fr-FR')} €</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}