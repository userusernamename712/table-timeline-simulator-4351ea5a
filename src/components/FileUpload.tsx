
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, FileText, Check } from "lucide-react";
import { parseCsv } from "@/utils/simulationUtils";

interface FileUploadProps {
  label: string;
  fileType: "maps" | "reservations";
  onFileUploaded: (data: any[], fileType: "maps" | "reservations") => void;
}

const FileUpload = ({ label, fileType, onFileUploaded }: FileUploadProps) => {
  const [fileName, setFileName] = useState("");
  const [isUploaded, setIsUploaded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if it's a CSV file
    if (!file.name.endsWith(".csv")) {
      toast.error("Please upload a CSV file");
      return;
    }

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvData = e.target?.result as string;
        const parsedData = parseCsv(csvData);
        
        if (parsedData.length === 0) {
          toast.error("The file appears to be empty or invalid");
          return;
        }
        
        onFileUploaded(parsedData, fileType);
        setIsUploaded(true);
        toast.success(`${label} file uploaded successfully`);
      } catch (error) {
        console.error("Error parsing CSV:", error);
        toast.error("Error parsing the CSV file");
      }
    };
    
    reader.onerror = () => {
      toast.error("Error reading the file");
    };
    
    reader.readAsText(file);
  };

  const handleUploadClick = () => {
    inputRef.current?.click();
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
              <p className="text-sm text-muted-foreground truncate max-w-xs">
                {fileName}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Upload a CSV file
              </p>
            )}
          </div>
          
          <Button 
            onClick={handleUploadClick} 
            className="mt-4 gap-2 transition-all duration-300 ease-in-out shadow-sm hover:shadow"
            variant={isUploaded ? "outline" : "default"}
          >
            <Upload className="w-4 h-4" />
            {isUploaded ? "Replace File" : "Upload File"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
