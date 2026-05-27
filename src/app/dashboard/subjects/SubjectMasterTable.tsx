"use client";

import React, { useState, useTransition } from "react";
import { 
  createSubjectAction, 
  updateSubjectAction, 
  deleteSubjectAction 
} from "@/app/actions/subjectActions";
import { 
  Search, 
  BookOpen, 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  X, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  Lock,
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface Subject {
  code: string;
  name: string;
  credits: number;
  category: string;
}

interface SubjectMasterTableProps {
  initialSubjects: Subject[];
  isAdmin: boolean;
}

const CATEGORY_NAMES: Record<string, string> = {
  HS: "Humanities & Social Sciences (HS)",
  BS: "Basic Sciences (BS)",
  ES: "Engineering Sciences (ES)",
  PC: "Professional Core (PC)",
  PE: "Professional Elective (PE)",
  OE: "Open Elective (OE)",
  PW: "Project Work (PW)",
  MNC: "Mandatory Non-Credit (MNC)",
};

export default function SubjectMasterTable({ initialSubjects, isAdmin }: SubjectMasterTableProps) {
  const [subjects, setSubjects] = useState<Subject[]>(initialSubjects);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [showAddForm, setShowAddForm] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Alert States
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Inline Editing States
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCredits, setEditCredits] = useState(0);
  const [editCategory, setEditCategory] = useState("PC");

  // Filtering Logic
  const filteredSubjects = initialSubjects.filter(sub => {
    const matchesSearch = 
      sub.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === "ALL" || sub.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const handleStartEdit = (sub: Subject) => {
    setEditingCode(sub.code);
    setEditName(sub.name);
    setEditCredits(sub.credits);
    setEditCategory(sub.category);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleCancelEdit = () => {
    setEditingCode(null);
  };

  const handleSaveEdit = async (code: string) => {
    if (!editName || editCredits < 0 || !editCategory) {
      setErrorMsg("All fields are required to update a subject.");
      return;
    }

    startTransition(async () => {
      const result = await updateSubjectAction(code, editName, editCredits, editCategory);
      if (result.error) {
        setErrorMsg(result.error);
      } else {
        setSuccessMsg(result.success || "Subject updated successfully.");
        setEditingCode(null);
      }
    });
  };

  const handleDelete = async (code: string) => {
    if (!confirm(`Are you sure you want to delete subject mapping for "${code}"?`)) {
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);

    startTransition(async () => {
      const result = await deleteSubjectAction(code);
      if (result.error) {
        setErrorMsg(result.error);
      } else {
        setSuccessMsg(result.success || "Subject deleted successfully.");
      }
    });
  };

  const handleAddSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createSubjectAction(formData);
      if (result.error) {
        setErrorMsg(result.error);
      } else {
        setSuccessMsg(result.success || "Subject created successfully.");
        setShowAddForm(false);
        e.currentTarget.reset();
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Alert Notices */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-3 animate-pulse-glow">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Execution Error</span>
            <p className="mt-1 opacity-90">{errorMsg}</p>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-success/10 border border-success/20 text-success text-sm flex items-start gap-3">
          <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Execution Successful</span>
            <p className="mt-0.5 opacity-90">{successMsg}</p>
          </div>
        </div>
      )}

      {/* Role-based advisor message */}
      {!isAdmin && (
        <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 text-muted-foreground text-xs flex gap-3">
          <Lock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-foreground block">Curriculum Read-Only Mode:</span>
            <span>You are currently signed in as a Class Advisor. Only coordinators with Administrator access can add, modify, or delete B.Tech category mappings.</span>
          </div>
        </div>
      )}

      {/* Admin Actions: Add Subject Panel */}
      {isAdmin && (
        <div className="glass-panel rounded-3xl border border-border overflow-hidden">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="w-full p-6 text-left font-bold flex items-center justify-between hover:bg-muted/40 transition-colors"
          >
            <span className="flex items-center gap-2 text-base">
              <Plus className="w-5 h-5 text-primary" /> Create Curriculum Mapping
            </span>
            {showAddForm ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>

          {showAddForm && (
            <div className="p-6 border-t border-border bg-card/45">
              <form onSubmit={handleAddSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="space-y-1">
                  <label htmlFor="code" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Subject Code</label>
                  <input
                    type="text"
                    id="code"
                    name="code"
                    required
                    placeholder="e.g., CS101"
                    className="w-full bg-background border border-border focus:border-primary/50 rounded-xl py-2 px-3 text-sm outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="name" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Subject Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    placeholder="e.g., Data Structures"
                    className="w-full bg-background border border-border focus:border-primary/50 rounded-xl py-2 px-3 text-sm outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="credits" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Credits</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    id="credits"
                    name="credits"
                    required
                    placeholder="e.g., 4"
                    className="w-full bg-background border border-border focus:border-primary/50 rounded-xl py-2 px-3 text-sm outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="category" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Category</label>
                  <select
                    id="category"
                    name="category"
                    required
                    defaultValue="PC"
                    className="w-full bg-background border border-border focus:border-primary/50 rounded-xl py-2 px-3 text-sm outline-none"
                  >
                    {Object.keys(CATEGORY_NAMES).map(cat => (
                      <option key={cat} value={cat}>{CATEGORY_NAMES[cat]}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-4 flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 text-sm font-semibold rounded-xl border border-border hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="px-5 py-2 text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/95 rounded-xl shadow shadow-primary/20 flex items-center gap-2"
                  >
                    {isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    <span>Save Mapping</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Search & Filter Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        {/* Search bar */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search subjects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card border border-border focus:border-primary/50 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none transition-all"
          />
        </div>

        {/* Category filter select */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-muted-foreground uppercase shrink-0">Filter Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full sm:w-auto bg-card border border-border focus:border-primary/50 rounded-xl py-2.5 px-4 text-sm outline-none"
          >
            <option value="ALL">All Categories</option>
            {Object.keys(CATEGORY_NAMES).map(cat => (
              <option key={cat} value={cat}>{cat} - {cat === "MNC" ? "Non-Credit" : `${CATEGORY_NAMES[cat].split(" (")[0]}`}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Subjects Grid */}
      <div className="glass-panel rounded-3xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <th className="py-4 px-6 w-32">Subject Code</th>
                <th className="py-4 px-6">Subject Title</th>
                <th className="py-4 px-6 w-28">Credits</th>
                <th className="py-4 px-6 w-56">Category Map</th>
                {isAdmin && <th className="py-4 px-6 w-32 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {filteredSubjects.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 5 : 4} className="py-12 text-center text-muted-foreground">
                    <BookOpen className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="font-bold">No subjects mapped.</p>
                    <p className="text-xs mt-1">Try resetting your search query or filters.</p>
                  </td>
                </tr>
              ) : (
                filteredSubjects.map(sub => {
                  const isEditing = editingCode === sub.code;

                  return (
                    <tr key={sub.code} className="hover:bg-muted/15 transition-colors">
                      {/* Subject Code (Static) */}
                      <td className="py-4 px-6 font-mono font-bold text-foreground">
                        {sub.code}
                      </td>

                      {/* Subject Title (Editable/Static) */}
                      <td className="py-4 px-6 font-semibold">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full bg-background border border-border focus:border-primary/50 rounded-lg py-1.5 px-3 text-sm outline-none"
                          />
                        ) : (
                          sub.name
                        )}
                      </td>

                      {/* Credits (Editable/Static) */}
                      <td className="py-4 px-6 font-mono">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            value={editCredits}
                            onChange={(e) => setEditCredits(parseFloat(e.target.value) || 0)}
                            className="w-20 bg-background border border-border focus:border-primary/50 rounded-lg py-1.5 px-3 text-sm outline-none"
                          />
                        ) : (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                            sub.credits === 0 ? "bg-muted text-muted-foreground" : "bg-primary/5 text-primary"
                          }`}>
                            {sub.credits} Credits
                          </span>
                        )}
                      </td>

                      {/* Category Map (Editable/Static) */}
                      <td className="py-4 px-6">
                        {isEditing ? (
                          <select
                            value={editCategory}
                            onChange={(e) => setEditCategory(e.target.value)}
                            className="w-full bg-background border border-border focus:border-primary/50 rounded-lg py-1.5 px-3 text-sm outline-none"
                          >
                            {Object.keys(CATEGORY_NAMES).map(cat => (
                              <option key={cat} value={cat}>{cat} - {cat === "MNC" ? "Non-Credit" : `${CATEGORY_NAMES[cat].split(" (")[0]}`}</option>
                            ))}
                          </select>
                        ) : (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            sub.category === "MNC" 
                              ? "bg-slate-500/10 text-slate-500 border border-slate-500/20" 
                              : "bg-indigo-500/10 text-indigo-500 border border-indigo-500/20"
                          }`}>
                            {sub.category}
                          </span>
                        )}
                      </td>

                      {/* Admin Actions */}
                      {isAdmin && (
                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          {isEditing ? (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleSaveEdit(sub.code)}
                                disabled={isPending}
                                className="p-1.5 rounded-lg hover:bg-success/10 text-success border border-success/15 hover:border-success/30 transition-colors"
                                title="Save"
                              >
                                {isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                disabled={isPending}
                                className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive border border-destructive/15 hover:border-destructive/30 transition-colors"
                                title="Cancel"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleStartEdit(sub)}
                                className="p-1.5 rounded-lg hover:bg-primary/10 text-primary border border-primary/10 hover:border-primary/30 transition-colors"
                                title="Edit subject"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(sub.code)}
                                className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-500 border border-rose-500/10 hover:border-rose-500/30 transition-colors"
                                title="Delete subject"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
