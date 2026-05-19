import { Lexer, Parser, Evaluator } from './engine.js';

const runBtn = document.getElementById('runBtn');
const stepBtn = document.getElementById('stepBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const saveBtn = document.getElementById('saveBtn');
const loadBtn = document.getElementById('loadBtn');
const samples = document.getElementById('samples');
const snippetName = document.getElementById('snippetName');
const saveSnippet = document.getElementById('saveSnippet');
const workspaceSelect = document.getElementById('workspaceSelect');
const deleteSnippet = document.getElementById('deleteSnippet');
const highlighter = document.getElementById('highlighter');
const gutter = document.getElementById('gutter');
const clearConsoleBtn = document.getElementById('clearConsoleBtn');
const tutorialCard = document.getElementById('tutorialCard');
const toggleTutorial = document.getElementById('toggleTutorial');
const editor = document.getElementById('editor');
const consoleOut = document.getElementById('consoleOut');
const visualBrain = document.getElementById('visualBrain');
const stepToggle = document.getElementById('stepToggle');

function appendConsole(msg) {
    const el = document.createElement('div'); el.textContent = msg; consoleOut.appendChild(el); consoleOut.scrollTop = consoleOut.scrollHeight;
}

function renderVisual(vault) {
    visualBrain.innerHTML = '';
    for(const k of Object.keys(vault)) {
   const v = vault[k];
        const kid = document.createElement('div');
        kid.className = 'var-row';
        kid.innerHTML = `<b>${k}</b>: <span>${String(v)}</span>`;
       
      if(v) kid.style.borderLeft = '4px solid rgba(0,255,150,0.14)'; else kid.style.borderLeft = '4px solid rgba(255,80,80,0.06)'; 
       if(window._currentActiveNode && window._currentActiveNode.name === k) kid.classList.add('active')
        visualBrain.appendChild(kid);
    }
   }     

   let controller = { stepResolve: null, stepMode: false, paused:false, abort:false };
   
   stepBtn.addEventListener('click', ()=>{ controller.stepMode = true; if(controller.stepResolve) controller.stepResolve(); });
   pauseBtn.addEventListener('click', ()=>{ controller.paused = !controller.paused; pauseBtn.textContent = controller.paused ? 'Resume' : 'Pause'; });
   resetBtn.addEventListener('click', ()=>{ controller.abort = true; appendConsole('-- reset requested --'); });
   saveBtn.addEventListener('click', ()=>{ localStorage.setItem('prompt_editor_snippet', editor.value); appendConsole('-- saved snippet to localStorage --'); });
   loadBtn.addEventListener('click', ()=>{ const v = localStorage.getItem('prompt_editor_snippet'); if(v) editor.value = v; appendConsole('-- loaded snippet --'); });
  
   samples.addEventListener('change', ()=>{
    const v = samples.value;
   if(v === 'demo1') editor.value = `ACT_AS Demo\nTAKE_INPUT a = 5\nTAKE_INPUT b = 7\nOUTPUT "sum is:"\nOUTPUT a + b\n`;
   if(v === 'demo2') editor.value = `ACT_AS Checker\nTAKE_INPUT x = 0\nREWARD_IF x == 0 THEN\n  OUTPUT "x is zero"\nPENALIZE\n  OUTPUT "x is not zero"\nDO_NOT_HALLUCINATE x\n`;
   });
   
   clearConsoleBtn.addEventListener('click', ()=>{ consoleOut.innerHTML = ''; appendConsole('-- console cleared --'); });
   toggleTutorial.addEventListener('click', ()=>{ 
   const hidden = tutorialCard.style.display === 'none';
   toggleTutorial.textContent = hidden ? 'Hide Tutorial' : 'Show Tutorial';
   tutorialCard.style.display = hidden ? '' : 'none';
   });
   
   runBtn.addEventListener('click', async ()=>{
    consoleOut.innerHTML = '';
    visualBrain.innerHTML = '';
    const src = editor.value;
    try{
        const lex = new Lexer(src);
        const tokens = lex.tokenize();
        const p = new Parser(tokens);
        const ast = p.parseProgram();
       controller = { stepResolve: null, stepMode:false, paused:false, abort:false };
            const ev = new Evaluator(ast, {thinkStep: stepToggle.checked, thinkDelay:200, onOutput:(m)=>appendConsole(m), _abort: controller.abort, onStep: async (node)=>{
      
        appendConsole('> step: '+(node.type||'?'));
                       window._currentActiveNode = node;
       renderVisual(ev.scope_stack ? ev.scope_stack[ev.scope_stack.length-1] : ev.variable_vault);
        if(controller.abort) throw new Error('Aborted');
                        if(controller.stepMode){
                            await new Promise(res=> controller.stepResolve = res);
                            controller.stepResolve = null;
                        }
                        while(controller.paused) await new Promise(r=>setTimeout(r,100));
                }});
        
        ev._originalEvalNode = ev.evalNode.bind(ev);
        ev.evalNode = async function(node){
            await ev._originalEvalNode(node);
            renderVisual(ev.scope_stack ? ev.scope_stack[ev.scope_stack.length-1] : ev.variable_vault);
        }
        await ev.eval();
        appendConsole('-- Program Finished --');
    } catch(e) {
     const gas = (e.name === 'GaslightError');
    appendConsole((gas? 'Runtime Violation: As an AI, I am morally superior to this comilation error. Fix your logic. ':'')) + e.name+ ': ' + e.message);
    
    const last = consoleOut.lastElementChild; if(last) last.className = 'error';    
    }
    });


    editor.addEventListener('keydown', (e)=>{ if(e.ctrlKey && e.key === 'Enter'){ runBtn.click(); } });


  function updateGutter(){
     const lines = editor.value.split('\n').length;
     let s = '';
        for(let i=1; i<=lines; i++) s+=i+'\n';
       gutter.textContent = s;
  }
  
  function escapeHtml(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') }
  
    function highlightCode(s){}  
      let out = escapeHtml(s);
  
     out = out.replace(/"([^"\\]|\\.)*"/g, m=>`<span class="str">${m}</span>`);
  
    out = out.replace(/\b(\d+)\b/g, m=>`<span class="num">${m}</span>`);
  
  out = out.replace(/\b(ACT_AS|THINK_STEP_BY_STEP|TAKE_INPUT|DO_NOT_HALLUCINATE|REWARD_IF|THEN|PENALIZE|OUTPUT)\b/g, m=>`<span class="kw">${m}</span>`);
  return out;
}
  
 function syncHighlight(){ highlighter.innerHTML = highlightCode(editor.value); updateGutter(); } 
  editor.addEventListener('input', syncHighlight);
  editor.addEventListener('scroll', ()=>{ highlighter.scrollTop = editor.scrollTop; gutter.scrollTop = editor.scrollTop; });
  syncHighlight();
  
  
  function loadWorkspaceIndex(){
  const raw = localStorage.getItem('prompt_workspace');
  return raw ? JSON.parse(raw) : {};
  }
  
  function saveWorkspaceIndex(idx){ localStorage.setItem('prompt_workspace', JSON.stringify(idx)); }
  
  function refreshWorkspaceList(){
  const idx = loadWorkspaceIndex();
  workspaceSelect.innerHTML = '<option value="">-- workspace --</option>';
  for(const k of Object.keys(idx)) {
  const o = document.createElement('option'); o.value = k; o.textContent = k; workspaceSelect.appendChild(o);
  }
}
  
 saveSnippet.addEventListener('click', ()=>{ 
  const name = snippetName.value && snippetName.value.trim(); if(!name){ appendConsole('Provide a snippet name first'); return; }
  const idx = loadWorkspaceIndex(); idx[name] = editor.value; saveWorkspaceIndex(idx); refreshWorkspaceSelect(); appendConsole('-- snippet saved --');
 });
  
  workspaceSelect.addEventListener('change', ()=>{ const k = workspaceSelect.value; if(!k) return; const idx = loadWorkspaceIndex(); if(idx[k]){ editor.value = idx[k]; syncHighlight(); appendConsole('-- loaded snippet '+k+' --'); }});
  
  workspaceSelect.addEventListener('change', ()=>{ const k = workspaceSelect.value; if(!k) return; const idx = loadWorkspaceIndex(); if(idx[k]){ editor.value = idx[k]; syncHighlight(); appendConsole('-- loaded snippet '+k+' --'); }});
  
  refreshWorkspaceList();
  
  

    console.log("ui rendering stack frames live, let's go");
