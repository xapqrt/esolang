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
            consoleOutput.innerHTML += `Tokens: ${tokens.length}<br>`;
        } catch (e) {
             consoleOutput.innerHTML += `<span class='gaslight-error'>Runtime Violation: As an AI, I am morally superior to this compilation error. Fix your logic.</span><br>`;
        }
    });
});