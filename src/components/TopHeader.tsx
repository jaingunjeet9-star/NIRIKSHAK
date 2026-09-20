import { useState } from 'react';
import { Shield, Crop, AlertCircle, BadgeCheck, ShieldAlert, BookOpen, Bot, Languages, Phone, ChevronDown, User, FlaskConical } from 'lucide-react';
import { useTranslation } from '../lib/i18n';
import { useUserSession, ROLE_LABELS, ROLE_COLORS, DEMO_USERS } from '../lib/userSession';

export type ActiveTab = 'scanner' | 'overview' | 'history' | 'reviews' | 'risk' | 'rules' | 'assistant';

interface TopHeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  pendingReviewCount: number;
  language: 'EN' | 'HI';
  setLanguage: (lang: 'EN' | 'HI') => void;
  onOpenAssistant: () => void;
  showDemoData?: boolean;
  onToggleDemoData?: () => void;
}

export function TopHeader({
  activeTab,
  setActiveTab,
  pendingReviewCount,
  language,
  setLanguage,
  onOpenAssistant,
  showDemoData = false,
  onToggleDemoData,
}: TopHeaderProps) {
  const { t } = useTranslation();
  const { currentUser, setCurrentUser, logoutInspector } = useUserSession();
  const [showRolePicker, setShowRolePicker] = useState(false);

  const roleColors = ROLE_COLORS[currentUser.role];

  return (
    <header className="w-full flex flex-col sticky top-0 z-40">
      {/* Top Announcement Strip */}
      <aside className="w-full bg-[#F6F4EE] border-b border-[#E7E3DC] px-4 md:px-10 py-2 text-[#535953] flex items-center justify-between text-[11px] tracking-wide font-medium">
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-[#52796F]" />
          <span className="uppercase tracking-wider">
            {t('nav.ministryName')}
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-4 font-mono text-[11px]">
          <span className="inline-flex items-center gap-1.5 text-[#335E46] bg-[#EBF3EE] px-2.5 py-0.5 rounded border border-[#C7DECF]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#52796F] inline-block animate-pulse"></span>
            {t('nav.portalActive')}
          </span>
          <span className="text-[#DFDBD3]">|</span>
          <span className="text-[#7A827B]">{t('nav.stationNode')}</span>
        </div>
      </aside>

      {/* Main Navigation Bar */}
      <div className="w-full px-4 md:px-10 h-16 flex items-center justify-between border-b border-[#E7E3DC] bg-[#FAF8F5]/95 backdrop-blur-sm">
        {/* Brand Cluster */}
        <div className="flex items-center gap-6 lg:gap-8">
          <button
            type="button"
            onClick={() => setActiveTab('scanner')}
            className="flex items-center gap-3 group text-left focus:outline-none cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-[#52796F] text-white flex items-center justify-center shadow-xs">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-[19px] font-bold text-[#2D322E] tracking-tight leading-none">
                NIRIKSHAK
              </span>
              <span className="text-[10px] font-semibold text-[#7A827B] uppercase tracking-wider mt-0.5">
                {t('nav.verifierTitle')}
              </span>
            </div>
          </button>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 ml-2">
            <button
              type="button"
              onClick={() => setActiveTab('scanner')}
              className={`text-sm px-3.5 py-2 rounded-xl flex items-center gap-2 transition-colors cursor-pointer ${
                activeTab === 'scanner'
                  ? 'bg-[#EBF3EE] text-[#335E46] font-semibold border border-[#C7DECF]/80'
                  : 'text-[#535953] hover:text-[#2D322E] hover:bg-[#F2F0E8] font-medium'
              }`}
            >
              <Crop className="w-4 h-4 text-[#52796F]" />
              <span>{t('nav.scanner')}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`text-sm px-3.5 py-2 rounded-xl flex items-center gap-2 transition-colors cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-[#EBF3EE] text-[#335E46] font-semibold border border-[#C7DECF]/80'
                  : 'text-[#535953] hover:text-[#2D322E] hover:bg-[#F2F0E8] font-medium'
              }`}
            >
              <BadgeCheck className="w-4 h-4" />
              <span>{t('nav.overview')}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('reviews')}
              className={`text-sm px-3.5 py-2 rounded-xl flex items-center gap-2 transition-colors cursor-pointer ${
                activeTab === 'reviews'
                  ? 'bg-[#EBF3EE] text-[#335E46] font-semibold border border-[#C7DECF]/80'
                  : 'text-[#535953] hover:text-[#2D322E] hover:bg-[#F2F0E8] font-medium'
              }`}
            >
              <AlertCircle className="w-4 h-4 text-[#9E432A]" />
              <span>{t('nav.alerts')}</span>
              {pendingReviewCount > 0 && (
                <span className="ml-0.5 px-2 py-0.2 bg-[#FAECE7] text-[#9E432A] font-mono text-[11px] font-semibold rounded border border-[#F7D0C4]">
                  {pendingReviewCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('risk')}
              className={`text-sm px-3.5 py-2 rounded-xl flex items-center gap-2 transition-colors cursor-pointer ${
                activeTab === 'risk'
                  ? 'bg-[#EBF3EE] text-[#335E46] font-semibold border border-[#C7DECF]/80'
                  : 'text-[#535953] hover:text-[#2D322E] hover:bg-[#F2F0E8] font-medium'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-[#8C5E2D]" />
              <span>{t('nav.riskCenter')}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('rules')}
              className={`text-sm px-3.5 py-2 rounded-xl flex items-center gap-2 transition-colors cursor-pointer ${
                activeTab === 'rules'
                  ? 'bg-[#EBF3EE] text-[#335E46] font-semibold border border-[#C7DECF]/80'
                  : 'text-[#535953] hover:text-[#2D322E] hover:bg-[#F2F0E8] font-medium'
              }`}
            >
              <BookOpen className="w-4 h-4 text-[#52796F]" />
              <span>{t('nav.rules')}</span>
            </button>
          </nav>
        </div>

        {/* Trailing Actions Cluster */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Demo Data Mode Toggle per Section 41 */}
          {onToggleDemoData && (
            <button
              type="button"
              id="btn-toggle-demo-data"
              onClick={onToggleDemoData}
              className={`h-10 px-3 border rounded-xl flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer text-xs font-semibold ${
                showDemoData
                  ? 'bg-[#FEF3C7] border-[#F59E0B] text-[#92400E] hover:bg-[#FDE68A]'
                  : 'bg-white border-[#E7E3DC] text-[#7A827B] hover:bg-[#F6F4EE] hover:text-[#2D322E]'
              }`}
              title={showDemoData ? 'Demo Data Mode Active (Section 41) — Click to hide sample presets' : 'Load Demo Data Mode (Section 41)'}
            >
              <FlaskConical className={`w-3.5 h-3.5 ${showDemoData ? 'text-[#D97706]' : 'text-[#7A827B]'}`} />
              <span className="hidden sm:inline">
                {showDemoData ? 'Demo Data: ON' : 'Load Demo Data'}
              </span>
              {showDemoData && (
                <span className="px-1.5 py-0.2 text-[9px] font-bold bg-[#F59E0B] text-white rounded font-mono">
                  DEMO
                </span>
              )}
            </button>
          )}

          {/* Compliance Assistant Trigger */}
          <button
            type="button"
            onClick={onOpenAssistant}
            className="h-10 px-3 bg-white border border-[#E7E3DC] hover:bg-[#F6F4EE] text-[#335E46] text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <Bot className="w-4 h-4 text-[#52796F]" />
            <span className="hidden sm:inline">{t('nav.aiAssistant')}</span>
          </button>

          {/* Language Switch Button */}
          <button
            type="button"
            onClick={() => setLanguage(language === 'EN' ? 'HI' : 'EN')}
            className="h-10 px-3 bg-white border border-[#E7E3DC] hover:border-[#DFDBD3] hover:bg-[#F6F4EE] text-[#535953] text-xs font-mono rounded-xl flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <Languages className="w-3.5 h-3.5 text-[#52796F]" />
            <span className={language === 'EN' ? 'font-bold text-[#335E46]' : 'text-[#7A827B]'}>EN</span>
            <span className="text-[#DFDBD3]">/</span>
            <span className={language === 'HI' ? 'font-bold text-[#335E46]' : 'text-[#7A827B]'}>HI</span>
          </button>

          {/* Helpdesk Callout */}
          <div className="hidden lg:flex items-center gap-2.5 px-3.5 py-1.5 bg-white border border-[#E7E3DC] rounded-xl shadow-xs">
            <Phone className="w-4 h-4 text-[#52796F]" />
            <div className="flex flex-col text-left">
              <span className="text-[9px] text-[#7A827B] uppercase font-bold tracking-wider leading-none">
                {t('nav.helpdesk')}
              </span>
              <span className="font-mono text-xs font-bold text-[#2D322E] leading-none mt-1">
                1800-11-4000
              </span>
            </div>
          </div>

          {/* ── Role / User Switcher (demo) ── */}
          <div className="relative border-l border-[#E7E3DC] pl-2.5 ml-1">
            <button
              type="button"
              id="role-switcher-btn"
              onClick={() => setShowRolePicker((v) => !v)}
              className="h-10 px-3 bg-white border border-[#E7E3DC] hover:bg-[#F6F4EE] rounded-xl flex items-center gap-2 shadow-xs cursor-pointer transition-colors"
              title={t('nav.switchUserTitle')}
            >
              <User className="w-4 h-4 text-[#52796F]" />
              <div className="hidden sm:flex flex-col text-left leading-none">
                <span className="text-[10px] font-bold text-[#2D322E] truncate max-w-[90px]">{currentUser.name}</span>
                <span
                  className="text-[9px] font-semibold uppercase tracking-wide mt-0.5 px-1.5 py-0.5 rounded"
                  style={{ background: roleColors.bg, color: roleColors.text, border: `1px solid ${roleColors.border}` }}
                >
                  {ROLE_LABELS[currentUser.role]}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#7A827B]" />
            </button>

            {showRolePicker && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowRolePicker(false)}
                />
                {/* Dropdown */}
                <div className="absolute right-0 top-12 z-50 w-72 bg-white border border-[#E7E3DC] rounded-2xl shadow-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#E7E3DC] bg-[#FAF8F5]">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#7A827B]">{t('nav.switchUserTitle')}</p>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#EBF3EE] text-[#335E46] border border-[#C7DECF] font-semibold">DEMO ROLES</span>
                    </div>
                    <p className="text-[10px] text-[#7A827B] mt-1">{t('nav.rolePermissionHint')}</p>
                  </div>

                  {/* Role options */}
                  <div className="py-1 divide-y divide-[#E7E3DC]/60 max-h-72 overflow-y-auto">
                    {DEMO_USERS.map((user) => {
                      const isCurrent = currentUser.id === user.id || currentUser.role === user.role;
                      const colors = ROLE_COLORS[user.role];
                      const canDel = user.role === 'ADMINISTRATOR' || user.role === 'SUPERVISOR';

                      return (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => {
                            setCurrentUser(user);
                            setShowRolePicker(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 flex items-start justify-between gap-2 transition-colors cursor-pointer ${
                            isCurrent ? 'bg-[#F6F4EE]' : 'hover:bg-[#FAF8F5]'
                          }`}
                        >
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-[#2D322E]">{user.name}</span>
                              {isCurrent && <span className="text-[10px] text-[#335E46] font-bold">✓ Active</span>}
                            </div>
                            <span className="text-[10px] text-[#7A827B] font-mono">{user.officerId}</span>
                            <span className="text-[9px] text-[#535953] mt-0.5">
                              {canDel ? '✓ Can delete inspection records' : '✗ Cannot delete records (view/review only)'}
                            </span>
                          </div>
                          <span
                            className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5"
                            style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}
                          >
                            {ROLE_LABELS[user.role]}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="px-4 py-2.5 border-t border-[#E7E3DC] bg-[#FAF8F5] flex items-center justify-between">
                    <span className="text-[10px] text-[#7A827B] font-mono">{currentUser.stationNode}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setShowRolePicker(false);
                        window.history.replaceState({}, '', '/inspector/login');
                        logoutInspector();
                      }}
                      className="text-xs font-semibold text-[#9E432A] hover:text-[#7F3422] cursor-pointer"
                    >
                      {currentUser.isDemo ? 'Exit Demo' : 'Logout'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
