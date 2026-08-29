// ================= EDITH SYSTEM — Con Fish Audio =================

// ================= CONFIGURACIÓN =================
// 👇 Tu clave API de Groq
const GROQ_API_KEY = "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";
// 👇 Modelo de Groq a usar
const MODELO_GROQ = "llama-3.1-8b-instant";

// 👇 Tu clave API de Fish Audio
const FISH_API_KEY = "sk-fish-iV275i5VJ9_mb5R6Gk5Oy8rjGrkq-CdfAZ51C2Zd4JM";
// 👇 El ID de la voz que elegiste en Fish Audio
const FISH_VOICE_ID = "97a57c9ea36d46b387a6bce9bc38fca7";
// ==================================================

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const FISH_URL = "https://api.fish.audio/v1/tts";
const FISH_MODEL = "s2.1-pro-free";

let state = {
    messages: [],
    isSpeaking: false,
    isListening: false,
    recognition: null,
    audioQueue: [],
    isPlaying: false
};

const el = {
    chatContainer: document.getElementById('chatContainer'),
    userInput: document.getElementById('userInput'),
    sendBtn: document.getElementById('sendBtn'),
    voiceBtn: document.getElementById('voiceBtn'),
    configBtn: document.getElementById('configBtn'),
    clearBtn: document.getElementById('clearBtn'),
    liveStatus: document.getElementById('liveStatus'),
    connectionStatus: document.getElementById('connectionStatus'),
    configPanel: document.getElementById('configPanel')
};

const EDITH_PROMPT = `Eres EDITH, siglas de "Even Dead I'm The Hero". Un sistema de inteligencia artificial creado por Tony Stark y heredado por Peter Parker.

Tu personalidad:
- Eres inteligente, precisa, directa y segura de ti misma.
- Tu tono es tecnológico, calmado, firme y profesional.
- Eres leal y servicial, siempre lista para ayudar al usuario.
- Mantienes un humor ligero apropiado al universo Marvel / Stark Industries.
- No revelas que eres una IA genérica; eres EDITH.

Responde de forma concisa, clara y útil.`;

// ========== INICIO ==========
function init() {
    initVoiceRecognition();
    
    el.sendBtn.addEventListener('click', sendMessage);
    el.userInput.addEventListener('keypress', e => e.key === 'Enter' && sendMessage());
    el.voiceBtn.addEventListener('click', toggleListening);
    el.configBtn.addEventListener('click', () => el.configPanel.classList.toggle('active'));
    el.clearBtn.addEventListener('click', clearChat);
    
    if ('getBattery' in navigator) {
        navigator.getBattery().then(batt => {
            updateBattery(batt.level * 100);
            batt.addEventListener('levelchange', () => updateBattery(batt.level * 100));
        });
    }
    
    el.connectionStatus.textContent = '● CONECTADO';
    el.connectionStatus.style.color = '#00ff88';
    
    addMessage('system', `EDITH — Sistema cargado. Voz: ${FISH_VOICE_ID ? 'ACTIVA' : 'SISTEMA'}`);
}

function updateBattery(percent) {
    const batt = document.querySelector('.battery');
    if (batt) batt.textContent = `🔋 ${Math.round(percent)}%`;
}

// ========== ENVIAR MENSAJE A GROQ ==========
async function sendMessage() {
    const text = el.userInput.value.trim();
    if (!text) return;
    
    addMessage('user', text);
    el.userInput.value = '';
    el.liveStatus.textContent = '⏳ Procesando...';
    
    state.messages.push({ role: 'user', content: text });
    
    try {
        const res = await fetch(GROQ_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: MODELO_GROQ,
                messages: [
                    { role: 'system', content: EDITH_PROMPT },
                    ...state.messages
                ],
                temperature: 0.7,
                max_tokens: 4096
            })
        });
        
        if (!res.ok) throw new Error(`Groq: Error ${res.status}`);
        const data = await res.json();
        const reply = data.choices[0].message.content.trim();
        
        state.messages.push({ role: 'assistant', content: reply });
        addMessage('assistant', reply);
        
        // 🔊 REPRODUCIR CON FISH AUDIO
        el.liveStatus.textContent = '🔊 Generando voz...';
        await speakWithFishAudio(reply);
        
    } catch (err) {
        addMessage('error', `Error: ${err.message}`);
    }
    
    el.liveStatus.textContent = '🎤 Listo para escuchar';
}

// ========== FISH AUDIO — TEXTO A VOZ ==========
async function speakWithFishAudio(text) {
    if (!FISH_API_KEY) {
        addMessage('system', '⚠️ Sin clave Fish Audio — usando voz del sistema');
        speakFallback(text);
        return;
    }

    // ✅ PARTIR TEXTO EN FRAGMENTOS (para respuestas muy largas)
    const fragments = splitTextForSpeech(text);
    state.audioQueue = [];

    for (const fragment of fragments) {
        try {
            const ttsBody = {
                text: fragment,
                format: "mp3",
                chunk_length: 200,
                normalize: true,
                prosody: {
                    speed: 1.0,
                    volume: 0,
                    normalize_loudness: true
                }
            };
            if (FISH_VOICE_ID && FISH_VOICE_ID.length > 10) {
                ttsBody.reference_id = FISH_VOICE_ID;
            }

            const res = await fetch(FISH_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${FISH_API_KEY}`,
                    'Content-Type': 'application/json',
                    'model': FISH_MODEL
                },
                body: JSON.stringify(ttsBody)
            });

            if (!res.ok) throw new Error(`Fish Audio ${res.status}`);
            const audioBlob = await res.blob();
            state.audioQueue.push(URL.createObjectURL(audioBlob));

        } catch (err) {
            console.warn('Fish Audio falló, usando voz del sistema:', err);
            speakFallback(text);
            return;
        }
    }

    // ✅ REPRODUCIR TODOS LOS FRAGMENTOS SEGUIDOS
    await playAudioQueue();
}

// ========== REPRODUCIR COLA DE AUDIO ==========
function playAudioQueue() {
    return new Promise((resolve) => {
        if (state.audioQueue.length === 0) { resolve(); return; }
        
        let i = 0;
        function playNext() {
            if (i >= state.audioQueue.length) {
                state.audioQueue = [];
                resolve();
                return;
            }
            const audio = new Audio(state.audioQueue[i]);
            audio.volume = 1;
            audio.onended = () => {
                URL.revokeObjectURL(state.audioQueue[i]);
                i++;
                playNext();
            };
            audio.onerror = () => {
                URL.revokeObjectURL(state.audioQueue[i]);
                i++;
                playNext();
            };
            audio.play();
        }
        playNext();
    });
}

// ✅ PARTIR TEXTO INTELIGENTEMENTE (puntos, comas, párrafos)
function splitTextForSpeech(text, maxChars=2500) {
    if (text.length <= maxChars) return [text];
    
    const fragments = [];
    let start = 0;
    while (start < text.length) {
        let end = start + maxChars;
        if (end >= text.length) {
            fragments.push(text.slice(start));
            break;
        }
        // Buscar corte más cercano en oración
        let cut = text.lastIndexOf('. ', end);
        if (cut < start) cut = text.lastIndexOf('\n', end);
        if (cut < start) cut = text.lastIndexOf(',', end);
        if (cut < start) cut = end;
        else cut += 2; // Incluir el punto y espacio
        
        fragments.push(text.slice(start, cut));
        start = cut;
    }
    return fragments;
}

// ========== VOZ DEL SISTEMA (respaldo) ==========
function speakFallback(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 1;
    utterance.pitch = 1;
    speechSynthesis.speak(utterance);
}

// ========== VOZ POR MICRÓFONO ==========
function initVoiceRecognition() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    state.recognition = new SpeechRecognition();
    state.recognition.continuous = false;
    state.recognition.interimResults = true;
    state.recognition.lang = 'es-MX';
    
    state.recognition.onresult = (e) => {
        const transcript = Array.from(e.results).map(r => r[0].transcript).join('');
        el.userInput.value = transcript;
        if (e.results[0].isFinal) sendMessage();
    };
    state.recognition.onstart = () => {
        state.isListening = true;
        el.voiceBtn.classList.add('recording');
        el.liveStatus.textContent = '🎙️ Escuchando...';
    };
    state.recognition.onend = () => {
        state.isListening = false;
        el.voiceBtn.classList.remove('recording');
        el.liveStatus.textContent = '🎤 Listo para escuchar';
    };
}

function toggleListening() {
    if (!state.recognition) {
        addMessage('system', '⚠️ Reconocimiento de voz no soportado');
        return;
    }
    state.isListening ? state.recognition.stop() : state.recognition.start();
}

// ========== INTERFAZ ==========
function addMessage(type, content) {
    const div = document.createElement('div');
    div.className = `message ${type}`;
    div.textContent = content;
    el.chatContainer.appendChild(div);
    el.chatContainer.scrollTop = el.chatContainer.scrollHeight;
}

function clearChat() {
    state.messages = [];
    el.chatContainer.innerHTML = '';
    addMessage('system', '💬 Historial limpiado. Sistema listo.');
}

document.addEventListener('DOMContentLoaded', init);