import React, { useState } from 'react';
import { MessageSquare, FileText, Send, User, Calendar, Activity, Pill, Stethoscope, ClipboardList } from 'lucide-react';
import axios from 'axios';

function App() {
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Hello! I am your AI Copilot. Who did you meet with today, and how did the interaction go?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // The CRM Form State (this will auto-update!)
  const [crmData, setCrmData] = useState({
    hcp_name: '',
    interaction_type: 'In-Person',
    sentiment: '',
    discussion_notes: '',
    follow_up: ''
  });

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { role: 'user', text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Send message to our FastAPI + LangGraph backend
      const response = await axios.post('http://localhost:8000/chat', {
        message: input,
        thread_id: 'demo_thread_1'
      });

      const aiMsg = { role: 'ai', text: response.data.reply };
      setMessages((prev) => [...prev, aiMsg]);

      // IN A FULL PRODUCTION APP: 
      // The backend would also return the structured JSON here so we can update `crmData`.
      // For this demo, if the AI says "SUCCESS", we simulate the UI update to show the concept.
      if (response.data.reply.includes("SUCCESS")) {
        // Basic regex to pull out the name for the demo UI
        const nameMatch = input.match(/Dr\.?\s[A-Za-z]+/i);
        setCrmData(prev => ({
          ...prev,
          hcp_name: nameMatch ? nameMatch[0] : 'Dr. Smith (Auto-detected)',
          sentiment: input.toLowerCase().includes('positive') ? 'Positive' : 'Neutral',
          discussion_notes: 'Auto-extracted from chat...',
          follow_up: 'AI suggested next step...'
        }));
      }

    } catch (error) {
      console.error(error);
      setMessages((prev) => [...prev, { role: 'ai', text: 'Error: Could not reach the backend. Is Uvicorn running?' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 font-inter">

      {/* LEFT PANEL: CRM Form (Auto-populating) */}
      <div className="w-1/2 p-6 border-r border-gray-200 overflow-y-auto">
        <div className="flex items-center gap-2 mb-8 text-indigo-700">
          <FileText size={24} />
          <h1 className="text-2xl font-bold tracking-tight">Interaction Log</h1>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6 relative overflow-hidden">
          {/* Visual indicator that AI is controlling the form */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                <User size={14} /> HCP Name
              </label>
              <div className={`p-3 rounded-lg border ${crmData.hcp_name ? 'bg-indigo-50 border-indigo-200 text-indigo-900 font-medium' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                {crmData.hcp_name || 'Waiting for AI extraction...'}
              </div>
            </div>
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                <Activity size={14} /> Sentiment
              </label>
              <div className={`p-3 rounded-lg border ${crmData.sentiment ? 'bg-indigo-50 border-indigo-200 text-indigo-900 font-medium' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                {crmData.sentiment || 'Waiting for AI extraction...'}
              </div>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              <ClipboardList size={14} /> Discussion Notes
            </label>
            <div className={`p-3 rounded-lg border h-24 ${crmData.discussion_notes ? 'bg-indigo-50 border-indigo-200 text-indigo-900 font-medium' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
              {crmData.discussion_notes || 'Waiting for AI extraction...'}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: AI Copilot Chat */}
      <div className="w-1/2 flex flex-col bg-white">
        <div className="p-4 border-b border-gray-100 bg-white shadow-sm z-10 flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-800">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700">
              <Stethoscope size={18} />
            </div>
            <div>
              <h2 className="font-semibold text-sm">HCP AI Copilot</h2>
              <p className="text-xs text-green-500 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span> Online (Groq gemma2-9b)</p>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 p-6 overflow-y-auto bg-gray-50 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-4 rounded-xl text-sm shadow-sm ${msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-none'
                  : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                }`}>
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-100 p-4 rounded-xl rounded-bl-none shadow-sm flex items-center gap-2 text-gray-400 text-sm">
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t border-gray-100">
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="e.g., I met Dr. Smith today. We discussed Product X and he was very positive..."
              className="w-full p-4 pr-12 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm"
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="absolute right-2 top-2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;