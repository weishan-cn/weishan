(function(){
  const RULES=Object.freeze([
    Object.freeze({intent:"AUTOMATION",destination:"AUTOMATION",capability:"automation",phrases:[/每天|定时|提醒我|通知我|自动发布|每s*day|schedule|remind me|automate/i],confirmation:"AUTOMATION"}),
    Object.freeze({intent:"PLUGIN",destination:"PLUGIN_WORKSPACE",capability:"plugin.video",phrases:[/视频插件|ocr\s*插件|调用.*插件|用.*插件|生成.*短片|做个视频|video plugin|ocr plugin|use .*plugin/i],confirmation:"EXECUTION"}),
    Object.freeze({intent:"COMMERCE",destination:"COMMERCE_WORKSPACE",capability:"commerce",phrases:[/买|购买|价格|酒店|机票|商品|iphone|checkout|payment|purchase|hotel|flight|price|buy/i]}),
    Object.freeze({intent:"DECISION",destination:"DECISION_WORKSPACE",capability:"decision",phrases:[/比较|选哪个|选择.*方案|给出建议|compare|which .*choose|recommend/i]}),
    Object.freeze({intent:"PLANNING",destination:"CONVERSATION",capability:"",phrases:[/制定.*计划|规划.*步骤|计划|规划|plan|roadmap/i]}),
    Object.freeze({intent:"REVIEW",destination:"CONVERSATION",capability:"",phrases:[/检查.*漏洞|审查|评审|review|audit/i]}),
    Object.freeze({intent:"SEARCH",destination:"SEARCH",capability:"search",phrases:[/搜索|查找|检索|search|find/i]}),
    Object.freeze({intent:"QUESTION",destination:"CONVERSATION",capability:"",phrases:[/什么是|解释一下|为什么|怎么|\?|？|what is|explain|why|how/i]}),
    Object.freeze({intent:"CONVERSATION",destination:"CONVERSATION",capability:"",phrases:[/你好|聊聊|你怎么看|hello|hi|chat/i]})
  ]);
  function match(raw){const text=String(raw||"");return Object.freeze(RULES.filter(rule=>rule.phrases.some(pattern=>pattern.test(text))).map(rule=>Object.freeze({intent:rule.intent,destination:rule.destination,capability:rule.capability,confirmation:rule.confirmation||""})));}
  function has(text,pattern){return pattern.test(String(text||""));}
  window.WeishanIntentRules=Object.freeze({match,has});
})();
