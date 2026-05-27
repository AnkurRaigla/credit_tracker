"use client";

import React, { useState } from "react";
import { Sparkles, RefreshCw, ChevronDown, ChevronUp, AlertCircle, FileText, Printer } from "lucide-react";

interface AiAdvisorWidgetProps {
  rollNumber: string;
}

export default function AiAdvisorWidget({ rollNumber }: AiAdvisorWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);

  const fetchAiAudit = async () => {
    setLoading(true);
    setErrorMsg(null);
    setAnalysis(null);

    try {
      const response = await fetch(`/api/ai-predict?rollNumber=${encodeURIComponent(rollNumber)}`);
      const data = await response.json();

      if (!response.ok) {
        setErrorMsg(data.error || "Failed to retrieve AI analysis.");
      } else {
        setAnalysis(data.analysis);
        setIsMock(data.isMock || false);
      }
    } catch (err) {
      console.error("AI fetch error:", err);
      setErrorMsg("A network error occurred while connecting to the Gemini AI models.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState && !analysis && !loading) {
      fetchAiAudit();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="glass-panel rounded-3xl border border-border overflow-hidden relative">
      {/* Decorative top gradient bar */}
      <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-primary to-purple-500"></div>

      <button
        onClick={handleToggle}
        type="button"
        className="w-full p-6 text-left font-bold flex items-center justify-between hover:bg-muted/30 transition-colors"
      >
        <span className="flex items-center gap-2.5 text-base">
          <Sparkles className="w-5 h-5 text-primary animate-pulse-glow" /> 
          <span>Gemini AI Academic Advisor</span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider uppercase bg-primary/10 text-primary border border-primary/20">
            AI Assistant
          </span>
        </span>
        {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>

      {isOpen && (
        <div className="p-6 border-t border-border bg-card/30 space-y-4">
          {/* Error Banner */}
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">AI Analysis Failed</span>
                <p className="mt-1 opacity-90">{errorMsg}</p>
                <button
                  onClick={fetchAiAudit}
                  className="mt-3 px-3 py-1.5 rounded-lg bg-destructive/20 hover:bg-destructive/30 text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3 h-3" /> Retry Generation
                </button>
              </div>
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 bg-background/30 rounded-2xl border border-border/40">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
                <Sparkles className="w-5 h-5 text-primary absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse-glow" />
              </div>
              <div>
                <p className="font-bold text-sm">Consulting B.Tech Curricular Models...</p>
                <p className="text-xs text-muted-foreground mt-1">Generating deep-risk predictions and elective pathway audits.</p>
              </div>
            </div>
          )}

          {/* Render markdown analysis */}
          {analysis && (
            <div className="space-y-4">
              {isMock && (
                <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 text-muted-foreground text-[10px] flex gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <span>
                    <strong>Sandbox Mode</strong>: Standard advisor audit models were generated using direct academic rule profiles. To link this to dynamic cloud LLM responses, set a valid <code className="bg-muted px-1.5 py-0.5 rounded text-amber-500 font-mono">GEMINI_API_KEY</code> environment variable in your root configuration.
                  </span>
                </div>
              )}

              {/* Styled analysis text body */}
              <div className="border border-border/60 rounded-2xl bg-background/50 p-6 text-sm leading-relaxed text-muted-foreground space-y-4 max-h-[460px] overflow-y-auto print:max-h-none print:overflow-visible">
                {analysis.split("\n").map((line, idx) => {
                  const trimmed = line.trim();
                  
                  if (trimmed.startsWith("##")) {
                    return (
                      <h3 key={idx} className="text-base font-extrabold text-foreground border-b border-border/45 pb-1.5 pt-4 first:pt-0">
                        {trimmed.replace(/##\s*/, "")}
                      </h3>
                    );
                  }
                  if (trimmed.startsWith("###")) {
                    return (
                      <h4 key={idx} className="text-sm font-bold text-primary pt-2 first:pt-0">
                        {trimmed.replace(/###\s*/, "")}
                      </h4>
                    );
                  }
                  if (trimmed.startsWith("*") || trimmed.startsWith("-")) {
                    // Extract bold matches
                    const content = trimmed.replace(/^[\*\-]\s*/, "");
                    const parts = content.split("**");
                    return (
                      <div key={idx} className="flex gap-2 text-xs py-0.5 pl-2 border-l border-primary/20">
                        <span className="text-primary font-bold">•</span>
                        <p>
                          {parts.map((part, pIdx) => {
                            if (pIdx % 2 === 1) {
                              return <strong key={pIdx} className="font-extrabold text-foreground">{part}</strong>;
                            }
                            return part;
                          })}
                        </p>
                      </div>
                    );
                  }
                  if (trimmed.startsWith("1.") || trimmed.startsWith("2.") || trimmed.startsWith("3.") || trimmed.startsWith("4.")) {
                    const content = trimmed.replace(/^\d+\.\s*/, "");
                    const parts = content.split("**");
                    return (
                      <div key={idx} className="flex gap-2 text-xs py-1 pl-2 border-l border-primary/40 bg-muted/20 rounded">
                        <span className="text-primary font-extrabold">{trimmed.match(/^\d+/)?.[0]}.</span>
                        <p>
                          {parts.map((part, pIdx) => {
                            if (pIdx % 2 === 1) {
                              return <strong key={pIdx} className="font-extrabold text-foreground">{part}</strong>;
                            }
                            return part;
                          })}
                        </p>
                      </div>
                    );
                  }

                  if (trimmed === "") return <div key={idx} className="h-2"></div>;

                  return <p key={idx} className="text-xs">{line}</p>;
                })}
              </div>

              {/* Action Toolbar */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={fetchAiAudit}
                  className="px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground font-semibold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Re-Generate</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground font-semibold text-xs flex items-center gap-1.5 shadow shadow-primary/20 transition-all"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Counsel report</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
