"use client";

import React, { useState, useRef } from "react";
import { 
  UploadCloud, 
  FileSpreadsheet, 
  AlertTriangle, 
  CheckCircle, 
  X, 
  RefreshCw, 
  Info, 
  Sparkles 
} from "lucide-react";

interface UploadSummary {
  totalParsedRows: number;
  successfullyIngested: number;
  failedRows: number;
  touchedStudentsCount: number;
}

export default function BulkUploadPage() {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [summary, setSummary] = useState<UploadSummary | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      validateAndSetFile(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    setUploadError(null);
    setSuccessMessage(null);
    setSummary(null);
    setWarnings([]);

    const name = selectedFile.name.toLowerCase();
    if (name.endsWith(".xlsx") || name.endsWith(".xls") || name.endsWith(".csv")) {
      setFile(selectedFile);
    } else {
      setUploadError("Invalid file type. Please upload an Excel (.xlsx, .xls) or CSV (.csv) file.");
      setFile(null);
    }
  };

  const removeFile = () => {
    setFile(null);
    setSummary(null);
    setWarnings([]);
    setSuccessMessage(null);
    setUploadError(null);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    setSuccessMessage(null);
    setSummary(null);
    setWarnings([]);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setUploadError(data.error || "Failed to process the spreadsheet.");
        if (data.details) {
          setWarnings(data.details);
        }
      } else {
        setSuccessMessage(data.message || "File uploaded and processed successfully.");
        if (data.summary) {
          setSummary(data.summary);
        }
        if (data.warnings) {
          setWarnings(data.warnings);
        }
      }
    } catch (err) {
      console.error("Upload error:", err);
      setUploadError("A network error occurred. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const triggerInputClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight">Bulk Student Data Ingest</h1>
        <p className="text-muted-foreground text-sm max-w-2xl">
          Upload B.Tech grade sheets and results transcripts (Excel or CSV). The engine will dynamically map course categories, isolate active backlogs, ignore fails in credits totals, and recalculate student CGPAs in real time.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Column (left/center) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-border">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-primary" /> Drag & Drop Upload
            </h2>

            <form onSubmit={handleUploadSubmit} className="space-y-5">
              {/* Drag zone container */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={file ? undefined : triggerInputClick}
                className={`relative border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 ${
                  dragActive
                    ? "border-primary bg-primary/5 scale-[0.99]"
                    : "border-border hover:border-primary/45 hover:bg-muted/40"
                } ${file ? "cursor-default" : ""}`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  id="file-upload"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {!file ? (
                  <div className="space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto pulse-glow">
                      <UploadCloud className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">
                        Drag and drop your spreadsheet here, or <span className="text-primary hover:underline font-bold">browse</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Supports Excel files (.xlsx, .xls) and CSV sheets (.csv) up to 10MB
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full flex items-center justify-between p-4 bg-muted/60 rounded-xl border border-border">
                    <div className="flex items-center gap-3 text-left">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                        <FileSpreadsheet className="w-5 h-5" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-semibold text-sm truncate max-w-[280px] lg:max-w-[400px]">
                          {file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeFile}
                      disabled={uploading}
                      className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors border border-border/40"
                      title="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Upload trigger button */}
              {file && (
                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/95 hover:to-purple-600/95 active:scale-[0.99] text-primary-foreground font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Ingesting Transcript Data...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Process and Audit Transcript</span>
                    </>
                  )}
                </button>
              )}
            </form>
          </div>

          {/* Operation alerts & Summary log reports */}
          {uploadError && (
            <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Failed to Ingest File</span>
                <p className="mt-1 opacity-90">{uploadError}</p>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="p-4 rounded-2xl bg-success/10 border border-success/20 text-success text-sm flex items-start gap-3">
              <CheckCircle className="w-5 h-5 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <span className="font-bold">Ingest Successful</span>
                <p className="mt-0.5 opacity-90">{successMessage}</p>
              </div>
            </div>
          )}

          {summary && (
            <div className="glass-panel p-6 rounded-3xl border border-border space-y-4">
              <h3 className="font-bold text-base border-b border-border pb-3 flex items-center gap-2">
                <Info className="w-4 h-4 text-primary" /> Ingestion Summary Report
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-muted/40 p-4 rounded-2xl border border-border text-center">
                  <span className="text-2xl font-extrabold">{summary.totalParsedRows}</span>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-1">Parsed Rows</p>
                </div>
                <div className="bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/10 text-center">
                  <span className="text-2xl font-extrabold text-emerald-500">{summary.successfullyIngested}</span>
                  <p className="text-[10px] text-emerald-500/80 uppercase font-bold tracking-wider mt-1">Successfully Saved</p>
                </div>
                <div className="bg-rose-500/5 p-4 rounded-2xl border border-rose-500/10 text-center">
                  <span className="text-2xl font-extrabold text-rose-500">{summary.failedRows}</span>
                  <p className="text-[10px] text-rose-500/80 uppercase font-bold tracking-wider mt-1">Failed Rows</p>
                </div>
                <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 text-center">
                  <span className="text-2xl font-extrabold text-primary">{summary.touchedStudentsCount}</span>
                  <p className="text-[10px] text-primary/80 uppercase font-bold tracking-wider mt-1">Touched Students</p>
                </div>
              </div>
            </div>
          )}

          {warnings.length > 0 && (
            <div className="glass-panel p-6 rounded-3xl border border-border space-y-3">
              <h3 className="font-bold text-sm text-amber-500 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Processing Console Logs ({warnings.length})
              </h3>
              <div className="max-h-60 overflow-y-auto border border-border rounded-xl bg-card p-3 font-mono text-xs space-y-1 bg-background/60">
                {warnings.map((warn, i) => (
                  <p key={i} className="text-muted-foreground border-b border-border/30 pb-1.5 last:border-0 last:pb-0">
                    <span className="text-amber-500 font-bold mr-1.5">[{i + 1}]</span>
                    {warn}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Mapping Instructions (Right panel) */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-border space-y-4">
            <h3 className="font-bold text-sm uppercase tracking-wider text-primary border-b border-border pb-3">
              Excel Header Synonyms
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Our ingestion engine parses sheets dynamically by mapping column headers. Ensure your spreadsheets include columns matching any of these synonyms:
            </p>
            <div className="space-y-3 text-xs">
              <div className="border-b border-border/50 pb-2">
                <span className="font-bold block text-foreground mb-1">1. Student Roll Number</span>
                <span className="text-muted-foreground">Roll Number, RollNo, Roll_No, Student_Id, Reg_No</span>
              </div>
              <div className="border-b border-border/50 pb-2">
                <span className="font-bold block text-foreground mb-1">2. Student Name</span>
                <span className="text-muted-foreground">Student Name, Name, Full Name, Student_Name</span>
              </div>
              <div className="border-b border-border/50 pb-2">
                <span className="font-bold block text-foreground mb-1">3. Course/Subject Code</span>
                <span className="text-muted-foreground">Subject Code, Course Code, SubCode, CourseCode</span>
              </div>
              <div className="border-b border-border/50 pb-2">
                <span className="font-bold block text-foreground mb-1">4. Letter Grade</span>
                <span className="text-muted-foreground">Grade, Result, Letter_Grade, Letter Grade</span>
              </div>
              <div>
                <span className="font-bold block text-foreground mb-1">5. Current Semester</span>
                <span className="text-muted-foreground">Semester, Sem, Term (values must be 1-8)</span>
              </div>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-3xl border border-border text-xs leading-relaxed text-muted-foreground space-y-2">
            <span className="font-bold text-foreground block mb-2">Automated Credit Calculus Rules:</span>
            <p>1. Earned credits are automatically extracted from the official subject registry mappings (Curriculum Master).</p>
            <p>2. Transcripts containing grade letters <strong className="text-rose-500 font-bold">F</strong>, <strong className="text-rose-500 font-bold">Ab</strong>, or <strong className="text-rose-500 font-bold">Absent</strong> are calculated as <strong className="text-foreground">0 earned credits</strong>.</p>
            <p>3. If a student subsequently retakes and passes a previously failed subject in a later term record, the active backlog is cleared, and credits are updated.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
