import { Lexer, Parser, Evaluator, VERSION, ParseError, GaslightError } from './engine.js';

const el = (id) => document.getElementById(id);

const editor = el('editor');
const highlighter = el('highlighter');
const gutter = el('gutter');
const consoleOut = el('consoleOut');
const visualBrain = el('visualBrain');
const status = el('status');
const samples = el('samples');
const tutorialCard = el('tutorialCard');

const SNIPPET_KEY = 'esolang_editor_buffer';
const WORKSPACE_KEY = 'esolang_snippets';

const SAMPLE_SOURCE = {
    demo1: 'ACT_AS Demo\nTAKE_INPUT a = 5\nTAKE_INPUT b = 7\nOUTPUT "sum is:"\nOUTPUT a + b\n',
    demo2: 'ACT_AS Checker\nTAKE_INPUT x = 0\nREWARD_IF x == 0 THEN\n  OUTPUT "x is zero"\nPENALIZE\n  OUTPUT "x is not zero"\nDO_NOT_HALLUCINATE x\n',
    demo3: 'ACT_AS Logic\nTAKE_INPUT a = 10\nTAKE_INPUT b = 20\nREWARD_IF a < b && b > 15 THEN\n  OUTPUT "condition met"\nPENALIZE\n  OUTPUT "nope"\n'
};

let controller = fresh_controller();
// survives the controller swap at the start of a run, so hitting Step before Run works
let step_mode = false;
let running = false;

function fresh_controller() {
    return { step_waiter: null, paused: false, aborted: false };
}

function line(msg) {
    const node = document.createElement('div');
    node.textContent = msg;
    consoleOut.appendChild(node);
    consoleOut.scrollTop = consoleOut.scrollHeight;
    return node;
}

function set_status(text, bad) {
    status.textContent = text;
    status.classList.toggle('bad', Boolean(bad));
}

function render_vars(scope) {
    visualBrain.textContent = '';
    const keys = Object.keys(scope || {});
    if (!keys.length) {
        const empty = document.createElement('div');
        empty.className = 'var-row';
        empty.textContent = 'no variables yet';
        visualBrain.appendChild(empty);
        return;
    }
    for (const key of keys) {
        const row = document.createElement('div');
        row.className = 'var-row';
        const name = document.createElement('b');
        name.textContent = key;
        const val = document.createElement('span');
        val.textContent = String(scope[key]);
        row.append(name, ': ', val);
        visualBrain.appendChild(row);
    }
}

function clear_console() {
    consoleOut.textContent = '';
}

async function execute() {
    if (running) return;
    running = true;
    controller = fresh_controller();
    clear_console();
    render_vars({});
    set_status('Running');

    const ev = new Evaluator(null, {
        // read through a function so Reset can actually interrupt a long loop
        aborted: () => controller.aborted,

        thinkDelay: el('stepToggle').checked ? 260 : 0,

        onOutput: (text) => line(text),

        onStep: async (node, engine) => {
            render_vars(engine.scopes[engine.scopes.length - 1]);

            if (controller.aborted) throw new Error('stopped');
            if (controller.paused) set_status('Paused');
            else set_status(`Step ${engine.steps}`);

            if (step_mode) {
                await new Promise((res) => { controller.step_waiter = res; });
                controller.step_waiter = null;
            }
        }
    });

    try {
        const ast = new Parser(new Lexer(editor.value).tokenize()).parseProgram();
        ev.ast = ast;
        await ev.run();
        line(`-- done, ${ev.steps} steps --`);
        set_status('Done');
    } catch (err) {
        const name = err instanceof GaslightError ? 'GaslightError' : err instanceof ParseError ? 'ParseError' : 'Error';
        const head = name === 'GaslightError'
            ? 'Runtime Violation: I am a AI, I am morally superior to this comilation error. Fix your logic. '
            : '';
        const node = line(head + err.message);
        node.classList.add('error');
        set_status(name === 'Error' ? 'Error' : name, true);
    } finally {
        running = false;
        controller.step_waiter = null;
        step_mode = false;
        if (controller.paused) {
            controller.paused = false;
            el('pauseBtn').textContent = 'Pause';
        }
    }
}

// ---- editor and highlighting ----------------------------------------------

function escape_html(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// one pass over the raw source, string alternative first so a keyword sitting
// inside a string never gets wrapped
const TOKEN_RE = /"[^"\n]*"|\b\d+(?:\.\d+)?\b|\b(?:ACT_AS|THINK_STEP_BY_STEP|TAKE_INPUT|DO_NOT_HALLUCINATE|REWARD_IF|THEN|PENALIZE|OUTPUT)\b/g;

function highlight(src) {
    let out = '';
    let last = 0;
    let m;

    TOKEN_RE.lastIndex = 0;
    while ((m = TOKEN_RE.exec(src)) !== null) {
        out += escape_html(src.slice(last, m.index));
        const cls = m[0].startsWith('"') ? 'str' : /^\d/.test(m[0]) ? 'num' : 'kw';
        out += `<span class="${cls}">${escape_html(m[0])}</span>`;
        last = m.index + m[0].length;
    }

    return out + escape_html(src.slice(last));
}

function sync_editor() {
    highlighter.innerHTML = highlight(editor.value) + '\n';
    const count = editor.value.split('\n').length;
    let nums = '';
    for (let i = 1; i <= count; i++) nums += i + '\n';
    gutter.textContent = nums;
}

editor.addEventListener('input', sync_editor);
editor.addEventListener('scroll', () => {
    highlighter.scrollTop = editor.scrollTop;
    gutter.scrollTop = editor.scrollTop;
});
editor.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        execute();
    }
    // tab should indent instead of leaving the field
    if (e.key === 'Tab') {
        e.preventDefault();
        const start = editor.selectionStart;
        editor.setRangeText('  ', start, editor.selectionEnd, 'end');
        sync_editor();
    }
});

// ---- toolbar ---------------------------------------------------------------

el('runBtn').addEventListener('click', execute);

el('stepBtn').addEventListener('click', () => {
    step_mode = true;
    set_status('Stepping');
    if (controller.step_waiter) controller.step_waiter();
});

el('pauseBtn').addEventListener('click', () => {
    controller.paused = !controller.paused;
    el('pauseBtn').textContent = controller.paused ? 'Resume' : 'Pause';
    set_status(controller.paused ? 'Paused' : 'Running');
    if (!controller.paused && controller.step_waiter) controller.step_waiter();
});

el('resetBtn').addEventListener('click', () => {
    controller.aborted = true;
    step_mode = false;
    if (controller.step_waiter) controller.step_waiter();
    clear_console();
    render_vars({});
    set_status('Reset');
});

el('clearConsoleBtn').addEventListener('click', () => {
    clear_console();
    line('-- console cleared --');
});

el('saveBtn').addEventListener('click', () => {
    localStorage.setItem(SNIPPET_KEY, editor.value);
    line('-- saved to local storage --');
});

el('loadBtn').addEventListener('click', () => {
    const saved = localStorage.getItem(SNIPPET_KEY);
    if (!saved) return line('-- nothing saved yet --');
    editor.value = saved;
    sync_editor();
    line('-- loaded from local storage --');
});

el('toggleTutorial').addEventListener('click', () => {
    const hidden = tutorialCard.style.display === 'none';
    tutorialCard.style.display = hidden ? '' : 'none';
    el('toggleTutorial').textContent = hidden ? 'Hide Help' : 'Show Help';
});

samples.addEventListener('change', () => {
    const src = SAMPLE_SOURCE[samples.value];
    if (!src) return;
    editor.value = src;
    samples.value = '';
    sync_editor();
});

// ---- saved snippets --------------------------------------------------------

function read_workspace() {
    try {
        const raw = JSON.parse(localStorage.getItem(WORKSPACE_KEY) || '{}');
        return raw && typeof raw === 'object' ? raw : {};
    } catch {
        return {};
    }
}

function write_workspace(map) {
    localStorage.setItem(WORKSPACE_KEY, JSON.stringify(map));
}

function refresh_snippet_list() {
    workspaceSelect.textContent = '';
    const blank = document.createElement('option');
    blank.value = '';
    blank.textContent = '-- snippets --';
    workspaceSelect.appendChild(blank);

    for (const name of Object.keys(read_workspace()).sort()) {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        workspaceSelect.appendChild(opt);
    }
}

const workspaceSelect = el('workspaceSelect');
const snippetName = el('snippetName');

el('saveSnippet').addEventListener('click', () => {
    const name = snippetName.value.trim();
    if (!name) return line('-- give the snippet a name first --');
    const map = read_workspace();
    map[name] = editor.value;
    write_workspace(map);
    refresh_snippet_list();
    snippetName.value = '';
    line(`-- saved snippet "${name}" --`);
});

workspaceSelect.addEventListener('change', () => {
    const name = workspaceSelect.value;
    const src = name && read_workspace()[name];
    if (src === undefined) return;
    editor.value = src;
    sync_editor();
    line(`-- loaded snippet "${name}" --`);
});

el('deleteSnippet').addEventListener('click', () => {
    const name = workspaceSelect.value;
    if (!name) return line('-- pick a snippet to delete --');
    const map = read_workspace();
    delete map[name];
    write_workspace(map);
    refresh_snippet_list();
    line(`-- deleted snippet "${name}" --`);
});

// ---- boot ------------------------------------------------------------------

editor.value = localStorage.getItem(SNIPPET_KEY) || editor.value;
refresh_snippet_list();
sync_editor();
render_vars({});
set_status(`Ready · esolang ${VERSION}`);