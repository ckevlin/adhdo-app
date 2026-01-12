'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Clock, Phone, Link, MapPin, FileText, Flame, Sun, Moon, CloudRain, CloudSnow, Cloud, Zap, Plus, Check, X, ChevronDown, Inbox, Calendar, Timer, Sunrise } from 'lucide-react';

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
  
  if (data.error) {
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
    throw new Error(data.error);
  }
  
  return data.content;
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

// Main App
export default function ADHDo() {
  const [tasks, setTasks] = useState([]);
  const [settings, setSettings] = useState({ apiKey: '', eveningHour: 19 });
  const [activeTab, setActiveTab] = useState('now');
  const [showChat, setShowChat] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCelebration, setShowCelebration] = useState(null);
  const [suggestion, setSuggestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [microSteps, setMicroSteps] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [sections, setSections] = useState({ void: true, today: true, tomorrow: true, week: true, later: true });
  const [customOrder, setCustomOrder] = useState({});
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverSection, setDragOverSection] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [quickAddSection, setQuickAddSection] = useState(null);
  const [quickAddText, setQuickAddText] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [whenPickerTask, setWhenPickerTask] = useState(null);

  const hour = new Date().getHours();
  const isEvening = hour >= settings.eveningHour;
  const theme = isEvening ? themes.dark : themes.light;

  // Load saved data
  useEffect(() => {
    try {
      const savedTasks = localStorage.getItem('adhdo-tasks');
      const savedSettings = localStorage.getItem('adhdo-settings');
      const savedOrder = localStorage.getItem('adhdo-order');
      if (savedTasks) setTasks(JSON.parse(savedTasks));
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

  // AI: Get task suggestion
  const getSuggestion = async () => {
    const incomplete = tasks.filter(t => !t.completed);
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
      const systemPrompt = `You are an ADHD-friendly task assistant. Pick ONE task from the provided priority pool. These are already filtered by priority - just pick the best one to do right now. Be supportive, never judgmental.

Rules:
- If evening (after 7pm), prefer home/computer tasks if available
- Look for batching opportunities within the pool
- Quick wins build momentum`;

      const userPrompt = `Time: ${now.toLocaleTimeString()}
Day: ${now.toLocaleDateString('en-US', { weekday: 'long' })}
Evening mode: ${isEvening}
Weather: ${weather ? `${weather.temp}°F ${weather.icon}` : 'unknown'}
Pool: ${poolName}

Tasks to choose from:
${priorityPool.map(t => `- ID: ${t.id} | "${t.text}" | urgent: ${t.urgent || false}`).join('\n')}

Return ONLY JSON:
{"taskId":"...","headline":"motivating 5-10 words","subtitle":"supportive message","bonusTaskId":null or "..." (only from same pool),"bonusReason":"why batch"}`;

      const response = await callClaude(settings.apiKey, 'claude-sonnet-4-20250514', systemPrompt, userPrompt);
      const match = response.match(/\{[\s\S]*\}/);
      if (match) {
        const data = JSON.parse(match[0]);
        setSuggestion({
          task: tasks.find(t => t.id === data.taskId) || priorityPool[0],
          headline: data.headline,
          subtitle: data.subtitle,
          bonus: data.bonusTaskId ? tasks.find(t => t.id === data.bonusTaskId) : null,
          bonusReason: data.bonusReason,
        });
      }
    } catch (e) {
      console.error(e);
      // Fallback - just pick first from priority pool
      setSuggestion({
        task: priorityPool[0],
        headline: priorityPool[0].urgent ? "🔥 This one's urgent!" : "Let's knock this out",
        subtitle: "You've got this!",
      });
    }
    setLoading(false);
  };

  // AI: Parse tasks from natural language
  const parseTasks = async (text) => {
    if (!settings.apiKey) return { tasks: [], response: "Add your API key in settings first!" };

    const systemPrompt = `Parse tasks from natural language. Be a supportive friend with ADHD - funny, warm, real.

Categories: phone, errand, cleaning, medical, financial, work, shopping, home
Locations: home, out, either`;

    const userPrompt = `Today: ${new Date().toISOString().split('T')[0]}
User said: "${text}"

Return ONLY JSON:
{"tasks":[{"text":"...","doDate":"YYYY-MM-DD or null","category":"...","location":"..."}],"response":"friendly ADHD-supportive acknowledgment"}`;

    try {
      const response = await callClaude(settings.apiKey, 'claude-haiku-4-5-20251001', systemPrompt, userPrompt);
      const match = response.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
    } catch (e) {
      console.error(e);
    }
    return { tasks: [], response: "Hmm, something went wrong. Try again?" };
  };

  // AI: Generate micro steps
  const getMicroSteps = async (task) => {
    if (!settings.apiKey) return null;
    setLoading(true);

    const systemPrompt = `Break tasks into TINY 2-5 minute steps for ADHD brains. First step should be SO small it's impossible not to do.`;
    const userPrompt = `Task: "${task.text}"
Return ONLY a JSON array of 4-6 steps: ["step1", "step2", ...]`;

    try {
      const response = await callClaude(settings.apiKey, 'claude-sonnet-4-20250514', systemPrompt, userPrompt);
      const match = response.match(/\[[\s\S]*\]/);
      if (match) {
        setMicroSteps({ task, steps: JSON.parse(match[0]) });
        setCurrentStep(0);
      }
    } catch (e) {
      setMicroSteps({
        task,
        steps: ["Take a deep breath", "Gather what you need", "Do the smallest part first", "Keep going!", "You did it! 🎉"]
      });
      setCurrentStep(0);
    }
    setLoading(false);
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
    };
    setTasks(prev => [...prev, newTask]);
  };

  const completeTask = (id) => {
    const task = tasks.find(t => t.id === id);
    if (task && !task.completed) {
      setShowCelebration(task);
    }
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: true, completedAt: new Date().toISOString() } : t));
  };

  const deleteTask = (id) => setTasks(tasks.filter(t => t.id !== id));
  const toggleUrgent = (id) => setTasks(tasks.map(t => t.id === id ? { ...t, urgent: !t.urgent } : t));
  const skipTask = () => getSuggestion();
  
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
      fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      color: theme.text,
      transition: 'background-color 0.3s, color 0.3s',
    }}>

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
            fontSize: 20,
            cursor: 'pointer',
          }}>⚙️</button>
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
            ) : remaining === 0 ? (
              <div style={{ padding: '60px 20px' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>✨</div>
                <p style={{ fontSize: 18, color: theme.textSecondary }}>All clear! Add some tasks.</p>
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
              }}>
                {isEvening && (
                  <div style={{
                    backgroundColor: theme.bgSecondary,
                    padding: '10px 20px',
                    borderRadius: 50,
                    fontSize: 14,
                    color: theme.textSecondary,
                    marginBottom: 32,
                  }}>🌙 Evening mode — home tasks only</div>
                )}
                
                <h2 style={{ fontSize: 30, fontWeight: 700, margin: '0 0 8px', lineHeight: 1.3 }}>
                  {suggestion.headline}
                </h2>
                <p style={{ fontSize: 16, color: theme.textSecondary, margin: '0 0 32px' }}>
                  {suggestion.subtitle}
                </p>

                {/* Main task card */}
                <button 
                  onClick={() => getMicroSteps(suggestion.task)}
                  style={{
                    width: '100%',
                    padding: '20px 24px',
                    backgroundColor: theme.cardBg,
                    border: 'none',
                    borderRadius: 16,
                    marginBottom: 12,
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  }}>
                  <div style={{ fontSize: 20, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {suggestion.task.urgent && <span>🔥</span>}
                    {suggestion.task.text}
                  </div>
                  <span style={{ fontSize: 20, color: theme.textMuted }}>›</span>
                </button>

                {/* Bonus task */}
                {suggestion.bonus && (
                  <button
                    onClick={() => getMicroSteps(suggestion.bonus)}
                    style={{
                      width: '100%',
                      padding: '16px 20px',
                      backgroundColor: theme.cardBg,
                      border: `2px dashed ${theme.border}`,
                      borderRadius: 16,
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 16,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 4, letterSpacing: 0.5 }}>
                        ⚡ BONUS — {suggestion.bonusReason || "while you're at it"}
                      </div>
                      <div style={{ fontSize: 17, fontWeight: 500 }}>{suggestion.bonus.text}</div>
                    </div>
                    <span style={{ fontSize: 20, color: theme.textMuted }}>›</span>
                  </button>
                )}

                <button onClick={getSuggestion} style={{
                  marginTop: 28,
                  background: 'none',
                  border: 'none',
                  fontSize: 15,
                  color: theme.textMuted,
                  cursor: 'pointer',
                }}>🎲 Suggest something else</button>
              </div>
            ) : (
              <div style={{ 
                padding: '60px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 'calc(100vh - 280px)',
              }}>
                <button onClick={getSuggestion} style={{
                  padding: '16px 32px',
                  backgroundColor: theme.accent,
                  color: theme.accentText,
                  border: 'none',
                  borderRadius: 50,
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}>Give me a suggestion</button>
              </div>
            )}
          </div>
        )}

        {/* LIST Tab */}
        {activeTab === 'list' && (
          <div>
            <h2 style={{ fontSize: 26, fontWeight: 600, marginBottom: 24 }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </h2>
            
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
                    ? '#0d0d14' 
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
                            padding: '16px 20px',
                            backgroundColor: theme.cardBg,
                            borderRadius: 12,
                            marginBottom: 4,
                            gap: 14,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                            cursor: 'grab',
                            opacity: draggedTask?.id === task.id ? 0.4 : 1,
                            transform: draggedTask?.id === task.id ? 'scale(0.98)' : 'scale(1)',
                            transition: 'opacity 0.15s, transform 0.15s',
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
                          {task.urgent && <Flame size={16} color="#ef4444" />}
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
                          }}><Flame size={16} color={task.urgent ? '#ef4444' : theme.textMuted} /></button>
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
      }}>
        <button onClick={() => setActiveTab('now')} style={{
          padding: '14px 22px',
          borderRadius: 50,
          border: 'none',
          backgroundColor: activeTab === 'now' ? theme.accent : 'transparent',
          color: activeTab === 'now' ? theme.accentText : theme.textSecondary,
          fontSize: 15,
          fontWeight: 500,
          cursor: 'pointer',
        }}>Now</button>
        
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
          padding: '14px 22px',
          borderRadius: 50,
          border: 'none',
          backgroundColor: activeTab === 'list' ? theme.accent : 'transparent',
          color: activeTab === 'list' ? theme.accentText : theme.textSecondary,
          fontSize: 15,
          fontWeight: 500,
          cursor: 'pointer',
        }}>List</button>
      </nav>

      {/* Chat Modal */}
      {showChat && (
        <ChatModal
          theme={theme}
          onClose={() => setShowChat(false)}
          onParseTasks={parseTasks}
          onAddTask={addTask}
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
                { key: 'nextweek', label: 'Next week' },
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

      {/* Celebration */}
      {showCelebration && (
        <div onClick={() => { setShowCelebration(null); getSuggestion(); }} style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: theme.bg,
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}>
          <Confetti />
          <div style={{ fontSize: 72, marginBottom: 20 }}>🎉</div>
          <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 12, textAlign: 'center', padding: '0 20px' }}>
            {celebrationMessages[Math.floor(Math.random() * celebrationMessages.length)]}
          </div>
          <div style={{ fontSize: 16, color: theme.textMuted, textDecoration: 'line-through', marginBottom: 8 }}>
            {showCelebration.text}
          </div>
          <div style={{ fontSize: 14, color: theme.textMuted }}>{remaining - 1} tasks remaining</div>
          <div style={{
            marginTop: 40,
            padding: '14px 28px',
            backgroundColor: theme.accent,
            color: theme.accentText,
            borderRadius: 50,
            fontSize: 16,
            fontWeight: 500,
          }}>Tap to continue</div>
        </div>
      )}

      {/* Micro Steps */}
      {microSteps && (
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
            padding: 40,
            maxWidth: 450,
            width: '90%',
            position: 'relative',
          }}>
            <button onClick={() => setMicroSteps(null)} style={{
              position: 'absolute',
              top: 16,
              right: 16,
              background: 'none',
              border: 'none',
              fontSize: 24,
              color: theme.textMuted,
              cursor: 'pointer',
            }}>×</button>
            
            <div style={{ fontSize: 13, color: theme.textMuted, marginBottom: 8 }}>
              Step {currentStep + 1} of {microSteps.steps.length}
            </div>
            <div style={{
              height: 4,
              backgroundColor: theme.border,
              borderRadius: 2,
              marginBottom: 28,
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                backgroundColor: theme.success,
                width: `${((currentStep + 1) / microSteps.steps.length) * 100}%`,
                transition: 'width 0.3s',
              }} />
            </div>
            
            <div style={{ fontSize: 24, fontWeight: 500, marginBottom: 32, lineHeight: 1.4 }}>
              {microSteps.steps[currentStep]}
            </div>
            
            <button onClick={() => {
              if (currentStep < microSteps.steps.length - 1) {
                setCurrentStep(s => s + 1);
              } else {
                completeTask(microSteps.task.id);
                setMicroSteps(null);
                setCurrentStep(0);
              }
            }} style={{
              width: '100%',
              padding: 16,
              backgroundColor: theme.accent,
              color: theme.accentText,
              border: 'none',
              borderRadius: 10,
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
            }}>
              {currentStep < microSteps.steps.length - 1 ? 'Done — Next →' : 'Complete! 🎉'}
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
              padding: '32px 28px 48px',
              width: '100%',
              maxWidth: 480,
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
          >
            {/* Drag handle + urgent */}
            <div style={{ 
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 28,
            }}>
              <div style={{ width: 44 }} />
              <div style={{ 
                width: 36, 
                height: 4, 
                backgroundColor: theme.border, 
                borderRadius: 2, 
              }} />
              <button
                onClick={() => toggleUrgent(selectedTask.id)}
                style={{
                  padding: '8px 12px',
                  backgroundColor: selectedTask.urgent ? '#fef2f2' : theme.bg,
                  color: selectedTask.urgent ? '#ef4444' : theme.textMuted,
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              ><Flame size={18} /></button>
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
                  <a href={`tel:${selectedTask.phone}`} style={{ color: theme.textMuted, textDecoration: 'none', fontSize: 14 }}>Call →</a>
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
                  <a href={selectedTask.url.startsWith('http') ? selectedTask.url : `https://${selectedTask.url}`} target="_blank" rel="noreferrer" style={{ color: theme.textMuted, textDecoration: 'none', fontSize: 14 }}>Open →</a>
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
                  <a href={`https://maps.google.com/?q=${encodeURIComponent(selectedTask.address)}`} target="_blank" rel="noreferrer" style={{ color: theme.textMuted, textDecoration: 'none', fontSize: 14 }}>Map →</a>
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
            </div>

            
          </div>
        </div>
      )}
    </div>
  );
}

// Chat Modal Component
function ChatModal({ theme, onClose, onParseTasks, onAddTask }) {
  const [messages, setMessages] = useState([
    { from: 'ai', text: "Brain dump time! Tell me everything. 🧠" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [messages]);

  const submit = async () => {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput('');
    setMessages(m => [...m, { from: 'user', text }]);
    setLoading(true);

    const result = await onParseTasks(text);
    
    if (result.tasks && result.tasks.length > 0) {
      result.tasks.forEach(t => onAddTask(t));
      setMessages(m => [...m,
        { from: 'system', text: `✓ ${result.tasks.length} task${result.tasks.length > 1 ? 's' : ''} added` },
        { from: 'ai', text: result.response }
      ]);
    } else {
      setMessages(m => [...m, { from: 'ai', text: result.response }]);
    }
    setLoading(false);
  };

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
        width: 450,
        maxWidth: '95%',
        maxHeight: '75vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '20px 24px',
          borderBottom: `1px solid ${theme.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Add Tasks</h3>
          <button onClick={onClose} style={{
            background: 'none',
            border: 'none',
            fontSize: 24,
            color: theme.textMuted,
            cursor: 'pointer',
          }}>×</button>
        </div>

        <div ref={ref} style={{
          flex: 1,
          overflowY: 'auto',
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}>
          {messages.map((m, i) => (
            <div key={i} style={{
              alignSelf: m.from === 'user' ? 'flex-end' : 'flex-start',
              backgroundColor: m.from === 'user' ? theme.accent : m.from === 'system' ? 'transparent' : theme.bgSecondary,
              color: m.from === 'user' ? theme.accentText : m.from === 'system' ? theme.success : theme.text,
              padding: m.from === 'system' ? '6px 0' : '12px 16px',
              borderRadius: 18,
              maxWidth: '85%',
              fontSize: m.from === 'system' ? 14 : 15,
              fontWeight: m.from === 'system' ? 500 : 400,
            }}>{m.text}</div>
          ))}
          {loading && (
            <div style={{
              alignSelf: 'flex-start',
              backgroundColor: theme.bgSecondary,
              padding: '12px 16px',
              borderRadius: 18,
              color: theme.textMuted,
              fontStyle: 'italic',
              fontSize: 14,
            }}>{loadingMantras[Math.floor(Math.random() * loadingMantras.length)]}</div>
          )}
        </div>

        <div style={{
          padding: '16px 20px',
          borderTop: `1px solid ${theme.border}`,
          display: 'flex',
          gap: 10,
        }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder="e.g. call mom tomorrow, buy groceries..."
            style={{
              flex: 1,
              padding: '12px 16px',
              border: `1px solid ${theme.border}`,
              borderRadius: 50,
              fontSize: 15,
              backgroundColor: theme.bg,
              color: theme.text,
              outline: 'none',
            }}
          />
          <button onClick={submit} disabled={!input.trim()} style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            border: 'none',
            backgroundColor: input.trim() ? theme.accent : theme.border,
            color: theme.accentText,
            fontSize: 18,
            cursor: input.trim() ? 'pointer' : 'default',
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
