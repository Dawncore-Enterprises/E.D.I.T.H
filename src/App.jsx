import React, { useEffect, useRef, useState } from 'react';
import { Activity, ArrowUp, AudioLines, Check, ChevronDown, CircleHelp, Command, Cpu, Mic, MicOff, Plus, Settings2, ShieldCheck, Sparkles, Volume2, X } from 'lucide-react';

const starter = [{ role: 'assistant', text: 'Hola. Soy E.D.I.T.H. ¿En qué puedo ayudarte hoy?', time: 'Ahora' }];
const stamp = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export default function App() {
  const [messages, setMessages] = useState(() => {
    try { return JSON.parse(localStorage.getItem('edith.messages')) || starter; } catch { return starter; }
  });
  const [input, setInput] = useState('');
  const [listening, setListening] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [compact, setCompact] = useState(() => localStorage.getItem('edith.compact') === 'true');
  const [voiceOutput, setVoiceOutput] = useState(() => localStorage.getItem('edith.voice') !== 'false');
  const [recognitionAvailable, setRecognitionAvailable] = useState(false);
  const [toast, setToast] = useState('');
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => { localStorage.setItem('edith.messages', JSON.stringify(messages)); scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); }, [messages]);
  useEffect(() => { localStorage.setItem('edith.compact', String(compact)); }, [compact]);
  useEffect(() => { localStorage.setItem('edith.voice', String(voiceOutput)); }, [voiceOutput]);
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    setRecognitionAvailable(Boolean(SR));
    return () => { try { recognitionRef.current?.stop(); } catch {} };
  }, []);

  const notify = (text) => { setToast(text); window.setTimeout(() => setToast(''), 2600); };
  const speak = (text) => {
    if (!voiceOutput || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-MX'; utterance.rate = 1.02;
    window.speechSynthesis.speak(utterance);
  };
  const send = (value = input) => {
    const text = value.trim();
    if (!text) return;
    setMessages(prev => [...prev, { role: 'user', text, time: stamp() }]);
    setInput('');
    const reply = 'Estoy lista para ayudarte. Esta versión reconstruida ya guarda el historial en este dispositivo; la conexión segura con un proveedor de IA se añadirá cuando exista un backend propio, sin claves API dentro de la aplicación.';
    window.setTimeout(() => {
      setMessages(prev => [...prev, { role: 'assistant', text: reply, time: stamp() }]);
      speak(reply);
    }, 450);
  };
  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { notify('El reconocimiento de voz no está disponible en este dispositivo.'); return; }
    if (listening) { try { recognitionRef.current?.stop(); } catch {} setListening(false); return; }
    const rec = new SR();
    rec.lang = 'es-MX'; rec.interimResults = true; rec.continuous = false;
    recognitionRef.current = rec;
    rec.onstart = () => setListening(true);
    rec.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) transcript += event.results[i][0].transcript;
      setInput(transcript);
      if (event.results[event.results.length - 1].isFinal) { setListening(false); send(transcript); }
    };
    rec.onerror = () => { setListening(false); notify('No pude acceder al reconocimiento de voz.'); };
    rec.onend = () => setListening(false);
    try { rec.start(); } catch { setListening(false); notify('No se pudo iniciar el micrófono.'); }
  };
  const reset = () => { setMessages(starter); localStorage.removeItem('edith.messages'); setShowSettings(false); notify('Conversación reiniciada'); };

  return <main className="shell">
    <div className="ambient ambient-one" /><div className="ambient ambient-two" />
    <header className="topbar">
      <button className="brand" onClick={() => { setMessages(starter); }} aria-label="Inicio">
        <span className="brand-mark"><Command size={21} strokeWidth={1.7}/></span>
        <span><strong>E.D.I.T.H.</strong><small>PERSONAL INTELLIGENCE</small></span>
      </button>
      <div className="top-actions">
        <span className="status"><i /> SISTEMA LISTO</span>
        <button className="icon-button" aria-label="Configuración" onClick={() => setShowSettings(true)}><Settings2 size={19}/></button>
      </div>
    </header>

    <section className="workspace">
      <aside className="side-rail">
        <button className="new-chat" onClick={reset}><Plus size={17}/><span>Nueva conversación</span></button>
        <div className="rail-label">ASISTENTE</div>
        <div className="rail-item active"><Sparkles size={16}/><span>Chat principal</span></div>
        <div className="rail-item muted"><Activity size={16}/><span>Estado del sistema</span><span className="tiny-dot"/></div>
        <div className="rail-bottom"><ShieldCheck size={16}/><span>Privacidad local</span></div>
      </aside>

      <section className="chat-area">
        <div className="chat-heading"><div><div className="eyebrow">DAWNCORE INTELLIGENCE</div><h1>¿Qué necesitas <span>hoy?</span></h1><p>Tu espacio personal para pensar, crear y resolver.</p></div><div className="core"><div className="core-ring ring-a"/><div className="core-ring ring-b"/><div className="core-center"><AudioLines size={26}/></div></div></div>
        <div className="chat-scroll" ref={scrollRef}>
          {messages.length === 1 && <div className="suggestions"><button onClick={() => send('Ayúdame a organizar mis proyectos') }><span>✦</span><b>Organizar proyectos</b><small>Convierte ideas en un plan</small><ArrowUp size={15}/></button><button onClick={() => send('Ayúdame a aprender algo nuevo') }><span>⌘</span><b>Aprender algo nuevo</b><small>Explora un tema paso a paso</small><ArrowUp size={15}/></button><button onClick={() => send('Dame ideas creativas para un proyecto') }><span>✧</span><b>Crear algo</b><small>Encuentra nuevas posibilidades</small><ArrowUp size={15}/></button></div>}
          <div className="messages">
            {messages.map((m, i) => <article key={i} className={'message ' + m.role}><div className="avatar">{m.role === 'assistant' ? <Command size={15}/> : 'TÚ'}</div><div className="message-body"><div className="message-meta">{m.role === 'assistant' ? 'E.D.I.T.H.' : 'TÚ'} <time>{m.time || 'Ahora'}</time></div><p>{m.text}</p></div></article>)}
          </div>
        </div>
        <div className="composer-wrap"><form className="composer" onSubmit={e => { e.preventDefault(); send(); }}><button type="button" className={'mic-button ' + (listening ? 'listening' : '')} onClick={startVoice} aria-label={listening ? 'Detener escucha' : 'Dictar mensaje'}>{listening ? <MicOff size={19}/> : <Mic size={19}/>}</button><input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} placeholder={listening ? 'Te escucho…' : 'Escribe un mensaje para E.D.I.T.H.'} /><span className="input-hint">↵</span><button className="send-button" type="submit" disabled={!input.trim()} aria-label="Enviar"><ArrowUp size={19}/></button></form><div className="composer-foot"><span><ShieldCheck size={12}/> El historial se guarda en este dispositivo</span><span>EDITH · BUILD PREVIEW</span></div></div>
      </section>
    </section>
    <footer className="app-footer"><span>Even Dead, I’m The Hero</span><span>Technology by <b>Dawncore Enterprises</b></span></footer>

    {showSettings && <div className="modal-backdrop" onClick={() => setShowSettings(false)}><section className="settings-panel" onClick={e => e.stopPropagation()}><div className="settings-head"><div><div className="eyebrow">PERSONALIZACIÓN</div><h2>Configuración</h2></div><button className="icon-button" onClick={() => setShowSettings(false)} aria-label="Cerrar"><X size={19}/></button></div>
      <div className="settings-group"><h3>Experiencia</h3><div className="setting-row"><div className="setting-icon"><Volume2 size={17}/></div><div className="setting-copy"><b>Respuestas por voz</b><small>Leer las respuestas en voz alta</small></div><button className={'toggle ' + (voiceOutput ? 'on' : '')} onClick={() => setVoiceOutput(v => !v)}><span/></button></div><div className="setting-row"><div className="setting-icon"><Cpu size={17}/></div><div className="setting-copy"><b>Interfaz compacta</b><small>Reducir espacios en pantalla</small></div><button className={'toggle ' + (compact ? 'on' : '')} onClick={() => setCompact(v => !v)}><span/></button></div></div>
      <div className="settings-group"><h3>Voz y activación</h3><div className="info-card"><Mic size={18}/><div><b>Dictado por voz</b><p>{recognitionAvailable ? 'Disponible al tocar el botón del micrófono con la app abierta.' : 'El reconocimiento depende de las funciones disponibles en tu dispositivo.'}</p></div></div><div className="info-card pending"><AudioLines size={18}/><div><b>Activación «Ok EDITH»</b><p>La escucha en segundo plano necesita un servicio Android nativo y pruebas específicas. No se marcará como activa hasta verificarla.</p></div></div></div>
      <div className="settings-group"><h3>Acerca de</h3><div className="about-card"><span className="about-logo"><Command size={19}/></span><div><b>E.D.I.T.H. <span className="version">v1.1 · rebuild</span></b><small>Even Dead, I’m The Hero</small><small className="credit">Technology by Dawncore Enterprises</small></div><Check size={16} className="check"/></div></div>
      <button className="reset-button" onClick={reset}>Reiniciar conversación</button>
      <p className="privacy-note"><ShieldCheck size={13}/> Sin claves API integradas en el cliente.</p>
    </section></div>}
    {toast && <div className="toast"><CircleHelp size={15}/>{toast}</div>}
  </main>;
}