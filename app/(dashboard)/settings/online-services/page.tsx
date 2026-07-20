"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, ChevronDown, ChevronUp, Link as LinkIcon, Loader2 } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import PageHeader from "@/components/layout/PageHeader";

export default function OnlineServicesAdminPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const toast = useToast();

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/online-services");
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      toast.error("Failed to load services");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    try {
      await fetch(`/api/online-services/${id}`, { method: "DELETE" });
      fetchCategories();
      toast.success("Deleted category");
    } catch {
      toast.error("Error deleting category");
    }
  };

  const handleDeleteLink = async (catId: string, linkId: string) => {
    if (!confirm("Delete this link?")) return;
    try {
      await fetch(`/api/online-services/${catId}/links/${linkId}`, { method: "DELETE" });
      fetchCategories();
      toast.success("Deleted link");
    } catch {
      toast.error("Error deleting link");
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="page-shell">
      <PageHeader title="Online Services Admin" subtitle="Manage categories and sub-links for Online Work page" />
      
      <div className="mb-4">
        <button className="btn btn-primary" onClick={() => {
          const title = prompt("Category Title?");
          if (title) {
             fetch("/api/online-services", {
               method: "POST",
               body: JSON.stringify({ title, order: categories.length + 1 }),
               headers: { "Content-Type": "application/json" }
             }).then(fetchCategories);
          }
        }}>
          <Plus size={16} /> Add Category
        </button>
      </div>

      <div className="space-y-4">
        {categories.map((cat) => (
          <div key={cat.id} className="glass-card overflow-hidden">
            <div className="flex justify-between items-center p-4 bg-black/20">
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => setExpandedCat(expandedCat === cat.id ? null : cat.id)}>
                {expandedCat === cat.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                <span className="font-semibold">{cat.order}. {cat.title}</span>
              </div>
              <div className="flex gap-2">
                <button className="icon-btn text-blue-400" onClick={() => {
                  const title = prompt("New title?", cat.title);
                  if (title) {
                    fetch(`/api/online-services/${cat.id}`, {
                      method: "PUT",
                      body: JSON.stringify({ ...cat, title }),
                      headers: { "Content-Type": "application/json" }
                    }).then(fetchCategories);
                  }
                }}><Edit2 size={16} /></button>
                <button className="icon-btn text-red-400" onClick={() => handleDeleteCategory(cat.id)}><Trash2 size={16} /></button>
              </div>
            </div>

            {expandedCat === cat.id && (
              <div className="p-4 border-t border-white/10">
                <div className="mb-3">
                  <button className="btn btn-secondary text-sm" onClick={() => {
                    const title = prompt("Link Title?");
                    const href = prompt("URL?");
                    if (title && href) {
                       fetch(`/api/online-services/${cat.id}/links`, {
                         method: "POST",
                         body: JSON.stringify({ title, href, order: cat.links.length + 1 }),
                         headers: { "Content-Type": "application/json" }
                       }).then(fetchCategories);
                    }
                  }}>
                    <Plus size={14} /> Add Link
                  </button>
                </div>
                <div className="space-y-2">
                  {cat.links?.map((link: any) => (
                    <div key={link.id} className="flex justify-between items-center bg-black/10 p-2 rounded">
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <LinkIcon size={14} />
                        {link.title} - <span className="text-gray-500">{link.href}</span>
                      </div>
                      <div className="flex gap-2">
                        <button className="icon-btn text-blue-400 p-1" onClick={() => {
                          const title = prompt("New title?", link.title) || link.title;
                          const href = prompt("New URL?", link.href) || link.href;
                          fetch(`/api/online-services/${cat.id}/links/${link.id}`, {
                            method: "PUT",
                            body: JSON.stringify({ ...link, title, href }),
                            headers: { "Content-Type": "application/json" }
                          }).then(fetchCategories);
                        }}><Edit2 size={14} /></button>
                        <button className="icon-btn text-red-400 p-1" onClick={() => handleDeleteLink(cat.id, link.id)}><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
