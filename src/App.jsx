import { useState, useEffect, useRef } from 'react';

export default function App() {
  const [provider, setProvider] = useState('google');
  const [apiKey, setApiKey] = useState(localStorage.getItem('ai_api_key') || '');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Halo! Saya AI Assistant by Zimzz. Isi API key lalu mulai chat. 🚀' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const saveKey = () => {
    localStorage.setItem('ai_api_key', apiKey);
    setMessages(m => [...m, { role: 'system', content: '✅ API key tersimpan.' }]);
  };

  const send = async () => {
    const text = input.trim();
    if (!text) return;
    if (!apiKey) {
      setMessages(m => [...m, { role: 'system', content: '⚠️ Isi API key dulu.' }]);
      return;
    }
    const newMsgs = [...messages, { role: 'user', content: text }];
    setMessages(newMsgs);
    setInput('');
    setLoading(true);

    try {
      const reply = await callAPI(provider, apiKey, newMsgs.filter(m => m.role !== 'system'));
      setMessages(m => [...m, { role: 'assistant', content: reply }]);
    } catch (e) {
      setMessages(m => [...m, { role: 'system', content: '❌ ' + e.message }]);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>🤖 AI Assistant</h1>
        <small>by <strong>Zimzz</strong> · React</small>
      </header>

      <div className="settings">
        <select value={provider} onChange={e => setProvider(e.target.value)}>
          <option value="openai">OpenAI</option>
          <option value="anthropic">Claude</option>
          <option value="google">Gemini</option>
        </select>
        <input
          type="password"
          value={apiKey}
          onChange={e => setApiKey(e.target.value)}
          placeholder="API key..."
        />
        <button onClick={saveKey}>💾 Simpan</button>
      </div>

      <div className="chat-area">
        {messages.map((m, i) => (
          <div key={i} className={`message ${m.role}`}>{m.content}</div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <div className="input-area">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          placeholder="Ketik pesan..."
        />
        <button className="send-btn" onClick={send} disabled={loading}>
          {loading ? '...' : 'Kirim'}
        </button>
      </div>

      <div className="creator">Dibuat oleh <strong>Zimzz</strong></div>
    </div>
  );
}

async function callAPI(provider, key, msgs) {
  if (provider === 'openai') {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
      body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'system', content: 'Kamu asisten AI.' }, ...msgs] })
    });
    const d = await r.json();
    if (d.error) throw new Error(d.error.message);
    return d.choices[0].message.content;
  }
  if (provider === 'anthropic') {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({ model: 'claude-3-haiku-20240307', max_tokens: 2000, system: 'Kamu asisten AI.', messages: msgs })
    });
    const d = await r.json();
    if (d.error) throw new Error(d.error.message);
    return d.content[0].text;
  }
  if (provider === 'google') {
    const contents = msgs.map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.content }] }));
    // ✅ DIPERBARUI: pakai gemini-flash-latest
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents })
    });
    const d = await r.json();
    if (d.error) throw new Error(d.error.message);
    return d.candidates[0].content.parts[0].text;
  }
}
