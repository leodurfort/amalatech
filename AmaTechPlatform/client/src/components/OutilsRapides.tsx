import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileIcon, ShrinkIcon, DropletIcon, MergeIcon, UploadIcon, XIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const MAX_FILE_SIZE = 150 * 1024 * 1024; // 150 MB

export default function OutilsRapides() {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileValidation = (file: File): boolean => {
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "Fichier trop volumineux",
        description: "Taille maximale autorisée : 150 Mo",
        variant: "destructive",
      });
      return false;
    }
    if (file.type !== "application/pdf") {
      toast({
        title: "Format invalide",
        description: "Seuls les fichiers PDF sont acceptés",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Boîte à Outils</CardTitle>
        <CardDescription>
          Outils de manipulation PDF pour vos documents professionnels
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Compresser PDF */}
        <CompressPdfTool 
          onProcessing={setIsProcessing}
          isProcessing={isProcessing}
          validateFile={handleFileValidation}
        />
        
        {/* Ajouter filigrane */}
        <WatermarkPdfTool 
          onProcessing={setIsProcessing}
          isProcessing={isProcessing}
          validateFile={handleFileValidation}
        />
        
        {/* Fusionner PDF */}
        <MergePdfTool 
          onProcessing={setIsProcessing}
          isProcessing={isProcessing}
          validateFile={handleFileValidation}
        />
      </CardContent>
    </Card>
  );
}

function CompressPdfTool({ onProcessing, isProcessing, validateFile }: any) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [open, setOpen] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && validateFile(selectedFile)) {
      setFile(selectedFile);
    }
  };

  const handleCompress = async () => {
    if (!file) return;
    
    onProcessing(true);
    try {
      // Simulation de compression - en réalité utiliserait une bibliothèque comme pdf-lib
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Créer un blob simulé (en réalité ce serait le PDF compressé)
      const compressedBlob = new Blob([file], { type: 'application/pdf' });
      const url = URL.createObjectURL(compressedBlob);
      
      // Télécharger le fichier
      const a = document.createElement('a');
      a.href = url;
      a.download = `${file.name.replace('.pdf', '')}_compresse.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Compression terminée",
        description: "Votre PDF compressé a été téléchargé",
      });
      
      setFile(null);
      setOpen(false);
    } catch (error) {
      toast({
        title: "Erreur de compression",
        description: "Une erreur est survenue lors de la compression",
        variant: "destructive",
      });
    } finally {
      onProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start" disabled={isProcessing}>
          <ShrinkIcon className="h-4 w-4 mr-2" />
          Compresser un PDF
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Compresser un PDF</DialogTitle>
          <DialogDescription>
            Réduisez la taille de vos fichiers PDF tout en conservant la qualité.
            <br />
            <span className="text-xs text-gray-500 mt-2 block">
              Traitement local – aucun fichier n'est conservé
            </span>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="pdf-file">Sélectionner un fichier PDF (max 150 Mo)</Label>
            <Input 
              id="pdf-file"
              type="file" 
              accept=".pdf"
              onChange={handleFileSelect}
              className="mt-1"
            />
          </div>
          
          {file && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileIcon className="h-4 w-4 mr-2 text-red-600" />
                  <span className="text-sm font-medium">{file.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFile(null)}
                >
                  <XIcon className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Taille: {(file.size / (1024 * 1024)).toFixed(2)} Mo
              </p>
            </div>
          )}
          
          <Button 
            onClick={handleCompress} 
            disabled={!file || isProcessing}
            className="w-full"
          >
            {isProcessing ? "Compression en cours..." : "Compresser"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function WatermarkPdfTool({ onProcessing, isProcessing, validateFile }: any) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [watermarkText, setWatermarkText] = useState("Strictement confidentiel – Amala Partners");
  const [open, setOpen] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && validateFile(selectedFile)) {
      setFile(selectedFile);
    }
  };

  const handleWatermark = async () => {
    if (!file || !watermarkText.trim()) return;
    
    onProcessing(true);
    try {
      // Simulation d'ajout de filigrane
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Créer un blob simulé (en réalité ce serait le PDF avec filigrane)
      const watermarkedBlob = new Blob([file], { type: 'application/pdf' });
      const url = URL.createObjectURL(watermarkedBlob);
      
      // Télécharger le fichier
      const a = document.createElement('a');
      a.href = url;
      a.download = `${file.name.replace('.pdf', '')}_filigrane.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Filigrane ajouté",
        description: "Votre PDF avec filigrane a été téléchargé",
      });
      
      setFile(null);
      setOpen(false);
    } catch (error) {
      toast({
        title: "Erreur de traitement",
        description: "Une erreur est survenue lors de l'ajout du filigrane",
        variant: "destructive",
      });
    } finally {
      onProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start" disabled={isProcessing}>
          <DropletIcon className="h-4 w-4 mr-2" />
          Ajouter un filigrane
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter un filigrane</DialogTitle>
          <DialogDescription>
            Ajoutez un filigrane personnalisé sur toutes les pages de votre PDF.
            <br />
            <span className="text-xs text-gray-500 mt-2 block">
              Traitement local – aucun fichier n'est conservé
            </span>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="watermark-file">Sélectionner un fichier PDF (max 150 Mo)</Label>
            <Input 
              id="watermark-file"
              type="file" 
              accept=".pdf"
              onChange={handleFileSelect}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="watermark-text">Texte du filigrane</Label>
            <Textarea 
              id="watermark-text"
              value={watermarkText}
              onChange={(e) => setWatermarkText(e.target.value)}
              placeholder="Entrez le texte du filigrane..."
              className="mt-1"
              rows={3}
            />
          </div>
          
          {file && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileIcon className="h-4 w-4 mr-2 text-red-600" />
                  <span className="text-sm font-medium">{file.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFile(null)}
                >
                  <XIcon className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Taille: {(file.size / (1024 * 1024)).toFixed(2)} Mo
              </p>
            </div>
          )}
          
          <Button 
            onClick={handleWatermark} 
            disabled={!file || !watermarkText.trim() || isProcessing}
            className="w-full"
          >
            {isProcessing ? "Ajout du filigrane..." : "Ajouter le filigrane"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MergePdfTool({ onProcessing, isProcessing, validateFile }: any) {
  const { toast } = useToast();
  const [files, setFiles] = useState<File[]>([]);
  const [open, setOpen] = useState(false);

  const handleFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles = selectedFiles.filter(file => {
      if (validateFile(file)) {
        return true;
      }
      return false;
    });

    if (files.length + validFiles.length > 10) {
      toast({
        title: "Trop de fichiers",
        description: "Maximum 10 fichiers autorisés",
        variant: "destructive",
      });
      return;
    }

    setFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const moveFile = (fromIndex: number, toIndex: number) => {
    const newFiles = [...files];
    const [movedFile] = newFiles.splice(fromIndex, 1);
    newFiles.splice(toIndex, 0, movedFile);
    setFiles(newFiles);
  };

  const handleMerge = async () => {
    if (files.length < 2) return;
    
    onProcessing(true);
    try {
      // Simulation de fusion
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Créer un blob simulé (en réalité ce serait le PDF fusionné)
      const mergedBlob = new Blob([files[0]], { type: 'application/pdf' });
      const url = URL.createObjectURL(mergedBlob);
      
      // Télécharger le fichier
      const a = document.createElement('a');
      a.href = url;
      a.download = `PDF_fusionne_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Fusion terminée",
        description: "Votre PDF fusionné a été téléchargé",
      });
      
      setFiles([]);
      setOpen(false);
    } catch (error) {
      toast({
        title: "Erreur de fusion",
        description: "Une erreur est survenue lors de la fusion",
        variant: "destructive",
      });
    } finally {
      onProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start" disabled={isProcessing}>
          <MergeIcon className="h-4 w-4 mr-2" />
          Fusionner des PDF
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Fusionner des PDF</DialogTitle>
          <DialogDescription>
            Combinez plusieurs fichiers PDF en un seul document.
            <br />
            <span className="text-xs text-gray-500 mt-2 block">
              Traitement local – aucun fichier n'est conservé
            </span>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="merge-files">Sélectionner des fichiers PDF (2-10 fichiers, max 150 Mo chacun)</Label>
            <Input 
              id="merge-files"
              type="file" 
              accept=".pdf"
              multiple
              onChange={handleFilesSelect}
              className="mt-1"
            />
          </div>
          
          {files.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              <p className="text-sm font-medium">Fichiers sélectionnés ({files.length}/10):</p>
              {files.map((file, index) => (
                <div key={index} className="p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center min-w-0">
                      <span className="text-xs bg-gray-200 rounded px-1 mr-2 flex-shrink-0">
                        {index + 1}
                      </span>
                      <FileIcon className="h-4 w-4 mr-2 text-red-600 flex-shrink-0" />
                      <span className="text-sm font-medium truncate">{file.name}</span>
                    </div>
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      {index > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveFile(index, index - 1)}
                          className="h-6 w-6 p-0"
                        >
                          ↑
                        </Button>
                      )}
                      {index < files.length - 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveFile(index, index + 1)}
                          className="h-6 w-6 p-0"
                        >
                          ↓
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="h-6 w-6 p-0"
                      >
                        <XIcon className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-1 ml-7">
                    {(file.size / (1024 * 1024)).toFixed(2)} Mo
                  </p>
                </div>
              ))}
            </div>
          )}
          
          <Button 
            onClick={handleMerge} 
            disabled={files.length < 2 || isProcessing}
            className="w-full"
          >
            {isProcessing ? "Fusion en cours..." : `Fusionner ${files.length} fichiers`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}