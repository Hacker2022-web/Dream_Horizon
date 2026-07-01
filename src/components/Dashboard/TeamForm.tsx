import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Image as ImageIcon, Upload } from 'lucide-react';
import { createTeamMember, updateTeamMember } from '../../lib/firebase';

type Props = {
  initialData?: any | null; // null => create mode
  onClose: () => void;
};

export const TeamForm = ({ initialData, onClose }: Props) => {
  const isEdit = !!initialData;
  const [name, setName] = useState(initialData?.name ?? '');
  const [role, setRole] = useState(initialData?.role ?? '');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialData?.image ?? null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] ?? null;
    setFile(selectedFile);
    if (selectedFile) {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const payload = { name, role };
    try {
      if (isEdit) {
        await updateTeamMember(initialData.id, payload, file ?? undefined);
      } else {
        if (!file) throw new Error('A photo is required to add a team member');
        await createTeamMember(payload, file);
      }
      onClose();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setRole(initialData.role);
      setPreviewUrl(initialData.image ?? null);
    } else {
      setName('');
      setRole('');
      setPreviewUrl(null);
    }
    setFile(null);
  }, [initialData]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 backdrop-blur-sm p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.form
        onSubmit={handleSubmit}
        className="relative w-full max-w-lg rounded-2xl bg-stone-900 border border-stone-800 p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.95, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 10 }}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full bg-stone-800 p-2 text-stone-400 hover:text-white hover:bg-stone-700 transition-colors"
          aria-label="Close form"
        >
          <X size={16} />
        </button>

        <div className="space-y-1">
          <h3 className="text-xl font-serif font-bold text-white">
            {isEdit ? 'Edit Team Member' : 'Add Team Member'}
          </h3>
          <p className="text-xs text-stone-500">
            {isEdit ? 'Modify details of your team member.' : 'Create a new team profile.'}
          </p>
        </div>

        <div className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-stone-400">
              Full Name
            </label>
            <input
              required
              type="text"
              placeholder="e.g. Aarav Mehta"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-stone-950/60 border border-stone-800 rounded-xl px-4 py-3 text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all duration-300"
            />
          </div>

          {/* Role */}
          <div className="space-y-1.5">
            <label className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-stone-400">
              Role / Title
            </label>
            <input
              required
              type="text"
              placeholder="e.g. Principal Architect & Founder"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-stone-950/60 border border-stone-800 rounded-xl px-4 py-3 text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all duration-300"
            />
          </div>

          {/* Image Upload */}
          <div className="space-y-1.5">
            <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-stone-400 block">
              Profile Photo
            </span>
            <div className="grid grid-cols-3 gap-4 items-center">
              <div className="aspect-[4/5] rounded-xl bg-stone-950 border border-stone-800 overflow-hidden flex items-center justify-center relative">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="text-stone-700 w-8 h-8" />
                )}
              </div>
              <div className="col-span-2 space-y-2">
                <label className="flex items-center justify-center gap-2 border border-stone-800 border-dashed rounded-xl p-4 text-xs text-stone-400 hover:text-white hover:border-stone-700 cursor-pointer bg-stone-950/20 hover:bg-stone-900/40 transition-all">
                  <Upload size={14} />
                  <span>Choose Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                <p className="text-[0.65rem] text-stone-500 leading-relaxed">
                  Upload portrait (recommended 4:5 ratio).
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer / Submit */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-stone-800 bg-stone-900 hover:bg-stone-800 hover:border-stone-700 py-3 text-xs font-semibold uppercase tracking-wider text-stone-400 hover:text-white transition-all duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-accent flex-1 rounded-xl py-3 text-xs font-semibold uppercase tracking-wider shadow-lg hover:shadow-accent/25 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Saving...</span>
            ) : (
              <span>{isEdit ? 'Save Changes' : 'Add Member'}</span>
            )}
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
};
