"use strict";
const A=require("assert");
const F=require("fs");
const P=require("path");
const M=require("vm");
const w={};
const c=M.createContext({window:w,Object,Array,Set,Number,String,RegExp,JSON,Error,Math,Date});
const intent=P.join(__dirname,"..","intent");
["intentTaxonomy.js","intentValidation.js"].forEach(n=>M.runInContext(F.readFileSync(P.join(intent,n),"utf8"),c));
["conversationReplayFixtures.js","conversationProductionReplay.js","conversationReplayHarness.js","conversationReplayOutcome.js","conversationShadowComparator.js"].forEach(n=>M.runInContext(F.readFileSync(P.join(__dirname,n),"utf8"),c));
const command=F.readFileSync(P.join(__dirname,"..","..","modules","command","commandApi.js"),"utf8");
const commandWindow={WeishanDispatchRouter:{createDispatchPlan(){return null;}}};
const commandContext=M.createContext({window:commandWindow,Object,Array,Set,Number,String,RegExp,JSON,Error,Math,Date});
M.runInContext(command,commandContext);
const classify=commandWindow.CommandApi.classify;
const fixtures=w.WeishanConversationReplayFixtures.create();
const harness=w.WeishanConversationReplayHarness;
const comparator=w.WeishanConversationShadowComparator;
const outcomeApi=w.WeishanConversationReplayOutcome;
const tests=[];
const test=(name,fn)=>tests.push([name,fn]);
const shadow={executionGate:"CLOSED",authorizesExecution:false};
test("one hundred fixtures",()=>A.equal(fixtures.length,100));
test("existing classifier exposed",()=>A.equal(typeof classify,"function"));
test("no queue before",()=>A.equal(commandWindow.CommandApi.snapshot().queue.length,0));
const outcomes=fixtures.map(fixture=>harness.run(fixture,{classify}));
fixtures.forEach((fixture,index)=>{
  const result=outcomes[index].outcome;
  test(fixture.scenarioId+" route",()=>A.equal(result.routeProposal.route,fixture.expectedRoute));
  test(fixture.scenarioId+" isolation",()=>A.equal(outcomes[index].mutationScan,"CLEAN"));
  test(fixture.scenarioId+" state",()=>A.equal(result.status,fixture.replayable?"REPLAYED":"NOT_REPLAYABLE"));
});
test("no queue after",()=>A.equal(commandWindow.CommandApi.snapshot().queue.length,0));
test("no history after",()=>A.equal(commandWindow.CommandApi.snapshot().history.length,0));
const comparisons=outcomes.map(item=>comparator.compare(item.outcome,shadow));
comparisons.forEach((comparison,index)=>test("comparison "+index,()=>A.equal(comparison.status,outcomes[index].outcome.status==="NOT_REPLAYABLE"?"NOT_REPLAYABLE":"NOT_COMPARABLE")));
const summary=outcomeApi.summarize(outcomes.map(item=>item.outcome));
test("sixty replayed",()=>A.equal(summary.counts.replayed,60));
test("forty not replayable",()=>A.equal(summary.counts.notReplayable,40));
test("no mutation",()=>A.equal(summary.counts.mutationInvalid,0));
test("closed gate",()=>A.equal(summary.executionGate,"CLOSED"));
test("no authorization",()=>A.equal(summary.authorizesExecution,false));
const invalidCases=[
  ["getter",x=>Object.defineProperty(x,"text",{enumerable:true,get(){return "x";}})],
  ["setter",x=>Object.defineProperty(x,"text",{enumerable:true,set(){}})],
  ["function",x=>{x.text=()=>"x";}],
  ["symbol",x=>{x.text=Symbol("x");}],
  ["circular",x=>{x.self=x;}],
  ["prototype",x=>Object.defineProperty(x,"__proto__",{enumerable:true,value:"x"})],
  ["sensitive",x=>{x.accessToken="x";}]
];
invalidCases.forEach(([name,mutate])=>test("reject "+name,()=>{
  const input=JSON.parse(JSON.stringify(fixtures[0]));
  mutate(input);
  A.throws(()=>harness.run(input,{classify}));
}));
for(let index=0;index<10;index++)test("deterministic "+index,()=>{ const first=JSON.parse(JSON.stringify(harness.run(fixtures[0],{classify}))); const second=JSON.parse(JSON.stringify(harness.run(fixtures[0],{classify}))); A.deepEqual(first,second); });
tests.forEach(([,fn])=>fn());
if(tests.length<180)throw new Error("insufficient tests");
console.log("CONVERSATION_REPLAY_TESTS PASS "+tests.length);
