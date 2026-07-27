import React from 'react';
import { Send, Paperclip, Smile, MoreVertical, Search, Phone, Video } from 'lucide-react';

const GroupChat = () => {
  return (
    <div className="flex h-screen text-gray-200 font-sans overflow-hidden">
      
      {/* Sidebar - Optional for navigation */}
      <div className="w-64 border-r border-gray-800 p-4 hidden md:flex flex-col">
        <h2 className="text-xl font-semibold text-white mb-6">Chats</h2>
        <div className="space-y-4">
          <div className="bg-[#1a1d24] p-3 rounded-xl border border-gray-700">Design Team</div>
          <div className="text-gray-500">General</div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-20 border-b border-gray-800 flex items-center justify-between px-6 bg-[#0f1117]/80 backdrop-blur-md">
          <div>
            <h1 className="text-lg font-bold text-white">Product Development</h1>
            <p className="text-xs text-green-500">12 members online</p>
          </div>
          <div className="flex gap-4 text-gray-400">
            <Phone size={20} className="cursor-pointer hover:text-white transition" />
            <Video size={20} className="cursor-pointer hover:text-white transition" />
            <MoreVertical size={20} className="cursor-pointer hover:text-white transition" />
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Example Message */}
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold">A</div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-semibold text-white">Alex River</span>
                <span className="text-[10px] text-gray-500">10:42 AM</span>
              </div>
              <p className="bg-[#1a1d24] p-3 rounded-r-2xl rounded-bl-2xl mt-1 max-w-md">
                Has anyone reviewed the final mockups for the dashboard?
              </p>
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-800">
          <div className="bg-[#1a1d24] rounded-2xl flex items-center p-2 border border-gray-700 focus-within:border-indigo-500 transition-colors">
            <button className="p-2 text-gray-400 hover:text-white"><Paperclip size={20} /></button>
            <input 
              type="text" 
              placeholder="Type your message..." 
              className="flex-1 bg-transparent border-none outline-none px-3 text-sm"
            />
            <button className="p-2 text-gray-400 hover:text-white"><Smile size={20} /></button>
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-xl transition">
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupChat;