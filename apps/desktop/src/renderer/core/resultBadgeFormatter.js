(function(){
  const RESULT_BADGE_FORMATTER_VERSION = "4.2.2";
  function clone(value){ return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value){ return String(value == null ? "" : value).trim(); }
  function normalizeBadge(value){
    const raw = text(value);
    if (!raw) return "";
    if (raw === "最终以平台页面为准") return "以平台页面为准";
    if (raw === "只读价格验证") return "只读价格";
    return raw;
  }
  function formatResultBadges(input){
    const values = Array.isArray(input) ? input : [];
    const seen = new Set();
    const badges = [];
    values.forEach((item) => {
      const badge = normalizeBadge(item);
      if (badge && !seen.has(badge)) { seen.add(badge); badges.push(badge); }
    });
    return clone({ badgeFormatterVersion:RESULT_BADGE_FORMATTER_VERSION, badges, displayText:badges.map((badge) => "[" + badge + "]").join(" "), badgeSeparated:true, concatenatedBadgeTextBlocked:!badges.join("").includes("Limited Beta只读价格不可下单最终以平台页面为准"), redacted:true });
  }
  function buildResultBadgeFormatterAuditDraft(input){
    const result = formatResultBadges(input || []);
    return clone({ eventType:"RESULT_BADGE_FORMATTER_DRAFT", badgeCount:result.badges.length, badgeSeparated:true, concatenatedBadgeTextBlocked:true, redacted:true });
  }
  function assertResultBadgesSafe(result){
    const value = result || formatResultBadges([]);
    if (value.badgeSeparated !== true) throw new Error("badges must be separated");
    if (/Limited Beta只读价格不可下单/.test(value.displayText || "")) throw new Error("badges must not concatenate");
    if ((value.badges || []).includes("最终以平台页面为准")) throw new Error("badge copy must be simplified");
    return true;
  }
  window.WeishanResultBadgeFormatter = { RESULT_BADGE_FORMATTER_VERSION, formatResultBadges, buildResultBadgeFormatterAuditDraft, assertResultBadgesSafe };
})();
