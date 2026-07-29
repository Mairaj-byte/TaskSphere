import React, { useEffect, useState } from 'react';
import { API_BASE, useAuth } from '../context/AuthContext';
import {
  Megaphone, Pin, PinOff, Plus, X, Paperclip, AlertCircle,
  Trash2, Archive, CheckCircle2, Eye, Loader2
} from 'lucide-react';

const CATEGORIES = ['Policy Update', 'Holiday', 'General News', 'Urgent'];

const categoryStyle = {
  'Policy Update': 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400',
  'Holiday': 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400',
  'General News': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  'Urgent': 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400',
};

const Announcements = () => {
  const { user, token } = useAuth();
  const isAdmin = user?.role === 'admin';
  const canViewReadStatus = ['admin', 'manager'].includes(user?.role);

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formBody, setFormBody] = useState('');
  const [formCategory, setFormCategory] = useState('General News');
  const [formDepartment, setFormDepartment] = useState('');
  const [formPinned, setFormPinned] = useState(false);
  const [formFiles, setFormFiles] = useState([]);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [readStatusFor, setReadStatusFor] = useState(null);
  const [readStatusData, setReadStatusData] = useState(null);

  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(null), 3000);
    return () => clearTimeout(t);
  }, [toastMsg]);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/announcements`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setAnnouncements(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch announcements', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markRead = async (id) => {
    try {
      await fetch(`${API_BASE}/announcements/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  const acknowledge = async (id) => {
    try {
      await fetch(`${API_BASE}/announcements/${id}/acknowledge`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setToastMsg('Acknowledged.');
      fetchAnnouncements();
    } catch (err) {
      console.error('Failed to acknowledge', err);
    }
  };

  const togglePin = async (announcement) => {
    try {
      const action = announcement.pinned ? 'unpin' : 'pin';
      await fetch(`${API_BASE}/announcements/${announcement._id}/${action}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAnnouncements();
    } catch (err) {
      console.error('Failed to toggle pin', err);
    }
  };

  const archiveAnnouncement = async (id) => {
    if (!window.confirm('Archive this announcement? It will be hidden from the main list but read history is kept.')) return;
    try {
      await fetch(`${API_BASE}/announcements/${id}/archive`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAnnouncements();
    } catch (err) {
      console.error('Failed to archive', err);
    }
  };

  const deleteAnnouncement = async (id) => {
    if (!window.confirm('Permanently delete this announcement? This cannot be undone.')) return;
    try {
      await fetch(`${API_BASE}/announcements/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAnnouncements();
    } catch (err) {
      console.error('Failed to delete', err);
    }
  };

  const openReadStatus = async (id) => {
    setReadStatusFor(id);
    setReadStatusData(null);
    try {
      const res = await fetch(`${API_BASE}/announcements/${id}/read-status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setReadStatusData(data);
    } catch (err) {
      console.error('Failed to fetch read status', err);
    }
  };

  const resetForm = () => {
    setFormTitle('');
    setFormBody('');
    setFormCategory('General News');
    setFormDepartment('');
    setFormPinned(false);
    setFormFiles([]);
    setFormError('');
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  setFormError("");

  if (!formTitle.trim()) {
    return setFormError("Title is required.");
  }

  if (!formBody.trim()) {
    return setFormError("Body is required.");
  }

  setSubmitting(true);

  try {
    const res = await fetch(`${API_BASE}/announcements`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: formTitle.trim(),
        body: formBody.trim(),
        category: formCategory,
        department: formDepartment.trim(),
        pinned: formPinned,
        attachments: [],
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      throw new Error(result.message || result.error || "Failed to post announcement.");
    }

    setToastMsg("Announcement posted successfully!");
    setIsModalOpen(false);

    setFormTitle("");
    setFormBody("");
    setFormCategory("General News");
    setFormDepartment("");
    setFormPinned(false);
    setFormFiles([]);

    fetchAnnouncements();
  } catch (err) {
    console.error(err);
    setFormError(err.message || "Failed to post announcement.");
  } finally {
    setSubmitting(false);
  }
};

  const hasRead = (announcement) =>
    announcement.readBy?.some((r) => (r.user?._id || r.user) === user?._id);
  const hasAcknowledged = (announcement) =>
    announcement.acknowledgedBy?.some((a) => (a.user?._id || a.user) === user?._id);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 sm:p-6 lg:p-8">
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-[200] flex items-center gap-2 px-4 py-3 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-lg text-sm">
          <CheckCircle2 size={16} className="text-emerald-400 dark:text-emerald-600" />
          {toastMsg}
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Megaphone size={26} className="text-indigo-500" />
            Announcements
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Organization-wide and department updates.
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-all"
          >
            <Plus size={18} />
            <span>Post Announcement</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-24">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : announcements.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-center">
          <Megaphone size={48} className="text-slate-300 dark:text-slate-700 mb-3" />
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">No Announcements Yet</h3>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((a) => (
            <div
              key={a._id}
              onMouseEnter={() => { if (!hasRead(a)) markRead(a._id); }}
              className={`bg-white dark:bg-slate-900 border rounded-xl p-5 shadow-sm ${
                a.pinned ? 'border-indigo-300 dark:border-indigo-800' : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {a.pinned && <Pin size={14} className="text-indigo-500" />}
                  <h3 className="font-semibold text-base text-slate-800 dark:text-slate-100">{a.title}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${categoryStyle[a.category] || ''}`}>
                    {a.category}
                  </span>
                  {a.department && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400">
                      {a.department}
                    </span>
                  )}
                  {!a.department && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      Organization-wide
                    </span>
                  )}
                </div>

                {isAdmin && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => togglePin(a)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                      title={a.pinned ? 'Unpin' : 'Pin to top'}
                    >
                      {a.pinned ? <PinOff size={14} /> : <Pin size={14} />}
                    </button>
                    <button
                      onClick={() => archiveAnnouncement(a._id)}
                      className="p-1.5 text-slate-400 hover:text-amber-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Archive"
                    >
                      <Archive size={14} />
                    </button>
                    <button
                      onClick={() => deleteAnnouncement(a._id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap mb-3">{a.body}</p>

             {a.attachments?.length > 0 && (
  <div className="flex flex-wrap gap-2 mb-3">
    {a.attachments.map((att, i) => (
      <a
        key={i}
        href={att.fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 hover:border-indigo-300"
      >
        <Paperclip size={12} />
        <span className="max-w-[150px] truncate">
          {att.fileName}
        </span>
      </a>
    ))}
  </div>
)}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80">
                <div className="text-xs text-slate-400">
                  Posted by {a.postedBy?.name || 'Unknown'} &middot; {new Date(a.createdAt).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2">
                  {canViewReadStatus && (
                    <button
                      onClick={() => openReadStatus(a._id)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-indigo-600"
                    >
                      <Eye size={13} /> Read status
                    </button>
                  )}
                  {hasAcknowledged(a) ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                      <CheckCircle2 size={13} /> Acknowledged
                    </span>
                  ) : (
                    <button
                      onClick={() => acknowledge(a._id)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      <CheckCircle2 size={13} /> Acknowledge
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-2xl w-full p-6 shadow-xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Post Announcement</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg">
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Title *</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-indigo-500"
                  placeholder="e.g., Office closed for Diwali"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Body *</label>
                <textarea
                  rows={5}
                  value={formBody}
                  onChange={(e) => setFormBody(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-indigo-500"
                  placeholder="Announcement details..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-indigo-500"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Department (leave blank for org-wide)
                  </label>
                  <input
                    type="text"
                    value={formDepartment}
                    onChange={(e) => setFormDepartment(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-indigo-500"
                    placeholder="e.g., Engineering"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pinned"
                  checked={formPinned}
                  onChange={(e) => setFormPinned(e.target.checked)}
                />
                <label htmlFor="pinned" className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Pin to top
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Attachments (images, PDFs, docs — up to 5 files)
                </label>
               <input
  type="file"
  multiple
  disabled
  className="w-full text-xs text-slate-500 opacity-50 cursor-not-allowed"
/>

<p className="text-xs text-slate-400 mt-1">
  File uploads will be enabled after the backend upload service is added.
</p>
                {formFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formFiles.map((f, i) => (
                      <span key={i} className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300">
                        {f.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg shadow-sm"
                >
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  {submitting ? 'Posting...' : 'Post Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* READ STATUS MODAL */}
      {readStatusFor && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-md w-full p-6 shadow-xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Read Status</h3>
              <button onClick={() => setReadStatusFor(null)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg">
                <X size={18} />
              </button>
            </div>

            {!readStatusData ? (
              <div className="flex justify-center py-8">
                <Loader2 size={20} className="animate-spin text-indigo-500" />
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Seen by</span>
                  <span className="font-semibold">{readStatusData.readCount} / {readStatusData.totalEligible}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Acknowledged by</span>
                  <span className="font-semibold">{readStatusData.acknowledgedCount} / {readStatusData.totalEligible}</span>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Seen</h4>
                  <div className="space-y-1.5">
                    {readStatusData.readBy.length === 0 && (
                      <p className="text-xs text-slate-400">No one yet.</p>
                    )}
                    {readStatusData.readBy.map((r, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span>{r.user?.name}</span>
                        <span className="text-slate-400">{new Date(r.readAt).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Announcements;