import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ShieldAlert, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { PARTY_DATA, SCENARIOS, STATES, ELECTION_TIMELINE, GLOSSARY } from '../data';
import { supabase } from '../supabaseClient';

// Party reference: name, abbreviation, color. Used as the "ballot" options.
const getParties = (stateName) => {
  const raw = PARTY_DATA[stateName] || PARTY_DATA["_default"];
  // Return party metadata without the old mock percentage
  return raw.map(p => ({ abbr: p.a, name: p.n, color: p.c }));
};

// --- ELECTION SIMULATOR (LIVE from Supabase) ---
export function ElectionSimPage({ state }) {
  const userState = state.user?.state || 'Delhi';
  const userId = state.user?.id;
  const [selState, setSelState] = useState(userState);
  const [voted, setVoted] = useState(null);       // index of selected party
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState([]);      // aggregated from DB
  const [loading, setLoading] = useState(true);
  const [voteError, setVoteError] = useState('');
  const [hasVotedHere, setHasVotedHere] = useState(false);

  // When voting, force the party list to be for the user's state
  const parties = getParties(userState);

  // Fetch aggregated vote results for the selected state
  const fetchResults = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('votes')
      .select('party_abbr, party_name, party_color')
      .eq('location', selState);

    if (error) { setLoading(false); return; }

    // Aggregate counts
    const counts = {};
    (data || []).forEach(v => {
      if (!counts[v.party_abbr]) counts[v.party_abbr] = { abbr: v.party_abbr, name: v.party_name, color: v.party_color, count: 0 };
      counts[v.party_abbr].count++;
    });

    const total = (data || []).length;
    // Build results: include all parties from reference, merge DB counts
    const merged = parties.map(p => {
      const dbEntry = counts[p.abbr];
      const count = dbEntry ? dbEntry.count : 0;
      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
      const seats = total > 0 ? Math.round((count / total) * 80) : 0;
      return { a: p.abbr, n: p.name, c: p.color, count, pct, seats };
    }).sort((a, b) => b.count - a.count);

    setResults(merged);
    setLoading(false);
  }, [selState]);

  // Check if user already voted in THEIR state
  const checkExistingVote = useCallback(async () => {
    if (!userId) { setHasVotedHere(false); return; }
    const { data } = await supabase
      .from('votes')
      .select('id')
      .eq('user_id', userId)
      .eq('location', userState)
      .limit(1);
    setHasVotedHere(data && data.length > 0);
  }, [userId, userState]);

  // Initial fetch + subscribe to real-time changes
  useEffect(() => {
    fetchResults();
    checkExistingVote();

    // Real-time subscription
    const channel = supabase
      .channel(`votes-${selState}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'votes', filter: `location=eq.${selState}` }, () => {
        fetchResults();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selState, fetchResults, checkExistingVote]);

  const handleSubmit = async () => {
    if (voted === null || !userId) return;
    setVoteError('');
    const party = parties[voted];

    const { error } = await supabase
      .from('votes')
      .insert({
        user_id: userId,
        party_name: party.name,
        party_abbr: party.abbr,
        party_color: party.color,
        location: userState // Force the vote to their own state
      });

    if (error) {
      if (error.code === '23505') { // unique constraint violation
        setVoteError('You have already voted in this state.');
        setHasVotedHere(true);
      } else {
        setVoteError('Failed to submit vote. Please try again.');
        // Error logged server-side via Supabase dashboard
      }
      return;
    }

    setSubmitted(true);
    setHasVotedHere(true);
    await fetchResults();
  };

  const changeState = (s) => { setSelState(s); setVoted(null); setSubmitted(false); setVoteError(''); };
  const totalVotes = results.reduce((s, r) => s + r.count, 0);

  // --- RESULTS VIEW ---
  if (submitted || (hasVotedHere && !loading)) {
    return (
      <div className="max-w-[1100px] mx-auto px-6 py-32">
        <p className="text-[12px] uppercase tracking-[0.15em] text-[#999] mb-4">Live Results — {selState}</p>
        <h1 style={{ fontSize: 'clamp(2rem,5vw,3rem)', fontWeight: 900, letterSpacing: '-0.03em' }} className="text-[#0D0D0D] mb-4">SEAT DISTRIBUTION</h1>
        <div className="flex items-center gap-4 mb-12">
          <p className="text-[14px] text-[#666]">{totalVotes} total vote{totalVotes !== 1 ? 's' : ''} cast</p>
          <button onClick={fetchResults} className="text-[12px] text-[#999] hover:text-[#E8690A] flex items-center gap-1 transition-colors"><RefreshCw size={12} />Refresh</button>
        </div>
        {totalVotes === 0 ? (
          <p className="text-[15px] text-[#999]">No votes recorded yet for {selState}.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-16">
            <div>
              <h3 className="text-[12px] uppercase tracking-[0.15em] text-[#999] mb-6">Simulated Seats (out of 80)</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={results.filter(r => r.count > 0)} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#999' }} />
                    <YAxis dataKey="a" type="category" width={50} tick={{ fontSize: 12, fill: '#444' }} />
                    <Tooltip contentStyle={{ borderRadius: 0, border: '1px solid #E0E0E0', boxShadow: 'none', fontSize: 13 }} formatter={(v, n, p) => [`${p.payload.count} votes (${p.payload.pct}%)`, 'Seats']} />
                    <Bar dataKey="seats" radius={[0, 2, 2, 0]}>
                      {results.filter(r => r.count > 0).map((r, i) => <Cell key={i} fill={r.c} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div>
              <h3 className="text-[12px] uppercase tracking-[0.15em] text-[#999] mb-6">Vote Share</h3>
              <div className="h-[250px] flex justify-center">
                <PieChart width={220} height={220}>
                  <Pie data={results.filter(r => r.count > 0)} dataKey="pct" nameKey="a" cx="50%" cy="50%" outerRadius={90} strokeWidth={1} stroke="#F5F3EF">
                    {results.filter(r => r.count > 0).map((r, i) => <Cell key={i} fill={r.c} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 0, fontSize: 12 }} />
                </PieChart>
              </div>
              <div className="mt-4 space-y-2">
                {results.filter(r => r.count > 0).slice(0, 5).map((r, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-3 h-3" style={{ backgroundColor: r.c }} />
                    <span className="text-[13px] text-[#666] flex-1">{r.a} — {r.n}</span>
                    <span className="text-[13px] font-medium">{r.pct}% ({r.count})</span>
                    {i === 0 && <span className="text-[10px] uppercase tracking-[0.1em] bg-[#0D0D0D] text-white px-2 py-0.5">Leading</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        <div className="border-t border-[#E0E0E0] mt-16 pt-8">
          <p className="text-[13px] text-[#999] leading-[1.7]">This is a live mock election simulator for educational purposes only. It does not represent actual election data, predictions, or endorsements of any political party.</p>
          <div className="flex gap-4 mt-6">
            <select value={selState} onChange={e => changeState(e.target.value)} className="py-3 border-b border-[#ccc] bg-transparent text-[15px] focus:border-[#0D0D0D] focus:outline-none pr-8">
              {STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>
    );
  }

  // --- VOTING VIEW ---
  // Users can only vote in THEIR state
  return (
    <div className="max-w-[1100px] mx-auto px-6 py-32">
      <p className="text-[12px] uppercase tracking-[0.15em] text-[#999] mb-4">Simulate</p>
      <h1 style={{ fontSize: 'clamp(2rem,5vw,3.5rem)', fontWeight: 900, letterSpacing: '-0.03em' }} className="text-[#0D0D0D] mb-4">LIVE ELECTION SIMULATOR</h1>
      <p className="text-[15px] font-light text-[#666] mb-12 max-w-xl">Cast your vote and see live results from all participants. You can only vote in your registered state. This is a live, data-driven educational exercise.</p>

      <div className="mb-12">
        <label className="text-[12px] uppercase tracking-[0.15em] text-[#999] block mb-3">Voting in</label>
        <p className="py-3 border-b border-[#ccc] bg-transparent text-[15px] font-medium text-[#0D0D0D]">{userState}</p>
      </div>

      <div className="border-t border-[#E0E0E0] pt-8">
        <h3 className="text-[12px] uppercase tracking-[0.15em] text-[#999] mb-8">Select a party to cast your vote</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-0">
          {parties.map((p, i) => (
            <button key={i} onClick={() => setVoted(i)} className={`text-left p-6 border border-[#E0E0E0] -ml-px -mt-px transition-all ${voted === i ? 'bg-[#0D0D0D] text-white' : 'hover:bg-[#f0ede8]'}`}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                <span style={{ fontSize: '1.3rem', fontWeight: 900, letterSpacing: '-0.02em' }}>{p.abbr}</span>
              </div>
              <p className={`text-[13px] font-light ${voted === i ? 'text-[#999]' : 'text-[#999]'}`}>{p.name}</p>
            </button>
          ))}
        </div>
        {voteError && <p className="mt-4 text-[13px] text-red-600">{voteError}</p>}
        {voted !== null && (
          <button onClick={handleSubmit} className="mt-8 bg-[#0D0D0D] text-white px-10 py-3 text-[13px] uppercase tracking-[0.1em] hover:bg-[#333] transition-colors">Submit Vote →</button>
        )}
      </div>
      <p className="mt-12 text-[12px] text-[#bbb] uppercase tracking-[0.1em]">Live simulator — votes are stored in real-time database</p>
    </div>
  );
}

// --- SCENARIOS ---
export function ScenariosPage() {
  const [openIdx, setOpenIdx] = useState(-1);
  return (
    <div className="max-w-[900px] mx-auto px-6 py-32">
      <div className="border border-[#E0E0E0] p-4 mb-12 flex items-center justify-center gap-3">
        <ShieldAlert size={16} className="text-[#E8690A]" />
        <span className="text-[13px] font-medium">ECI Helpline: 1950 — Toll-free — Available on election day</span>
      </div>
      <p className="text-[12px] uppercase tracking-[0.15em] text-[#999] mb-4">Troubleshoot</p>
      <h1 style={{ fontSize: 'clamp(2rem,5vw,3.5rem)', fontWeight: 900, letterSpacing: '-0.03em' }} className="text-[#0D0D0D] mb-12">ELECTION DAY PROBLEMS — SOLVED</h1>
      <div className="border-t border-[#E0E0E0]">
        {SCENARIOS.map((sc, i) => (
          <div key={i} className="border-b border-[#E0E0E0]">
            <button onClick={() => setOpenIdx(openIdx === i ? -1 : i)} className="w-full flex items-center gap-4 py-5 text-left hover:text-[#E8690A] transition-colors">
              <span className="text-[13px] text-[#bbb] font-mono w-8">{String(i + 1).padStart(2, '0')}</span>
              <span className="text-[15px] font-medium flex-1">{sc.q}</span>
              <ChevronDown size={14} className={`text-[#999] transition-transform ${openIdx === i ? 'rotate-180' : ''}`} />
            </button>
            {openIdx === i && (
              <div className="pb-6 pl-12">
                <ol className="space-y-2">
                  {sc.s.map((st, j) => <li key={j} className="text-[14px] font-light leading-[1.7] text-[#666] flex gap-3"><span className="text-[#bbb] font-mono text-[12px] mt-0.5">{j + 1}.</span>{st}</li>)}
                </ol>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// --- LEARN ---
export function LearnPage() {
  const [activeTab, setActiveTab] = useState(0);
  const tabs = ["Overview", "Parliament", "Voting Process", "Key Bodies", "Glossary", "Women in Elections"];

  return (
    <div className="max-w-[1100px] mx-auto px-6 py-32">
      <p className="text-[12px] uppercase tracking-[0.15em] text-[#999] mb-4">Reference</p>
      <h1 style={{ fontSize: 'clamp(2rem,5vw,3.5rem)', fontWeight: 900, letterSpacing: '-0.03em' }} className="text-[#0D0D0D] mb-12">CIVIC LIBRARY</h1>

      <div className="flex gap-6 border-b border-[#E0E0E0] mb-12 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {tabs.map((t, i) => (
          <button key={i} onClick={() => setActiveTab(i)} className={`pb-3 text-[13px] uppercase tracking-[0.08em] whitespace-nowrap transition-colors ${activeTab === i ? 'text-[#0D0D0D] border-b border-[#0D0D0D]' : 'text-[#999] hover:text-[#666]'}`}>{t}</button>
        ))}
      </div>

      {activeTab === 0 && (
        <div>
          <div className="grid md:grid-cols-2 gap-12 mb-16">
            <p className="text-[15px] font-light leading-[1.8] text-[#666]">India is a parliamentary democratic republic. Elections are held at national (Lok Sabha), state (Vidhan Sabha), and local (Panchayat/Municipality) levels. Universal adult suffrage ensures every citizen aged 18+ can vote.</p>
            <p className="text-[15px] font-light leading-[1.8] text-[#666]">India conducts the world's largest democratic exercise. The 2024 General Election saw 96.8 crore registered voters across 543 constituencies, managed by over 1.5 crore election officials.</p>
          </div>
          <h3 className="text-[12px] uppercase tracking-[0.15em] text-[#999] mb-8">Key Milestones</h3>
          <div className="border-l border-[#E0E0E0] ml-4">
            {ELECTION_TIMELINE.map((t, i) => (
              <div key={i} className="flex items-start gap-6 pb-6 pl-8 relative">
                <div className="absolute left-[-4px] top-1 w-2 h-2 bg-[#0D0D0D] rounded-full" />
                <span className="text-[14px] font-mono text-[#999] w-12 flex-shrink-0">{t.year}</span>
                <p className="text-[14px] font-light text-[#666]">{t.event}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 1 && (
        <div>
          <div className="grid md:grid-cols-2 gap-12 mb-12">
            <p className="text-[15px] font-light leading-[1.8] text-[#666]">Parliament comprises the President and two Houses. The Lok Sabha (Lower House) has 543 elected members serving 5-year terms. The Rajya Sabha (Upper House) has 245 members with 6-year terms, one-third retiring every two years.</p>
            <p className="text-[15px] font-light leading-[1.8] text-[#666]">The Lok Sabha can be dissolved by the President on PM's advice. Rajya Sabha is a permanent body and cannot be dissolved. Money bills can only originate in Lok Sabha.</p>
          </div>
          <div className="border border-[#E0E0E0] p-8">
            <p className="text-[12px] uppercase tracking-[0.15em] text-[#999] mb-6 text-center">Parliament Structure</p>
            <div className="text-center mb-6"><span className="text-[15px] font-medium border border-[#E0E0E0] px-6 py-2 inline-block">President of India</span></div>
            <div className="flex justify-center gap-8">
              <div className="border border-[#E0E0E0] p-6 flex-1 max-w-[250px]">
                <p className="text-[14px] font-medium mb-2">Lok Sabha</p>
                <p className="text-[13px] text-[#999]">543 elected seats</p>
                <p className="text-[13px] text-[#999]">5-year term</p>
                <p className="text-[13px] text-[#999]">Can be dissolved</p>
              </div>
              <div className="border border-[#E0E0E0] p-6 flex-1 max-w-[250px]">
                <p className="text-[14px] font-medium mb-2">Rajya Sabha</p>
                <p className="text-[13px] text-[#999]">245 members</p>
                <p className="text-[13px] text-[#999]">6-year term</p>
                <p className="text-[13px] text-[#999]">Permanent body</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-0 border border-[#E0E0E0] mt-8">
            {[["543","Lok Sabha Seats"],["245","Rajya Sabha Members"],["5 yrs","Lok Sabha Term"],["6 yrs","Rajya Sabha Term"],["18+","Voting Age"],["25+","Candidate Age (LS)"]].map(([n,l],i)=>(
              <div key={i} className="p-6 border-b border-r border-[#E0E0E0]">
                <p style={{fontSize:'1.8rem',fontWeight:900,letterSpacing:'-0.02em'}} className="text-[#0D0D0D]">{n}</p>
                <p className="text-[12px] text-[#999] mt-1">{l}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 2 && (
        <div>
          <p className="text-[15px] font-light leading-[1.8] text-[#666] mb-12 max-w-2xl">Voting uses Electronic Voting Machines (EVMs) with Voter Verifiable Paper Audit Trail (VVPAT). Elections are held in multiple phases for security and logistics.</p>
          <h3 className="text-[12px] uppercase tracking-[0.15em] text-[#999] mb-8">Inside the Polling Booth</h3>
          <div className="border-t border-[#E0E0E0]">
            {["Enter the polling station with valid photo ID","Officer verifies your identity against voter list","Indelible ink is applied to your left index finger","Proceed to the EVM behind the voting screen","Press the button next to your chosen candidate","VVPAT slip displays for 7 seconds — verify your choice","Exit the polling station"].map((s,i)=>(
              <div key={i} className="flex items-center gap-6 py-4 border-b border-[#E0E0E0]">
                <span className="text-[13px] font-mono text-[#bbb] w-8">{String(i+1).padStart(2,'0')}</span>
                <p className="text-[14px] font-light text-[#666]">{s}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 3 && (
        <div>
          <div className="grid md:grid-cols-2 gap-12 mb-12">
            <p className="text-[15px] font-light leading-[1.8] text-[#666]">The Election Commission of India (ECI) is an autonomous constitutional body established under Article 324. It consists of the Chief Election Commissioner and two Election Commissioners, appointed by the President.</p>
            <p className="text-[15px] font-light leading-[1.8] text-[#666]">The ECI has the power to announce election schedules, enforce the Model Code of Conduct, register political parties, and ensure free and fair elections. It operates independently of the executive.</p>
          </div>
          <h3 className="text-[12px] uppercase tracking-[0.15em] text-[#999] mb-6">Key Officials</h3>
          {[["CEO","Chief Electoral Officer — heads election machinery at state level"],["RO","Returning Officer — oversees election conduct in a constituency"],["ERO","Electoral Registration Officer — maintains voter rolls"],["BLO","Booth Level Officer — grassroots official for voter data and outreach"]].map(([title,desc],i)=>(
            <div key={i} className="flex gap-6 py-4 border-b border-[#E0E0E0]">
              <span className="text-[14px] font-medium w-12">{title}</span>
              <p className="text-[14px] font-light text-[#666]">{desc}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 4 && (
        <div className="border-t border-[#E0E0E0]">
          {GLOSSARY.map((g, i) => (
            <div key={i} className="flex gap-8 py-4 border-b border-[#E0E0E0]">
              <span className="text-[14px] font-medium w-36 flex-shrink-0">{g.term}</span>
              <p className="text-[14px] font-light text-[#666]">{g.def}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 5 && (
        <div>
          <div className="grid md:grid-cols-2 gap-12 mb-12">
            <p className="text-[15px] font-light leading-[1.8] text-[#666]">Women's participation in Indian elections has grown steadily. In the 2024 elections, women voter turnout reached near parity with men in several states, with states like Manipur and Meghalaya recording higher women turnout.</p>
            <p className="text-[15px] font-light leading-[1.8] text-[#666]">The 18th Lok Sabha has 74 women MPs (13.6% of 543). While increasing, this remains below global averages. India ranks 141st globally in women's parliamentary representation.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border border-[#E0E0E0]">
            {[["74","Women MPs (18th LS)"],["13.6%","Of Lok Sabha"],["67.2%","Women Turnout 2024"],["33%","Reserved (Nari Shakti Act)"]].map(([n,l],i)=>(
              <div key={i} className="p-6 border-b border-r border-[#E0E0E0]">
                <p style={{fontSize:'1.5rem',fontWeight:900,letterSpacing:'-0.02em'}} className="text-[#0D0D0D]">{n}</p>
                <p className="text-[12px] text-[#999] mt-1">{l}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
