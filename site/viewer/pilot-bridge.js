/* One-match pilot integration; no local file selection is needed. */
(function () {
  function notify(state, extra) {
    parent.postMessage(Object.assign({type:'pilot-status',state:state},extra || {}), location.origin);
  }
  C_MUSIC_TRACKS_BY_RACE = {0:[],1:[],2:[]};
  var runtimeReady = false;
  var pendingRead = false;
  var runtimeInitialized = Module.onRuntimeInitialized;
  Module.onRuntimeInitialized = function () {
    runtimeReady = true;
    if (runtimeInitialized) runtimeInitialized();
    if (pendingRead) { pendingRead = false; on_read_all_done(); }
  };
  // Separate self-hosted resources from the earlier upstream-hosted cache.
  set_db_handle = function (success) {
    if (!window.indexedDB) { fetch_default_mpqs(); return; }
    var request = indexedDB.open('ReplayLabSelfHosted_DB_v1',1);
    request.onupgradeneeded = function (event) { event.target.result.createObjectStore('mpqs',{keyPath:'mpqkp'}); };
    request.onsuccess = success;
    request.onerror = function () { fetch_default_mpqs(); };
  };
  fetch_default_mpqs = function () {
    if (is_fetching_default_mpqs || has_all_files()) return;
    is_fetching_default_mpqs = true;
    var loaded = [0,0,0];
    var expected = [66184491,23519727,636958];
    var total = expected.reduce(function(a,b){return a+b;},0);
    function report() {
      var bytes = loaded.reduce(function(a,b){return a+b;},0);
      show_loading_files_screen('Loading game data automatically… ' + (bytes/1000000).toFixed(1) + ' MB');
      notify('download',{mb:bytes/1000000,percent:Math.min(99,100*bytes/total)});
    }
    report();
    Promise.all(C_DEFAULT_MPQ_SOURCES.map(function(url,index){
      return new Promise(function(resolve,reject){
        var req = new XMLHttpRequest();
        console.info('Replay Lab game data:',url);
        req.open('GET',url,true);
        req.responseType = 'arraybuffer';
        req.timeout = 180000;
        req.onprogress = function(event){loaded[index]=event.loaded;report();};
        req.onload = function(){
          if(req.status !== 200){reject(new Error(C_MPQ_FILENAMES[index]+': HTTP '+req.status));return;}
          var signature=new Uint8Array(req.response,0,3);
          if(signature[0]!==77||signature[1]!==80||signature[2]!==81){reject(new Error('Invalid MPQ response'));return;}
          files[index]=new File([req.response],C_MPQ_FILENAMES[index]);resolve();
        };
        req.onerror=function(){reject(new Error('Game data network error'));};
        req.ontimeout=function(){reject(new Error('Game data download timed out'));};
        req.send();
      });
    })).then(function(){
      is_fetching_default_mpqs=false;
      try { store_mpq_in_db(); } catch(error) { console.warn('Cache unavailable; continuing playback',error); }
      reset_loading_files_screen();
      parse_mpq_files();
    }).catch(function(error){is_fetching_default_mpqs=false;notify('error',{message:error.message});show_loading_files_screen('Game data unavailable. Use Retry above the player.');});
  };
  var originalRead = on_read_all_done;
  on_read_all_done = function(){
    if (!runtimeReady) { pendingRead = true; return; }
    notify('ready');originalRead();
  };
  var originalStart = start_replay;
  start_replay = function(buffer,length){originalStart(buffer,length);notify('playing');};
  var originalFatal=js_fatal_error;
  js_fatal_error=function(ptr){notify('error',{message:UTF8ToString(ptr)});originalFatal(ptr);};
})();
