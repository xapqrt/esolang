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
               console.log("AST Root generated successfully!");
               consoleOutput.innerHTML +=  `AST Parsed Successfully!<br>`;
               window.current_ast = ast;
        } catch (e) {
             consoleOutput.innerHTML += `<span class='gaslight-error'>${e.message}</span><br>`;
        }
    });
});
import { Parser, Evaluator } from './engine.js';