(function(){
  function clone(value){return JSON.parse(JSON.stringify(value));}
  function createVideoSimulationSnapshots(){const rows=[];return{record:(state)=>{const snapshot=Object.freeze(clone(state));rows.push(snapshot);return snapshot;},list:()=>rows.slice(),reset:()=>{rows.splice(0);}};}
  window.WeishanVideoSimulationSnapshots={createVideoSimulationSnapshots};
})();
