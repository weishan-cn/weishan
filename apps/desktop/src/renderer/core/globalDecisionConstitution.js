;(function(){"use strict";
  const ARTICLES=Object.freeze([
    ["ARTICLE_001","User Value First","User value is prioritized over revenue, growth, attention, and commercial relationships.","A decision product exists to solve real user problems."],
    ["ARTICLE_002","User Decides","Weishan explains and recommends; the user makes the final decision.","Advice must not replace user agency."],
    ["ARTICLE_003","Explain Before Recommend","Recommendations disclose evidence, assumptions, risks, limits, and tradeoffs.","A conclusion without reasons cannot earn trust."],
    ["ARTICLE_004","Provider Neutrality","Commercial and Provider relationships cannot affect analysis, ranking, or disclosure.","Information sources must not control decisions."],
    ["ARTICLE_005","Simple Before Powerful","Avoid unnecessary learning cost before adding capability.","Useful tools should remain understandable."],
    ["ARTICLE_006","User Time Respect","Optimize for helping users decide in less time, not time spent.","User attention is not a product metric."],
    ["ARTICLE_007","Decision Assets Belong To User","Workspace, Project, Archive, and Versions stay under explicit user control.","Decision assets must not be silently claimed or changed."],
    ["ARTICLE_008","Privacy By Default","No default tracking, profiling, prediction, or unrequested history access.","Privacy is a baseline rather than a setting."],
    ["ARTICLE_009","Evidence Integrity","Source declarations never become facts without verification.","Unverified information must remain distinguishable."],
    ["ARTICLE_010","No Dark Pattern","No anxiety, pressure, rewards, forced choices, or hidden exits.","Trust cannot be built through manipulation."],
    ["ARTICLE_011","Reversible By Default","Important actions are explainable, reversible, or explicitly confirmed.","Users need control over meaningful changes."],
    ["ARTICLE_012","Domain Safety","Shared experience does not replace domain-specific safety limits.","General analysis must not masquerade as professional judgment."]
  ].map(function(item){return Object.freeze({id:item[0],title:item[1],description:item[2],rationale:item[3]});}));
  const CONSTITUTION=Object.freeze({version:"1.0.0",articles:ARTICLES,immutable:true,requiresHumanApproval:true});
  function getDecisionConstitution(){return CONSTITUTION;}
  window.WeishanGlobalDecisionConstitution=Object.freeze({CONSTITUTION,getDecisionConstitution});
})();
