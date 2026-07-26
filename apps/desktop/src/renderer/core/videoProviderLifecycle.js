(function(){
  const TRANSITIONS={initialize:["ready","dispose"],ready:["busy","dispose"],busy:["ready","dispose"],dispose:[]};
  function createVideoProviderLifecycle(){let state="initialize";function move(next){if(!TRANSITIONS[state].includes(next))return false;state=next;return true;}return{getState:()=>state,ready:()=>move("ready"),busy:()=>move("busy"),dispose:()=>state==="dispose"?true:move("dispose")};}
  window.WeishanVideoProviderLifecycle={createVideoProviderLifecycle};
})();
