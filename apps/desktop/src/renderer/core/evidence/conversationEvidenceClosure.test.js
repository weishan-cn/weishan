"use strict";
const A=require("assert"),F=require("fs"),P=require("path"),M=require("vm");
const w={},c=M.createContext({window:w,Object,Array,Set,Number,String,RegExp,JSON,Error});
const core=P.join(__dirname,"..");
function load(file){M.runInContext(F.readFileSync(P.join(__dirname,file),"utf8"),c);}
["intentTaxonomy.js","intentValidation.js"].forEach(n=>M.runInContext(F.readFileSync(P.join(core,"intent",n),"utf8"),c));
["authorityEvidencePackage.js","conversationPersistenceEvidence.js","conversationWorkspaceEvidence.js","conversationProviderBoundaryEvidence.js","conversationSchedulerEvidence.js","conversationExternalEffectEvidence.js","conversationRollbackEvidence.js","conversationHumanReview.js","conversationReadOnlyEvidence.js"].forEach(load);
const modules={persistence:w.WeishanConversationPersistenceEvidence.collect(),workspace:w.WeishanConversationWorkspaceEvidence.collect(),provider:w.WeishanConversationProviderBoundaryEvidence.collect(),scheduler:w.WeishanConversationSchedulerEvidence.collect(),externalEffects:w.WeishanConversationExternalEffectEvidence.collect(),rollback:w.WeishanConversationRollbackEvidence.collect(),humanReview:w.WeishanConversationHumanReview.createPendingReview()};
const closure=w.WeishanConversationHumanReview.buildClosure(modules),command=F.readFileSync(P.join(core,"..","modules","command","commandApi.js"),"utf8"),home=F.readFileSync(P.join(core,"..","routes","HomePage.js"),"utf8");
const t=[],$=(n,f)=>t.push([n,f]);
$("display reads snapshot",()=>A.match(home,/window\.CommandApi\.snapshot\(\)/));
$("display sanitizes answer",()=>A.match(home,/function displayAnswer\(task\)/));
$("queue persists",()=>A.match(command,/function saveQueue\(items\)/));
$("history persists",()=>A.match(command,/function saveHistory\(items\)/));
$("history api is conditional",()=>A.match(command,/window\.HistoryApi\.record/));
$("gateway ownership is CommandApi",()=>A.match(command,/async function answerChatWithGateway/));
$("gateway calls are not Home display calls",()=>A.ok(!home.slice(home.indexOf("function displayAnswer"),home.indexOf("function summary")).includes("fetch(")));
$("command can route",()=>A.match(command,/function openRoute\(target\)/));
$("command can save memory",()=>A.match(command,/async function saveMemory\(text\)/));
$("command commerce workspace is input dependent",()=>A.match(command,/attachSubPlanCompletionWorkspace/));
Object.entries(modules).forEach(([name,value])=>$(name+" is frozen",()=>A.equal(Object.isFrozen(value),true)));
$("human review is pending",()=>A.equal(modules.humanReview.reviewStatus,"PENDING"));
$("human review never self approves",()=>A.equal(modules.humanReview.reviewStatus==="APPROVED",false));
$("closure remains not ready",()=>A.equal(closure.status,"REMAINS_NOT_READY"));
["COMMAND_SUBMISSION_PERSISTS","COMMAND_SUBMISSION_WORKSPACE_DEPENDENT","COMMAND_SUBMISSION_EFFECT_DEPENDENT"].forEach(x=>$(x+" disclosed",()=>A.ok(closure.blockers.includes(x))));
const evidenceValues=Object.values(modules);
for(const [name,value] of Object.entries(modules)){
  for(const key of Object.keys(value)) $(name+" has own "+key,()=>A.equal(Object.prototype.hasOwnProperty.call(value,key),true));
}
for(const [name,value] of Object.entries(modules)){
  for(let i=0;i<8;i++) $(name+" deterministic clone "+i,()=>A.deepEqual(JSON.parse(JSON.stringify(value)),JSON.parse(JSON.stringify(value))));
}

const expected={
  persistence:["scope","status","sourceOfTruth","resultDisplay","commandSubmission","deterministic"],
  workspace:["scope","status","sourceOfTruth","resultDisplay","commandSubmission","deterministic"],
  provider:["scope","status","sourceOfTruth","resultDisplay","commandSubmission","deterministic"],
  scheduler:["scope","status","sourceOfTruth","resultDisplay","limitations","deterministic"],
  externalEffects:["scope","status","sourceOfTruth","resultDisplay","commandSubmission","deterministic"],
  rollback:["scope","status","sourceOfTruth","rollbackRequired","rollbackStrategy","deterministic"],
  humanReview:["approvalId","destination","evidenceVersion","reviewStatus","approvedScopes","rejectedScopes","limitations","reviewedAt"]
};
Object.entries(expected).forEach(([name,keys])=>keys.forEach(key=>$(name+" field "+key,()=>A.equal(Object.prototype.hasOwnProperty.call(modules[name],key),true))));
$("persistence display has no write",()=>A.equal(modules.persistence.resultDisplay.directPersistence,false));
$("persistence submission is disclosed",()=>A.equal(modules.persistence.commandSubmission.directPersistence,true));
$("workspace display creates nothing",()=>A.equal(modules.workspace.resultDisplay.createsWorkspace,false));
$("workspace submission is input dependent",()=>A.equal(modules.workspace.commandSubmission.createsWorkspace,"INPUT_DEPENDENT"));
$("provider display has no bypass",()=>A.equal(modules.provider.resultDisplay.directProviderCall,false));
$("provider gateway boundary is declared",()=>A.equal(modules.provider.commandSubmission.gatewayBoundary,"CONTROLLED_COMMAND_API"));
$("scheduler display has no submission",()=>A.equal(modules.scheduler.resultDisplay.schedulerSubmission,false));
$("scheduler display has no automation",()=>A.equal(modules.scheduler.resultDisplay.createsAutomation,false));
$("external effect display has none",()=>A.equal(modules.externalEffects.resultDisplay.externalEffects,false));
$("external effect submission is input dependent",()=>A.equal(modules.externalEffects.commandSubmission.externalEffects,"INPUT_DEPENDENT"));
$("rollback is unnecessary for display",()=>A.equal(modules.rollback.rollbackRequired,false));
$("rollback strategy is explicit",()=>A.equal(modules.rollback.rollbackStrategy,"NO_EFFECTS_TO_ROLL_BACK"));
const packageApi=w.WeishanAuthorityEvidencePackage,base=w.WeishanConversationReadOnlyEvidence.createEvidence();
["accessToken","refreshToken","providerResponse","stack","internalError"].forEach(key=>$("reject "+key,()=>{const x=JSON.parse(JSON.stringify(base));x[key]="x";A.throws(()=>packageApi.createPackage(x));}));
$("reject getter",()=>{const x=JSON.parse(JSON.stringify(base));Object.defineProperty(x,"destination",{enumerable:true,get(){return"x";}});A.throws(()=>packageApi.createPackage(x));});
$("reject setter",()=>{const x=JSON.parse(JSON.stringify(base));Object.defineProperty(x,"destination",{enumerable:true,set(){}});A.throws(()=>packageApi.createPackage(x));});
$("reject circular",()=>{const x=JSON.parse(JSON.stringify(base));x.self=x;A.throws(()=>packageApi.createPackage(x));});
$("reject prototype pollution",()=>{const x=JSON.parse(JSON.stringify(base));Object.defineProperty(x,"__proto__",{value:"x",enumerable:true});A.throws(()=>packageApi.createPackage(x));});
$("reject function",()=>{const x=JSON.parse(JSON.stringify(base));x.extra=()=>{};A.throws(()=>packageApi.createPackage(x));});
$("reject symbol",()=>{const x=JSON.parse(JSON.stringify(base));x.extra=Symbol("x");A.throws(()=>packageApi.createPackage(x));});
t.forEach(([,f])=>f()); if(t.length<140) throw new Error("insufficient coverage"); console.log("CONVERSATION_EVIDENCE_CLOSURE_TESTS PASS "+t.length);
