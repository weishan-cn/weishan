(function(){
  const BAD=/token|secret|apikey|credential|password|endpoint|baseurl|url|path|authorization|cookie|requestclient|sdkclient|httpclient|networkclient|processenv|environment|providerclient|privatekey|clientsecret/i;
  function ownName(key){return typeof key==="string"?!BAD.test(key):false;}
  function safe(value,seen){if(value===null||["string","number","boolean"].includes(typeof value))return true;if(typeof value!=="object")return false;const visited=seen||new Set();if(visited.has(value))return false;visited.add(value);if(Array.isArray(value))return Reflect.ownKeys(value).every((key)=>typeof key==="string"&&key!=="length"&&ownName(key)&&safeDescriptor(value,key,visited));const proto=Object.getPrototypeOf(value),constructor=proto&&Object.getOwnPropertyDescriptor(proto,"constructor");if(proto!==null&&(!constructor||typeof constructor.value!=="function"||Object.getPrototypeOf(proto)!==null))return false;return Reflect.ownKeys(value).every((key)=>ownName(key)&&key!=="__proto__"&&key!=="prototype"&&key!=="constructor"&&safeDescriptor(value,key,visited));}
  function safeDescriptor(value,key,seen){const descriptor=Object.getOwnPropertyDescriptor(value,key);return !!descriptor&&!descriptor.get&&!descriptor.set&&safe(descriptor.value,seen);}
  function certifyVideoProviderSecurity(value){const passed=safe(value);return Object.freeze({status:passed?"passed":"failed",code:passed?"SECURITY_OK":"SECURITY_REJECTED",message:passed?"安全验证通过":"安全验证未通过"});}
  window.WeishanVideoProviderSecurityCertification={safe,certifyVideoProviderSecurity};
})();
