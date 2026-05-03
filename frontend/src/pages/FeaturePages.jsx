import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, MapPin, Send, ChevronDown, AlertCircle, ExternalLink, Trophy } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { QUIZ_QUESTIONS, AI_RESPONSES, VOTER_ID_STEPS } from '../data';
import { supabase } from '../supabaseClient';

const ELink = ({href,children}) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#E8690A] hover:underline inline-flex items-center gap-1">{children}<ExternalLink size={12}/></a>;

// --- VOTER ID PAGE ---
export function VoterIdPage() {
  const [openStep, setOpenStep] = useState(0);
  const stepLinks = [
    <span>Go to <ELink href="https://voters.eci.gov.in">voters.eci.gov.in</ELink> and click "New Registration (Form 6)"</span>,
    null, null,
    <span>Document formats accepted per <ELink href="https://eci.gov.in">ECI guidelines</ELink></span>,
    null,
    <span>Track via <ELink href="https://voters.eci.gov.in">Voter Portal</ELink> or call <a href="tel:1950" className="text-[#E8690A] hover:underline">1950</a></span>
  ];
  return (
    <div className="max-w-[900px] mx-auto px-6 py-32">
      <p className="text-[12px] uppercase tracking-[0.15em] text-[#999] mb-4">Guide</p>
      <h1 style={{fontSize:'clamp(2rem,5vw,3.5rem)',fontWeight:900,letterSpacing:'-0.03em'}} className="text-[#0D0D0D] mb-6">VOTER ID REGISTRATION</h1>
      <div className="grid md:grid-cols-2 gap-12 mb-16">
        <p className="text-[15px] font-light leading-[1.8] text-[#666]">Form 6 is the official application for new voter registration. Indian citizens aged 18+ who have never registered, or who have moved to a new constituency, must file this form.</p>
        <p className="text-[15px] font-light leading-[1.8] text-[#666]">The process is entirely online via <ELink href="https://voters.eci.gov.in">voters.eci.gov.in</ELink>. Verification typically takes 30–45 days. Track status via the portal or by calling <a href="tel:1950" className="text-[#E8690A] hover:underline">1950</a>.</p>
      </div>
      <div className="border-t border-[#E0E0E0]">
        {VOTER_ID_STEPS.map((s,i)=>(
          <div key={i} className="border-b border-[#E0E0E0]">
            <button onClick={()=>setOpenStep(openStep===i?-1:i)} className="w-full flex items-center gap-6 py-6 text-left hover:text-[#E8690A] transition-colors">
              <span className="text-[13px] text-[#999] font-mono w-8">{String(i+1).padStart(2,'0')}</span>
              <span className="text-[16px] font-medium flex-1">{s.title}</span>
              <ChevronDown size={16} className={`text-[#999] transition-transform ${openStep===i?'rotate-180':''}`}/>
            </button>
            {openStep===i && <div className="pb-6 pl-14"><p className="text-[14px] font-light leading-[1.8] text-[#666]">{s.desc}</p>{stepLinks[i] && <p className="mt-3 text-[13px]">{stepLinks[i]}</p>}</div>}
          </div>
        ))}
      </div>
      <div className="border-t border-[#E0E0E0] mt-16 pt-12">
        <h3 className="text-[12px] uppercase tracking-[0.15em] text-[#999] mb-4">Already registered?</h3>
        <p className="text-[15px] font-light leading-[1.8] text-[#666] max-w-xl">Need to update details? File <strong>Form 8A</strong> online at <ELink href="https://voters.eci.gov.in">voters.eci.gov.in</ELink> or visit your Electoral Registration Officer. Also check <ELink href="https://nvsp.in">National Voters' Service Portal</ELink>.</p>
      </div>
      <p className="mt-12 text-[12px] text-[#bbb] uppercase tracking-[0.1em]">Always verify on <ELink href="https://eci.gov.in">Election Commission of India</ELink></p>
    </div>
  );
}

// --- QUIZ PAGE ---
export function QuizPage({ state, setState }) {
  const { currentQ, score, showResult, answered, selectedIdx } = state.quizState;
  const userId = state.user?.id;
  const q = QUIZ_QUESTIONS[currentQ];
  const total = QUIZ_QUESTIONS.length;
  const [bestScore, setBestScore] = useState(null);
  const [scoreSaved, setScoreSaved] = useState(false);

  // Fetch best score on mount
  useEffect(() => {
    if (!userId) return;
    supabase.from('quiz_scores').select('score').eq('user_id', userId).order('score', { ascending: false }).limit(1)
      .then(({ data }) => { if (data && data.length > 0) setBestScore(data[0].score); });
  }, [userId]);

  // Save score when quiz completes
  useEffect(() => {
    if (!showResult || scoreSaved || !userId) return;
    setScoreSaved(true);
    supabase.from('quiz_scores').insert({ user_id: userId, score, total_questions: total })
      .then(() => { if (bestScore === null || score > bestScore) setBestScore(score); });
  }, [showResult, scoreSaved, userId, score, total, bestScore]);

  const handleAnswer = (idx) => { if (answered) return; setState(p => ({...p, quizState: {...p.quizState, score: idx===q.a ? score+1 : score, answered: true, selectedIdx: idx}})); };
  const handleNext = () => { if (currentQ < total-1) setState(p => ({...p, quizState: {currentQ:currentQ+1, score:p.quizState.score, showResult:false, answered:false, selectedIdx:-1}})); else setState(p => ({...p, quizState: {...p.quizState, showResult: true}})); };
  const reset = () => { setScoreSaved(false); setState(p => ({...p, quizState: {currentQ:0, score:0, showResult:false, answered:false, selectedIdx:-1}})); };
  if (showResult) { const pct = Math.round((score/total)*100); return (
    <div className="max-w-[700px] mx-auto px-6 py-32 text-center">
      <p className="text-[12px] uppercase tracking-[0.15em] text-[#999] mb-4">Results</p>
      <h1 style={{fontSize:'4rem',fontWeight:900,letterSpacing:'-0.03em'}} className="text-[#0D0D0D]">{pct}%</h1>
      <p className="text-[15px] font-light text-[#666] mt-4 mb-2">{score} of {total} correct</p>
      <p className="text-[15px] font-light text-[#666] mb-4">{pct>=80?"Outstanding civic knowledge.":pct>=50?"Good effort — keep learning.":"Review the Civic Library to improve."}</p>
      {bestScore !== null && <div className="flex items-center justify-center gap-2 mb-12 text-[#E8690A]"><Trophy size={16}/><span className="text-[14px] font-medium">Your Best: {bestScore}/{total}</span></div>}
      {bestScore === null && <div className="mb-12" />}
      <button onClick={reset} className="border border-[#0D0D0D] px-8 py-3 text-[13px] uppercase tracking-[0.1em] hover:bg-[#0D0D0D] hover:text-white transition-colors">Retake Quiz</button>
    </div>); }
  return (
    <div className="max-w-[700px] mx-auto px-6 py-32">
      <div className="flex justify-between items-center mb-2">
        <p className="text-[12px] uppercase tracking-[0.15em] text-[#999]">Question {currentQ+1} of {total}</p>
        <p className="text-[12px] uppercase tracking-[0.15em] text-[#999]">Score: {score}</p>
      </div>
      <div className="w-full bg-[#E0E0E0] h-[2px] mb-12"><div className="bg-[#0D0D0D] h-full transition-all" style={{width:`${(currentQ/total)*100}%`}}/></div>
      <h2 style={{fontSize:'clamp(1.5rem,3vw,2rem)',fontWeight:900,letterSpacing:'-0.02em',lineHeight:1.2}} className="text-[#0D0D0D] mb-10">{q.q}</h2>
      <div>{q.o.map((opt,i) => { let cls = "border-b border-[#E0E0E0] hover:bg-[#f0ede8]"; if (answered) { if (i===q.a) cls="border-b border-[#1A5C3A] bg-[#1A5C3A]/5"; else if (i===selectedIdx) cls="border-b border-red-400 bg-red-50"; else cls="border-b border-[#E0E0E0] opacity-50"; } return (<button key={i} onClick={()=>handleAnswer(i)} disabled={answered} className={`w-full text-left py-4 px-4 text-[15px] transition-all ${cls} ${answered?'cursor-default':'cursor-pointer'}`}><span className="text-[13px] text-[#999] mr-4 font-mono">{String.fromCharCode(65+i)}</span>{opt}</button>); })}</div>
      {answered && (<div className="mt-6 py-4 border-l-2 border-[#E8690A] pl-4"><p className="text-[14px] font-medium text-[#0D0D0D] mb-1">{selectedIdx===q.a?"Correct":"Incorrect"}</p><p className="text-[13px] font-light text-[#666]">{q.e}</p></div>)}
      <div className="flex justify-end mt-8"><button onClick={handleNext} disabled={!answered} className="bg-[#0D0D0D] text-white px-8 py-3 text-[13px] uppercase tracking-[0.1em] hover:bg-[#333] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">{currentQ<total-1?'Next':'View Results'}</button></div>
    </div>
  );
}

// --- BOOTH FINDER with Leaflet + Nominatim geocoding ---
// Hardcoded fallback for offline/API failure
const PIN_COORDS_FALLBACK = {"110001":[28.6139,77.2090],"110011":[28.6328,77.2197],"400001":[18.9322,72.8264],"400051":[19.0596,72.8295],"560001":[12.9716,77.5946],"560034":[12.9352,77.6245],"600001":[13.0827,80.2707],"600020":[13.0569,80.2425],"700001":[22.5726,88.3639],"700019":[22.5195,88.3832],"500001":[17.3850,78.4867],"380001":[23.0225,72.5714],"411001":[18.5204,73.8567],"302001":[26.9124,75.7873]};

const BOOTH_TEMPLATES = [
  ["Govt. Primary School","Ward Office / Community Centre","Municipal School"],
  ["Block A, Near Main Road","Sector Market Area","Near Bus Stand, Main Colony"],
];

export function BoothFinderPage() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [booths, setBooths] = useState(null);
  const [loading, setLoading] = useState(false);
  const [areaName, setAreaName] = useState('');
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const leafletLoaded = useRef(false);

  useEffect(() => {
    if (leafletLoaded.current) return;
    if (!document.querySelector('link[href*="leaflet"]')) {
      const css = document.createElement('link'); css.rel='stylesheet'; css.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; document.head.appendChild(css);
    }
    if (!document.querySelector('script[src*="leaflet"]')) {
      const js = document.createElement('script'); js.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'; js.onload=()=>{leafletLoaded.current=true;}; document.head.appendChild(js);
    } else { leafletLoaded.current = true; }
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, []);

  useEffect(() => { return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } }; }, []);

  const validate = (v) => {
    if (!v) return "Please enter a PIN code.";
    if (/\D/.test(v)) return "PIN code must contain only digits.";
    if (v.length !== 6) return "PIN code must be exactly 6 digits.";
    if (v[0] === '0') return "Please enter a valid Indian PIN code.";
    return '';
  };

  const generateBooths = (postOffices, district) => {
    // Generate up to 3 realistic-sounding booths based on actual Post Office locations
    const selectedPOs = postOffices.slice(0, 3);
    const names = selectedPOs.map((po, i) => {
      if (i === 0) return `${po.Name} Primary Vidyalaya`;
      if (i === 1) return `Community Hall, ${po.Name}`;
      return `Govt. High School, ${po.Name}`;
    });
    const addrs = selectedPOs.map((po) => `${po.Name}, ${district}`);
    const dists = ["0.4 km","0.9 km","1.5 km"];
    return names.map((n,i) => ({ name: n, addr: addrs[i], dist: dists[i] }));
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    const err = validate(pin);
    if (err) { setError(err); setBooths(null); return; }
    setError(''); setLoading(true); setBooths(null);

    try {
      // 1. Strict PIN code validation via PostalPincode API
      const pinRes = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      const pinData = await pinRes.json();
      
      if (!pinData || pinData[0].Status !== "Success" || !pinData[0].PostOffice) {
        setError("Invalid PIN code. Could not locate in India.");
        setLoading(false);
        return;
      }
      
      const postOffices = pinData[0].PostOffice;
      const district = postOffices[0].District;
      const state = postOffices[0].State;
      const area = postOffices[0].Name;

      // 2. Get Coordinates via Nominatim
      let coords = null;
      const nomRes = await fetch(`https://nominatim.openstreetmap.org/search?postalcode=${pin}&country=India&format=json&limit=1`, {
        headers: { 'Accept-Language': 'en' }
      });
      const nomData = await nomRes.json();
      
      if (nomData && nomData.length > 0) {
         coords = [parseFloat(nomData[0].lat), parseFloat(nomData[0].lon)];
      } else {
         // Fallback to district search if postalcode coords are missing
         const distRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${district},${state},India&format=json&limit=1`, {
           headers: { 'Accept-Language': 'en' }
         });
         const distData = await distRes.json();
         if (distData && distData.length > 0) {
             coords = [parseFloat(distData[0].lat), parseFloat(distData[0].lon)];
         }
      }

      if (!coords) {
         coords = PIN_COORDS_FALLBACK[pin] || [20.5937, 78.9629];
      }

      const generatedBooths = generateBooths(postOffices, district);
      setAreaName(`${area}, ${district}`);
      setBooths(generatedBooths);
      setLoading(false);
      setTimeout(() => initMap(coords, generatedBooths), 150);

    } catch (error) {
      setError("Error connecting to location service. Please try again.");
      setLoading(false);
    }
  };

  const initMap = (coords, boothList) => {
    if (!window.L || !mapContainerRef.current) return;
    if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    const map = window.L.map(mapContainerRef.current).setView(coords, 15);
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18
    }).addTo(map);

    // Create custom marker icon in saffron
    const markerIcon = window.L.divIcon({
      className: '',
      html: `<div style="width:28px;height:28px;background:#E8690A;border:2px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-size:12px;font-weight:bold;"></div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -16]
    });

    const offsets = [[0.003, 0.002], [-0.002, 0.004], [0.004, -0.003]];
    const bl = boothList || booths || [];
    offsets.forEach((o, i) => {
      if (!bl[i]) return;
      const m = window.L.marker([coords[0] + o[0], coords[1] + o[1]], { icon: markerIcon }).addTo(map);
      m.bindPopup(`<div style="font-family:sans-serif;font-size:13px;line-height:1.5"><b>${bl[i].name}</b><br/>${bl[i].addr}<br/><span style="color:#888">7:00 AM – 6:00 PM</span></div>`);
    });

    // Fit bounds to show all markers
    const bounds = offsets.map(o => [coords[0]+o[0], coords[1]+o[1]]);
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    mapRef.current = map;
  };

  return (
    <div className="max-w-[1100px] mx-auto px-6 py-32">
      <p className="text-[12px] uppercase tracking-[0.15em] text-[#999] mb-4">Locate</p>
      <h1 style={{fontSize:'clamp(2rem,5vw,3.5rem)',fontWeight:900,letterSpacing:'-0.03em'}} className="text-[#0D0D0D] mb-6">POLLING BOOTH FINDER</h1>
      <p className="text-[15px] font-light leading-[1.8] text-[#666] mb-12 max-w-xl">Enter any valid 6-digit Indian PIN code to locate nearby polling stations on the map. Works for all Indian PIN codes.</p>
      <form onSubmit={handleSearch} className="flex gap-4 mb-4 max-w-md">
        <input type="text" maxLength="6" placeholder="PIN Code (e.g. 110044)" value={pin} onChange={e=>{setPin(e.target.value.replace(/\D/g,''));setError('');}} className="flex-1 py-3 border-b border-[#ccc] bg-transparent text-[15px] focus:border-[#0D0D0D] focus:outline-none tracking-[0.2em]"/>
        <button type="submit" disabled={loading} className="border border-[#0D0D0D] px-6 py-3 text-[13px] uppercase tracking-[0.1em] hover:bg-[#0D0D0D] hover:text-white transition-colors flex items-center gap-2 disabled:opacity-50"><Search size={14}/>{loading ? 'Searching...' : 'Search'}</button>
      </form>
      {error && <div className="flex items-center gap-2 mb-8 text-[#DC2626]"><AlertCircle size={14}/><span className="text-[13px]">{error}</span></div>}

      {loading && (
        <div className="flex items-center gap-3 py-8">
          <div className="w-4 h-4 border-2 border-[#E8690A] border-t-transparent rounded-full animate-spin"/>
          <span className="text-[14px] text-[#999]">Locating polling stations for PIN {pin}...</span>
        </div>
      )}

      {booths && !loading && (
        <>
          {areaName && <p className="text-[14px] text-[#666] mb-6">Showing results near <strong className="text-[#0D0D0D]">{areaName}</strong> (PIN {pin})</p>}
          <div className="grid md:grid-cols-2 gap-12 mt-4">
            <div>
              <div ref={mapContainerRef} style={{height:'380px',width:'100%'}} className="border border-[#E0E0E0]"/>
              <p className="text-[11px] text-[#bbb] mt-2">Map data © OpenStreetMap contributors · Booth locations are simulated for educational purposes</p>
            </div>
            <div>
              <h3 className="text-[12px] uppercase tracking-[0.15em] text-[#999] mb-6">{booths.length} Booths Found</h3>
              {booths.map((r,i)=>(
                <div key={i} className="py-5 border-b border-[#E0E0E0]">
                  <div className="flex items-start gap-4">
                    <span className="text-[13px] font-mono mt-0.5 text-[#E8690A]">{String(i+1).padStart(2,'0')}</span>
                    <div>
                      <p className="text-[15px] font-medium text-[#0D0D0D]">{r.name}</p>
                      <p className="text-[13px] text-[#999] mt-1">{r.addr}</p>
                      <p className="text-[12px] text-[#bbb] mt-1">{r.dist} away · 7 AM – 6 PM</p>
                    </div>
                  </div>
                </div>
              ))}
              <p className="mt-6 text-[12px] text-[#bbb]">Verify your actual booth at <a href="https://voters.eci.gov.in" target="_blank" rel="noopener noreferrer" className="text-[#E8690A] hover:underline">voters.eci.gov.in</a> or call <a href="tel:1950" className="text-[#E8690A] hover:underline">1950</a></p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// --- AI CHAT ---
export function AIChatPage({ state, setState }) {
  const { chatHistory } = state;
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const endRef = useRef(null);
  const hasSentGreeting = useRef(false);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatHistory, typing]);

  useEffect(() => {
    // Populate chat history with a static greeting if it's empty or only has the default prompt
    if (!hasSentGreeting.current && chatHistory.length <= 1) {
      hasSentGreeting.current = true;
      const staticGreeting = "Hello! I'm Election Sathi, your guide to Indian elections. I can help you with voter registration, polling booth procedures, EVMs, and the election process. What would you like to know today?";
      setState(p => ({...p, chatHistory: [{role:'ai', text:staticGreeting, ts:new Date()}]}));
    }
  }, [setState, chatHistory.length]);

  const quickQs = ["How do I register to vote?","What happens on voting day?","What is EVM?","How is the PM elected?","What is NOTA?","What documents for voting day?","What is Model Code of Conduct?","How to check voter list?","What if vote is challenged?","What is VVPAT?"];

  const sendMessage = async (text) => {
    if (!text.trim() || typing) return;
    setState(p => ({...p, chatHistory: [...p.chatHistory, {role:'user', text, ts:new Date()}]}));
    setInput('');
    setTyping(true);

    // Call real Gemini API via backend
    try {
      const res = await fetch(import.meta.env.DEV ? 'http://localhost:8000/api/chat' : '/api/chat', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ session_id: 'election-sathi-chat', message: text })
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'API error');
      }
      
      const data = await res.json();
      const reply = data.reply || data.response || data.text;
      
      if (reply) {
        setState(p => ({...p, chatHistory: [...p.chatHistory, {role:'ai', text:reply, ts:new Date()}]}));
      } else {
        throw new Error('Empty response');
      }
    } catch(error) {
      const errorMsg = error.message !== 'API error' && error.message !== 'Empty response' 
        ? error.message 
        : "Something went wrong. Please try again.";
      setState(p => ({...p, chatHistory: [...p.chatHistory, {role:'ai', text:errorMsg, ts:new Date()}]}));
    } finally {
      setTyping(false);
    }
  };

  return (
    <div className="max-w-[800px] mx-auto px-6 pt-24 pb-6 h-screen flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-[12px] uppercase tracking-[0.15em] text-[#999]">Assistant</p>
          <h1 style={{fontSize:'1.8rem',fontWeight:900,letterSpacing:'-0.02em'}} className="text-[#0D0D0D]">AI SATHI</h1>
        </div>
        <button onClick={()=>setState(p=>({...p,chatHistory:[p.chatHistory[0]]}))} className="text-[12px] uppercase tracking-[0.1em] text-[#999] hover:text-[#E8690A] transition-colors">Clear</button>
      </div>
      <div className="flex-1 overflow-y-auto border-t border-b border-[#E0E0E0] py-6 space-y-6">
        {chatHistory.map((m,i)=>(
          <div key={i} className={`flex ${m.role==='user'?'justify-end':'justify-start'}`}>
            <div className={`max-w-[75%] ${m.role==='user'?'bg-[#0D0D0D] text-white':'bg-[#f0ede8] text-[#0D0D0D]'} px-5 py-4`} style={{borderRadius:'2px'}}>
              <div className="text-[14px] leading-[1.7] font-light [&>ul]:list-disc [&>ul]:ml-4 [&>ul]:mb-2 [&>ul_li]:marker:text-[#E8690A] [&>ol]:list-decimal [&>ol]:ml-4 [&>ol]:mb-2 [&>ol_li]:marker:text-[#E8690A] [&>p]:mb-2 last:[&>p]:mb-0 [&>strong]:font-semibold">
                <ReactMarkdown>{m.text}</ReactMarkdown>
              </div>
              <p className={`text-[10px] mt-2 ${m.role==='user'?'text-[#999]':'text-[#bbb]'}`}>{m.ts.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</p>
            </div>
          </div>
        ))}
        {typing && <div className="flex gap-1 px-4 py-3 bg-[#f0ede8] w-fit" style={{borderRadius:'2px'}}><div className="w-1.5 h-1.5 bg-[#999] rounded-full animate-bounce"/><div className="w-1.5 h-1.5 bg-[#999] rounded-full animate-bounce" style={{animationDelay:'0.15s'}}/><div className="w-1.5 h-1.5 bg-[#999] rounded-full animate-bounce" style={{animationDelay:'0.3s'}}/></div>}
        <div ref={endRef}/>
      </div>
      <div className="pt-4">
        <div className="flex gap-2 overflow-x-auto pb-3" style={{scrollbarWidth:'none'}}>
          {quickQs.map(q=><button key={q} onClick={()=>sendMessage(q)} disabled={typing} className="whitespace-nowrap px-3 py-1.5 border border-[#ddd] text-[11px] uppercase tracking-[0.05em] text-[#666] hover:border-[#0D0D0D] hover:text-[#0D0D0D] transition-colors flex-shrink-0">{q}</button>)}
        </div>
        <form onSubmit={e=>{e.preventDefault();sendMessage(input);}} className="flex gap-3">
          <input value={input} onChange={e=>setInput(e.target.value)} disabled={typing} placeholder="Ask about Indian elections..." className="flex-1 py-3 border-b border-[#ccc] bg-transparent text-[14px] focus:border-[#0D0D0D] focus:outline-none"/>
          <button type="submit" disabled={typing||!input.trim()} className="bg-[#0D0D0D] text-white px-4 py-3 hover:bg-[#333] disabled:opacity-30 transition-colors"><Send size={16}/></button>
        </form>
      </div>
    </div>
  );
}
