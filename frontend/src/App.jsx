import React, { useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateCrmData, setViewMode, setHistoryData } from './redux/crmSlice';
import { addUserMessage, addAiMessage, setLoading } from './redux/chatSlice';
import { FileText, Send, User, Calendar, Activity, ClipboardList, Stethoscope, Clock, CheckCircle, Package, BookOpen, Target, Mic, Moon, Sun } from 'lucide-react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

const FormField = ({ label, icon: Icon, value, isTextArea = false }) => (
  <div className={isTextArea ? "col-span-2" : "col-span-1"}>
    <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
      <Icon size={14} /> {label}
    </label>
    <div className={`p-3 rounded-lg border transition-colors ${isTextArea ? 'min-h-[80px]' : ''} ${value
        ? 'bg-indigo-50 border-indigo-200 text-indigo-900 dark:bg-indigo-900/30 dark:border-indigo-800/50 dark:text-indigo-200 font-medium'
        : 'bg-gray-50 border-gray-200 text-gray-400 dark:bg-gray-800/50 dark:border-gray-700 dark:text-gray-500 italic'
      }`}>
      {value || 'Waiting for AI...'}
    </div>
  </div>
);

function App() {
  const dispatch = useDispatch();
  const [isDarkMode, setIsDarkMode] = useState(false);

  const { viewMode, crmData, historyData } = useSelector((state) => state.crm);
  const { threadId, messages, loading } = useSelector((state) => state.chat);

  const [input, setInput] = useState('');

  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);

  const getSentimentWithEmoji = (sentiment) => {
    if (!sentiment) return null;
    const s = sentiment.toLowerCase();
    if (s.includes('positive')) return `${sentiment.toUpperCase()} 😊`;
    if (s.includes('negative')) return `${sentiment.toUpperCase()} 😞`;
    return `${sentiment.toUpperCase()} 😐`;
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const sendMessage = async () => {
    if (!input.trim() && !isRecording) return;

    const currentInput = input;
    dispatch(addUserMessage(currentInput));
    setInput('');
    dispatch(setLoading(true));

    if (textareaRef.current) {
      textareaRef.current.style.height = '56px';
    }

    try {
      const response = await axios.post('http://localhost:8000/chat', {
        message: currentInput,
        thread_id: threadId
      }, {
        timeout: 60000
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

      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        dispatch(addAiMessage('The request timed out because the AI took longer than 1 min to respond. Please try again.'));
      } else if (error.response?.data.detail.includes("Error code: 429")) {
        dispatch(addAiMessage("The AI is currently at maximum capacity. Please wait a few minutes and try again."));
      } else {
        dispatch(addAiMessage('Error: Could not reach the backend.'));
      }
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    adjustTextareaHeight();
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support voice input. Please try Google Chrome or Microsoft Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => {
        const newText = prev + (prev.endsWith(' ') || prev === '' ? '' : ' ') + transcript;
        return newText;
      });

      setTimeout(adjustTextareaHeight, 10);
    };

    recognition.onerror = (err) => {
      console.error("Speech recognition error:", err);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50 dark:bg-gray-950 font-inter text-gray-900 dark:text-gray-100 transition-colors">
      {/* LEFT PANEL */}
      <div className="w-full md:w-1/2 p-4 md:p-6 border-r border-gray-200 dark:border-gray-800 overflow-y-auto flex-1 custom-scrollbar">
        {viewMode === 'form' && (
          <>
            <div className="flex items-center gap-2 mb-6 text-indigo-700 dark:text-indigo-400">
              <FileText size={24} />
              <h1 className="text-2xl font-bold tracking-tight">Interaction Log</h1>
            </div>
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 relative overflow-hidden transition-colors">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>

              <div className="grid grid-cols-2 gap-6">
                <FormField label="HCP Name" icon={User} value={crmData.hcp_name} />
                <FormField label="Interaction Type" icon={Calendar} value={crmData.interaction_type} />
                <FormField label="Sentiment" icon={Activity} value={crmData.sentiment ? getSentimentWithEmoji(crmData.sentiment) : ''} />
                <FormField label="Interaction Date" icon={Clock} value={crmData.interaction_date} />

                <FormField label="Discussion Notes" icon={ClipboardList} value={crmData.discussion_notes} isTextArea={true} />

                <FormField label="Materials Shared" icon={BookOpen} value={crmData.materials_shared} />
                <FormField label="Samples Distributed" icon={Package} value={crmData.samples_distributed} />

                <FormField label="Follow-up Actions" icon={Calendar} value={crmData.follow_up} isTextArea={true} />
                <FormField label="AI Summary" icon={FileText} value={crmData.summary} isTextArea={true} />

                {crmData.next_best_action && crmData.next_best_action.length > 0 && (
                  <div className="col-span-1 md:col-span-2 mt-2 p-5 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-950/40 border border-indigo-100 dark:border-indigo-900/50 rounded-xl shadow-sm">
                    <div className="flex items-center gap-2 mb-4 text-indigo-800 dark:text-indigo-300">
                      <Target size={20} className="text-indigo-600 dark:text-indigo-400" />
                      <span className="font-bold text-sm uppercase tracking-wider text-indigo-900 dark:text-indigo-200">AI Suggested Follow up</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                      {crmData.next_best_action.map((action, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm text-indigo-900 dark:text-indigo-200 bg-white dark:bg-gray-900 p-3 rounded-lg shadow-sm border border-indigo-50/50 dark:border-indigo-800/30 hover:shadow-md transition-shadow">
                          <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 font-bold text-xs">
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

        {viewMode === 'history' && (
          <>
            <div className="flex items-center gap-2 mb-8 text-purple-700 dark:text-purple-400">
              <Clock size={24} />
              <h1 className="text-2xl font-bold tracking-tight">HCP History</h1>
            </div>

            <div className="space-y-4">
              {historyData.map((meeting, idx) => (
                <div key={idx} className="bg-white dark:bg-gray-900 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 border-l-4 border-l-purple-500 dark:border-l-purple-500 transition-colors">

                  <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-50 dark:border-gray-800">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{meeting.date}</span>
                      {meeting.type && (
                        <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-md">
                          {meeting.type}
                        </span>
                      )}
                    </div>
                    <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${meeting.sentiment?.toLowerCase() === 'positive' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        meeting.sentiment?.toLowerCase() === 'negative' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                      }`}>
                      <span>{meeting.sentiment?.toUpperCase() || 'Neutral'}</span>
                      <span>{meeting.sentiment?.toLowerCase() === 'positive' ? '😊' : meeting.sentiment?.toLowerCase() === 'negative' ? '😞' : '😐'}</span>
                    </div>
                  </div>

                  {meeting.notes && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{meeting.notes}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-y-3 gap-x-4 bg-gray-50/50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-50 dark:border-gray-800">
                    {meeting.materials && (
                      <div className="col-span-1">
                        <span className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Materials</span>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{meeting.materials}</p>
                      </div>
                    )}
                    {meeting.samples && (
                      <div className="col-span-1">
                        <span className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Samples</span>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{meeting.samples}</p>
                      </div>
                    )}
                    {meeting.outcomes && (
                      <div className="col-span-2">
                        <span className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Outcomes</span>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{meeting.outcomes}</p>
                      </div>
                    )}
                    {meeting.follow_up && (
                      <div className="col-span-2">
                        <span className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Follow-up</span>
                        <p className="text-sm font-medium text-indigo-700 dark:text-indigo-400">{meeting.follow_up}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {historyData.length === 0 && (
                <div className="text-center p-8 bg-gray-50 dark:bg-gray-900 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
                  <div className="text-gray-400 dark:text-gray-600 mb-2 flex justify-center"><Clock size={32} /></div>
                  <div className="text-gray-500 dark:text-gray-400 text-sm font-medium">No historical records found for this doctor.</div>
                </div>
              )}
            </div>

            <button
              onClick={() => dispatch(setViewMode('form'))}
              className="mt-6 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors"
            >
              &larr; Back to Active Log
            </button>
          </>
        )}
      </div>

      {/* RIGHT PANEL - CHAT */}
      <div className="w-full md:w-1/2 flex flex-col bg-white dark:bg-gray-950 h-[50vh] md:h-full border-t md:border-t-0 border-gray-200 dark:border-gray-800 transition-colors">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm z-10 flex items-center justify-between transition-colors">
          <div className="flex items-center gap-2 text-gray-800 dark:text-gray-100">
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-400">
              <Stethoscope size={18} />
            </div>
            <div>
              <h2 className="font-semibold text-sm">HCP AI Copilot</h2>
              <p className="text-xs text-gray-400 dark:text-gray-500">Session: {threadId.substring(0, 12)}...</p>
            </div>
          </div>

          {/* THEME TOGGLE BUTTON */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
            title="Toggle Dark Mode"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>

        <div className="flex-1 p-6 overflow-y-auto bg-gray-50 dark:bg-gray-950 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-4 rounded-xl text-sm shadow-sm ${msg.role === 'user'
                ? 'bg-indigo-600 text-white rounded-br-none dark:bg-indigo-500'
                : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-bl-none'
                }`}>
                {msg.role === 'user' ? (
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {msg.text}
                  </div>
                ) : (
                  <div className="prose prose-sm prose-indigo dark:prose-invert max-w-none">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-4 rounded-xl rounded-bl-none shadow-sm flex items-center gap-2">
                <div className="w-2 h-2 bg-indigo-400 dark:bg-indigo-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-indigo-400 dark:bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-indigo-400 dark:bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          )}
        </div>

        {/* INPUT AREA */}
        <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 transition-colors">
          <div className="relative flex items-end gap-2 items-center">

            {/* The Textarea */}
            <div className="relative flex-1">
              <textarea
                id="chat-input"
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={isRecording ? "Listening..." : "Type or speak your message... (Shift + Enter for new line)"}
                rows={1}
                className={`w-full p-4 pr-12 bg-gray-50 dark:bg-gray-800 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 resize-none overflow-y-auto transition-colors text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${isRecording
                    ? 'border-red-300 dark:border-red-500/50 bg-red-50/30 dark:bg-red-900/20'
                    : 'border-gray-200 dark:border-gray-700'
                  }`}
                style={{ minHeight: '56px' }}
                disabled={loading}
              />

              {/* Mic Button positioned inside the textarea */}
              <button
                onClick={toggleRecording}
                disabled={loading}
                className={`absolute right-3 top-3 p-1.5 rounded-lg transition-all ${isRecording
                  ? 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400 animate-pulse'
                  : 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-gray-700 dark:hover:text-indigo-400'
                  } disabled:opacity-50`}
                title="Voice Input"
              >
                <Mic size={20} />
              </button>
            </div>

            {/* Send Button */}
            <button
              onClick={sendMessage}
              disabled={loading || (!input.trim() && !isRecording)}
              className="p-4 h-[56px] bg-indigo-600 dark:bg-indigo-500 text-white rounded-xl hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:opacity-50 flex items-center justify-center flex-shrink-0 transition-colors mb-2"
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