"use strict";
const A=require("assert"),F=require("fs"),P=require("path"),M=require("vm"),d=P.resolve(__dirname,"..");
const c=M.createContext({window:{},Date,Object,Array,Set,Number,String,RegExp,JSON,Error});
["intentTaxonomy.js","intentValidation.js","intentEnvelope.js","intentRules.js","intentClassifier.js","equivalence/authoritativeOutcome.js","equivalence/equivalenceCase.js","equivalence/equivalenceCorpus.js"].forEach(function(f){M.runInContext(F.readFileSync(P.join(d,f),"utf8"),c)});
const o=c.window.WeishanAuthoritativeOutcome,q=c.window.WeishanEquivalenceCase;
function base(){return {schemaVersion:"1.0",caseId:"x",sourceSystem:"FALLBACK",rawInput:"x",primaryIntent:"CONVERSATION",secondaryIntents:[],destination:"CONVERSATION",requiresUserConfirmation:false,confirmationReasons:[],clarification:{status:"NONE",questions:[]},capabilityAvailability:{status:"UNKNOWN"},routeProposal:"",executionProposed:false,persistenceProposed:false,externalEffectProposed:false,evidence:["x"],limitations:[],createdAt:"2026-01-01T00:00:00.000Z"}}
function bad(x){A.equal(o.isAuthoritativeOutcome(x),false)}
let t=[];function $(n,f){t.push([n,f])}
$("getter",function(){let x=base();Object.defineProperty(x,"rawInput",{get:function(){return"x"}});bad(x)});
$("setter",function(){let x=base();Object.defineProperty(x,"caseId",{set:function(){}});bad(x)});
$("circular",function(){let x=base();x.evidence.push(x);bad(x)});
$("pollution",function(){let x=base();Object.defineProperty(x,"__proto__",{value:"x",enumerable:true});bad(x)});
$("function",function(){let x=base();x.evidence=[function(){}];bad(x)});
$("symbol",function(){let x=base();x[Symbol("x")]=1;bad(x)});
$("nonfinite",function(){let x=base();x.evidence=[Infinity];bad(x)});
["secret","token","credential","authorization","endpoint","header"].forEach(function(k){$(k,function(){let x=base();x[k]="x";bad(x)})});
$("oversized clarification",function(){let x=base();x.clarification={status:"REQUIRED",questions:["1","2","3","4"]};bad(x)});
$("bad enum",function(){let x=base();x.primaryIntent="BAD";bad(x)});
$("case invalid",function(){A.equal(q.isEquivalenceCase({}),false)});
$("source isolation",function(){let r=/require\s*\(|import\s|HomePage|commandApi|ipcRenderer|electron|https?:/i;["authoritativeOutcome.js","authoritativeAdapters.js","authoritativeNormalization.js","equivalenceCase.js","equivalenceCorpus.js","equivalenceRunner.js","equivalenceMetrics.js","equivalencePolicy.js","equivalenceReport.js"].forEach(function(f){A.equal(r.test(F.readFileSync(P.join(__dirname,f),"utf8")),false,f)})});
Array.from({length:12},function(_,i){$("immutable "+i,function(){A.equal(Object.isFrozen(o.createAuthoritativeOutcome(base())),true)})});
t.forEach(function(pair){pair[1]()});console.log("EQUIVALENCE_SECURITY_TESTS PASS "+t.length);
