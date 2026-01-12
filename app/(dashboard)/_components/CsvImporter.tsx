/* eslint-disable react/no-unescaped-entities */
// components/CsvImporter.tsx
"use client";

import { useState, useRef } from "react"; // ADD useRef
import { Button } from "@/components/ui/button";
import {
  Upload,
  FileText,
  AlertCircle,
  CheckCircle,
  Download,
  X,
} from "lucide-react";
import { showToast } from "@/lib/toast";

interface ImportResult {
  success: boolean;
  message: string;
  importedCount: number;
  errorCount: number;
  duplicatesCount?: number;
  errors?: string[];
  duplicates?: Array<{
    email: string;
    name: string;
    existingOwner: string;
  }>;
}

export default function CsvImporter({ onClose }: { onClose: () => void }) {
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [fileName, setFileName] = useState("");
  const [showWarning, setShowWarning] = useState(false);
  const [fileSelected, setFileSelected] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null); // ADD ref

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      showToast.error("Please upload a CSV file");
      return;
    }

    setFileName(file.name);
    setFileSelected(true);
    setShowWarning(true); // Show warning when file is selected
    setResult(null);
  };

  const handleConfirmImport = async () => {
    if (!fileSelected || !fileInputRef.current?.files?.[0]) return;

    setIsImporting(true);
    setShowWarning(false);

    const file = fileInputRef.current.files[0];

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/leads/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setResult({
          success: true,
          message: data.message || "Import successful",
          importedCount: data.importedCount || 0,
          errorCount: 0,
          duplicatesCount: data.duplicatesCount,
          duplicates: data.duplicates,
        });
        showToast.success(`Imported ${data.importedCount} leads successfully`);
      } else {
        setResult({
          success: false,
          message: data.error || "Import failed",
          importedCount: 0,
          errorCount: data.errorCount || 0,
          errors: data.errors || data.details,
          duplicatesCount: data.duplicatesCount,
          duplicates: data.duplicates,
        });
        showToast.error(data.error || "Import failed");
      }
    } catch (error) {
      setResult({
        success: false,
        message: `Network error during import: ${error}`,
        importedCount: 0,
        errorCount: 0,
      });
      showToast.error("Network error during import");
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = () => {
    const template = `Partners Name,Email Address,Phone Number,Business Address,Service Type,Lead Source,Priority Level,Additional Notes,Assets,Next Follow-up Date
Acme Inc,acme@example.com,1234567890,123 Business Rd,Logistics,Website,HIGH,Interested in fleet management,"5 Trucks, 2 Vans",1/15/2024
Global Corp,global@example.com,987654321,456 Corporate Ave,Food & Drinks,Referral,MEDIUM,Looking for cold chain logistics,Refrigerated Trucks,1/20/2024
Tech Solutions,tech@example.com,1122334455,789 Tech Park,Pharmacy,Google Ads,LOW,Need medical equipment transport,Medical Devices,1/25/2024`;

    const blob = new Blob([template], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "leads_import_template.csv";
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleCancelWarning = () => {
    setShowWarning(false);
    setFileSelected(false);
    setFileName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Import Leads from CSV</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <div className="flex flex-col items-center justify-center space-y-3">
          <Upload className="h-12 w-12 text-gray-400" />
          <div className="text-sm text-gray-600">
            <label
              htmlFor="csv-file"
              className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500"
            >
              <span>Upload a CSV file</span>
              <input
                id="csv-file"
                ref={fileInputRef} // ADD ref here
                name="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileSelect} // Use handleFileSelect instead of handleFileUpload
                disabled={isImporting}
                className="sr-only"
              />
            </label>
            <p className="pl-1">or drag and drop</p>
          </div>
          <p className="text-xs text-gray-500">CSV up to 10MB</p>
        </div>
      </div>

      {fileName && !showWarning && (
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <FileText className="h-4 w-4" />
          <span>{fileName}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancelWarning}
            className="text-red-600 hover:text-red-700"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {isImporting && (
        <div className="text-center text-blue-600">
          <p>Importing leads, please wait...</p>
        </div>
      )}

      {result && (
        <div
          className={`p-4 rounded-lg border ${
            result.success
              ? "bg-green-50 border-green-200"
              : "bg-red-50 border-red-200"
          }`}
        >
          <div className="flex items-start space-x-3">
            {result.success ? (
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            )}
            <div className="flex-1">
              <p
                className={`font-medium ${
                  result.success ? "text-green-800" : "text-red-800"
                }`}
              >
                {result.message}
              </p>

              {result.importedCount > 0 && (
                <p className="text-sm text-green-700 mt-1">
                  Successfully imported: {result.importedCount} leads
                </p>
              )}

              {result.duplicatesCount !== undefined &&
                result.duplicatesCount > 0 && (
                  <p className="text-sm text-orange-700 mt-1">
                    Duplicates detected: {result.duplicatesCount} leads
                  </p>
                )}

              {result.errorCount > 0 && (
                <p className="text-sm text-red-700 mt-1">
                  Errors: {result.errorCount} records
                </p>
              )}

              {/* Show duplicate details */}
              {result.duplicates && result.duplicates.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-orange-800 mb-2">
                    Duplicate leads found:
                  </p>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {result.duplicates.slice(0, 5).map((dup, index) => (
                      <div
                        key={index}
                        className="text-sm text-orange-700 p-2 bg-orange-100 rounded"
                      >
                        <strong>{dup.name}</strong> ({dup.email}) - Already
                        assigned to {dup.existingOwner}
                      </div>
                    ))}
                    {result.duplicates.length > 5 && (
                      <p className="text-xs text-orange-600">
                        ...and {result.duplicates.length - 5} more duplicates
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Show error details */}
              {result.errors && result.errors.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-red-800 mb-2">
                    Error details:
                  </p>
                  <ul className="text-sm text-red-700 space-y-1 max-h-32 overflow-y-auto">
                    {result.errors.slice(0, 5).map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                    {result.errors.length > 5 && (
                      <li className="text-xs text-red-600">
                        • ...and {result.errors.length - 5} more errors
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Button onClick={downloadTemplate} variant="outline" className="flex-1">
          <Download className="h-4 w-4 mr-2" />
          Download Template
        </Button>

        <Button onClick={onClose} variant="outline" className="flex-1">
          Close
        </Button>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">
          CSV Format Requirements: (Flexible Column Names)
        </h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>
            • <strong>Required:</strong> Name/Company and Email fields
          </li>
          <li>
            • <strong>Supported modules:</strong> Logistics, Food & Drinks, Chat
            With a Doctor, etc.
          </li>
          <li>
            • <strong>Name columns:</strong> "Name", "Company", "Partners Name",
            "Business Name"
          </li>
          <li>
            • <strong>Email columns:</strong> "Email", "Email Address", "Mail"
          </li>
          <li>
            • <strong>Phone columns:</strong> "Phone", "Phone Number",
            "Telephone", "Mobile"
          </li>
          <li>
            • <strong>Address columns:</strong> "Address", "Business Address",
            "Location"
          </li>
          <li>
            • <strong>Assets column:</strong> For logistics (trucks, equipment,
            fleet details)
          </li>
          <li>
            • <strong>Priority values:</strong> HIGH, MEDIUM, LOW
          </li>
          <li>
            • <strong>Date format:</strong> YYYY-MM-DD or MM/DD/YYYY
          </li>
          <li>
            • <strong>Max file size:</strong> 10MB
          </li>
          <li>• Duplicate emails will be detected and flagged</li>
          <li>• Unknown columns will be added to notes</li>
        </ul>
      </div>

      {/* Warning Modal - MOVED TO BOTTOM */}
      {showWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center space-x-3 mb-4">
              <AlertCircle className="h-6 w-6 text-orange-500" />
              <h3 className="text-lg font-semibold">Confirm Import</h3>
            </div>

            <p className="text-gray-600 mb-4">
              You are about to import <strong>{fileName}</strong>. Please
              ensure:
            </p>

            <ul className="text-sm text-gray-600 space-y-2 mb-6">
              <li>• Required fields (Name, Email) are present</li>
              <li>• Email formats are correct</li>
              <li>• No duplicate records exist</li>
              <li>• Date formats are consistent (YYYY-MM-DD)</li>
              <li>• File size is under 10MB</li>
            </ul>

            <div className="flex gap-3">
              <Button
                onClick={handleCancelWarning}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmImport}
                className="flex-1"
                disabled={isImporting}
              >
                {isImporting ? "Importing..." : "Confirm Import"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
