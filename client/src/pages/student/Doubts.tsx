import { useState, useRef } from 'react';
import { ChatState, ChatMessage } from '../../types/assistant';
import { aiAPI } from '../../api';
import { Send, Mic, Book, CheckSquare, Settings2, Plus, Sparkles, BrainCircuit, FileText, Upload, Loader2 } from 'lucide-react';

export default function ChatPage() {
  const [state, setState] = useState<ChatState>({
    activeChatId: 'chat-1',
    sessions: [
      {
        id: 'chat-1',
        studentId: 'me',
        title: 'Document AI Chat',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: []
      }
    ],
    isLoading: false,
    isRecording: false,
    selectedContext: null
  });

  const [input, setInput] = useState('');
  const [docId, setDocId] = useState<string | null>(null);
  const [docName, setDocName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeSession = state.sessions.find(s => s.id === state.activeChatId);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    try {
      const res = await aiAPI.uploadPdf(file);
      setDocId(res.docId);
      setDocName(res.filename);
      
      // Add a system message confirming upload
      const sysMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'system',
        content: `Uploaded document: ${res.filename} (${res.pages} pages). You can now ask questions about it.`,
        timestamp: new Date().toISOString()
      };
      
      setState(prev => ({
        ...prev,
        sessions: prev.sessions.map(s => 
          s.id === prev.activeChatId 
            ? { ...s, messages: [...s.messages, sysMsg] } 
            : s
        )
      }));
    } catch (err) {
      console.error(err);
      alert('Failed to upload PDF');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !activeSession) return;
    
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };
    
    setState(prev => ({
      ...prev,
      isLoading: true,
      sessions: prev.sessions.map(s => 
        s.id === prev.activeChatId 
          ? { ...s, messages: [...s.messages, userMsg] } 
          : s
      )
    }));
    
    const currentInput = input;
    setInput('');
    
    try {
      const response = await aiAPI.chat(currentInput, docId || undefined);
      
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.content,
        structuredResponse: response.structuredResponse,
        timestamp: new Date().toISOString(),
        contextSources: docName ? [{ type: 'note', title: docName, id: docId! }] : []
      };
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        sessions: prev.sessions.map(s => 
          s.id === prev.activeChatId 
            ? { ...s, messages: [...s.messages, aiMsg] } 
            : s
        )
      }));
    } catch (err) {
      console.error(err);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-surface-950">
      
      {/* Left Sidebar: Chat History */}
      <div className="w-64 border-r border-surface-800 bg-surface-900/30 flex flex-col hidden md:flex">
        <div className="p-4 border-b border-surface-800">
          <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-surface-800 hover:bg-surface-700 text-surface-200 text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
          <p className="text-[10px] font-bold text-surface-500 uppercase tracking-wider mb-2 px-2 pt-2">Recent Chats</p>
          {state.sessions.map(s => (
            <button 
              key={s.id}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                s.id === state.activeChatId 
                  ? 'bg-primary-500/10 text-primary-300 border border-primary-500/20' 
                  : 'text-surface-300 hover:bg-surface-800/50 border border-transparent'
              }`}
            >
              <div className="truncate font-medium">{s.title}</div>
              <div className="text-[10px] text-surface-500 mt-0.5">Today</div>
            </button>
          ))}
        </div>
      </div>

      {/* Center: Chat Window */}
      <div className="flex-1 flex flex-col relative">
        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {activeSession?.messages.length === 0 && (
             <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
               <Sparkles className="w-12 h-12 text-surface-400 mb-4" />
               <p className="text-surface-300">Upload a PDF or start typing to begin.</p>
             </div>
          )}
          
          {activeSession?.messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : msg.role === 'system' ? 'justify-center' : 'justify-start'}`}>
              {msg.role === 'system' ? (
                <div className="px-4 py-1.5 rounded-full bg-surface-800/50 text-[11px] text-surface-400">
                  {msg.content}
                </div>
              ) : (
                <div className={`max-w-[85%] flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  
                  {/* Avatar */}
                  <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border ${
                    msg.role === 'user' 
                      ? 'bg-surface-800 border-surface-700 text-surface-300' 
                      : 'bg-gradient-to-br from-primary-500/20 to-accent-500/20 border-primary-500/30 text-primary-400'
                  }`}>
                    {msg.role === 'user' ? 'S' : <Sparkles className="w-4 h-4" />}
                  </div>

                  {/* Content Bubble */}
                  <div className="space-y-2">
                    <div className={`p-4 rounded-2xl ${
                      msg.role === 'user' 
                        ? 'bg-surface-800 text-surface-100 rounded-tr-sm' 
                        : 'bg-surface-900 border border-surface-800 text-surface-200 rounded-tl-sm shadow-sm'
                    }`}>
                      <p className="leading-relaxed text-[15px]">{msg.content}</p>

                      {/* Structured Content for Assistant */}
                      {msg.structuredResponse && (
                        <div className="mt-4 space-y-4">
                          {msg.structuredResponse.keyPoints && (
                            <div className="bg-surface-950/50 rounded-xl p-4 border border-surface-800/50">
                              <h4 className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <CheckSquare className="w-3.5 h-3.5" /> Key Takeaways
                              </h4>
                              <ul className="space-y-2">
                                {msg.structuredResponse.keyPoints.map((kp, i) => (
                                  <li key={i} className="flex gap-2 text-sm text-surface-300">
                                    <span className="text-primary-500 mt-0.5">•</span> {kp}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {msg.structuredResponse.example && (
                            <div className="bg-accent-500/5 border border-accent-500/20 rounded-xl p-4">
                              <h4 className="text-xs font-semibold text-accent-400/80 uppercase tracking-wider mb-2 flex items-center gap-2">
                                💡 Analogy / Example
                              </h4>
                              <p className="text-sm text-accent-100/90 leading-relaxed">
                                {msg.structuredResponse.example}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Context Source Chip */}
                    {msg.contextSources && msg.contextSources.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {msg.contextSources.map((src, i) => (
                          <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded bg-surface-800/50 border border-surface-700/50 text-[10px] text-surface-400">
                            <FileText className="w-3 h-3 opacity-70" />
                            <span>Source: {src.title}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>
          ))}
          {state.isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[85%] flex gap-3 flex-row">
                <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border bg-gradient-to-br from-primary-500/20 to-accent-500/20 border-primary-500/30 text-primary-400">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                </div>
                <div className="p-4 rounded-2xl bg-surface-900 border border-surface-800 text-surface-400 rounded-tl-sm flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-surface-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-surface-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-surface-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-surface-950/80 backdrop-blur-md border-t border-surface-800 shrink-0">
          <div className="max-w-3xl mx-auto relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-accent-500/20 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <div className="relative flex items-end gap-2 bg-surface-900 border border-surface-700 rounded-2xl p-2 shadow-sm group-focus-within:border-primary-500/50 transition-colors">
              <input 
                type="file" 
                accept="application/pdf" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                title="Upload PDF Context"
                className="p-3 text-surface-400 hover:text-surface-200 hover:bg-surface-800 rounded-xl transition-colors shrink-0"
              >
                {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
              </button>
              
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder={docName ? `Ask about ${docName}...` : "Upload a PDF or ask a general question..."}
                className="w-full bg-transparent border-none focus:ring-0 text-surface-100 text-sm resize-none max-h-32 min-h-[44px] py-3 custom-scrollbar"
                rows={1}
              />
              
              <button 
                onClick={handleSend}
                disabled={!input.trim() || state.isLoading}
                className="p-3 bg-primary-600 hover:bg-primary-500 text-white rounded-xl shadow-lg shadow-primary-500/25 transition-all shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar: Context Panel */}
      <div className="w-72 border-l border-surface-800 bg-surface-900/30 flex flex-col hidden lg:flex">
        <div className="p-4 border-b border-surface-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-surface-200 flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-primary-400" /> Active Context
          </h3>
          <button className="text-surface-400 hover:text-surface-200"><Settings2 className="w-4 h-4" /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
          {/* Notes Linked */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-bold text-surface-500 uppercase tracking-wider">Loaded Documents</p>
            </div>
            <div className="space-y-2">
              {docName ? (
                <div className="p-3 bg-surface-800/50 border border-primary-500/30 rounded-xl flex items-start gap-3">
                  <Book className="w-4 h-4 text-primary-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-surface-200 leading-tight">{docName}</p>
                    <p className="text-[10px] text-surface-500 mt-1">Context active for AI</p>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-surface-500">No documents uploaded. Click the upload icon in the chat bar to add a PDF.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
