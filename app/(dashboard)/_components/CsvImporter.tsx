// components/CsvImporter.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileText, AlertCircle, CheckCircle } from "lucide-react";

interface ImportResult {
  success: boolean;
  message: string;
  importedCount: number;
  errorCount: number;
  errors?: string[];
}

export default function CsvImporter() {
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [fileName, setFileName] = useState("");

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsImporting(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/leads/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setResult(data);
      } else {
        setResult({
          success: false,
          message: data.error || "Import failed",
          importedCount: 0,
          errorCount: 0,
          errors: data.details,
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: `Network error during import: ${error}`,
        importedCount: 0,
        errorCount: 0,
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-4">
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
                name="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                disabled={isImporting}
                className="sr-only"
              />
            </label>
            <p className="pl-1">or drag and drop</p>
          </div>
          <p className="text-xs text-gray-500">CSV up to 10MB</p>
        </div>
      </div>

      {fileName && (
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <FileText className="h-4 w-4" />
          <span>{fileName}</span>
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
              {result.errorCount > 0 && (
                <p className="text-sm text-red-700 mt-1">
                  Errors: {result.errorCount} records
                </p>
              )}
              {result.errors && result.errors.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-red-800">
                    Error details:
                  </p>
                  <ul className="text-sm text-red-700 mt-1 space-y-1 max-h-32 overflow-y-auto">
                    {result.errors.slice(0, 10).map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                    {result.errors.length > 10 && (
                      <li>• ...and {result.errors.length - 10} more errors</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">
          CSV Format Requirements:
        </h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>
            • Required columns: <strong>Partner Name, Email</strong>
          </li>
          <li>
            • Optional columns: Phone, Address, Service, Source, Priority,
            Status, Notes, Next Follow-up
          </li>
          <li>• Priority must be: LOW, MEDIUM, or HIGH</li>
          <li>• Dates should be in format: YYYY-MM-DD or MM/DD/YYYY</li>
          <li>
            •{" "}
            <a href="/api/leads/export" download className="underline">
              Download template
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}
