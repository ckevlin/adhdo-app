'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Clock, Phone, Link, MapPin, FileText, Flame, Sun, Moon, CloudRain, CloudSnow, Cloud, Zap, Plus, Check, X, ChevronDown, Inbox, Calendar, Timer, Sunrise, Copy, Settings, RefreshCw, Sparkles, List } from 'lucide-react';

// Themes
const themes = {
  light: {
    bg: '#F5F3F0',
    bgSecondary: '#ECEAE6',
    text: '#000000',
    textSecondary: '#666666',
    textMuted: '#999999',
    accent: '#000000',
    accentText: '#FFFFFF',
    border: '#E5E2DD',
    cardBg: '#FFFFFF',
    success: '#22C55E',
  },
  dark: {
    bg: '#0a0a0a',
    bgSecondary: '#141414',
    text: '#FFFFFF',
    textSecondary: 'rgba(255,255,255,0.7)',
    textMuted: 'rgba(255,255,255,0.5)',
    accent: '#FFFFFF',
    accentText: '#000000',
    border: '#2a2a2a',
    cardBg: '#1a1a1a',
    success: '#22C55E',
  }
};

const loadingMantras = [
  "Summoning executive function...",
  "Consulting the ADHD gods...",
  "Finding the least scary task...",
  "Negotiating with your inner chaos goblin...",
  "Convincing your brain this is a good idea...",
  "Scanning for the path of least resistance...",
];

const celebrationMessages = [
  "BOOM! One down! 💥",
  "Look at you being productive!",
  "That wasn't so bad, right?",
  "Your future self thanks you!",
  "Serotonin unlocked! 🔓",
  "You absolute legend!",
  "Task obliterated! ✨",
  "WHO'S CRUSHING IT? YOU ARE!",
];

// API call function - uses server-side API route
async function callClaude(apiKey, model, systemPrompt, userMessage) {
  // Try server-side API first (more secure)
  try {
    const response = await fetch('/api/claude', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        system: systemPrompt,
        prompt: userMessage,
      }),
    });
    
    const data = await response.json();
    
    if (!data.error) {
      return data.content;
    }
  } catch (e) {
    // Fall through to direct API
  }
  
  // Fallback to direct API call if server route fails and we have a key
  if (apiKey) {
    const directResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });
    const directData = await directResponse.json();
    return directData.content?.[0]?.text || '';
  }
  
  throw new Error('API call failed');
}

// Confetti component
function Confetti() {
  const colors = ['#FF6B9D', '#4ECDC4', '#FEC84D', '#95E1D3', '#F38181'];
  const pieces = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 2 + Math.random() * 2,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: 8 + Math.random() * 6,
  }));

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {pieces.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.left}%`,
            top: -20,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : 2,
            animation: `fall ${p.duration}s ease-out ${p.delay}s forwards`,
          }}
        />
      ))}
    </div>
  );
}

// Mini confetti burst component
function MiniConfetti() {
  const colors = ['#FF6B9D', '#4ECDC4', '#FEC84D', '#95E1D3', '#F38181'];
  const pieces = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: 40 + Math.random() * 20,
    delay: Math.random() * 0.2,
    duration: 0.8 + Math.random() * 0.5,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: 6 + Math.random() * 4,
    angle: (Math.random() - 0.5) * 120,
  }));

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 10 }}>
      {pieces.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.left}%`,
            top: '50%',
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : 2,
            animation: `burst ${p.duration}s ease-out ${p.delay}s forwards`,
            '--angle': `${p.angle}deg`,
          }}
        />
      ))}
    </div>
  );
}

// Main App
export default function ADHDo() {
  const [tasks, setTasks] = useState([]);
  const [settings, setSettings] = useState({ apiKey: '', eveningHour: 19 });
  const [activeTab, setActiveTab] = useState('now');
  const [showChat, setShowChat] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [suggestion, setSuggestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [sections, setSections] = useState({ void: true, today: true, tomorrow: true, week: true, later: true });
  const [showCompleted, setShowCompleted] = useState(false);
  const [customOrder, setCustomOrder] = useState({});
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverSection, setDragOverSection] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [quickAddSection, setQuickAddSection] = useState(null);
  const [quickAddText, setQuickAddText] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [whenPickerTask, setWhenPickerTask] = useState(null);
  const [suggestionTaskIds, setSuggestionTaskIds] = useState(null); // Track which tasks the suggestion is based on
  const [todayDoneMessage, setTodayDoneMessage] = useState(null);
  const [completingTaskId, setCompletingTaskId] = useState(null);
  const [showMiniConfetti, setShowMiniConfetti] = useState(false);

  const hour = new Date().getHours();
  const isEvening = hour >= settings.eveningHour;
  const theme = isEvening ? themes.dark : themes.light;

  // Load saved data
  useEffect(() => {
    try {
      const savedTasks = localStorage.getItem('adhdo-tasks');
      const savedSettings = localStorage.getItem('adhdo-settings');
      const savedOrder = localStorage.getItem('adhdo-order');
      if (savedTasks) {
        const parsedTasks = JSON.parse(savedTasks);
        // Clean up completed tasks older than a week
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const cleanedTasks = parsedTasks.filter(t => 
          !t.completed || !t.completedAt || t.completedAt >= oneWeekAgo
        );
        setTasks(cleanedTasks);
      }
      if (savedSettings) setSettings(JSON.parse(savedSettings));
      if (savedOrder) setCustomOrder(JSON.parse(savedOrder));
    } catch (e) {}
  }, []);

  // Save data
  useEffect(() => {
    localStorage.setItem('adhdo-tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('adhdo-settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('adhdo-order', JSON.stringify(customOrder));
  }, [customOrder]);

  // Auto-fetch suggestion when tasks change or on first load with API key
  const taskIdsRef = useRef(null);
  useEffect(() => {
    const incompleteTasks = tasks.filter(t => !t.completed);
    const currentIds = incompleteTasks.map(t => t.id).sort().join(',');
    
    // Only fetch if we have an API key and tasks exist
    if (settings.apiKey && incompleteTasks.length > 0) {
      // Check if today tasks were added while showing todayDoneMessage
      const todayDate = new Date().toISOString().split('T')[0];
      const todayTasks = incompleteTasks.filter(t => t.doDate && t.doDate <= todayDate);
      
      if (todayDoneMessage && todayTasks.length > 0) {
        // New today tasks added - clear celebration and refresh
        setTodayDoneMessage(null);
        getSuggestion();
        return;
      }
      
      // Fetch if task list changed or we don't have a suggestion
      if (currentIds !== taskIdsRef.current || !suggestion) {
        taskIdsRef.current = currentIds;
        
        // Small delay to batch rapid changes
        const timeout = setTimeout(() => {
          getSuggestion();
        }, 500);
        return () => clearTimeout(timeout);
      }
    }
  }, [tasks, settings.apiKey, todayDoneMessage]);

  // Fetch weather
  const fetchWeather = () => {
    if (!navigator.geolocation) {
      alert('Geolocation not supported');
      return;
    }
    setWeatherLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&current=temperature_2m,weather_code&temperature_unit=fahrenheit`
          );
          const data = await res.json();
          const code = data.current.weather_code;
          let icon = 'sun';
          if (code >= 45 && code <= 48) icon = 'cloud';
          else if (code >= 51 && code <= 82) icon = 'rain';
          else if (code >= 71 && code <= 77) icon = 'snow';
          else if (code >= 95) icon = 'storm';
          setWeather({ temp: Math.round(data.current.temperature_2m), icon });
        } catch (e) {
          console.error('Weather fetch error:', e);
        }
        setWeatherLoading(false);
      },
      (err) => {
        console.error('Geolocation error:', err);
        setWeatherLoading(false);
        alert('Location access denied. Enable location to get weather.');
      },
      { timeout: 10000 }
    );
  };

  // AI: Generate celebration message when today's tasks are done
  const generateTodayDoneMessage = async (completedCount) => {
    // Fetch a random celebration GIF from Giphy
    const fetchCelebrationGif = async (searchTerm = 'celebration') => {
      try {
        // Using Giphy's public beta API key (rate limited but free)
        const response = await fetch(
          `https://api.giphy.com/v1/gifs/search?api_key=dc6zaTOxFJmzC&q=${encodeURIComponent(searchTerm)}&limit=25&rating=pg`
        );
        const data = await response.json();
        if (data.data && data.data.length > 0) {
          const randomIndex = Math.floor(Math.random() * Math.min(data.data.length, 25));
          return data.data[randomIndex].images.fixed_height.url;
        }
      } catch (e) {
        console.error('GIF fetch error:', e);
      }
      return null;
    };

    if (!settings.apiKey) {
      const gifUrl = await fetchCelebrationGif('happy dance celebration');
      setTodayDoneMessage({
        headline: "You're done for today!",
        subtitle: `${completedCount} task${completedCount > 1 ? 's' : ''} completed. You've earned a break.`,
        gifUrl
      });
      return;
    }

    try {
      const eveningContext = isEvening ? "It's evening time, so emphasize rest and winding down. Messages like 'rest is productive too' or 'your couch is calling' are great!" : "";
      
      const response = await callClaude(
        settings.apiKey,
        'claude-haiku-4-5-20251001',
        `You're a witty, warm friend celebrating someone finishing their tasks for the day. Be funny, playful, and genuinely celebratory. Keep it SHORT - one punchy headline and one short subtitle. Also suggest a fun GIF search term. ${eveningContext}`,
        `The user just completed ALL their tasks for today! They got through ${completedCount} task${completedCount > 1 ? 's' : ''}.${isEvening ? " It's evening now." : ""}

Return ONLY JSON:
{"headline":"funny celebratory headline, 5-8 words max, no emoji","subtitle":"short supportive message","gifSearch":"2-3 word gif search term like 'mic drop' or 'happy dance' or 'couch relaxing'"}`
      );
      const match = response.match(/\{[\s\S]*\}/);
      if (match) {
        const data = JSON.parse(match[0]);
        const gifUrl = await fetchCelebrationGif(data.gifSearch || 'celebration success');
        setTodayDoneMessage({
          headline: data.headline,
          subtitle: data.subtitle,
          completedCount,
          gifUrl
        });
      }
    } catch (e) {
      const gifUrl = await fetchCelebrationGif('celebration success');
      setTodayDoneMessage({
        headline: "You're done for today!",
        subtitle: `${completedCount} task${completedCount > 1 ? 's' : ''} completed. You've earned a break.`,
        gifUrl
      });
    }
  };

  // AI: Get task suggestion
  const getSuggestion = async (skipTodayDoneCheck = false) => {
    let incomplete = tasks.filter(t => !t.completed);
    
    // In evening mode, only show home tasks (treat undefined/null as 'either')
    if (isEvening) {
      incomplete = incomplete.filter(t => !t.location || t.location === 'home' || t.location === 'either');
    }
    
    if (!incomplete.length || !settings.apiKey) {
      setSuggestion(null);
      return;
    }

    // Priority order: urgent today > today > urgent this week > this week > urgent later > later > void
    const todayDate = new Date().toISOString().split('T')[0];
    const tomorrowDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const weekEndDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const urgentToday = incomplete.filter(t => t.doDate && t.doDate <= todayDate && t.urgent);
    const normalToday = incomplete.filter(t => t.doDate && t.doDate <= todayDate && !t.urgent);
    const todayTasksLeft = urgentToday.length + normalToday.length;
    
    // Check if today is complete but there are other tasks
    const todayCompletedTasks = tasks.filter(t => 
      t.completed && 
      t.completedAt && 
      t.completedAt.split('T')[0] === todayDate
    );
    
    // If no today tasks left but there are other tasks, show celebration (unless skipped)
    // Only show full GIF celebration if 3+ tasks were completed today
    if (!skipTodayDoneCheck && todayTasksLeft === 0 && incomplete.length > 0 && todayCompletedTasks.length >= 3) {
      // Generate AI celebration message with GIF
      if (!todayDoneMessage) {
        generateTodayDoneMessage(todayCompletedTasks.length);
      }
      setSuggestion(null);
      return;
    } else if (skipTodayDoneCheck) {
      setTodayDoneMessage(null);
    }
    
    const urgentTomorrow = incomplete.filter(t => t.doDate === tomorrowDate && t.urgent);
    const normalTomorrow = incomplete.filter(t => t.doDate === tomorrowDate && !t.urgent);
    const urgentWeek = incomplete.filter(t => t.doDate > tomorrowDate && t.doDate <= weekEndDate && t.urgent);
    const normalWeek = incomplete.filter(t => t.doDate > tomorrowDate && t.doDate <= weekEndDate && !t.urgent);
    const urgentLater = incomplete.filter(t => t.doDate > weekEndDate && t.urgent);
    const normalLater = incomplete.filter(t => t.doDate > weekEndDate && !t.urgent);
    const voidTasksIncomplete = incomplete.filter(t => !t.doDate);
    
    // Get the highest priority non-empty pool
    let priorityPool = [];
    let poolName = '';
    
    if (urgentToday.length > 0) {
      priorityPool = urgentToday;
      poolName = 'urgent today';
    } else if (normalToday.length > 0) {
      priorityPool = normalToday;
      poolName = 'today';
    } else if (urgentTomorrow.length > 0) {
      priorityPool = urgentTomorrow;
      poolName = 'urgent tomorrow';
    } else if (normalTomorrow.length > 0) {
      priorityPool = normalTomorrow;
      poolName = 'tomorrow';
    } else if (urgentWeek.length > 0) {
      priorityPool = urgentWeek;
      poolName = 'urgent this week';
    } else if (normalWeek.length > 0) {
      priorityPool = normalWeek;
      poolName = 'this week';
    } else if (urgentLater.length > 0) {
      priorityPool = urgentLater;
      poolName = 'urgent later';
    } else if (normalLater.length > 0) {
      priorityPool = normalLater;
      poolName = 'later';
    } else {
      priorityPool = voidTasksIncomplete;
      poolName = 'void';
    }

    if (priorityPool.length === 0) {
      setSuggestion(null);
      return;
    }

    setLoading(true);
    try {
      const now = new Date();
      const systemPrompt = `You are an ADHD-friendly task assistant. Your goal is to help batch similar tasks together to build momentum.

FIRST: Look at ALL tasks (not just priority pool) and find groups of 2-3 related tasks that could be done together. Look for:
- Same action type: "Call Jim", "Call bank", "Call mom" → batch as "Phone calls"
- Same location/context: "order plant", "order flooring" → batch as "Online ordering"  
- Same category: "empty trash", "dishes", "vacuum" → batch as "Quick home tasks"
- Same errand area: "CVS", "grocery store" → batch as "Errands"

THEN: Pick the best group or single task to suggest right now.

If you find a good group, suggest the primary task and include related tasks as "batch" items.
If no good groupings exist, just pick the best single task from the priority pool.

Be supportive, never judgmental. Quick wins build momentum!`;

      const userPrompt = `Time: ${now.toLocaleTimeString()}
Day: ${now.toLocaleDateString('en-US', { weekday: 'long' })}
Evening mode: ${isEvening}
Weather: ${weather ? `${weather.temp}°F ${weather.icon}` : 'unknown'}

PRIORITY POOL (${poolName}) - prefer tasks from here:
${priorityPool.map(t => `- ID: ${t.id} | "${t.text}" | urgent: ${t.urgent || false}`).join('\n')}

ALL OTHER TASKS (can batch with priority tasks if related):
${incomplete.filter(t => !priorityPool.includes(t)).map(t => `- ID: ${t.id} | "${t.text}" | section: ${t.doDate ? (t.doDate <= todayDate ? 'today' : t.doDate === tomorrowDate ? 'tomorrow' : t.doDate <= weekEndDate ? 'week' : 'later') : 'void'}`).join('\n')}

Return ONLY JSON:
{
  "taskId": "primary task ID from priority pool",
  "headline": "motivating 5-10 words. NO HYPHENS OR DASHES. Use colons if needed. (e.g. 'Phone call power hour!' or 'Time to knock these out')",
  "subtitle": "supportive message",
  "batchTaskIds": ["id1", "id2"] or [] (up to 2 related tasks from ANY section to do together),
  "batchReason": "short label like 'Phone calls' or 'Quick wins'" or null
}`;

      const response = await callClaude(settings.apiKey, 'claude-sonnet-4-20250514', systemPrompt, userPrompt);
      const match = response.match(/\{[\s\S]*\}/);
      if (match) {
        const data = JSON.parse(match[0]);
        const batchTasks = (data.batchTaskIds || [])
          .map(id => tasks.find(t => t.id === id))
          .filter(Boolean);
        
        setSuggestion({
          task: tasks.find(t => t.id === data.taskId) || priorityPool[0],
          headline: data.headline,
          subtitle: data.subtitle,
          batchTasks: batchTasks,
          batchReason: data.batchReason,
        });
      }
    } catch (e) {
      console.error(e);
      // Fallback - just pick first from priority pool
      setSuggestion({
        task: priorityPool[0],
        headline: priorityPool[0].urgent ? "This one's urgent!" : "Let's knock this out",
        subtitle: "You've got this!",
        batchTasks: [],
      });
    }
    setLoading(false);
  };

  // AI: Parse tasks from natural language
  const parseTasks = async (text, totalTasksAddedSoFar = 0, existingTasks = []) => {
    if (!settings.apiKey) return { tasks: [], response: "Add your API key in settings first!" };

    // Get existing incomplete tasks for duplicate/merge detection
    const incompleteTasks = tasks.filter(t => !t.completed);
    const existingTasksList = incompleteTasks.map(t => ({
      id: t.id,
      text: t.text,
      category: t.category,
      subtasks: t.subtasks?.map(st => st.text) || []
    }));

    // Calculate key dates for the AI
    const today = new Date();
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    const nextWeekStart = new Date(today); nextWeekStart.setDate(today.getDate() + 7);
    const nextWeekEnd = new Date(today); nextWeekEnd.setDate(today.getDate() + 13);
    const nextMonthStart = new Date(today); nextMonthStart.setMonth(today.getMonth() + 1);

    const systemPrompt = `Parse tasks from natural language. You're a warm, witty friend who truly gets ADHD brains.

Categories: phone, errand, cleaning, medical, financial, work, shopping, home
Locations: home, out, either

DATE PARSING - Pay close attention to time references:
- "today" → today's date
- "tomorrow" → tomorrow's date
- "this week" → a date within the next 7 days
- "next week" → a date 7-13 days from now (pick middle of next week)
- "next month", "later", "eventually", "someday", "at some point" → a date 30+ days out
- No time mentioned → null (goes to void/unsorted)
- Specific days like "Monday", "Friday" → calculate the actual date

IMPORTANT: If the user mentions needing to get/buy multiple items as part of ONE task, create ONE task with subtasks.
Example: "go to health food store to get beans, bread and butter" becomes:
{"text":"Go to health food store","subtasks":["beans","bread","butter"],...}

DUPLICATE/MERGE DETECTION:
- Check if the new task is a DUPLICATE of an existing task (same or very similar text)
- Check if the new task could MERGE with an existing task (same action type like "order X" + "order Y", or same location/errand)
- If you detect a potential duplicate or merge, set "mergePrompt" with a friendly question
- Include "mergeWithId" (the existing task ID) and "mergeType" ("duplicate" or "combine")

PERSONALITY RULES FOR YOUR RESPONSE:
- If they're adding a LOT of tasks (5+): acknowledge it warmly
- If they mention something emotionally heavy: be genuinely empathetic
- If they add something fun or self-care: celebrate it!
- Keep responses SHORT - one sentence, maybe two max
- Sound human, not like a corporate chatbot`;

    const userPrompt = `Today: ${today.toISOString().split('T')[0]} (${today.toLocaleDateString('en-US', { weekday: 'long' })})
Tomorrow: ${tomorrow.toISOString().split('T')[0]}
Next week range: ${nextWeekStart.toISOString().split('T')[0]} to ${nextWeekEnd.toISOString().split('T')[0]}
Next month starts: ${nextMonthStart.toISOString().split('T')[0]}

Tasks already added this session: ${totalTasksAddedSoFar}
User said: "${text}"

EXISTING TASKS (check for duplicates/merge opportunities):
${existingTasksList.length > 0 ? existingTasksList.map(t => `- ID: ${t.id} | "${t.text}" | category: ${t.category}${t.subtasks.length ? ` | subtasks: ${t.subtasks.join(', ')}` : ''}`).join('\n') : '(none)'}

Return ONLY JSON:
{
  "tasks":[{"text":"...","doDate":"YYYY-MM-DD or null","category":"...","location":"...","subtasks":[]}],
  "response":"your warm, context-aware response",
  "mergePrompt": null or "I noticed you already have 'order green tea' - want me to combine these into one ordering task?",
  "mergeWithId": null or "existing-task-id",
  "mergeType": null or "duplicate" or "combine",
  "mergeSubtask": null or "the item to add as subtask if combining"
}`;

    try {
      const response = await callClaude(settings.apiKey, 'claude-haiku-4-5-20251001', systemPrompt, userPrompt);
      const match = response.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
    } catch (e) {
      console.error(e);
    }
    return { tasks: [], response: "Hmm, something went wrong. Try again?" };
  };

  // Task actions
  const addTask = (taskData) => {
    const newTask = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      text: taskData.text,
      completed: false,
      urgent: false,
      createdAt: new Date().toISOString(),
      doDate: taskData.doDate || null,
      category: taskData.category || 'general',
      location: taskData.location || 'either',
      subtasks: (taskData.subtasks || []).map(st => ({ text: st, completed: false })),
    };
    setTasks(prev => [...prev, newTask]);
  };

  const completeTask = (id) => {
    const task = tasks.find(t => t.id === id);
    if (!task || task.completed) return;
    
    // Trigger animation
    setCompletingTaskId(id);
    setShowMiniConfetti(true);
    
    // Delay the actual completion to let animation play
    setTimeout(() => {
      setTasks(tasks.map(t => t.id === id ? { ...t, completed: true, completedAt: new Date().toISOString() } : t));
      setCompletingTaskId(null);
    }, 300);
    
    // Hide mini confetti after animation
    setTimeout(() => setShowMiniConfetti(false), 1500);
  };

  const deleteTask = (id) => setTasks(tasks.filter(t => t.id !== id));
  
  const uncompleteTask = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: false, completedAt: null } : t));
  };
  
  const toggleUrgent = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, urgent: !t.urgent } : t));
    if (selectedTask && selectedTask.id === id) {
      setSelectedTask({ ...selectedTask, urgent: !selectedTask.urgent });
    }
  };
  const skipTask = () => getSuggestion();
  
  const toggleSubtask = (taskId, subtaskIndex) => {
    setTasks(tasks.map(t => {
      if (t.id === taskId && t.subtasks) {
        const newSubtasks = [...t.subtasks];
        newSubtasks[subtaskIndex] = { ...newSubtasks[subtaskIndex], completed: !newSubtasks[subtaskIndex].completed };
        return { ...t, subtasks: newSubtasks };
      }
      return t;
    }));
  };
  
  const updateTask = (id, updates) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, ...updates } : t));
    if (selectedTask?.id === id) {
      setSelectedTask(prev => ({ ...prev, ...updates }));
    }
  };

  const scheduleTask = (taskId, when) => {
    let doDate = null;
    const now = new Date();
    
    switch (when) {
      case 'today':
        doDate = now.toISOString().split('T')[0];
        break;
      case 'tomorrow':
        now.setDate(now.getDate() + 1);
        doDate = now.toISOString().split('T')[0];
        break;
      case 'weekend':
        const daysUntilSaturday = (6 - now.getDay() + 7) % 7 || 7;
        now.setDate(now.getDate() + daysUntilSaturday);
        doDate = now.toISOString().split('T')[0];
        break;
      case 'nextweek':
        const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
        now.setDate(now.getDate() + daysUntilMonday);
        doDate = now.toISOString().split('T')[0];
        break;
      case 'later':
        now.setDate(now.getDate() + 14);
        doDate = now.toISOString().split('T')[0];
        break;
      default:
        doDate = null;
    }
    
    setTasks(tasks.map(t => t.id === taskId ? { ...t, doDate } : t));
    setWhenPickerTask(null);
  };

  // Drag and drop handlers
  const handleDragStart = (e, task, sectionKey) => {
    setDraggedTask({ ...task, fromSection: sectionKey });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, sectionKey, index = null) => {
    e.preventDefault();
    setDragOverSection(sectionKey);
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverSection(null);
    setDragOverIndex(null);
  };

  const handleDrop = (e, sectionKey, dropIndex = null) => {
    e.preventDefault();
    if (!draggedTask) return;

    const fromSection = draggedTask.fromSection;
    const isSameSection = fromSection === sectionKey;

    if (isSameSection && dropIndex !== null) {
      // Reorder within same section
      const sectionOrder = customOrder[sectionKey] || [];
      const sectionTasks = getSectionTasks(sectionKey);
      const taskIds = sectionTasks.map(t => t.id);
      
      // Remove dragged task from current position
      const currentIndex = taskIds.indexOf(draggedTask.id);
      if (currentIndex !== -1) {
        taskIds.splice(currentIndex, 1);
      }
      
      // Insert at new position
      const insertIndex = dropIndex > currentIndex ? dropIndex - 1 : dropIndex;
      taskIds.splice(insertIndex, 0, draggedTask.id);
      
      setCustomOrder(prev => ({ ...prev, [sectionKey]: taskIds }));
    } else {
      // Move to different section
      let newDoDate = null;
      if (sectionKey === 'today') {
        newDoDate = today;
      } else if (sectionKey === 'tomorrow') {
        newDoDate = tomorrow;
      } else if (sectionKey === 'week') {
        const d = new Date();
        d.setDate(d.getDate() + 3);
        newDoDate = d.toISOString().split('T')[0];
      } else if (sectionKey === 'later') {
        const d = new Date();
        d.setDate(d.getDate() + 14);
        newDoDate = d.toISOString().split('T')[0];
      }

      setTasks(tasks.map(t => 
        t.id === draggedTask.id ? { ...t, doDate: newDoDate } : t
      ));

      // Add to custom order at drop position
      if (dropIndex !== null) {
        const sectionOrder = customOrder[sectionKey] || [];
        const newOrder = [...sectionOrder];
        newOrder.splice(dropIndex, 0, draggedTask.id);
        setCustomOrder(prev => ({ ...prev, [sectionKey]: newOrder }));
      }
    }

    setDraggedTask(null);
    setDragOverSection(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDragOverSection(null);
    setDragOverIndex(null);
  };

  // Get tasks for a section with custom ordering
  const getSectionTasks = (sectionKey) => {
    let sectionTasks;
    switch (sectionKey) {
      case 'void':
        sectionTasks = tasks.filter(t => !t.completed && !t.doDate);
        break;
      case 'today':
        sectionTasks = tasks.filter(t => !t.completed && t.doDate && t.doDate <= today);
        break;
      case 'tomorrow':
        sectionTasks = tasks.filter(t => !t.completed && t.doDate === tomorrow);
        break;
      case 'week':
        sectionTasks = tasks.filter(t => !t.completed && t.doDate > tomorrow && t.doDate <= weekEnd);
        break;
      case 'later':
        sectionTasks = tasks.filter(t => !t.completed && t.doDate > weekEnd);
        break;
      default:
        sectionTasks = [];
    }
    return sectionTasks;
  };

  // Get bucket label for a task
  const getTaskBucketLabel = (task) => {
    if (!task.doDate) return 'the void';
    if (task.doDate <= today) return null; // Today tasks don't need a label
    if (task.doDate === tomorrow) return "tomorrow's list";
    if (task.doDate <= weekEnd) return 'this week';
    return 'later';
  };

  // Quick add handler
  const handleQuickAdd = (sectionKey) => {
    if (!quickAddText.trim()) {
      setQuickAddSection(null);
      return;
    }

    let doDate = null;
    if (sectionKey === 'today') {
      doDate = today;
    } else if (sectionKey === 'tomorrow') {
      doDate = tomorrow;
    } else if (sectionKey === 'week') {
      const d = new Date();
      d.setDate(d.getDate() + 3);
      doDate = d.toISOString().split('T')[0];
    } else if (sectionKey === 'later') {
      const d = new Date();
      d.setDate(d.getDate() + 14);
      doDate = d.toISOString().split('T')[0];
    }

    addTask({ text: quickAddText.trim(), doDate });
    setQuickAddText('');
    setQuickAddSection(null);
  };

  // Organize tasks - urgent always float to top, then custom order
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const weekEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const sortWithCustomOrder = (taskList, sectionKey) => {
    const order = customOrder[sectionKey] || [];
    const sorted = [...taskList].sort((a, b) => {
      // Urgent always first
      if (a.urgent && !b.urgent) return -1;
      if (!a.urgent && b.urgent) return 1;
      
      // Then by custom order
      const aIndex = order.indexOf(a.id);
      const bIndex = order.indexOf(b.id);
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
    return sorted;
  };
  
  const voidTasks = sortWithCustomOrder(tasks.filter(t => !t.completed && !t.doDate), 'void');
  const todayTasks = sortWithCustomOrder(tasks.filter(t => !t.completed && t.doDate && t.doDate <= today), 'today');
  const tomorrowTasks = sortWithCustomOrder(tasks.filter(t => !t.completed && t.doDate === tomorrow), 'tomorrow');
  const weekTasks = sortWithCustomOrder(tasks.filter(t => !t.completed && t.doDate > tomorrow && t.doDate <= weekEnd), 'week');
  const laterTasks = sortWithCustomOrder(tasks.filter(t => !t.completed && t.doDate > weekEnd), 'later');
  const remaining = tasks.filter(t => !t.completed).length;

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: theme.bg,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      color: theme.text,
      transition: 'background-color 0.3s, color 0.3s',
    }}>
      <style>{`
        @keyframes fall {
          0% { opacity: 1; transform: translateY(0) rotate(0deg); }
          100% { opacity: 0; transform: translateY(100vh) rotate(720deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes glow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        @keyframes rainbow {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        @keyframes taskComplete {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.02); }
          100% { transform: scale(0.95); opacity: 0; }
        }
        @keyframes burst {
          0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(-100px) translateX(calc(var(--angle) * 1px)) rotate(360deg); opacity: 0; }
        }
        @keyframes floatLR {
          0% { transform: translateX(-50px) rotate(0deg); opacity: 0; }
          3% { opacity: 0.5; }
          97% { opacity: 0.5; }
          100% { transform: translateX(600px) rotate(360deg); opacity: 0; }
        }
        @keyframes floatRL {
          0% { transform: translateX(600px) rotate(0deg); opacity: 0; }
          3% { opacity: 0.5; }
          97% { opacity: 0.5; }
          100% { transform: translateX(-50px) rotate(-360deg); opacity: 0; }
        }
        @keyframes cardGlow {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.01); }
        }
        * { box-sizing: border-box; }
      `}</style>

      {/* Header */}
      <header style={{
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: theme.bg,
      }}>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
          {isEvening && <Moon size={16} />}
          ADH-Do
        </h1>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {weather ? (
            <span style={{ fontSize: 14, color: theme.textSecondary, display: 'flex', alignItems: 'center', gap: 6 }}>
              {weather.icon === 'sun' && <Sun size={16} />}
              {weather.icon === 'cloud' && <Cloud size={16} />}
              {weather.icon === 'rain' && <CloudRain size={16} />}
              {weather.icon === 'snow' && <CloudSnow size={16} />}
              {weather.icon === 'storm' && <Zap size={16} />}
              {weather.temp}°
            </span>
          ) : (
            <button onClick={fetchWeather} disabled={weatherLoading} style={{
              background: theme.bgSecondary,
              border: 'none',
              padding: '8px 14px',
              borderRadius: 20,
              fontSize: 13,
              color: theme.textSecondary,
              cursor: weatherLoading ? 'wait' : 'pointer',
              opacity: weatherLoading ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}><Sun size={14} /> {weatherLoading ? 'Loading...' : 'Add weather'}</button>
          )}
          <button onClick={() => setShowSettings(true)} style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
          }}><Settings size={20} color={theme.textMuted} /></button>
        </div>
      </header>

      {/* Main */}
      <main style={{ maxWidth: 550, margin: '0 auto', padding: '24px 20px 140px' }}>
        
        {/* NOW Tab */}
        {activeTab === 'now' && (
          <div style={{ textAlign: 'center' }}>
            {!settings.apiKey ? (
              <div style={{ padding: '60px 20px' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🔑</div>
                <p style={{ fontSize: 17, color: theme.textSecondary, marginBottom: 24 }}>
                  Add your Anthropic API key to get AI suggestions
                </p>
                <button onClick={() => setShowSettings(true)} style={{
                  padding: '14px 28px',
                  backgroundColor: theme.accent,
                  color: theme.accentText,
                  border: 'none',
                  borderRadius: 50,
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}>Open Settings</button>
              </div>
            ) : todayDoneMessage ? (
              <div style={{ 
                padding: '60px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 'calc(100vh - 280px)',
                textAlign: 'center',
              }}>
                {todayDoneMessage.gifUrl ? (
                  <img 
                    src={todayDoneMessage.gifUrl} 
                    alt="Celebration" 
                    style={{ 
                      width: 200, 
                      height: 150, 
                      objectFit: 'cover', 
                      borderRadius: 16, 
                      marginBottom: 24,
                    }} 
                  />
                ) : (
                  <Sparkles size={48} color={theme.textSecondary} style={{ marginBottom: 20 }} />
                )}
                <h2 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 12px', lineHeight: 1.3 }}>
                  {todayDoneMessage.headline}
                </h2>
                <p style={{ fontSize: 17, color: theme.textSecondary, margin: '0 0 32px' }}>
                  {todayDoneMessage.subtitle}
                </p>
                <button 
                  onClick={() => {
                    setTodayDoneMessage(null);
                    getSuggestion(true);
                  }}
                  style={{
                    padding: '14px 28px',
                    backgroundColor: theme.bgSecondary,
                    color: theme.text,
                    border: 'none',
                    borderRadius: 50,
                    fontSize: 16,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  I want to do more
                </button>
              </div>
            ) : loading ? (
              <div style={{ 
                padding: '60px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 'calc(100vh - 280px)',
              }}>
                <p style={{ 
                  color: theme.textMuted, 
                  fontStyle: 'italic',
                  fontSize: 17,
                  animation: 'glow 1.5s ease-in-out infinite',
                }}>
                  {loadingMantras[Math.floor(Math.random() * loadingMantras.length)]}
                </p>
              </div>
            ) : suggestion && suggestion.task ? (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 'calc(100vh - 280px)',
                textAlign: 'center',
                position: 'relative',
              }}>
                {showMiniConfetti && <MiniConfetti />}
                {isEvening && (
                  <div style={{
                    backgroundColor: theme.bgSecondary,
                    padding: '10px 20px',
                    borderRadius: 50,
                    fontSize: 14,
                    color: theme.textSecondary,
                    marginBottom: 32,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}><Moon size={16} /> Evening mode — home tasks only</div>
                )}
                
                <h2 style={{ fontSize: 34, fontWeight: 700, margin: '0 0 10px', lineHeight: 1.3 }}>
                  {suggestion.headline}
                </h2>
                <p style={{ fontSize: 18, color: theme.textSecondary, margin: '0 0 32px' }}>
                  {suggestion.subtitle}
                </p>

                {/* Main task card */}
                <div 
                  style={{
                    width: '100%',
                    padding: '20px 24px',
                    backgroundColor: theme.cardBg,
                    borderRadius: 16,
                    marginBottom: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    color: theme.text,
                    animation: completingTaskId === suggestion.task.id ? 'taskComplete 0.3s ease-out forwards' : 'none',
                  }}>
                  <button 
                    onClick={() => completeTask(suggestion.task.id)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      border: `2px solid ${theme.border}`,
                      background: 'none',
                      cursor: 'pointer',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Check size={16} color={theme.textMuted} style={{ opacity: 0.5 }} />
                  </button>
                  <button
                    onClick={() => setSelectedTask(suggestion.task)}
                    style={{
                      flex: 1,
                      background: 'none',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      padding: 0,
                      color: theme.text,
                    }}
                  >
                    <div style={{ fontSize: 20, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                      {suggestion.task.urgent && <Flame size={20} color="#F97316" fill="#F97316" />}
                      {suggestion.task.text}
                    </div>
                    {suggestion.task.subtasks && suggestion.task.subtasks.length > 0 && (
                      <div style={{ fontSize: 13, color: theme.textMuted, marginTop: 4 }}>
                        {suggestion.task.subtasks.filter(st => st.completed).length}/{suggestion.task.subtasks.length} items
                      </div>
                    )}
                  </button>
                </div>

                {/* Batch tasks */}
                {suggestion.batchTasks && suggestion.batchTasks.length > 0 && (
                  <div style={{
                    width: '100%',
                    padding: '8px 24px',
                    backgroundColor: 'transparent',
                    border: `2px dashed ${theme.border}`,
                    borderRadius: 16,
                  }}>
                    {suggestion.batchTasks.map((batchTask) => {
                      const bucketLabel = getTaskBucketLabel(batchTask);
                      return (
                        <div
                          key={batchTask.id}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 16,
                            padding: '12px 0',
                            color: theme.text,
                          }}
                        >
                          <button 
                            onClick={() => completeTask(batchTask.id)}
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 8,
                              border: `2px solid ${theme.border}`,
                              background: 'none',
                              cursor: 'pointer',
                              flexShrink: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginTop: bucketLabel ? 4 : 0,
                            }}
                          >
                            <Check size={16} color={theme.textMuted} style={{ opacity: 0.5 }} />
                          </button>
                          <button
                            onClick={() => setSelectedTask(batchTask)}
                            style={{
                              flex: 1,
                              background: 'none',
                              border: 'none',
                              textAlign: 'left',
                              cursor: 'pointer',
                              padding: 0,
                              color: theme.text,
                            }}
                          >
                            {bucketLabel && (
                              <div style={{ 
                                fontSize: 11, 
                                color: theme.textMuted, 
                                marginBottom: 6,
                                textTransform: 'uppercase',
                                letterSpacing: 1,
                                fontWeight: 600,
                              }}>
                                From {bucketLabel}
                              </div>
                            )}
                            <div style={{ fontSize: 20, fontWeight: 600 }}>
                              {batchTask.text}
                            </div>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                <button onClick={getSuggestion} style={{
                  marginTop: 28,
                  background: 'none',
                  border: 'none',
                  fontSize: 15,
                  color: theme.textMuted,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  alignSelf: 'center',
                }}><RefreshCw size={14} /> Surprise me</button>
              </div>
            ) : (
              <div style={{ 
                padding: '60px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 'calc(100vh - 280px)',
                textAlign: 'center',
              }}>
                {isEvening && (
                  <div style={{
                    backgroundColor: theme.bgSecondary,
                    padding: '10px 20px',
                    borderRadius: 50,
                    fontSize: 14,
                    color: theme.textSecondary,
                    marginBottom: 32,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}><Moon size={16} /> Evening mode — home tasks only</div>
                )}
                <Sparkles size={48} color={theme.textSecondary} style={{ marginBottom: 16 }} />
                <p style={{ fontSize: 16, color: theme.textMuted }}>
                  Add some tasks to get started
                </p>
              </div>
            )}
          </div>
        )}

        {/* LIST Tab */}
        {activeTab === 'list' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <p style={{ fontSize: 13, color: theme.textMuted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Today is</p>
              <h2 style={{ fontSize: 26, fontWeight: 600, margin: 0 }}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </h2>
            </div>
            
            {[
              { key: 'void', title: 'The Void', items: voidTasks, icon: Inbox },
              { key: 'today', title: 'Today', items: todayTasks, icon: Clock },
              { key: 'tomorrow', title: 'Tomorrow', items: tomorrowTasks, icon: Sunrise },
              { key: 'week', title: 'This Week', items: weekTasks, icon: Calendar },
              { key: 'later', title: 'Later', items: laterTasks, icon: Timer },
            ].map(section => {
              const SectionIcon = section.icon;
              return (
              <div 
                key={section.key}
                onDragOver={(e) => handleDragOver(e, section.key)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, section.key)}
                style={{
                  padding: section.key === 'void' ? '16px' : '8px',
                  marginBottom: section.key === 'void' ? '24px' : '8px',
                  borderRadius: section.key === 'void' ? 16 : 12,
                  backgroundColor: section.key === 'void' 
                    ? '#0D0C0E' 
                    : (dragOverSection === section.key ? theme.bgSecondary : 'transparent'),
                  border: dragOverSection === section.key && section.key !== 'void' 
                    ? `2px dashed ${theme.border}` 
                    : '2px dashed transparent',
                  transition: 'background-color 0.2s, border 0.2s',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {section.key === 'void' && (
                  <>
                    {/* Stars */}
                    {Array.from({ length: 30 }).map((_, i) => (
                      <div
                        key={i}
                        style={{
                          position: 'absolute',
                          width: Math.random() > 0.7 ? 2 : 1,
                          height: Math.random() > 0.7 ? 2 : 1,
                          backgroundColor: '#fff',
                          borderRadius: '50%',
                          top: `${Math.random() * 100}%`,
                          left: `${Math.random() * 100}%`,
                          opacity: 0.3 + Math.random() * 0.7,
                          animation: `twinkle ${2 + Math.random() * 3}s ease-in-out ${Math.random() * 2}s infinite`,
                          pointerEvents: 'none',
                        }}
                      />
                    ))}
                    {/* Floating objects */}
                    {[
                      { emoji: '🛸', top: '15%', duration: 25, delay: 0, anim: 'floatLR' },
                      { emoji: '🎸', top: '70%', duration: 30, delay: 12, anim: 'floatRL' },
                      { emoji: '🥾', top: '40%', duration: 28, delay: 25, anim: 'floatLR' },
                      { emoji: '🪐', top: '25%', duration: 35, delay: 40, anim: 'floatRL' },
                      { emoji: '👽', top: '55%', duration: 27, delay: 55, anim: 'floatLR' },
                      { emoji: '🧦', top: '80%', duration: 32, delay: 70, anim: 'floatRL' },
                      { emoji: '☄️', top: '35%', duration: 22, delay: 85, anim: 'floatLR' },
                      { emoji: '🍕', top: '60%', duration: 29, delay: 100, anim: 'floatRL' },
                      { emoji: '🚀', top: '20%', duration: 26, delay: 115, anim: 'floatLR' },
                      { emoji: '🌮', top: '75%', duration: 33, delay: 130, anim: 'floatRL' },
                      { emoji: '🎱', top: '45%', duration: 28, delay: 145, anim: 'floatLR' },
                      { emoji: '🦑', top: '30%', duration: 31, delay: 160, anim: 'floatRL' },
                    ].map((obj, i) => (
                      <div
                        key={i}
                        style={{
                          position: 'absolute',
                          top: obj.top,
                          left: 0,
                          fontSize: 16,
                          animation: `${obj.anim} ${obj.duration}s linear ${obj.delay}s infinite`,
                          pointerEvents: 'none',
                          zIndex: 0,
                          opacity: 0,
                        }}
                      >{obj.emoji}</div>
                    ))}
                  </>
                )}
                <div 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '14px 0',
                  }}
                >
                  <div
                    onClick={() => setSections(s => ({ ...s, [section.key]: !s[section.key] }))}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      cursor: 'pointer',
                      flex: 1,
                      position: 'relative',
                      zIndex: 1,
                    }}
                  >
                    <span style={{
                      color: section.key === 'void' ? 'rgba(255,255,255,0.5)' : theme.textMuted,
                      transform: sections[section.key] ? 'rotate(0)' : 'rotate(-90deg)',
                      transition: 'transform 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                    }}><ChevronDown size={16} /></span>
                    <SectionIcon size={18} color={section.key === 'void' ? 'rgba(255,255,255,0.5)' : theme.textMuted} />
                    <span style={{ 
                      fontSize: 14, 
                      fontWeight: 600, 
                      color: section.key === 'void' ? 'rgba(255,255,255,0.7)' : theme.textSecondary, 
                      textTransform: 'uppercase', 
                      letterSpacing: 0.5 
                    }}>
                      {section.title}
                    </span>
                    <span style={{ fontSize: 13, color: section.key === 'void' ? 'rgba(255,255,255,0.4)' : theme.textMuted }}>({section.items.length})</span>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setQuickAddSection(quickAddSection === section.key ? null : section.key);
                      setQuickAddText('');
                    }}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      border: 'none',
                      background: section.key === 'void' ? 'rgba(255,255,255,0.1)' : theme.bgSecondary,
                      color: section.key === 'void' ? 'rgba(255,255,255,0.6)' : theme.textMuted,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      zIndex: 1,
                    }}
                  ><Plus size={16} /></button>
                </div>
                
                {quickAddSection === section.key && (
                  <div style={{
                    display: 'flex',
                    gap: 8,
                    marginBottom: 12,
                  }}>
                    <input
                      type="text"
                      value={quickAddText}
                      onChange={(e) => setQuickAddText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleQuickAdd(section.key);
                        if (e.key === 'Escape') setQuickAddSection(null);
                      }}
                      placeholder="Add a task..."
                      autoFocus
                      style={{
                        flex: 1,
                        padding: '12px 16px',
                        border: 'none',
                        borderRadius: 10,
                        fontSize: 15,
                        backgroundColor: theme.cardBg,
                        color: theme.text,
                        outline: 'none',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      }}
                    />
                    <button
                      onClick={() => handleQuickAdd(section.key)}
                      disabled={!quickAddText.trim()}
                      style={{
                        padding: '12px 16px',
                        borderRadius: 10,
                        border: 'none',
                        backgroundColor: quickAddText.trim() ? theme.accent : theme.border,
                        color: theme.accentText,
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: quickAddText.trim() ? 'pointer' : 'default',
                      }}
                    >Add</button>
                  </div>
                )}
                
                {sections[section.key] && (
                  section.items.length === 0 ? (
                    <p style={{ 
                      color: section.key === 'void' ? 'rgba(255,255,255,0.4)' : theme.textMuted, 
                      fontStyle: 'italic', 
                      fontSize: 14, 
                      padding: section.key === 'void' ? '12px 8px' : '4px 0 16px 28px',
                      textAlign: section.key === 'void' ? 'center' : 'left',
                      position: 'relative',
                      zIndex: 1,
                    }}>
                      {section.key === 'void' ? 'Drop tasks here to sort later' : 'Nothing scheduled'}
                    </p>
                  ) : (
                    section.items.map((task, index) => (
                      <div key={task.id} style={{ position: 'relative', zIndex: 1 }}>
                        {/* Drop zone above task */}
                        <div
                          onDragOver={(e) => { e.preventDefault(); handleDragOver(e, section.key, index); }}
                          onDragEnter={(e) => { e.preventDefault(); setDragOverSection(section.key); setDragOverIndex(index); }}
                          onDrop={(e) => handleDrop(e, section.key, index)}
                          style={{
                            height: draggedTask && dragOverSection === section.key && dragOverIndex === index ? 12 : 4,
                            backgroundColor: draggedTask && dragOverSection === section.key && dragOverIndex === index ? theme.accent : 'transparent',
                            borderRadius: 4,
                            marginBottom: 4,
                            transition: 'all 0.15s ease',
                          }}
                        />
                        <div 
                          draggable
                          onDragStart={(e) => handleDragStart(e, task, section.key)}
                          onDragEnd={handleDragEnd}
                          onClick={() => setSelectedTask(task)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '18px 20px',
                            backgroundColor: theme.cardBg,
                            borderRadius: 12,
                            marginBottom: 6,
                            gap: 14,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                            cursor: 'grab',
                            opacity: draggedTask?.id === task.id ? 0.4 : 1,
                            transform: draggedTask?.id === task.id ? 'scale(0.98)' : 'scale(1)',
                            transition: 'opacity 0.15s, transform 0.15s',
                            animation: completingTaskId === task.id ? 'taskComplete 0.3s ease-out forwards' : 'none',
                          }}
                        >
                          <button onClick={(e) => { e.stopPropagation(); completeTask(task.id); }} style={{
                            width: 24,
                            height: 24,
                            borderRadius: 6,
                            border: `2px solid ${theme.border}`,
                            background: 'none',
                            cursor: 'pointer',
                            flexShrink: 0,
                          }} />
                          {task.urgent && <Flame size={16} color="#F97316" fill="#F97316" />}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ fontSize: 16 }}>{task.text}</span>
                            {task.dueDate && (
                              <span style={{
                                fontSize: 12,
                                color: new Date(task.dueDate) < new Date() ? '#ef4444' : theme.textMuted,
                                marginLeft: 10,
                              }}>
                                Due {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            )}
                            {task.subtasks && task.subtasks.length > 0 && (
                              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {task.subtasks.map((st, stIndex) => (
                                  <div 
                                    key={stIndex}
                                    onClick={(e) => { e.stopPropagation(); toggleSubtask(task.id, stIndex); }}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 8,
                                      cursor: 'pointer',
                                    }}
                                  >
                                    <div style={{
                                      width: 16,
                                      height: 16,
                                      borderRadius: 4,
                                      border: `1.5px solid ${theme.border}`,
                                      backgroundColor: st.completed ? theme.accent : 'transparent',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      flexShrink: 0,
                                    }}>
                                      {st.completed && <Check size={10} color={theme.accentText} />}
                                    </div>
                                    <span style={{
                                      fontSize: 14,
                                      color: st.completed ? theme.textMuted : theme.textSecondary,
                                      textDecoration: st.completed ? 'line-through' : 'none',
                                    }}>{st.text}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          {section.key === 'void' && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); setWhenPickerTask(task); }}
                              style={{
                                padding: '6px 12px',
                                backgroundColor: theme.bg,
                                border: `1px solid ${theme.border}`,
                                borderRadius: 6,
                                fontSize: 13,
                                color: theme.textMuted,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              <Plus size={12} /> When
                            </button>
                          )}
                          <button onClick={(e) => { e.stopPropagation(); toggleUrgent(task.id); }} style={{
                            background: 'none',
                            border: 'none',
                            opacity: task.urgent ? 1 : 0.3,
                            cursor: 'pointer',
                            padding: 4,
                            display: section.key === 'void' ? 'none' : 'flex',
                            alignItems: 'center',
                          }}><Flame size={16} color={task.urgent ? '#F97316' : theme.textMuted} fill={task.urgent ? '#F97316' : 'none'} /></button>
                          <button onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }} style={{
                            background: 'none',
                            border: 'none',
                            color: theme.textMuted,
                            cursor: 'pointer',
                            padding: 4,
                            display: section.key === 'void' ? 'none' : 'flex',
                            alignItems: 'center',
                          }}><X size={18} /></button>
                        </div>
                        {/* Drop zone below last task */}
                        {index === section.items.length - 1 && (
                          <div
                            onDragOver={(e) => { e.preventDefault(); handleDragOver(e, section.key, index + 1); }}
                            onDragEnter={(e) => { e.preventDefault(); setDragOverSection(section.key); setDragOverIndex(index + 1); }}
                            onDrop={(e) => handleDrop(e, section.key, index + 1)}
                            style={{
                              height: draggedTask && dragOverSection === section.key && dragOverIndex === index + 1 ? 12 : 4,
                              backgroundColor: draggedTask && dragOverSection === section.key && dragOverIndex === index + 1 ? theme.accent : 'transparent',
                              borderRadius: 4,
                              transition: 'all 0.15s ease',
                            }}
                          />
                        )}
                      </div>
                    ))
                  )
                )}
              </div>
            )})}

            {/* Completed Tasks Section */}
            {(() => {
              const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
              const recentlyCompleted = tasks.filter(t => 
                t.completed && 
                t.completedAt && 
                t.completedAt >= oneWeekAgo
              ).sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
              
              if (recentlyCompleted.length === 0) return null;
              
              return (
                <div style={{ marginTop: 24 }}>
                  <div 
                    onClick={() => setShowCompleted(!showCompleted)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '14px 0',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{
                      color: theme.textMuted,
                      transform: showCompleted ? 'rotate(0)' : 'rotate(-90deg)',
                      transition: 'transform 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                    }}><ChevronDown size={16} /></span>
                    <Check size={18} color={theme.textMuted} />
                    <span style={{ 
                      fontSize: 14, 
                      fontWeight: 600, 
                      color: theme.textSecondary, 
                      textTransform: 'uppercase', 
                      letterSpacing: 0.5 
                    }}>
                      Completed
                    </span>
                    <span style={{ fontSize: 13, color: theme.textMuted }}>({recentlyCompleted.length})</span>
                  </div>
                  
                  {showCompleted && (
                    <div style={{ paddingLeft: 0 }}>
                      {recentlyCompleted.map((task) => (
                        <div 
                          key={task.id}
                          onClick={() => uncompleteTask(task.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '14px 20px',
                            backgroundColor: theme.cardBg,
                            borderRadius: 12,
                            marginBottom: 6,
                            gap: 14,
                            opacity: 0.6,
                            cursor: 'pointer',
                          }}
                        >
                          <button 
                            onClick={(e) => { e.stopPropagation(); uncompleteTask(task.id); }}
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: 6,
                              backgroundColor: theme.textMuted,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              border: 'none',
                              cursor: 'pointer',
                            }}
                          >
                            <Check size={14} color="#fff" />
                          </button>
                          <span style={{ 
                            flex: 1, 
                            fontSize: 16, 
                            color: theme.textSecondary,
                            textDecoration: 'line-through',
                          }}>
                            {task.text}
                          </span>
                          <span style={{ fontSize: 12, color: theme.textMuted }}>
                            {new Date(task.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </main>

      {/* Bottom Nav */}
      <nav style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: theme.cardBg,
        borderRadius: 50,
        padding: 8,
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        border: `1px solid ${theme.border}`,
        zIndex: 50,
      }}>
        <button onClick={() => setActiveTab('now')} style={{
          padding: '14px 18px',
          borderRadius: 50,
          border: 'none',
          backgroundColor: activeTab === 'now' ? theme.bgSecondary : 'transparent',
          color: activeTab === 'now' ? theme.text : theme.textMuted,
          fontSize: 15,
          fontWeight: 500,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}><Sparkles size={20} /></button>
        
        <button onClick={() => setShowChat(true)} style={{
          width: 54,
          height: 54,
          borderRadius: '50%',
          border: 'none',
          backgroundColor: theme.accent,
          color: theme.accentText,
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}><Plus size={24} /></button>
        
        <button onClick={() => setActiveTab('list')} style={{
          padding: '14px 18px',
          borderRadius: 50,
          border: 'none',
          backgroundColor: activeTab === 'list' ? theme.bgSecondary : 'transparent',
          color: activeTab === 'list' ? theme.text : theme.textMuted,
          fontSize: 15,
          fontWeight: 500,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}><List size={20} /></button>
      </nav>

      {/* Chat Modal */}
      {showChat && (
        <ChatModal
          theme={theme}
          onClose={() => setShowChat(false)}
          onParseTasks={parseTasks}
          onAddTask={addTask}
          onMergeTask={(taskId, subtaskText) => {
            setTasks(tasks.map(t => {
              if (t.id === taskId) {
                const newSubtasks = [...(t.subtasks || []), { text: subtaskText, completed: false }];
                return { ...t, subtasks: newSubtasks };
              }
              return t;
            }));
          }}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          theme={theme}
          settings={settings}
          onSave={(s) => { setSettings(s); setShowSettings(false); }}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* When Picker Modal */}
      {whenPickerTask && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.3)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setWhenPickerTask(null)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: theme.cardBg,
              borderRadius: 20,
              padding: '28px',
              width: '100%',
              maxWidth: 340,
              boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
            }}
          >
            <h3 style={{ 
              fontSize: 22, 
              fontWeight: 600, 
              margin: '0 0 8px',
              color: theme.text,
            }}>
              When do you want to focus on this?
            </h3>
            <p style={{ 
              fontSize: 14, 
              color: theme.textMuted, 
              margin: '0 0 24px',
            }}>
              Pick a time and it'll move out of the void
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { key: 'today', label: 'Today' },
                { key: 'tomorrow', label: 'Tomorrow' },
                { key: 'weekend', label: 'This weekend' },
                { key: 'later', label: 'Later' },
              ].map(option => (
                <button
                  key={option.key}
                  onClick={() => scheduleTask(whenPickerTask.id, option.key)}
                  style={{
                    padding: '16px 20px',
                    backgroundColor: theme.bg,
                    border: `1px solid ${theme.border}`,
                    borderRadius: 12,
                    fontSize: 16,
                    fontWeight: 500,
                    color: theme.text,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setWhenPickerTask(null)}
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: 'transparent',
                border: 'none',
                fontSize: 15,
                color: theme.textMuted,
                cursor: 'pointer',
                marginTop: 16,
              }}
            >
              Keep in the void
            </button>
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.3)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
          onClick={() => setSelectedTask(null)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: theme.cardBg,
              borderRadius: '24px 24px 0 0',
              padding: '12px 28px 48px',
              width: '100%',
              maxWidth: 480,
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
          >
            {/* Drag handle */}
            <div style={{ 
              display: 'flex',
              justifyContent: 'center',
              marginBottom: 20,
            }}>
              <div style={{ 
                width: 36, 
                height: 4, 
                backgroundColor: theme.border, 
                borderRadius: 2, 
              }} />
            </div>
            
            {/* Urgent button */}
            <div style={{ 
              display: 'flex',
              justifyContent: 'flex-end',
              marginBottom: 12,
            }}>
              <button
                onClick={() => toggleUrgent(selectedTask.id)}
                style={{
                  padding: '8px 12px',
                  backgroundColor: selectedTask.urgent ? '#fff7ed' : theme.bg,
                  color: selectedTask.urgent ? '#F97316' : theme.textMuted,
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              ><Flame size={18} color={selectedTask.urgent ? '#F97316' : theme.textMuted} fill={selectedTask.urgent ? '#F97316' : 'none'} /></button>
            </div>

            {/* Task Text */}
            <input
              type="text"
              value={selectedTask.text}
              onChange={(e) => updateTask(selectedTask.id, { text: e.target.value })}
              style={{
                width: '100%',
                padding: 0,
                border: 'none',
                fontSize: 24,
                fontWeight: 600,
                backgroundColor: 'transparent',
                color: theme.text,
                outline: 'none',
                marginBottom: 32,
              }}
            />

            {/* Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              
              {/* Deadline */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <Clock size={18} color={theme.textMuted} style={{ opacity: 0.5 }} />
                <input
                  type="date"
                  value={selectedTask.dueDate || ''}
                  onChange={(e) => updateTask(selectedTask.id, { dueDate: e.target.value })}
                  placeholder="Deadline"
                  style={{
                    flex: 1,
                    padding: '12px 0',
                    border: 'none',
                    borderBottom: `1px solid ${theme.border}`,
                    fontSize: 16,
                    backgroundColor: 'transparent',
                    color: selectedTask.dueDate ? theme.text : theme.textMuted,
                    outline: 'none',
                  }}
                />
              </div>

              {/* Phone */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <Phone size={18} color={theme.textMuted} style={{ opacity: 0.5 }} />
                <input
                  type="tel"
                  value={selectedTask.phone || ''}
                  onChange={(e) => updateTask(selectedTask.id, { phone: e.target.value })}
                  placeholder="Phone number"
                  style={{
                    flex: 1,
                    padding: '12px 0',
                    border: 'none',
                    borderBottom: `1px solid ${theme.border}`,
                    fontSize: 16,
                    backgroundColor: 'transparent',
                    color: theme.text,
                    outline: 'none',
                  }}
                />
                {selectedTask.phone && (
                  <>
                    <button 
                      onClick={() => navigator.clipboard.writeText(selectedTask.phone)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                    >
                      <Copy size={16} color={theme.textMuted} />
                    </button>
                    <a href={`tel:${selectedTask.phone}`} style={{ color: theme.textMuted, textDecoration: 'none', fontSize: 14 }}>Call →</a>
                  </>
                )}
              </div>

              {/* URL */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <Link size={18} color={theme.textMuted} style={{ opacity: 0.5 }} />
                <input
                  type="url"
                  value={selectedTask.url || ''}
                  onChange={(e) => updateTask(selectedTask.id, { url: e.target.value })}
                  placeholder="Link"
                  style={{
                    flex: 1,
                    padding: '12px 0',
                    border: 'none',
                    borderBottom: `1px solid ${theme.border}`,
                    fontSize: 16,
                    backgroundColor: 'transparent',
                    color: theme.text,
                    outline: 'none',
                  }}
                />
                {selectedTask.url && (
                  <>
                    <button 
                      onClick={() => navigator.clipboard.writeText(selectedTask.url)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                    >
                      <Copy size={16} color={theme.textMuted} />
                    </button>
                    <a href={selectedTask.url.startsWith('http') ? selectedTask.url : `https://${selectedTask.url}`} target="_blank" rel="noreferrer" style={{ color: theme.textMuted, textDecoration: 'none', fontSize: 14 }}>Open →</a>
                  </>
                )}
              </div>

              {/* Address */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <MapPin size={18} color={theme.textMuted} style={{ opacity: 0.5 }} />
                <input
                  type="text"
                  value={selectedTask.address || ''}
                  onChange={(e) => updateTask(selectedTask.id, { address: e.target.value })}
                  placeholder="Address"
                  style={{
                    flex: 1,
                    padding: '12px 0',
                    border: 'none',
                    borderBottom: `1px solid ${theme.border}`,
                    fontSize: 16,
                    backgroundColor: 'transparent',
                    color: theme.text,
                    outline: 'none',
                  }}
                />
                {selectedTask.address && (
                  <>
                    <button 
                      onClick={() => navigator.clipboard.writeText(selectedTask.address)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                    >
                      <Copy size={16} color={theme.textMuted} />
                    </button>
                    <a href={`https://maps.google.com/?q=${encodeURIComponent(selectedTask.address)}`} target="_blank" rel="noreferrer" style={{ color: theme.textMuted, textDecoration: 'none', fontSize: 14 }}>Map →</a>
                  </>
                )}
              </div>

              {/* Notes */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <FileText size={18} color={theme.textMuted} style={{ opacity: 0.5, marginTop: 12 }} />
                <textarea
                  value={selectedTask.notes || ''}
                  onChange={(e) => updateTask(selectedTask.id, { notes: e.target.value })}
                  placeholder="Notes"
                  rows={2}
                  style={{
                    flex: 1,
                    padding: '12px 0',
                    border: 'none',
                    borderBottom: `1px solid ${theme.border}`,
                    fontSize: 16,
                    backgroundColor: 'transparent',
                    color: theme.text,
                    outline: 'none',
                    resize: 'none',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              {/* Subtasks */}
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 13, color: theme.textMuted, marginBottom: 12, fontWeight: 500 }}>Items</div>
                
                {/* Existing subtasks */}
                {(selectedTask.subtasks || []).map((st, stIndex) => (
                  <div 
                    key={stIndex}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '8px 0',
                    }}
                  >
                    <button
                      onClick={() => toggleSubtask(selectedTask.id, stIndex)}
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 4,
                        border: `2px solid ${st.completed ? theme.accent : theme.border}`,
                        backgroundColor: st.completed ? theme.accent : 'transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {st.completed && <Check size={12} color={theme.accentText} />}
                    </button>
                    <span style={{
                      flex: 1,
                      fontSize: 15,
                      color: st.completed ? theme.textMuted : theme.text,
                      textDecoration: st.completed ? 'line-through' : 'none',
                    }}>{st.text}</span>
                    <button
                      onClick={() => {
                        const newSubtasks = selectedTask.subtasks.filter((_, i) => i !== stIndex);
                        updateTask(selectedTask.id, { subtasks: newSubtasks });
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: theme.textMuted,
                        cursor: 'pointer',
                        padding: 4,
                        opacity: 0.5,
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                
                {/* Add new subtask */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                  <Plus size={20} color={theme.textMuted} style={{ opacity: 0.5 }} />
                  <input
                    type="text"
                    placeholder="Add item..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.target.value.trim()) {
                        const newSubtasks = [...(selectedTask.subtasks || []), { text: e.target.value.trim(), completed: false }];
                        updateTask(selectedTask.id, { subtasks: newSubtasks });
                        e.target.value = '';
                      }
                    }}
                    style={{
                      flex: 1,
                      padding: '8px 0',
                      border: 'none',
                      fontSize: 15,
                      backgroundColor: 'transparent',
                      color: theme.text,
                      outline: 'none',
                    }}
                  />
                </div>
              </div>
            </div>

            
          </div>
        </div>
      )}
    </div>
  );
}

// Chat Modal Component
function ChatModal({ theme, onClose, onParseTasks, onAddTask, onMergeTask }) {
  const [messages, setMessages] = useState([
    { from: 'ai', text: "Throw it all in here. I'll catch it. ✨" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [totalTasksAdded, setTotalTasksAdded] = useState(0);
  const [pendingMerge, setPendingMerge] = useState(null);
  const [stars] = useState(() => Array.from({ length: 50 }, () => ({
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    size: Math.random() > 0.7 ? 2 : 1,
    opacity: 0.3 + Math.random() * 0.7,
    duration: 2 + Math.random() * 3,
    delay: Math.random() * 2,
  })));
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [messages]);

  const handleMergeResponse = (shouldMerge) => {
    if (!pendingMerge) return;
    
    if (shouldMerge) {
      onMergeTask(pendingMerge.mergeWithId, pendingMerge.mergeSubtask);
      setMessages(m => [...m, 
        { from: 'user', text: 'Yes, combine them' },
        { from: 'system', text: '✓ Added to existing task' },
        { from: 'ai', text: 'Nice, keeping it tidy! 🧹' }
      ]);
    } else {
      pendingMerge.tasks.forEach(t => onAddTask(t));
      setTotalTasksAdded(prev => prev + pendingMerge.tasks.length);
      setMessages(m => [...m,
        { from: 'user', text: 'Keep them separate' },
        { from: 'system', text: `✓ ${pendingMerge.tasks.length} task${pendingMerge.tasks.length > 1 ? 's' : ''} into the void` },
        { from: 'ai', text: 'Got it, separate it is!' }
      ]);
    }
    setPendingMerge(null);
  };

  const submit = async () => {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput('');
    setMessages(m => [...m, { from: 'user', text }]);
    setLoading(true);

    const result = await onParseTasks(text, totalTasksAdded);
    
    if (result.mergePrompt && result.mergeWithId) {
      setPendingMerge({
        tasks: result.tasks,
        mergeWithId: result.mergeWithId,
        mergeSubtask: result.mergeSubtask || result.tasks[0]?.text,
        mergeType: result.mergeType
      });
      setMessages(m => [...m, { from: 'ai', text: result.mergePrompt, isMergePrompt: true }]);
    } else if (result.tasks && result.tasks.length > 0) {
      result.tasks.forEach(t => onAddTask(t));
      setTotalTasksAdded(prev => prev + result.tasks.length);
      setMessages(m => [...m,
        { from: 'system', text: `✓ ${result.tasks.length} task${result.tasks.length > 1 ? 's' : ''} into the void` },
        { from: 'ai', text: result.response }
      ]);
    } else {
      setMessages(m => [...m, { from: 'ai', text: result.response }]);
    }
    setLoading(false);
  };

  return (
    <div 
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div 
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: '#0D0C0E',
          borderRadius: 24,
          width: 480,
          maxWidth: '95%',
          height: '70vh',
          maxHeight: 600,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
          boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
        }}
      >
        {/* Stars background */}
        {stars.map((star, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: star.size,
              height: star.size,
              backgroundColor: '#fff',
              borderRadius: '50%',
              top: star.top,
              left: star.left,
              opacity: star.opacity,
              animation: `twinkle ${star.duration}s ease-in-out ${star.delay}s infinite`,
              pointerEvents: 'none',
            }}
          />
        ))}

        {/* Header */}
        <div style={{
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'relative',
          zIndex: 1,
        }}>
          <div style={{ width: 44 }} />
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: '#ffffff', letterSpacing: 0.5 }}>
            Add tasks
          </h3>
          <button onClick={onClose} style={{
            background: 'none',
            border: 'none',
            fontSize: 28,
            color: 'rgba(255,255,255,0.5)',
            cursor: 'pointer',
            width: 44,
            height: 44,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>×</button>
        </div>

        {/* Messages area */}
        <div ref={ref} style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          position: 'relative',
          zIndex: 1,
        }}>
          {messages.map((m, i) => (
            <React.Fragment key={i}>
              <div style={{
                alignSelf: m.from === 'user' ? 'flex-end' : 'flex-start',
                backgroundColor: m.from === 'user' 
                  ? 'rgba(255,255,255,0.15)' 
                  : m.from === 'system' 
                    ? 'transparent' 
                    : 'rgba(255,255,255,0.08)',
                color: m.from === 'system' ? 'rgba(255,255,255,0.5)' : '#ffffff',
                padding: m.from === 'system' ? '6px 0' : '12px 16px',
                borderRadius: 18,
                maxWidth: '85%',
                fontSize: m.from === 'system' ? 14 : 15,
                fontWeight: m.from === 'system' ? 500 : 400,
              }}>{m.text}</div>
              {m.isMergePrompt && pendingMerge && (
                <div style={{ 
                  display: 'flex', 
                  gap: 8, 
                  alignSelf: 'flex-start',
                  marginTop: 4,
                }}>
                  <button
                    onClick={() => handleMergeResponse(true)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 20,
                      border: '1px solid rgba(255,255,255,0.3)',
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      color: '#ffffff',
                      fontSize: 14,
                      cursor: 'pointer',
                    }}
                  >
                    Yes, combine
                  </button>
                  <button
                    onClick={() => handleMergeResponse(false)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 20,
                      border: '1px solid rgba(255,255,255,0.2)',
                      backgroundColor: 'transparent',
                      color: 'rgba(255,255,255,0.7)',
                      fontSize: 14,
                      cursor: 'pointer',
                    }}
                  >
                    Keep separate
                  </button>
                </div>
              )}
            </React.Fragment>
          ))}
          {loading && (
            <div style={{
              alignSelf: 'flex-start',
              padding: '12px 16px',
              display: 'flex',
              gap: 4,
            }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255,255,255,0.5)',
                  animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
                }} />
              ))}
            </div>
          )}
        </div>

        {/* Input area */}
        <div style={{
          padding: '16px 20px 20px',
          display: 'flex',
          gap: 10,
          position: 'relative',
          zIndex: 1,
        }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !pendingMerge && submit()}
            placeholder={pendingMerge ? "Answer above first..." : "I need to..."}
            disabled={!!pendingMerge}
            autoFocus
            style={{
              flex: 1,
              padding: '14px 18px',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 50,
              fontSize: 16,
              backgroundColor: 'rgba(255,255,255,0.1)',
              color: '#ffffff',
              outline: 'none',
            }}
          />
          <button onClick={submit} disabled={!input.trim() || pendingMerge} style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            border: 'none',
            backgroundColor: input.trim() ? '#ffffff' : 'rgba(255,255,255,0.2)',
            color: '#111111',
            fontSize: 20,
            cursor: input.trim() ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>↑</button>
        </div>
      </div>
    </div>
  );
}

// Settings Modal
function SettingsModal({ theme, settings, onSave, onClose }) {
  const [key, setKey] = useState(settings.apiKey || '');
  const [hour, setHour] = useState(settings.eveningHour || 19);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backdropFilter: 'blur(8px)',
    }}>
      <div style={{
        backgroundColor: theme.cardBg,
        borderRadius: 20,
        padding: 32,
        width: 400,
        maxWidth: '95%',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 28,
        }}>
          <h3 style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>Settings</h3>
          <button onClick={onClose} style={{
            background: 'none',
            border: 'none',
            fontSize: 24,
            color: theme.textMuted,
            cursor: 'pointer',
          }}>×</button>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: theme.textSecondary, marginBottom: 8 }}>
            Anthropic API Key
          </label>
          <input
            type="password"
            value={key}
            onChange={e => setKey(e.target.value)}
            placeholder="sk-ant-..."
            style={{
              width: '100%',
              padding: '12px 14px',
              border: `1px solid ${theme.border}`,
              borderRadius: 8,
              fontSize: 15,
              backgroundColor: theme.bg,
              color: theme.text,
              outline: 'none',
            }}
          />
          <p style={{ fontSize: 13, color: theme.textMuted, marginTop: 6 }}>
            Get yours at console.anthropic.com
          </p>
        </div>

        <div style={{ marginBottom: 28 }}>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: theme.textSecondary, marginBottom: 8 }}>
            Evening Mode Starts
          </label>
          <select
            value={hour}
            onChange={e => setHour(Number(e.target.value))}
            style={{
              width: '100%',
              padding: '12px 14px',
              border: `1px solid ${theme.border}`,
              borderRadius: 8,
              fontSize: 15,
              backgroundColor: theme.bg,
              color: theme.text,
            }}
          >
            {Array.from({ length: 12 }, (_, i) => i + 12).map(h => (
              <option key={h} value={h}>{h > 12 ? h - 12 : 12}:00 {h >= 12 ? 'PM' : 'AM'}</option>
            ))}
          </select>
        </div>

        <button onClick={() => onSave({ apiKey: key, eveningHour: hour })} style={{
          width: '100%',
          padding: 14,
          backgroundColor: theme.accent,
          color: theme.accentText,
          border: 'none',
          borderRadius: 10,
          fontSize: 16,
          fontWeight: 600,
          cursor: 'pointer',
        }}>Save Settings</button>
      </div>
    </div>
  );
}

