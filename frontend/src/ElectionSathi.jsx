import React, { useState } from 'react';
import { Menu, X, LogOut } from 'lucide-react';
import { LandingPage, AuthPage, OnboardingPage, DashboardPage, BrandLogo } from './pages/AuthPages';
import { VoterIdPage, QuizPage, BoothFinderPage, AIChatPage } from './pages/FeaturePages';
import { ElectionSimPage, ScenariosPage, LearnPage } from './pages/ContentPages';

const fontLink = document.createElement('link');
fontLink.href = 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;700;900&family=DM+Serif+Display&display=swap';
fontLink.rel = 'stylesheet';
document.head.appendChild(fontLink);

const globalStyle = document.createElement('style');
globalStyle.textContent = `
  * { font-family: 'DM Sans', sans-serif; }
  body { background: #F5F3EF; color: #0D0D0D; font-size: 15px; }
  .page-fade { animation: fadeIn 0.2s ease; }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
`;
document.head.appendChild(globalStyle);

export default function ElectionSathi() {
  const [state, setState] = useState({
    currentPage: "landing",
    isAuthenticated: false,
    hasCompletedOnboarding: false,
    user: null,
    chatHistory: [{ role: 'ai', text: "Namaste! I am Election Sathi — your guide to understanding India's election process. Ask me anything about voting, registration, or the ECI.", ts: new Date() }],
    quizState: { currentQ: 0, score: 0, showResult: false, answered: false, selectedIdx: -1 }
  });
  const [menuOpen, setMenuOpen] = useState(false);

  const navigate = (page) => { setState(p => ({ ...p, currentPage: page })); setMenuOpen(false); window.scrollTo(0, 0); };
  const updateUser = (data) => setState(p => ({ ...p, user: { ...p.user, ...data } }));
  const logout = () => setState({ currentPage: "landing", isAuthenticated: false, hasCompletedOnboarding: false, user: null, chatHistory: [state.chatHistory[0]], quizState: { currentQ: 0, score: 0, showResult: false, answered: false, selectedIdx: -1 } });

  const NAV_LINKS = [
    { name: "Home", key: "dashboard" },
    { name: "Voter ID", key: "voter-id" },
    { name: "Quiz", key: "quiz" },
    { name: "Booth", key: "booth-finder" },
    { name: "Chat", key: "ai-chat" },
    { name: "Simulator", key: "polls" },
    { name: "Scenarios", key: "scenarios" },
    { name: "Learn", key: "learn" }
  ];

  const Navbar = () => (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#F5F3EF]/95 backdrop-blur-sm border-b border-[#E8E8E8] h-14 flex items-center justify-between px-6 lg:px-10">
      <button onClick={() => navigate("dashboard")}><BrandLogo size="lg"/></button>
      <div className="hidden lg:flex items-center gap-1">
        {NAV_LINKS.map(l => (
          <button key={l.key} onClick={() => navigate(l.key)} className={`px-4 py-1.5 text-[13px] tracking-[0.05em] transition-colors ${state.currentPage === l.key ? 'text-[#0D0D0D] border-b border-[#E8690A]' : 'text-[#999] hover:text-[#0D0D0D]'}`}>{l.name}</button>
        ))}
      </div>
      <div className="hidden lg:flex items-center gap-4">
        <span className="text-[13px] text-[#999]">{state.user?.name}</span>
        <button onClick={logout} className="text-[#bbb] hover:text-[#E8690A] transition-colors"><LogOut size={15} /></button>
      </div>
      <button className="lg:hidden text-[#666]" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={20} /> : <Menu size={20} />}</button>
      {menuOpen && (
        <div className="absolute top-14 left-0 right-0 bg-[#F5F3EF] border-b border-[#E8E8E8] lg:hidden flex flex-col p-6 gap-1">
          <div className="pb-4 mb-4 border-b border-[#E0E0E0]">
            <p className="text-[14px] font-medium">{state.user?.name}</p>
            <p className="text-[12px] text-[#999]">{state.user?.email}</p>
          </div>
          {NAV_LINKS.map(l => (
            <button key={l.key} onClick={() => navigate(l.key)} className={`text-left py-3 text-[14px] tracking-[0.05em] ${state.currentPage === l.key ? 'text-[#E8690A]' : 'text-[#666]'}`}>{l.name}</button>
          ))}
          <button onClick={logout} className="text-left py-3 text-[14px] text-red-500 mt-4 border-t border-[#E0E0E0] pt-4">Logout</button>
        </div>
      )}
    </nav>
  );

  const renderPage = () => {
    const p = { state, setState, navigate, updateUser };
    switch (state.currentPage) {
      case "landing": return <LandingPage navigate={navigate} />;
      case "auth": return <AuthPage setState={setState} navigate={navigate} />;
      case "onboarding": return <OnboardingPage {...p} />;
      case "dashboard": return <DashboardPage state={state} navigate={navigate} />;
      case "voter-id": return <VoterIdPage />;
      case "quiz": return <QuizPage state={state} setState={setState} />;
      case "booth-finder": return <BoothFinderPage />;
      case "ai-chat": return <AIChatPage state={state} setState={setState} />;
      case "polls": return <ElectionSimPage state={state} />;
      case "scenarios": return <ScenariosPage />;
      case "learn": return <LearnPage />;
      default: return <LandingPage navigate={navigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F3EF]">
      {state.isAuthenticated && <Navbar />}
      <div key={state.currentPage} className="page-fade">
        {renderPage()}
      </div>
    </div>
  );
}
