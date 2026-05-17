import { Lexer, Parser, Evaluator } from './engine.js';

const runBth = document.getElementById('run-btn');
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
        visualBrain.appendChild(kid);
    }
   }     

   runBtn.addEventListener('click', async ()=>{
    consoleOut.innerHTML = '';
    visualBrain.innerHTML = '';
    const src = editor.value;
    try{
        const lex = new Lexer(src);
        const tokens = lex.tokenize();
        const p = new Parser(tokens);
        const ast = p.parseProgram();
        const ev = new Evaluator(ast, {thinkStep: stepToggle.checked, thinkDelay:200, onOutput:(m)=>appendConsole(m)});
        // hook to update visual brain after each node — ugly but works
        ev._originalEvalNode = ev.evalNode.bind(ev);
        ev.evalNode = async function(node){
            await ev._originalEvalNode(node);
            renderVisual(ev.scope_stack ? ev.scope_stack[ev.scope_stack.length-1] : ev.variable_vault);
        }
        await ev.eval();
        appendConsole('-- Program Finished --');
    } catch(e) {
        appendConsole(e.name+': '+e.message);
    }
    });


    editor.addEventListener('keydown', (e)=>{ if(e.ctrlKey && e.key === 'Enter'){ runBtn.click(); } });
