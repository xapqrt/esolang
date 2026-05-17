import { Lexer } from './engine.js';

document.addEventListener('DOMContentLoaded', () => {
    const runBtn = document.getElementById('run-btn');
    const codeEditor = document.getElementById('code-editor');
    const consoleOutput = document.getElementById('console-output');

    runBtn.addEventListener("click", () => {
        const source_code = codeEditor.value;
        consoleOutput.innerHTML = "<span class='gaslight-error'>Lexer starting...</span><br>";

        try {
            const lexer = new Lexer(source_code);
            const tokens = lexer.tokenize();
            const parser = new Parser(tokens);
                const ast = parser.parse();
             consoleOutput.innerHTML +=  `[x] AST Compiled.<br>`;
      
            const evaHooks = {
                    onPrint: (msg) => { consoleOutput.innerHTML += `> ${msg}<br>`; consoleOutput.scrollTo(0, consoleOutput.scrollHeight); },                                                                                                            
            onMem: (mem) => { document.getElementById("memory-map").innerHTML = JSON.stringify(mem, null, 2).replace(/\n/g, "<br>").replace(/ /g, "&nbsp;"); },
               onThink: async() => new Promise(r => setTimeout(r, 600))
                };

            const evaluator = new Evaluator(evaHooks);
            await evaluator.evalNode(ast, evaluator.global);
            consoleOutput.innerHTML += `<span style='color: #0f0'>Program exited gracefully.</span><br>`;
            } catch (e) {
             consoleOutput.innerHTML += `<span class='gaslight-error'>${e.message}</span><br>`;
        }
    });
});
import { Parser, Evaluator } from './engine.js';