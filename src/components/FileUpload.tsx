
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, FileText, Check, Trash2 } from "lucide-react";
import { parseCsv } from "@/utils/simulationUtils";
import { StoredFile } from "@/types";

interface FileUploadProps {
  label: string;
  fileType: "maps" | "reservations";
  onFileUploaded: (data: any[], fileType: "maps" | "reservations", fileInfo?: StoredFile) => void;
  storedFile?: StoredFile;
  onRemoveFile?: () => void;
}

const FileUpload = ({ label, fileType, onFileUploaded, storedFile, onRemoveFile }: FileUploadProps) => {
  const [fileName, setFileName] = useState("");
  const [isUploaded, setIsUploaded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Initialize from stored file if available
  useEffect(() => {
    if (storedFile) {
      setFileName(storedFile.fileName);
      setIsUploaded(true);
    }
  }, [storedFile]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if it's a CSV file
    if (!file.name.endsWith(".csv")) {
      toast.error("Please upload a CSV file");
      return;
    }

    setFileName(file.name);
    
    // Show loading toast
    const loadingToastId = toast.loading(`Processing ${label}...`);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvData = e.target?.result as string;
        const parsedData = parseCsv(csvData);
        
        if (parsedData.length === 0) {
          toast.error("The file appears to be empty or invalid", {
            id: loadingToastId
          });
          return;
        }
        
        // Create file storage object
        const fileInfo: StoredFile = {
          data: parsedData,
          fileName: file.name,
          rawContent: csvData,
          lastUpdated: new Date().toISOString()
        };
        
        onFileUploaded(parsedData, fileType, fileInfo);
        setIsUploaded(true);
        toast.success(`${label} file uploaded successfully`, {
          id: loadingToastId
        });
      } catch (error) {
        console.error("Error parsing CSV:", error);
        toast.error("Error parsing the CSV file", {
          id: loadingToastId
        });
      }
    };
    
    reader.onerror = () => {
      toast.error("Error reading the file", {
        id: loadingToastId
      });
    };
    
    reader.readAsText(file);
  };

  const handleUploadClick = () => {
    inputRef.current?.click();
  };
  
  const handleRemoveFile = () => {
    if (onRemoveFile) {
      onRemoveFile();
      setFileName("");
      setIsUploaded(false);
      toast.success(`${label} file removed`);
    }
  };

  return (
    <div className="animate-fade-in">
      <input
        type="file"
        accept=".csv"
        ref={inputRef}
        onChange={handleFileChange}
        className="hidden"
      />
      
      <div className="glass-card p-6 transition-all duration-300 ease-in-out">
        <div className="flex flex-col items-center space-y-4">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${isUploaded ? "bg-green-100" : "bg-primary/10"}`}>
            {isUploaded ? (
              <Check className="w-8 h-8 text-green-500" />
            ) : (
              <FileText className="w-8 h-8 text-primary" />
            )}
          </div>
          
          <div className="text-center">
            <h3 className="font-medium text-lg">{label}</h3>
            {fileName ? (
              <div className="flex items-center space-x-2">
                <p className="text-sm text-muted-foreground truncate max-w-xs">
                  {fileName}
                </p>
                {storedFile && (
                  <div className="text-xs text-muted-foreground">
                    (saved)
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Upload a CSV file
              </p>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={handleUploadClick} 
              className="mt-4 gap-2 transition-all duration-300 ease-in-out shadow-sm hover:shadow"
              variant={isUploaded ? "outline" : "default"}
            >
              <Upload className="w-4 h-4" />
              {isUploaded ? "Replace File" : "Upload File"}
            </Button>
            
            {isUploaded && onRemoveFile && (
              <Button 
                onClick={handleRemoveFile} 
                className="mt-4 gap-2"
                variant="destructive"
              >
                <Trash2 className="w-4 h-4" />
                Remove
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
