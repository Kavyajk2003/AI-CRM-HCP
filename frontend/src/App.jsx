import React, { useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateCrmData, setViewMode, setHistoryData } from './redux/crmSlice';
import { addUserMessage, addAiMessage, setLoading } from './redux/chatSlice';
import { FileText, Send, User, Calendar, Activity, ClipboardList, Stethoscope, Clock, CheckCircle, Package, BookOpen, Target } from 'lucide-react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

// Helper component to render form fields cleanly
const FormField = ({ label, icon: Icon, value, isTextArea = false }) => (
  <div className={isTextArea ? "col-span-2" : "col-span-1"}>
    <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
      <Icon size={14} /> {label}
    </label>
    <div className={`p-3 rounded-lg border ${isTextArea ? 'min-h-[80px]' : ''} ${value ? 'bg-indigo-50 border-indigo-200 text-indigo-900 font-medium' : 'bg-gray-50 border-gray-200 text-gray-400 italic'}`}>
      {value || 'Waiting for AI...'}
    </div>
  </div>
);

function App() {
  const dispatch = useDispatch();

  const { viewMode, crmData, historyData } = useSelector((state) => state.crm);
  const { threadId, messages, loading } = useSelector((state) => state.chat);

  const [input, setInput] = useState('');
  const textareaRef = useRef(null);

  const getSentimentWithEmoji = (sentiment) => {
    if (!sentiment) return null;
    const s = sentiment.toLowerCase();
    if (s.includes('positive')) return `${sentiment.toUpperCase()} 😊`;
    if (s.includes('negative')) return `${sentiment.toUpperCase()} 😞`;
    return `${sentiment.toUpperCase()} 😐`;
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const currentInput = input;
    dispatch(addUserMessage(currentInput));
    setInput('');
    dispatch(setLoading(true));

    try {
      const response = await axios.post('http://localhost:8000/chat', {
        message: currentInput,
        thread_id: threadId
      });

      dispatch(addAiMessage(response.data.reply));

      if (response.data.data) {
        dispatch(updateCrmData(response.data.data));
        dispatch(setViewMode('form'));
      }
      else if (response.data.history) {
        dispatch(setHistoryData(response.data.history));
        dispatch(setViewMode('history'));
      }

    } catch (error) {
      console.error(error);
      dispatch(addAiMessage('Error: Could not reach the backend.'));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // Reset height
      // Max expand to 150px, then show scrollbar
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  };

  // Handle Enter (Send) vs Shift+Enter (New Line)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage();

      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 font-inter">
      {/* LEFT PANEL */}
      <div className="w-1/2 p-6 border-r border-gray-200 overflow-y-auto">
        {viewMode === 'form' && (
          <>
            <div className="flex items-center gap-2 mb-6 text-indigo-700">
              <FileText size={24} />
              <h1 className="text-2xl font-bold tracking-tight">Interaction Log</h1>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>

              <div className="grid grid-cols-2 gap-6">
                <FormField label="HCP Name" icon={User} value={crmData.hcp_name} />
                <FormField label="Interaction Type" icon={Calendar} value={crmData.interaction_type} />
                <FormField label="Sentiment" icon={Activity} value={crmData.sentiment ? getSentimentWithEmoji(crmData.sentiment) : ''} />
                <FormField label="Interaction Date" icon={Clock} value={crmData.interaction_date} />

                <FormField label="Discussion Notes" icon={ClipboardList} value={crmData.discussion_notes} isTextArea={true} />

                <FormField label="Materials Shared" icon={BookOpen} value={crmData.materials_shared} />
                <FormField label="Samples Distributed" icon={Package} value={crmData.samples_distributed} />

                <FormField label="Outcomes" icon={CheckCircle} value={crmData.outcomes} isTextArea={true} />
                <FormField label="Follow-up Actions" icon={Calendar} value={crmData.follow_up} isTextArea={true} />
                <FormField label="AI Summary" icon={FileText} value={crmData.summary} isTextArea={true} />
                {crmData.next_best_action && crmData.next_best_action.length > 0 && (
                  <div className="col-span-1 md:col-span-2 mt-2 p-5 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl shadow-sm">
                    <div className="flex items-center gap-2 mb-4 text-indigo-800">
                      <Target size={20} className="text-indigo-600" />
                      <span className="font-bold text-sm uppercase tracking-wider text-indigo-900">AI Suggested Follow up</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {crmData.next_best_action.map((action, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm text-indigo-900 bg-white p-3 rounded-lg shadow-sm border border-indigo-50/50 hover:shadow-md transition-shadow">
                          <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs">
                            {i + 1}
                          </span>
                          <span className="font-medium">{action}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* History View Component Remains Unchanged */}
        {viewMode === 'history' && (
          <>
            <div className="flex items-center gap-2 mb-8 text-purple-700">
              <Clock size={24} />
              <h1 className="text-2xl font-bold tracking-tight">HCP History</h1>
            </div>

            <div className="space-y-4">
              {historyData.map((meeting, idx) => (
                <div key={idx} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-purple-500">

                  {/* Header: Date & Sentiment */}
                  <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-50">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-700">{meeting.date}</span>
                      {meeting.type && (
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md">
                          {meeting.type}
                        </span>
                      )}
                    </div>
                    <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${meeting.sentiment?.toLowerCase() === 'positive' ? 'bg-green-100 text-green-700' :
                      meeting.sentiment?.toLowerCase() === 'negative' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                      <span>{meeting.sentiment?.toUpperCase() || 'Neutral'}</span>
                      <span>{meeting.sentiment?.toLowerCase() === 'positive' ? '😊' : meeting.sentiment?.toLowerCase() === 'negative' ? '😞' : '😐'}</span>
                    </div>
                  </div>

                  {/* Main Discussion Notes */}
                  {meeting.notes && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-700 leading-relaxed">{meeting.notes}</p>
                    </div>
                  )}

                  {/* Grid for Extra Details */}
                  <div className="grid grid-cols-2 gap-y-3 gap-x-4 bg-gray-50/50 p-3 rounded-lg border border-gray-50">

                    {meeting.materials && (
                      <div className="col-span-1">
                        <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Materials</span>
                        <p className="text-sm text-gray-600">{meeting.materials}</p>
                      </div>
                    )}

                    {meeting.samples && (
                      <div className="col-span-1">
                        <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Samples</span>
                        <p className="text-sm text-gray-600">{meeting.samples}</p>
                      </div>
                    )}

                    {meeting.outcomes && (
                      <div className="col-span-2">
                        <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Outcomes</span>
                        <p className="text-sm text-gray-600">{meeting.outcomes}</p>
                      </div>
                    )}

                    {meeting.follow_up && (
                      <div className="col-span-2">
                        <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Follow-up</span>
                        <p className="text-sm text-gray-600 font-medium text-indigo-700">{meeting.follow_up}</p>
                      </div>
                    )}

                  </div>
                </div>
              ))}

              {historyData.length === 0 && (
                <div className="text-center p-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <div className="text-gray-400 mb-2 flex justify-center"><Clock size={32} /></div>
                  <div className="text-gray-500 text-sm font-medium">No historical records found for this doctor.</div>
                </div>
              )}
            </div>

            <button
              onClick={() => dispatch(setViewMode('form'))}
              className="mt-6 text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 transition-colors"
            >
              &larr; Back to Active Log
            </button>
          </>
        )}
      </div>

      {/* RIGHT PANEL - CHAT */}
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

              <div className={`max-w-[80%] p-4 rounded-xl text-sm shadow-sm ${msg.role === 'user'
                ? 'bg-indigo-600 text-white rounded-br-none'
                : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                }`}>

                {/* Check the role: 
                  - User gets standard text with pre-wrap (to respect Shift+Enter newlines)
                  - AI gets ReactMarkdown with Tailwind typography formatting 
                */}
                {msg.role === 'user' ? (
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {msg.text}
                  </div>
                ) : (
                  <div className="prose prose-sm prose-indigo max-w-none">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                )}

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
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type your message... (Shift + Enter for new line)"
              rows={1}
              className="w-full p-4 pr-12 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none overflow-y-auto"
              style={{ minHeight: '56px' }} // Matches the visual height of your old input box
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