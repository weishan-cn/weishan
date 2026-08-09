"use strict";
const assert=require("assert");
const fs=require("fs");
const vm=require("vm");
const sourcePath=require("path").join(__dirname,"..","..","apps","desktop","src","renderer","core","i18n.js");
let source=fs.readFileSync(sourcePath,"utf8");
source=source.replace(/\}\)\(\);\s*$/, "window.__i18nTables={zh,en,zhHant,languageOptions};})();");
function load(storeSeed, systemLanguage){
  const store=Object.assign({}, storeSeed); const events=[];
  const window={navigator:{language:systemLanguage||"en-US"},WeishanStore:{read:(key,fallback)=>Object.prototype.hasOwnProperty.call(store,key)?store[key]:fallback,write:(key,value)=>{store[key]=value;}},dispatchEvent:(event)=>events.push(event.type)};
  vm.runInNewContext(source,{window,CustomEvent:function(type){this.type=type;}});
  return { api:window.I18n, tables:window.__i18nTables, store, events };
}
const tests=[]; const test=(name,fn)=>tests.push([name,fn]);
test("exposes only three supported languages",()=>assert.deepEqual(load().api.getLanguageOptions().map((item)=>item.code),["zh","en","zh-Hant"]));
test("uses native names for every supported language",()=>assert.deepEqual(load().api.getLanguageOptions().map((item)=>item.nativeName),["中文（简体）","English","繁體中文"]));
test("unsupported system language falls back to English",()=>assert.equal(load({},"ja-JP").api.systemLanguage(),"en"));
test("traditional system language remains traditional",()=>assert.equal(load({},"zh-TW").api.systemLanguage(),"zh-Hant"));
["es","pt","fr","de","ja","ko","ru","ar","hi"].forEach((legacy)=>test("legacy "+legacy+" preference is migrated to English",()=>{const loaded=load({"settings.languageMode":"manual","settings.lang":legacy}); assert.equal(loaded.api.getLang(),"en"); assert.equal(loaded.store["settings.lang"],"en");}));
test("manual language changes dispatch without restart",()=>{const loaded=load(); loaded.api.setLang("zh-Hant"); assert.equal(loaded.api.getLang(),"zh-Hant"); assert.deepEqual(loaded.events,["weishan:lang"]);});
test("unknown manual language is never persisted",()=>{const loaded=load(); loaded.api.setLang("ja"); assert.equal(loaded.api.getLang(),"en"); assert.equal(loaded.store["settings.lang"],"en");});
test("every supported resource has every non-empty key",()=>{const {tables}=load(); const keys=Object.keys(tables.zh); [tables.en,tables.zhHant].forEach((table)=>keys.forEach((key)=>assert.equal(typeof table[key],"string",key+" must exist") || assert.notEqual(table[key],"",key+" must not be blank")));});
["zh","en","zh-Hant"].forEach((language)=>test(language+" has localized Home task statuses",()=>{const loaded=load(); loaded.api.setLang(language); assert.notEqual(loaded.api.t("homeTaskQueued"),"homeTaskQueued"); assert.notEqual(loaded.api.t("homeTaskFailed"),"homeTaskFailed");}));
test("Home preserves raw answers and user input",()=>{const home=fs.readFileSync(require("path").join(__dirname,"..","..","apps","desktop","src","renderer","routes","HomePage.js"),"utf8"); assert.match(home,/function displayAnswer\(task\)\{\s*return cleanAiDisplay\(task && task\.answer \|\| ""\);/); assert.match(home,/textarea id="commandInput"[^>]*>\$\{esc\(commandInputDraft\)\}/);});
test("Home task presenters use i18n keys",()=>{const home=fs.readFileSync(require("path").join(__dirname,"..","..","apps","desktop","src","renderer","routes","HomePage.js"),"utf8"); ["homeTaskQueued","homeTaskRunning","homeTaskVideoPreparing","homeTaskDone","homeTaskFailed","homeTaskNotCompleted"].forEach((key)=>assert.ok(home.includes('t("'+key+'")')));});
test("Commerce shell uses i18n chrome keys",()=>{const commerce=fs.readFileSync(require("path").join(__dirname,"..","..","apps","desktop","src","renderer","routes","CommerceAgentPage.js"),"utf8"); ["commerceTitle","commerceSearchLabel","commerceGenerate","commerceClearAll","commerceTaskList"].forEach((key)=>assert.ok(commerce.includes('t("'+key+'")')));});
tests.forEach(([,fn])=>fn()); console.log("I18N_TRUTHFULNESS_TESTS PASS "+tests.length);
