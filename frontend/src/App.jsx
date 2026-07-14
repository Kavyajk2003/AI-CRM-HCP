import React, { useState } from 'react';
import { FileText, Send, User, Calendar, Activity, ClipboardList, Stethoscope, Clock } from 'lucide-react';
import axios from 'axios';

// Helper to generate a unique thread ID for the session
const generateThreadId = () => `thread_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;

function App() {
  const [threadId] = useState(generateThreadId());

  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Hello! I am your AI Copilot. Log a new meeting, or ask me to retrieve history for a doctor.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('form');

  const [crmData, setCrmData] = useState({
    hcp_name: '', interaction_type: 'In-Person', sentiment: '', discussion_notes: '', follow_up: ''
  });

  const [historyData, setHistoryData] = useState([]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { role: 'user', text: input };
    setMessages((prev) => [...prev, userMsg]);
    const currentInput = input;
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:8000/chat', {
        message: currentInput,
        thread_id: threadId // Uses the dynamic session ID
      });

      const aiMsg = { role: 'ai', text: response.data.reply };
      setMessages((prev) => [...prev, aiMsg]);

      if (response.data.data) {
        setCrmData(response.data.data);
        setViewMode('form');
      }
      else if (response.data.history) {
        setHistoryData(response.data.history);
        setViewMode('history');
      }

    } catch (error) {
      console.error(error);
      setMessages((prev) => [...prev, { role: 'ai', text: 'Error: Could not reach the backend.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 font-inter">
      <div className="w-1/2 p-6 border-r border-gray-200 overflow-y-auto">
        {viewMode === 'form' && (
          <>
            <div className="flex items-center gap-2 mb-8 text-indigo-700">
              <FileText size={24} />
              <h1 className="text-2xl font-bold tracking-tight">Interaction Log</h1>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2"><User size={14} /> HCP Name</label>
                  <div className={`p-3 rounded-lg border ${crmData.hcp_name ? 'bg-indigo-50 border-indigo-200 text-indigo-900 font-medium' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                    {crmData.hcp_name || 'Waiting for AI...'}
                  </div>
                </div>
                <div>
                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2"><Activity size={14} /> Sentiment</label>
                  <div className={`p-3 rounded-lg border ${crmData.sentiment ? 'bg-indigo-50 border-indigo-200 text-indigo-900 font-medium' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                    {crmData.sentiment || 'Waiting for AI...'}
                  </div>
                </div>
              </div>
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2"><ClipboardList size={14} /> Discussion Notes</label>
                <div className={`p-3 rounded-lg border min-h-[80px] ${crmData.discussion_notes ? 'bg-indigo-50 border-indigo-200 text-indigo-900 font-medium' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                  {crmData.discussion_notes || 'Waiting for AI...'}
                </div>
              </div>
            </div>
          </>
        )}

        {viewMode === 'history' && (
          <>
            <div className="flex items-center gap-2 mb-8 text-purple-700">
              <Clock size={24} />
              <h1 className="text-2xl font-bold tracking-tight">HCP History</h1>
            </div>
            <div className="space-y-4">
              {historyData.map((meeting, idx) => (
                <div key={idx} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-purple-500">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-bold text-gray-700">{meeting.date}</span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${meeting.sentiment === 'Positive' ? 'bg-green-100 text-green-700' :
                      meeting.sentiment === 'Negative' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                      {meeting.sentiment || 'Neutral'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{meeting.notes}</p>
                </div>
              ))}
              {historyData.length === 0 && (
                <div className="text-gray-500 text-sm">No historical records found for this doctor.</div>
              )}
            </div>
            <button
              onClick={() => setViewMode('form')}
              className="mt-6 text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
            >
              &larr; Back to Active Log
            </button>
          </>
        )}
      </div>

      <div className="w-1/2 flex flex-col bg-white">
        <div className="p-4 border-b border-gray-100 bg-white shadow-sm z-10 flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-800">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700">
              <Stethoscope size={18} />
            </div>
            <div>
              <h2 className="font-semibold text-sm">HCP AI Copilot</h2>
              <p className="text-xs text-gray-400">Session: {threadId.substring(0, 12)}...</p>
            </div>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-y-auto bg-gray-50 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-4 rounded-xl text-sm shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                }`}>
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-100 p-4 rounded-xl rounded-bl-none shadow-sm flex items-center gap-2">
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-white border-t border-gray-100">
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type your message..."
              className="w-full p-4 pr-12 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="absolute right-2 top-2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
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