import React, { useState, useEffect } from 'react';
import { API_BASE, useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { 
    Search, Filter, CheckCircle, XCircle, ChevronLeft, ChevronRight, Folder, LayoutList, AlignLeft, Flag, Users, Calendar, X, MessageSquare, Send, FileText
} from 'lucide-react';

const Approvals = () => {
    const { token } = useAuth();
    const { socket } = useSocket();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('tasks');
    
    // Separated Data States
    const [standaloneTasks, setStandaloneTasks] = useState([]); 
    const [projectTasks, setProjectTasks] = useState([]);       
    const [projects, setProjects] = useState([]);               
    
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    // Review Modal State
    const [viewingItem, setViewingItem] = useState(null);
    const [feedback, setFeedback] = useState('');

    useEffect(() => {
        fetchData();
        if (socket) {
            socket.on('taskUpdated', fetchTasks);
            socket.on('projectUpdated', fetchProjects);
        }
        return () => {
            if (socket) {
                socket.off('taskUpdated', fetchTasks);
                socket.off('projectUpdated', fetchProjects);
            }
        };
    }, [socket, token]);

    const fetchData = async () => {
        setLoading(true);
        await Promise.all([fetchTasks(), fetchProjects()]);
        setLoading(false);
    };

    const fetchTasks = async () => {
        try {
            const res = await fetch(`${API_BASE}/tasks?status=${encodeURIComponent('Completed (Pending Approval)')}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            const allTasks = Array.isArray(data) ? data : [];
            
            setStandaloneTasks(allTasks.filter(t => !t.group).map(t => ({...t, _itemType: 'task'})));
            setProjectTasks(allTasks.filter(t => t.group).map(t => ({...t, _itemType: 'projectTask'})));
        } catch (error) {
            toast.error("Failed to load pending tasks");
        }
    };

    const fetchProjects = async () => {
        try {
            const res = await fetch(`${API_BASE}/groups?approvalStatus=Pending`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setProjects((Array.isArray(data) ? data : []).map(p => ({...p, _itemType: 'project'})));
        } catch (error) {
            toast.error("Failed to load pending projects");
        }
    };

    const handleProcessApproval = async (actionType) => {
        const isApprove = actionType === 'approve';
        const item = viewingItem;
        
        if (!isApprove && !feedback.trim()) {
            toast.error("Please provide instructions or a reason for rejection.");
            return;
        }
        
        try {
            if (item._itemType === 'task' || item._itemType === 'projectTask') {
                const res = await fetch(`${API_BASE}/tasks/${item._id}/status`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ 
                        status: isApprove ? 'Approved' : 'Rejected',
                        feedback: feedback.trim()
                    })
                });
                if (!res.ok) throw new Error("Failed to process task");
                toast.success(`Task successfully ${isApprove ? 'approved' : 'rejected'}`);
            } 
            else if (item._itemType === 'project') {
                const endpoint = isApprove ? 'approve' : 'reject';
                const res = await fetch(`${API_BASE}/groups/${item._id}/${endpoint}`, {
                    method: 'PATCH',
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!res.ok) throw new Error("Failed to process project");
                toast.success(`Project successfully ${isApprove ? 'approved' : 'rejected'}`);
            }
            
            setViewingItem(null);
            setFeedback('');
            fetchData(); 
        } catch (error) {
            toast.error(error.message);
        }
    };

    const getFilteredItems = () => {
        if (activeTab === 'tasks') {
            return standaloneTasks.filter(item => {
                const titleMatch = (item.title || item.name || '').toLowerCase().includes(searchQuery.toLowerCase());
                const priorityMatch = priorityFilter === '' || item.priority === priorityFilter;
                return titleMatch && priorityMatch;
            });
        } else {
            const combined = [...projects, ...projectTasks];
            return combined.filter(item => {
                const titleMatch = (item.title || item.name || '').toLowerCase().includes(searchQuery.toLowerCase());
                const priorityMatch = priorityFilter === '' || (item._itemType === 'projectTask' ? item.priority === priorityFilter : true);
                return titleMatch && priorityMatch;
            });
        }
    };

    const filteredItems = getFilteredItems();
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    const paginatedItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const getPriorityColor = (priority) => {
        if (priority === 'High' || priority === 'Urgent') return 'text-rose-400';
        if (priority === 'Medium') return 'text-amber-400';
        return 'text-emerald-400';
    };

    return (
        <div className="p-6 h-full overflow-y-auto bg-[#0B101E] text-slate-100 selection:bg-indigo-500 selection:text-white">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Approval Center</h1>
                    <p className="text-sm text-slate-400 mt-1">Review and manage pending items.</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <div className="relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                            className="w-full sm:w-64 py-2.5 pl-10 pr-4 rounded-xl border border-slate-700 bg-[#121826] text-white placeholder:text-slate-500 focus:border-indigo-500 outline-none transition-all text-sm"
                        />
                    </div>
                    <select
                        value={priorityFilter}
                        onChange={(e) => { setPriorityFilter(e.target.value); setCurrentPage(1); }}
                        className="py-2.5 pl-3 pr-8 rounded-xl border border-slate-700 bg-[#121826] text-white outline-none focus:border-indigo-500 text-sm"
                    >
                        <option value="">All Priorities</option>
                        <option value="High">High Priority</option>
                        <option value="Medium">Medium Priority</option>
                        <option value="Low">Low Priority</option>
                    </select>
                </div>
            </div>

            <div className="flex border-b border-slate-800 mb-6">
                <button
                    onClick={() => { setActiveTab('tasks'); setCurrentPage(1); }}
                    className={`pb-3 px-6 text-sm font-semibold transition-colors ${
                        activeTab === 'tasks' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-400 hover:text-white'
                    }`}
                >
                    Standalone Tasks ({standaloneTasks.length})
                </button>
                <button
                    onClick={() => { setActiveTab('projects'); setCurrentPage(1); }}
                    className={`pb-3 px-6 text-sm font-semibold transition-colors ${
                        activeTab === 'projects' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-400 hover:text-white'
                    }`}
                >
                    Project Approvals ({projects.length + projectTasks.length})
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
                </div>
            ) : filteredItems.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-slate-800 rounded-2xl bg-[#121826]/50">
                    <CheckCircle className="mx-auto h-12 w-12 text-slate-700 mb-3" />
                    <h3 className="text-lg font-medium text-white">All Caught Up!</h3>
                    <p className="text-sm text-slate-400">No pending items in this category.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {paginatedItems.map(item => (
                        <div 
                            key={item._id} 
                            onClick={() => {
                                setViewingItem(item);
                                setFeedback('');
                            }}
                            className="group cursor-pointer bg-[#121826] border border-slate-800 rounded-2xl p-5 hover:border-indigo-500/50 hover:bg-[#121826]/80 hover:shadow-lg transition-all flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2 max-w-[70%]">
                                        {activeTab === 'projects' && (
                                            item._itemType === 'project' ? 
                                            <Folder size={16} className="text-indigo-400 shrink-0" /> : 
                                            <LayoutList size={16} className="text-sky-400 shrink-0" />
                                        )}
                                        <h3 className="text-base font-bold text-white truncate group-hover:text-indigo-300 transition-colors">
                                            {item.title || item.name}
                                        </h3>
                                    </div>
                                    <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold whitespace-nowrap uppercase tracking-wider">
                                        {item._itemType === 'project' ? 'Project' : 'Task'}
                                    </span>
                                </div>
                                
                                <p className="text-sm text-slate-400 line-clamp-2 mb-5 leading-relaxed font-medium">
                                    {item.description || "No description provided."}
                                </p>
                                
                                <div className="grid grid-cols-2 gap-y-4 text-sm mb-2">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-1">Submitted By</span>
                                        <span className="text-white font-semibold truncate">{item.createdBy?.name || item.assignedTo?.[0]?.name || 'System'}</span>
                                    </div>
                                    
                                    {item._itemType !== 'project' && activeTab === 'projects' && (
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-1">From Project</span>
                                            <span className="text-indigo-400 font-semibold truncate">Project Task</span>
                                        </div>
                                    )}

                                    {(activeTab === 'tasks' || item._itemType === 'projectTask') && (
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-1">Priority</span>
                                            <span className={`font-bold ${getPriorityColor(item.priority)}`}>
                                                {item.priority}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-800/60">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setViewingItem(item); setFeedback(''); }}
                                    className="w-full flex items-center justify-center gap-2 bg-[#5C45FD]/10 text-[#5C45FD] border border-[#5C45FD]/30 hover:bg-[#5C45FD] hover:text-white py-2.5 rounded-xl transition-all font-bold text-sm"
                                >
                                    <MessageSquare size={16} />
                                    Review & Action
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {totalPages > 1 && (
                <div className="flex justify-between items-center mt-6 p-4 bg-[#121826] border border-slate-800 rounded-2xl">
                    <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => p - 1)}
                        className="p-2 rounded-lg bg-[#0B101E] border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 disabled:opacity-50 transition-colors"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <span className="text-sm text-slate-400 font-medium">
                        Page <span className="text-white font-bold">{currentPage}</span> of {totalPages}
                    </span>
                    <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(p => p + 1)}
                        className="p-2 rounded-lg bg-[#0B101E] border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 disabled:opacity-50 transition-colors"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            )}

            {/* =========================================================
                FULL-FEATURED REVIEW MODAL WITH ATTACHMENTS
            ========================================================= */}
            {viewingItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B101E]/95 p-4 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
                    <div className="w-full max-w-[900px] max-h-[90vh] rounded-3xl border border-slate-800 bg-[#121826] shadow-2xl flex flex-col overflow-hidden relative">
                        
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-slate-800/60 bg-[#121826] px-6 py-5 shrink-0">
                            <div className="flex items-center gap-3">
                                <span className="flex items-center justify-center h-10 w-10 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                                    {viewingItem._itemType === 'project' ? <Folder size={20} /> : <CheckCircle size={20} />}
                                </span>
                                <div>
                                    <h2 className="text-xl font-bold text-white tracking-tight">Review Submission</h2>
                                    <p className="text-xs text-slate-400 font-medium capitalize tracking-wider">
                                        {viewingItem._itemType === 'project' ? 'Project Approval' : 'Task Approval'}
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => { setViewingItem(null); setFeedback(''); }} 
                                className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors border border-transparent hover:border-slate-700"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Scrollable Body */}
                        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                
                                {/* Left Section: Content */}
                                <div className="md:col-span-2 space-y-6">
                                    <div className="rounded-2xl border border-slate-800/80 bg-[#0B101E] p-6 shadow-inner">
                                        <h1 className="text-2xl font-black text-white tracking-tight mb-6">
                                            {viewingItem.title || viewingItem.name}
                                        </h1>
                                        
                                        <div className="space-y-2 mb-8">
                                            <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                                <AlignLeft className="h-3.5 w-3.5" /> Description / Work Details
                                            </h3>
                                            <div className="rounded-xl border border-slate-800 bg-[#121826] p-4 text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                                                {viewingItem.description || "No description provided."}
                                            </div>
                                        </div>

                                        {/* ATTACHMENT REVIEW BLOCK */}
                                        <div className="space-y-2">
                                            <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                                <FileText className="h-3.5 w-3.5" /> Attachments
                                            </h3>
                                            
                                            <div className="rounded-xl border border-slate-800 bg-[#121826] overflow-hidden">
                                              <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 bg-[#0B101E]">
                                                <div>
                                                  <h4 className="text-sm font-bold text-white">Attached Files</h4>
                                                  <p className="text-xs text-slate-500">{(viewingItem.attachments || []).length} files attached</p>
                                                </div>
                                              </div>
                                              
                                              {(viewingItem.attachments && viewingItem.attachments.length > 0) ? (
                                                 <div className="p-4 grid grid-cols-1 gap-3">
                                                    {viewingItem.attachments.map((att, i) => {
                                                       const attName = typeof att === 'string' ? `Attachment ${i+1}` : att.name;
                                                       const attUrl = typeof att === 'string' ? att : att.url;
                                                       return (
                                                           <a key={i} href={attUrl} download={attName} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-xl border border-slate-700 bg-[#0B101E] hover:border-indigo-500 transition-colors group">
                                                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
                                                                 <FileText className="h-5 w-5" />
                                                              </div>
                                                              <div className="min-w-0 flex-1">
                                                                 <p className="text-sm font-bold text-white truncate group-hover:text-indigo-300">{attName}</p>
                                                                 <p className="text-[10px] text-slate-500 uppercase tracking-wider">Click to view/download</p>
                                                              </div>
                                                           </a>
                                                       );
                                                    })}
                                                 </div>
                                              ) : (
                                                 <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                                                   <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800/50 mb-3 border border-slate-700">
                                                     <FileText className="h-4 w-4 text-slate-400" />
                                                   </div>
                                                   <h5 className="text-sm font-bold text-slate-300">No files uploaded.</h5>
                                                 </div>
                                              )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Box: Instructions & Feedback */}
                                    <div className="rounded-2xl border border-slate-800/80 bg-[#0B101E] p-6 shadow-inner">
                                        <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
                                            <MessageSquare className="h-3.5 w-3.5" /> Instructions & Feedback
                                        </h3>
                                        <p className="text-xs text-slate-400 mb-3">
                                            Provide instructions for revisions or leave a congratulatory note. Members will receive this via notification.
                                        </p>
                                        <textarea
                                            value={feedback}
                                            onChange={(e) => setFeedback(e.target.value)}
                                            placeholder="Write your feedback here..."
                                            className="w-full h-32 rounded-xl border border-slate-700 bg-[#121826] p-4 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-none transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Right Section: Metadata & Action Buttons */}
                                <div className="space-y-6">
                                    <div className="rounded-2xl border border-slate-800/80 bg-[#0B101E] p-5 shadow-inner space-y-5">
                                        <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 border-b border-slate-800 pb-2">Properties</h3>
                                        
                                        {viewingItem._itemType !== 'project' && (
                                            <div className="space-y-1">
                                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Priority</span>
                                                <div className="flex items-center gap-2 text-sm font-bold text-white">
                                                    <Flag className={`h-4 w-4 ${getPriorityColor(viewingItem.priority)}`} />
                                                    {viewingItem.priority}
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-1">
                                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Submitted By</span>
                                            <div className="flex items-center gap-2 text-sm font-bold text-white">
                                                <Users className="h-4 w-4 text-indigo-400" />
                                                {viewingItem.createdBy?.name || viewingItem.assignedTo?.[0]?.name || 'System'}
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Due Date / Timeline</span>
                                            <div className="flex items-center gap-2 text-sm font-bold text-white">
                                                <Calendar className="h-4 w-4 text-emerald-400" />
                                                {viewingItem.dueDate ? new Date(viewingItem.dueDate).toLocaleDateString() : "No deadline"}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="rounded-2xl border border-slate-800/80 bg-[#0B101E] p-5 shadow-inner space-y-3">
                                        <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 border-b border-slate-800 pb-2 mb-4">Final Decision</h3>
                                        
                                        <button
                                            onClick={() => handleProcessApproval('approve')}
                                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#00E676] px-4 py-3 text-sm font-bold text-[#0B101E] hover:bg-[#00C853] transition-all shadow-lg shadow-[#00E676]/20"
                                        >
                                            <CheckCircle className="h-5 w-5" /> Approve Submission
                                        </button>
                                        
                                        <button
                                            onClick={() => handleProcessApproval('reject')}
                                            className="w-full flex items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-bold text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
                                        >
                                            <XCircle className="h-5 w-5" /> Reject & Request Changes
                                        </button>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Approvals;