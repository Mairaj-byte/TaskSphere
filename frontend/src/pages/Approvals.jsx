import React, { useState, useEffect } from 'react';
import { API_BASE, useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { 
    Search, Filter, CheckCircle2, XCircle, ChevronLeft, ChevronRight, 
    Folder, LayoutList, AlignLeft, Flag, Users, Calendar, X, 
    MessageSquare, FileText, ArrowUpRight, Sparkles, AlertCircle, Clock
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

    const getPriorityBadge = (priority) => {
        switch(priority) {
            case 'High':
            case 'Urgent':
                return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
            case 'Medium':
                return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
            default:
                return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
        }
    };

    return (
        <div className="min-h-full p-4 md:p-8 text-slate-100 selection:bg-[#5C45FD] selection:text-white font-sans">
            
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="h-2 w-2 rounded-full bg-[#dc9750] animate-pulse"></span>
                        <span className="text-xs font-bold tracking-widest text-[#dc9750] uppercase">Review Workspace</span>
                    </div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">Approval Center</h1>
                    <p className="text-sm text-slate-400 mt-1">Review team submissions, provide feedback, and make decisions.</p>
                </div>
                
                {/* Search & Filter Inputs */}
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                    <div className="relative w-full sm:w-64">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search submissions..."
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                            className="w-full py-2.5 pl-10 pr-4 rounded-xl border border-slate-800 bg-[#121826] text-white placeholder:text-slate-500 focus:border-[#dc9750] focus:ring-1 focus:ring-[#dc9750] outline-none transition-all text-sm shadow-inner"
                        />
                    </div>
                    <div className="relative w-full sm:w-auto">
                        <select
                            value={priorityFilter}
                            onChange={(e) => { setPriorityFilter(e.target.value); setCurrentPage(1); }}
                            className="w-full py-2.5 pl-4 pr-10 rounded-xl border border-slate-800 bg-[#121826] text-white outline-none focus:border-[#dc9750] text-sm appearance-none cursor-pointer"
                        >
                            <option value="">All Priorities</option>
                            <option value="High">High Priority</option>
                            <option value="Medium">Medium Priority</option>
                            <option value="Low">Low Priority</option>
                        </select>
                        <Filter size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Custom Tab Switcher styled with active target theme */}
            <div className="flex items-center border-b border-slate-800/80 mb-8 gap-2">
                <button
                    onClick={() => { setActiveTab('tasks'); setCurrentPage(1); }}
                    className={`relative pb-4 px-4 text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                        activeTab === 'tasks' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                    <LayoutList size={16} className={activeTab === 'tasks' ? 'text-[#dc9750]' : 'text-slate-400'} />
                    Standalone Tasks 
                    <span className={`ml-1.5 px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === 'tasks' ? 'bg-[#dc9750]/20 text-[#dc9750]' : 'bg-slate-800 text-slate-400'}`}>
                        {standaloneTasks.length}
                    </span>
                    {activeTab === 'tasks' && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#dc9750] rounded-t-full"></span>
                    )}
                </button>
                
                <button
                    onClick={() => { setActiveTab('projects'); setCurrentPage(1); }}
                    className={`relative pb-4 px-4 text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                        activeTab === 'projects' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                    <Folder size={16} className={activeTab === 'projects' ? 'text-[#dc9750]' : 'text-slate-400'} />
                    Project Approvals 
                    <span className={`ml-1.5 px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === 'projects' ? 'bg-[#dc9750]/20 text-[#dc9750]' : 'bg-slate-800 text-slate-400'}`}>
                        {projects.length + projectTasks.length}
                    </span>
                    {activeTab === 'projects' && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#dc9750] rounded-t-full"></span>
                    )}
                </button>
            </div>

            {/* Main Content Area */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-24">
                    <div className="relative h-12 w-12">
                        <div className="absolute inset-0 rounded-full border-2 border-[#dc9750]/20"></div>
                        <div className="absolute inset-0 rounded-full border-2 border-[#dc9750] border-t-transparent animate-spin"></div>
                    </div>
                    <p className="text-sm text-slate-400 mt-4 font-medium animate-pulse">Syncing approvals...</p>
                </div>
            ) : filteredItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 border border-slate-800/60 rounded-3xl bg-[#121826]/40 backdrop-blur-sm text-center">
                    <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 shadow-lg shadow-emerald-500/5">
                        <CheckCircle2 size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">Queue Clear</h3>
                    <p className="text-sm text-slate-400 max-w-sm">There are no pending approvals matching your current filters.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {paginatedItems.map(item => (
                        <div 
                            key={item._id} 
                            onClick={() => {
                                setViewingItem(item);
                                setFeedback('');
                            }}
                            className="group relative cursor-pointer bg-[#121826] border border-slate-800/80 hover:border-[#dc9750]/50 rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between hover:shadow-xl hover:shadow-[#dc9750]/5 hover:-translate-y-0.5"
                        >
                            <div>
                                <div className="flex justify-between items-start gap-4 mb-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="p-2.5 rounded-xl bg-[#0B101E] border border-slate-800 group-hover:border-[#dc9750]/30 transition-colors">
                                            {item._itemType === 'project' ? (
                                                <Folder size={18} className="text-[#dc9750]" />
                                            ) : (
                                                <LayoutList size={18} className="text-sky-400" />
                                            )}
                                        </div>
                                        <h3 className="text-base font-bold text-white truncate group-hover:text-[#dc9750] transition-colors">
                                            {item.title || item.name}
                                        </h3>
                                    </div>
                                    <span className="shrink-0 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/50 text-slate-300 text-[11px] font-semibold tracking-wide">
                                        {item._itemType === 'project' ? 'Project' : 'Task'}
                                    </span>
                                </div>
                                
                                <p className="text-sm text-slate-400 line-clamp-2 mb-6 leading-relaxed">
                                    {item.description || "No specific details provided for this review item."}
                                </p>
                            </div>

                            <div className="pt-4 border-t border-slate-800/60 flex items-center justify-between gap-4 text-xs text-slate-400">
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="flex items-center gap-1.5 truncate">
                                        <Users size={14} className="text-slate-500 shrink-0" />
                                        <span className="truncate">{item.createdBy?.name || item.assignedTo?.[0]?.name || 'System'}</span>
                                    </div>
                                    {item.priority && (
                                        <div className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${getPriorityBadge(item.priority)}`}>
                                            {item.priority}
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={(e) => { 
                                        e.stopPropagation(); 
                                        setViewingItem(item); 
                                        setFeedback(''); 
                                    }}
                                    className="flex items-center gap-1.5 text-xs font-bold text-[#dc9750] group-hover:translate-x-0.5 transition-transform shrink-0"
                                >
                                    Review <ArrowUpRight size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-between items-center mt-8 p-4 bg-[#121826] border border-slate-800 rounded-2xl">
                    <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => p - 1)}
                        className="p-2 rounded-xl bg-[#0B101E] border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 disabled:opacity-40 transition-colors"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <span className="text-xs text-slate-400 font-medium">
                        Page <span className="text-white font-bold">{currentPage}</span> of {totalPages}
                    </span>
                    <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(p => p + 1)}
                        className="p-2 rounded-xl bg-[#0B101E] border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 disabled:opacity-40 transition-colors"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            )}

            {/* Review Modal */}
            {viewingItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-4xl max-h-[90vh] rounded-3xl border border-slate-800 bg-[#121826] shadow-2xl flex flex-col overflow-hidden">
                        
                        {/* Modal Header */}
                        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-[#121826]">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-[#dc9750]/10 border border-[#dc9750]/20 text-[#dc9750]">
                                    {viewingItem._itemType === 'project' ? <Folder size={20} /> : <LayoutList size={20} />}
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white">Review Request</h2>
                                    <p className="text-xs text-slate-400">
                                        Submitted by <span className="text-slate-200 font-medium">{viewingItem.createdBy?.name || viewingItem.assignedTo?.[0]?.name || 'System'}</span>
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => { setViewingItem(null); setFeedback(''); }} 
                                className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            
                            {/* Main Info */}
                            <div>
                                <h1 className="text-2xl font-bold text-white mb-3">
                                    {viewingItem.title || viewingItem.name}
                                </h1>
                                <div className="p-4 rounded-2xl border border-slate-800 bg-[#0B101E] text-sm text-slate-300 leading-relaxed">
                                    {viewingItem.description || "No additional description provided."}
                                </div>
                            </div>

                            {/* Attachments Section */}
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                                    <FileText size={14} /> Attachments
                                </h3>
                                {viewingItem.attachments && viewingItem.attachments.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {viewingItem.attachments.map((att, i) => {
                                            const attName = typeof att === 'string' ? `Attachment ${i+1}` : att.name;
                                            const attUrl = typeof att === 'string' ? att : att.url;
                                            return (
                                                <a 
                                                    key={i} 
                                                    href={attUrl} 
                                                    download={attName} 
                                                    target="_blank" 
                                                    rel="noreferrer" 
                                                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-800 bg-[#0B101E] hover:border-[#dc9750]/50 transition-colors group"
                                                >
                                                    <div className="p-2 rounded-lg bg-[#dc9750]/10 text-[#dc9750]">
                                                        <FileText size={16} />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-xs font-bold text-white truncate group-hover:text-[#dc9750] transition-colors">{attName}</p>
                                                        <span className="text-[10px] text-slate-500">Click to view file</span>
                                                    </div>
                                                </a>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="p-4 rounded-xl border border-dashed border-slate-800 bg-[#0B101E]/50 text-center text-xs text-slate-500">
                                        No media files attached to this submission.
                                    </div>
                                )}
                            </div>

                            {/* Feedback Input */}
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
                                    <MessageSquare size={14} /> Decision Note / Feedback
                                </h3>
                                <textarea
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    placeholder="Add notes for your decision (Required for rejection)..."
                                    className="w-full h-28 rounded-2xl border border-slate-800 bg-[#0B101E] p-4 text-sm text-white placeholder:text-slate-500 focus:border-[#dc9750] outline-none resize-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Modal Actions - Button Styles Updated to Match Reference Code */}
                        <div className="border-t border-slate-800 p-4 bg-[#121826] flex items-center justify-end gap-3">
                            {/* Reject Button */}
                            <button
                                onClick={() => handleProcessApproval('reject')}
                                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all active:scale-[0.98] text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 border border-rose-500/20"
                            >
                                <XCircle size={16} className="text-rose-400" />
                                Reject Submission
                            </button>

                            {/* Approve Button (Matches Reference Active State Styling) */}
                            <button
                                onClick={() => handleProcessApproval('approve')}
                                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all active:scale-[0.98] bg-[#dc9750] text-[#1e2640] shadow-sm hover:bg-[#c8853e]"
                            >
                                <CheckCircle2 size={16} className="text-[#1e2640]" />
                                Approve Submission
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default Approvals;