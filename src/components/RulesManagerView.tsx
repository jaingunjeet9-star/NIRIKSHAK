import { useState, useMemo } from 'react';
import { BookOpen, Search, Play, Sparkles, RotateCcw, ShieldCheck, CheckCircle2, AlertOctagon, AlertTriangle, Layers, Flame } from 'lucide-react';
import { STATUTORY_RULES, CRITICAL_RULE_CATEGORIES, isRuleCritical } from '../engine/rules';
import { StatutoryRule, ProductCategory, ComplianceFinding } from '../types';
import { evaluateCompliance } from '../engine/evaluator';
import { useTranslation } from '../lib/i18n';
import { COMMODITY_SCHEMAS, SUPPORTED_SANDBOX_CATEGORIES, getCategorySchema } from '../config/categorySchemas';

export function RulesManagerView() {
  const { t } = useTranslation();

  // Active Category State for Sandbox & Rules Browser
  const [testCategory, setTestCategory] = useState<ProductCategory>('PERSONAL_CARE_COSMETIC');
  const currentSchema = useMemo(() => getCategorySchema(testCategory), [testCategory]);

  // Form State: dynamic key-value map initialized with the category's pristine sample product
  const [formFields, setFormFields] = useState<Record<string, any>>(() => ({
    ...COMMODITY_SCHEMAS['PERSONAL_CARE_COSMETIC'].sampleProduct,
  }));

  // Browser State
  const [actScopeFilter, setActScopeFilter] = useState<string>('CATEGORY_RULES');
  const [criticalOnly, setCriticalOnly] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Sandbox Result State (strictly category-isolated)
  const [sandboxResult, setSandboxResult] = useState<{
    score: number;
    findings: ComplianceFinding[];
    summaryCounts: any;
  } | null>(null);

  // Filter rules for the left panel based on current category and actScopeFilter
  const filteredRules = useMemo(() => {
    return STATUTORY_RULES.filter((r) => {
      // 0. Criticality filter
      if (criticalOnly && !isRuleCritical(r)) {
        return false;
      }

      // 1. Category relevance
      let matchesScope = true;
      if (actScopeFilter === 'CATEGORY_RULES') {
        matchesScope = r.applicableCategories.includes(testCategory);
      } else if (actScopeFilter === 'ALL') {
        matchesScope = true;
      } else {
        // Specific act filter (e.g. LM_PC_2011, COSMETICS_RULES_2020, etc.)
        matchesScope = r.actName.includes(actScopeFilter) || r.applicableCategories.includes(testCategory);
      }

      // 2. Search query match
      const matchesSearch =
        searchTerm.trim() === '' ||
        r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.sectionRef.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.ruleId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.ruleCategory && r.ruleCategory.toLowerCase().includes(searchTerm.toLowerCase())) ||
        r.actName.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesScope && matchesSearch;
    });
  }, [testCategory, actScopeFilter, criticalOnly, searchTerm]);

  const [selectedRule, setSelectedRule] = useState<StatutoryRule | null>(() => {
    return STATUTORY_RULES.find((r) => r.applicableCategories.includes('PERSONAL_CARE_COSMETIC')) || STATUTORY_RULES[0];
  });

  // Strict Category Switching Handler: Clears stale state, validation, and previous results
  const handleCategorySwitch = (newCategory: ProductCategory) => {
    setTestCategory(newCategory);
    const newSchema = getCategorySchema(newCategory);

    // 1. Immediately wipe previous form values and load new category sample
    setFormFields({ ...newSchema.sampleProduct });

    // 2. Immediately wipe previous evaluation results
    setSandboxResult(null);

    // 3. Reset left rules filter to newly selected category rules
    setActScopeFilter('CATEGORY_RULES');
    setSearchTerm('');

    // 4. Update selected rule to first applicable rule in new category
    const firstRule = STATUTORY_RULES.find((r) => r.applicableCategories.includes(newCategory));
    if (firstRule) {
      setSelectedRule(firstRule);
    }
  };

  // Field value change handler
  const handleFieldChange = (key: string, value: any) => {
    setFormFields((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Reset form to active category sample defaults
  const handleResetForm = () => {
    setFormFields({ ...currentSchema.sampleProduct });
    setSandboxResult(null);
  };

  // Run Sandbox Evaluation
  const handleRunSandbox = () => {
    // Construct clean extractedFields containing only the values defined in the current schema
    const cleanFields: Record<string, any> = {};
    for (const field of currentSchema.fields) {
      if (formFields[field.key] !== undefined && formFields[field.key] !== '') {
        cleanFields[field.key] = formFields[field.key];
      }
    }

    // Evaluate compliance using deterministic engine
    const evaluation = evaluateCompliance(cleanFields as any, testCategory, false);

    // Extra safety guarantee: filter findings strictly by rules applicable to this category
    const categoryFindings = evaluation.findings.filter((f) => {
      const rule = STATUTORY_RULES.find((r) => r.ruleId === f.ruleId);
      return !rule || rule.applicableCategories.includes(testCategory);
    });

    setSandboxResult({
      score: evaluation.score,
      findings: categoryFindings,
      summaryCounts: evaluation.summaryCounts,
    });
  };

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 md:px-10 py-6 md:py-8 space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E7E3DC] pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#EBF3EE] border border-[#C7DECF] rounded-lg mb-2">
            <BookOpen className="w-3.5 h-3.5 text-[#52796F]" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#335E46]">
              {t('rules.badgeRules')}
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#2D322E] tracking-tight">
            {t('rules.title')}
          </h2>
          <p className="text-xs md:text-sm text-[#535953] mt-1">
            Category-aware statutory validation sandbox &amp; metrological rules repository under Indian consumer law.
          </p>
        </div>

        {/* Category Selector In Header */}
        <div className="flex items-center gap-3 bg-[#FAF8F5] border border-[#E7E3DC] p-2 rounded-xl">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#2D322E] pl-2">
            <Layers className="w-4 h-4 text-[#52796F]" />
            <span className="hidden sm:inline">{t('rules.catCategory')}:</span>
          </div>
          <select
            id="sandbox-category-selector"
            value={testCategory}
            onChange={(e) => handleCategorySwitch(e.target.value as ProductCategory)}
            className="h-9 px-3 bg-white border border-[#E7E3DC] rounded-lg text-xs font-semibold text-[#2D322E] focus:outline-none focus:border-[#52796F] cursor-pointer shadow-2xs"
          >
            {SUPPORTED_SANDBOX_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {COMMODITY_SCHEMAS[cat]?.displayName || cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Category Statutory Frameworks Banner */}
      <div className="p-4 bg-white border border-[#E7E3DC] rounded-2xl shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#2D322E]">Governing Statutory Frameworks for</span>
            <span className="px-2.5 py-0.5 bg-[#EBF3EE] text-[#335E46] text-xs font-bold rounded-md border border-[#C7DECF]">
              {currentSchema.displayName}
            </span>
          </div>
          <p className="text-xs text-[#535953]">
            {currentSchema.shortDescription}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {currentSchema.applicableActs.map((act) => (
            <div
              key={act.actCode}
              className="px-3 py-1.5 bg-[#FAF8F5] border border-[#E7E3DC] rounded-xl text-xs space-y-0.5"
            >
              <div className="font-bold text-[#2D322E] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#52796F]" />
                <span>{act.sectionRef}</span>
              </div>
              <div className="text-[10px] text-[#7A827B] max-w-[220px] truncate">{act.actTitle}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
        {/* Left Column: Rules Browser (6 Cols) */}
        <div className="lg:col-span-6 bg-white border border-[#E7E3DC] rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-[#E7E3DC] pb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#52796F]" />
              <h3 className="text-sm font-bold text-[#2D322E]">Statutory Rules Browser</h3>
            </div>
            <span className="text-xs font-mono text-[#7A827B]">
              {filteredRules.length} {filteredRules.length === 1 ? 'rule' : 'rules'} active
            </span>
          </div>

          {/* Act Scope Filters */}
          <div className="flex flex-wrap gap-1.5 p-1 bg-[#FAF8F5] rounded-xl border border-[#E7E3DC]">
            <button
              type="button"
              onClick={() => setActScopeFilter('CATEGORY_RULES')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                actScopeFilter === 'CATEGORY_RULES'
                  ? 'bg-white text-[#335E46] shadow-2xs border border-[#E7E3DC]'
                  : 'text-[#535953] hover:text-[#2D322E]'
              }`}
            >
              {currentSchema.displayName} Rules
            </button>
            {currentSchema.applicableActs.map((act) => (
              <button
                key={act.actCode}
                type="button"
                onClick={() => setActScopeFilter(act.actCode)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  actScopeFilter === act.actCode
                    ? 'bg-white text-[#335E46] shadow-2xs border border-[#E7E3DC]'
                    : 'text-[#535953] hover:text-[#2D322E]'
                }`}
              >
                {act.sectionRef}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setActScopeFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                actScopeFilter === 'ALL' && !criticalOnly
                  ? 'bg-white text-[#335E46] shadow-2xs border border-[#E7E3DC]'
                  : 'text-[#7A827B] hover:text-[#2D322E]'
              }`}
            >
              All Acts (Reference)
            </button>
            <button
              type="button"
              onClick={() => setCriticalOnly(!criticalOnly)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                criticalOnly
                  ? 'bg-[#FAECE7] text-[#9E432A] shadow-2xs border border-[#F7D0C4]'
                  : 'text-[#9E432A] hover:bg-[#FAECE7]/50'
              }`}
            >
              <Flame className="w-3 h-3" />
              <span>Critical Only</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-[#7A827B] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t('rules.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-9 pl-9 pr-3 bg-[#FAF8F5] border border-[#E7E3DC] rounded-lg text-xs focus:outline-none focus:border-[#52796F]"
            />
          </div>

          {/* Rules List */}
          <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
            {filteredRules.length === 0 ? (
              <div className="p-8 text-center bg-[#FAF8F5] rounded-xl border border-dashed border-[#E7E3DC] text-xs text-[#7A827B]">
                No statutory rules match your search for this commodity.
              </div>
            ) : (
              filteredRules.map((rule) => (
                <div
                  key={rule.ruleId}
                  onClick={() => setSelectedRule(rule)}
                  className={`p-4 rounded-xl border text-xs cursor-pointer transition-all ${
                    selectedRule?.ruleId === rule.ruleId
                      ? 'bg-[#FAF8F5] border-[#52796F] ring-1 ring-[#52796F]'
                      : 'bg-white border-[#E7E3DC] hover:border-[#DFDBD3]'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-[#335E46] bg-[#EBF3EE] px-2 py-0.5 rounded border border-[#C7DECF]">
                        {rule.sectionRef}
                      </span>
                      <span className="font-bold text-[#2D322E]">
                        {t('ruleTitles.' + rule.ruleId, rule.title)}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-[#7A827B] flex-shrink-0">{rule.ruleId}</span>
                  </div>

                  {/* Defined Category & Criticality Tags (Section 15) */}
                  <div className="flex items-center gap-1.5 my-1.5 flex-wrap">
                    {rule.ruleCategory && (
                      <span className="font-mono text-[9px] font-bold text-[#535953] bg-[#FAF8F5] px-1.5 py-0.5 rounded border border-[#E7E3DC]">
                        Cat: {rule.ruleCategory}
                      </span>
                    )}
                    {isRuleCritical(rule) && (
                      <span className="font-mono text-[9px] font-bold text-[#9E432A] bg-[#FAECE7] px-1.5 py-0.5 rounded border border-[#F7D0C4] flex items-center gap-1">
                        <Flame className="w-2.5 h-2.5" />
                        <span>CRITICAL CATEGORY</span>
                      </span>
                    )}
                  </div>

                  <p className="text-[#535953] mt-1 leading-relaxed">
                    {t('ruleDescriptions.' + rule.ruleId, rule.description)}
                  </p>
                  <div className="mt-2 pt-2 border-t border-[#E7E3DC] flex justify-between text-[11px] text-[#7A827B]">
                    <span>{t('rules.actLabel')} {rule.actName}</span>
                    <span className="font-semibold text-[#8C5E2D]">
                      {t('rules.penaltyLabel')} {rule.statutoryPenaltyRef || t('rules.penaltyDefault')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Category-Aware Testing Sandbox (6 Cols) */}
        <div className="lg:col-span-6 bg-white border border-[#E7E3DC] rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-[#E7E3DC] pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#52796F]" />
              <h3 className="text-sm font-bold text-[#2D322E]">{t('rules.sandboxHeader')}</h3>
            </div>
            <button
              type="button"
              onClick={handleResetForm}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#7A827B] hover:text-[#2D322E] px-2 py-1 rounded hover:bg-[#FAF8F5] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Defaults</span>
            </button>
          </div>

          <p className="text-xs text-[#535953]">
            Evaluate hypothetical package declarations strictly against statutory mandates applicable to{' '}
            <strong className="text-[#2D322E]">{currentSchema.displayName}</strong>.
          </p>

          {/* Dynamically Rendered Form Derived from Category Schema */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {currentSchema.fields.map((field) => {
              const isColSpan2 = field.gridSpan === 2;
              return (
                <div key={field.key} className={isColSpan2 ? 'sm:col-span-2' : ''}>
                  <label className="block text-[11px] font-bold text-[#7A827B] uppercase mb-1">
                    {t(field.labelKey, field.defaultLabel)}
                    {field.required && <span className="text-[#9E432A] ml-0.5">*</span>}
                  </label>

                  {field.type === 'select' ? (
                    <select
                      value={formFields[field.key] ?? field.defaultValue ?? ''}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      className="w-full h-10 px-3 bg-[#FAF8F5] border border-[#E7E3DC] rounded-lg text-xs font-medium text-[#2D322E] focus:outline-none focus:border-[#52796F]"
                    >
                      {field.options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : field.type === 'number' ? (
                    <input
                      type="number"
                      value={formFields[field.key] ?? field.defaultValue ?? ''}
                      placeholder={field.placeholder}
                      onChange={(e) => handleFieldChange(field.key, e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full h-10 px-3 bg-[#FAF8F5] border border-[#E7E3DC] rounded-lg text-xs font-mono font-bold text-[#8C5E2D] focus:outline-none focus:border-[#52796F]"
                    />
                  ) : (
                    <input
                      type="text"
                      value={formFields[field.key] ?? field.defaultValue ?? ''}
                      placeholder={field.placeholder}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      className="w-full h-10 px-3 bg-[#FAF8F5] border border-[#E7E3DC] rounded-lg text-xs font-mono text-[#2D322E] focus:outline-none focus:border-[#52796F]"
                    />
                  )}

                  {field.helpText && (
                    <span className="text-[10px] text-[#7A827B] mt-0.5 block leading-tight">
                      {field.helpText}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <button
            type="button"
            id="run-sandbox-btn"
            onClick={handleRunSandbox}
            className="w-full h-11 bg-[#52796F] hover:bg-[#45665E] active:bg-[#3B5750] text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <Play className="w-4 h-4" />
            <span>{t('rules.evaluateBtn')} for {currentSchema.displayName}</span>
          </button>

          {/* Sandbox Evaluation Output */}
          {sandboxResult && (
            <div className="p-4 bg-[#FAF8F5] border border-[#E7E3DC] rounded-xl text-xs space-y-4">
              <div className="flex justify-between items-center border-b border-[#E7E3DC] pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A827B] block">
                    Statutory Compliance Score
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-xl font-bold text-[#335E46]">
                      {sandboxResult.score}/100
                    </span>
                    <span className="text-[11px] text-[#535953]">
                      ({sandboxResult.findings.length} applicable rules evaluated)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 bg-[#EBF3EE] text-[#335E46] text-[10px] font-bold rounded border border-[#C7DECF]">
                    {sandboxResult.summaryCounts?.verified ?? 0} Verified
                  </span>
                  <span className="px-2 py-0.5 bg-[#FAECE7] text-[#9E432A] text-[10px] font-bold rounded border border-[#F7D0C4]">
                    {sandboxResult.summaryCounts?.potentialIssues ?? 0} Issues
                  </span>
                </div>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {sandboxResult.findings.length === 0 ? (
                  <div className="p-3 text-center text-[#7A827B]">
                    No rule findings generated.
                  </div>
                ) : (
                  sandboxResult.findings.map((f: any) => (
                    <div
                      key={f.id}
                      className={`p-3 rounded-xl border text-[11px] space-y-1 ${
                        f.status === 'VERIFIED'
                          ? 'bg-white border-[#C7DECF] text-[#335E46]'
                          : f.status === 'VIOLATION' || f.status === 'POTENTIAL_ISSUE'
                          ? 'bg-[#FAECE7] border-[#F7D0C4] text-[#9E432A]'
                          : 'bg-[#FBF3E8] border-[#EED9C4] text-[#8C5E2D]'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="font-semibold">
                          <span className="font-mono font-bold mr-1.5">[{f.sectionRef}]</span>
                          <span>{t('ruleTitles.' + f.ruleId, f.title)}</span>
                        </div>
                        <span className="font-mono text-[10px] font-bold uppercase">
                          {f.status === 'VERIFIED' ? '✓ PASS' : f.status === 'VIOLATION' ? '✗ VIOLATION' : '! REVIEW'}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#535953] flex items-center gap-2">
                        <span>Act: {f.actName}</span>
                        <span>•</span>
                        <span className="font-mono">{f.detectedText}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
