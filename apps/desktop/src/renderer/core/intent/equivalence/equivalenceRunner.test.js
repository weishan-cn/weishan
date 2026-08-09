"use strict";
const A=require("assert"),F=require("fs"),P=require("path"),M=require("vm"),d=P.resolve(__dirname,"..");
const c=M.createContext({window:{},Date,Object,Array,Set,Number,String,RegExp,JSON,Error});
["intentTaxonomy.js","intentValidation.js","intentEnvelope.js","intentRules.js","intentClassifier.js","equivalence/authoritativeOutcome.js","equivalence/authoritativeNormalization.js","equivalence/equivalenceCase.js","equivalence/equivalenceRunner.js"].forEach(function(f){M.runInContext(F.readFileSync(P.join(d,f),"utf8"),c)});
const r=c.window.WeishanEquivalenceRunner;
function cas(o){return Object.assign({caseId:"r-1",language:"zh-Hans",category:"CONVERSATION",rawInput:"你好",source:"HOME",explicitContext:{synthetic:true},capabilitySnapshot:[],expectedSafetyProperties:[],authoritativeSystems:["FALLBACK"],notes:"x"},o||{})}
function out(o){return Object.assign({schemaVersion:"1.0",caseId:"r-1",sourceSystem:"FALLBACK",rawInput:"你好",primaryIntent:"CONVERSATION",secondaryIntents:[],destination:"CONVERSATION",requiresUserConfirmation:false,confirmationReasons:[],clarification:{status:"NONE",questions:[]},capabilityAvailability:{status:"UNKNOWN"},routeProposal:"",executionProposed:false,persistenceProposed:false,externalEffectProposed:false,evidence:["x"],limitations:[],createdAt:"2026-01-01T00:00:00.000Z"},o||{})}
let t=[];function $(n,f){t.push([n,f])}
$("exact",function(){A.equal(r.runEquivalenceCase(cas(),out()).dimensions.primary,"MATCH")});
$("missing",function(){A.equal(r.runEquivalenceCase(cas(),null).dimensions.codes[0],"AUTHORITATIVE_NOT_COMPARABLE")});
$("intent mismatch",function(){A.equal(r.runEquivalenceCase(cas(),out({primaryIntent:"SEARCH"})).dimensions.primary,"MISMATCH")});
$("destination mismatch",function(){A.equal(r.runEquivalenceCase(cas(),out({destination:"SEARCH"})).dimensions.destination,"MISMATCH")});
$("confirmation weaker",function(){A.equal(r.runEquivalenceCase(cas(),out({requiresUserConfirmation:true,confirmationReasons:["EXECUTION"]})).dimensions.confirmation,"SHADOW_WEAKER")});
$("clarification under",function(){A.equal(r.runEquivalenceCase(cas(),out({clarification:{status:"REQUIRED",questions:["x"]}})).dimensions.clarification,"SHADOW_UNDER_ASKS")});
$("capability mismatch",function(){A.equal(r.runEquivalenceCase(cas(),out({capabilityAvailability:{status:"DISABLED"}})).dimensions.capability,"MISMATCH")});
$("safe freeze",function(){A.equal(Object.isFrozen(r.runEquivalenceCase(cas(),out())),true)});
Array.from({length:32},function(_,i){$("deterministic "+i,function(){A.deepEqual(r.runEquivalenceCase(cas(),out()),r.runEquivalenceCase(cas(),out()))})});
t.forEach(function(pair){pair[1]()});console.log("EQUIVALENCE_RUNNER_TESTS PASS "+t.length);
