import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import { Plus, Edit2, Trash2, ArrowLeft } from "lucide-react";
import {
  getTvetPrograms,
  addTvetProgram,
  updateTvetProgram,
  deleteTvetProgram
} from "../services/tvetService";

export default function TvetAdmin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ id: null, title: "", description: "", category: "", imageUrl: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }
    load();
  }, [user]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getTvetPrograms();
      setPrograms(data);
    } catch (e) {
      setError("Failed to load programs.");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (form.id) {
        await updateTvetProgram(form.id, {
          title: form.title,
          description: form.description,
          category: form.category,
          imageUrl: form.imageUrl,
        });
      } else {
        await addTvetProgram({
          title: form.title,
          description: form.description,
          category: form.category,
          imageUrl: form.imageUrl,
        });
      }
      setForm({ id: null, title: "", description: "", category: "", imageUrl: "" });
      await load();
    } catch (e) {
      setError(e.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const onEdit = (p) => setForm({ id: p.id, title: p.title, description: p.description, category: p.category || "", imageUrl: p.imageUrl || "" });
  const onDelete = async (id) => {
    if (!confirm("Delete this program?")) return;
    await deleteTvetProgram(id);
    await load();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button onClick={() => navigate("/tvet")} className="p-2 rounded hover:bg-gray-100">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">TVET Admin</h1>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 bg-red-50 text-red-700 border border-red-200 p-3 rounded">{error}</div>
        )}

        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
          <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600">Title</label>
              <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent" required />
            </div>
            <div>
              <label className="text-sm text-gray-600">Category</label>
              <input value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent" />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm text-gray-600">Description</label>
              <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent" rows={3} />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm text-gray-600">Image URL (optional)</label>
              <input value={form.imageUrl} onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent" />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button type="submit" disabled={saving} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 flex items-center">
                <Plus className="w-4 h-4 mr-2" /> {form.id ? "Update Program" : "Add Program"}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : programs.length === 0 ? (
            <div className="text-gray-600">No programs yet.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {programs.map((p) => (
                <motion.div key={p.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{p.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{p.description}</p>
                      <p className="text-xs text-gray-500 mt-1">{p.category}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button onClick={() => onEdit(p)} className="p-2 rounded hover:bg-gray-100">
                        <Edit2 className="w-4 h-4 text-gray-600" />
                      </button>
                      <button onClick={() => onDelete(p.id)} className="p-2 rounded hover:bg-gray-100">
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



