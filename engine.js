export const VERSION = '0.2.0';

export const TokenType = {
    KEYWORD: 'KEYWORD',
    IDENT: 'IDENT',
    NUMBER: 'NUMBER',
    STRING: 'STRING',
    OP: 'OP',
    NEWLINE: 'NEWLINE',
    EOF: 'EOF'
};

export const KEYWORDS = new Map([
    ['ACT_AS', TokenType.KEYWORD],
    ['THINK_STEP_BY_STEP', TokenType.KEYWORD],
    ['TAKE_INPUT', TokenType.KEYWORD],
    ['DO_NOT_HALLUCINATE', TokenType.KEYWORD],
    ['REWARD_IF', TokenType.KEYWORD],
    ['THEN', TokenType.KEYWORD],
    ['PENALIZE', TokenType.KEYWORD],
    ['OUTPUT', TokenType.KEYWORD]
]);

// keywords that start a statement and carry the rest of the line
const STATEMENT_KEYWORDS = new Set([
    'ACT_AS', 'THINK_STEP_BY_STEP', 'TAKE_INPUT', 'DO_NOT_HALLUCINATE',
    'REWARD_IF', 'THEN', 'PENALIZE', 'OUTPUT'
]);

const TWO_CHAR_OPS = new Set(['==', '!=', '<=', '>=', '&&', '||']);

const PRECEDENCE = {
    '||': 1, '&&': 2,
    '==': 3, '!=': 3,
    '<': 4, '>': 4, '<=': 4, '>=': 4,
    '+': 5, '-': 5,
    '*': 6, '/': 6
};

export class ParseError extends Error {
    constructor(msg, line) {
        super(line ? `line ${line}: ${msg}` : msg);
        this.name = 'ParseError';
        this.line = line;
    }
}

export class GaslightError extends Error {
    constructor(msg) {
        super(msg);
        this.name = 'GaslightError';
    }
}

export class Lexer {
    constructor(src) {
        this.src = src || '';
        this.idx = 0;
        this.line = 1;
        this.col = 0;
        this.tokens = [];
    }

    get ch() { return this.src[this.idx] || ''; }
    get peek() { return this.src[this.idx + 1] || ''; }

    advance() {
        const cur = this.ch;
        if (cur === '\n') { this.line += 1; this.col = 0; }
        else this.col += 1;
        this.idx += 1;
        return cur;
    }

    readWhile(pred) {
        let out = '';
        while (this.ch && pred(this.ch)) out += this.advance();
        return out;
    }

    readNumber() {
        const whole = this.readWhile(c => /[0-9]/.test(c));
        let frac = '';
        if (this.ch === '.' && /[0-9]/.test(this.peek)) {
            frac = '.' + this.readWhile(c => /[0-9]/.test(c));
        }
        return { type: TokenType.NUMBER, value: Number(whole + frac), line: this.line };
    }

    readIdent() {
        const name = this.readWhile(c => /[a-zA-Z0-9_]/.test(c));
        const type = KEYWORDS.has(name) ? TokenType.KEYWORD : TokenType.IDENT;
        return { type, value: name, line: this.line };
    }

    readString() {
        this.advance(); // opening quote
        let out = '';
        while (this.ch && this.ch !== '"') {
            if (this.ch === '\\') {
                const esc = this.peek;
                if (esc === 'n') { out += '\n'; this.advance(); }
                else if (esc === 't') { out += '\t'; this.advance(); }
                else if (esc === '"') { out += '"'; this.advance(); }
                else out += this.ch;
            } else {
                out += this.ch;
            }
            this.advance();
        }
        if (this.ch !== '"') throw new ParseError('string never closed', this.line);
        this.advance();
        return { type: TokenType.STRING, value: out, line: this.line };
    }

    tokenize() {
        while (this.ch) {
            const col = this.col;

            if (this.ch === '\n') {
                this.tokens.push({ type: TokenType.NEWLINE, line: this.line, col });
                this.advance();
                continue;
            }
            if (this.ch === ' ' || this.ch === '\t' || this.ch === '\r') { this.advance(); continue; }
            if (this.ch === '"') { this.tokens.push({ ...this.readString(), col }); continue; }
            if (/[0-9]/.test(this.ch)) { this.tokens.push({ ...this.readNumber(), col }); continue; }
            if (/[a-zA-Z_]/.test(this.ch)) { this.tokens.push({ ...this.readIdent(), col }); continue; }

            const pair = this.ch + this.peek;
            if (TWO_CHAR_OPS.has(pair)) {
                this.tokens.push({ type: TokenType.OP, value: pair, line: this.line, col });
                this.advance();
                this.advance();
                continue;
            }
            this.tokens.push({ type: TokenType.OP, value: this.ch, line: this.line, col });
            this.advance();
        }

        this.tokens.push({ type: TokenType.EOF, line: this.line, col: 0 });
        return this.tokens;
    }
}

export class Parser {
    constructor(tokens) {
        this.tokens = tokens || [];
        this.idx = 0;
    }

    peek(offset = 0) {
        return this.tokens[this.idx + offset] || { type: TokenType.EOF, line: 0 };
    }

    next() {
        const tok = this.peek();
        this.idx += 1;
        return tok;
    }

    atKeyword(name) {
        const t = this.peek();
        return t.type === TokenType.KEYWORD && t.value === name;
    }

    eatNewlines() {
        while (this.peek().type === TokenType.NEWLINE) this.next();
    }

    parseProgram() {
        const nodes = [];
        this.eatNewlines();
        while (this.peek().type !== TokenType.EOF) {
            const before = this.idx;
            const node = this.parseStatement();
            if (node) nodes.push(node);
            this.eatNewlines();
            // never loop forever on a token we cannot make sense of
            if (this.idx === before) this.next();
        }
        return nodes;
    }

    parseStatement() {
        const tok = this.peek();

        if (tok.type === TokenType.NEWLINE) { this.next(); return null; }

        if (tok.type === TokenType.KEYWORD && STATEMENT_KEYWORDS.has(tok.value)) {
            switch (tok.value) {
                case 'ACT_AS': return this.parseActAs();
                case 'THINK_STEP_BY_STEP': return this.parseThink();
                case 'TAKE_INPUT': return this.parseTakeInput();
                case 'OUTPUT': return this.parseOutput();
                case 'REWARD_IF': return this.parseConditional();
                case 'DO_NOT_HALLUCINATE': return this.parseDoNotHallucinate();
            }
        }

        throw new ParseError(`dont know what to do with "${tok.value ?? tok.type}"`, tok.line);
    }

    parseActAs() {
        this.next();
        const name = this.next();
        if (name.type !== TokenType.IDENT) throw new ParseError('ACT_AS needs a name', name.line);
        return { type: 'ActAsNode', name: name.value };
    }

    parseThink() {
        this.next();
        return { type: 'ThinkNode' };
    }

    parseTakeInput() {
        this.next();
        const name = this.next();
        if (name.type !== TokenType.IDENT) throw new ParseError('TAKE_INPUT needs a variable name', name.line);
        const eq = this.next();
        if (!(eq.type === TokenType.OP && eq.value === '=')) throw new ParseError('expected = after the variable name', eq.line);
        return { type: 'VariableDeclNode', name: name.value, value: this.parseExpression() };
    }

    parseOutput() {
        this.next();
        return { type: 'OutputNode', expr: this.parseExpression() };
    }

    parseDoNotHallucinate() {
        this.next();
        return { type: 'AssertNode', expr: this.parseExpression() };
    }

    parseConditional() {
        // blocks end when a line dedents back out to the REWARD_IF indent
        const base = this.peek().col;
        this.next();
        const condition = this.parseExpression();

        if (!this.atKeyword('THEN')) throw new ParseError('REWARD_IF needs THEN at the end of the line', this.peek().line);
        this.next();
        this.eatNewlines();

        const then_block = this.parseBlock(base, ['PENALIZE']);

        let otherwise_block = [];
        if (this.atKeyword('PENALIZE')) {
            this.next();
            this.eatNewlines();
            otherwise_block = this.parseBlock(base, []);
        }

        return { type: 'ConditionalNode', condition, then: then_block, otherwise: otherwise_block };
    }

    parseBlock(base_indent, stoppers) {
        const block = [];
        while (this.peek().type !== TokenType.EOF) {
            const tok = this.peek();
            if (tok.type === TokenType.NEWLINE) { this.next(); continue; }
            if (tok.col <= base_indent) break;
            if (tok.type === TokenType.KEYWORD && stoppers.includes(tok.value)) break;
            block.push(this.parseStatement());
            this.eatNewlines();
        }
        return block;
    }

    parseExpression() {
        return this.parseBinary(0);
    }

    parsePrimary() {
        const tok = this.peek();

        if (tok.type === TokenType.NUMBER || tok.type === TokenType.STRING) {
            this.next();
            return { type: 'LiteralNode', value: tok.value };
        }
        if (tok.type === TokenType.IDENT) {
            this.next();
            return { type: 'IdentifierNode', name: tok.value };
        }
        if (tok.type === TokenType.OP && tok.value === '(') {
            this.next();
            const inner = this.parseExpression();
            const close = this.next();
            if (!(close.type === TokenType.OP && close.value === ')')) throw new ParseError('missing )', close.line);
            return inner;
        }
        if (tok.type === TokenType.OP && tok.value === '-') {
            this.next();
            return { type: 'NegateNode', operand: this.parsePrimary() };
        }

        throw new ParseError(`cant use "${tok.value ?? tok.type}" in an expression`, tok.line);
    }

    parseBinary(min_prec) {
        let left = this.parsePrimary();

        while (this.peek().type === TokenType.OP) {
            const op = this.peek().value;
            const prec = PRECEDENCE[op];
            if (prec === undefined || prec < min_prec) break;
            this.next();
            const right = this.parseBinary(prec + 1);
            left = { type: 'BinaryOpNode', operator: op, left, right };
        }
        return left;
    }
}

export class Evaluator {
    constructor(ast, opts = {}) {
        this.ast = ast || [];
        this.opts = opts;
        this.scopes = [Object.create(null)];
        this.role = null;
        this.thinking = false;
        this.steps = 0;
    }

    get aborted() {
        return this.opts.aborted ? this.opts.aborted() === true : false;
    }

    lookup(name) {
        for (let i = this.scopes.length - 1; i >= 0; i--) {
            if (name in this.scopes[i]) return this.scopes[i][name];
        }
        return undefined;
    }

    define(name, value) {
        this.scopes[this.scopes.length - 1][name] = value;
    }

    async run() {
        this.scopes = [Object.create(null)];
        this.role = null;
        this.thinking = false;
        this.steps = 0;

        for (const node of this.ast) {
            if (this.aborted) break;
            await this.exec(node);
        }
        return this;
    }

    async execBlock(nodes) {
        for (const node of nodes) {
            if (this.aborted) return;
            await this.exec(node);
        }
    }

    async exec(node) {
        if (!node) return;

        switch (node.type) {
            case 'ActAsNode':
                this.role = node.name;
                break;

            case 'ThinkNode':
                this.thinking = true;
                if (this.opts.onThink) this.opts.onThink(node);
                break;

            case 'VariableDeclNode':
                this.define(node.name, this.value(node.value));
                break;

            case 'OutputNode': {
                const out = this.value(node.expr);
                if (this.opts.onOutput) this.opts.onOutput(typeof out === 'string' ? out : String(out));
                break;
            }

            case 'ConditionalNode': {
                const cond = Boolean(this.value(node.condition));
                this.scopes.push(Object.create(null));
                try {
                    await this.execBlock(cond ? node.then : node.otherwise);
                } finally {
                    this.scopes.pop();
                }
                break;
            }

            case 'AssertNode': {
                const got = this.value(node.expr);
                if (got === null || got === undefined || got === '') {
                    throw new GaslightError(
                        `DO_NOT_HALLUCINATE caught an empty value. "${describe(node.expr)}" is not a thing here.`
                    );
                }
                break;
            }

            default:
                throw new Error(`evaluator does not know node type ${node.type}`);
        }

        this.steps += 1;

        if (this.opts.onStep) await this.opts.onStep(node, this);
        if (this.thinking && this.opts.thinkDelay) await new Promise(r => setTimeout(r, this.opts.thinkDelay));
    }

    value(expr) {
        if (!expr) return undefined;

        switch (expr.type) {
            case 'LiteralNode':
                return expr.value;
            case 'IdentifierNode':
                return this.lookup(expr.name);
            case 'NegateNode':
                return -Number(this.value(expr.operand));
            case 'BinaryOpNode':
                return this.binary(expr);
        }
        return undefined;
    }

    binary(expr) {
        const l = this.value(expr.left);
        const r = this.value(expr.right);

        switch (expr.operator) {
            case '+': return num(l) + num(r);
            case '-': return num(l) - num(r);
            case '*': return num(l) * num(r);
            case '/':
                if (Number(r) === 0) throw new GaslightError('divided by zero, the model blinked');
                return num(l) / num(r);
            case '==': return l == r;
            case '!=': return l != r;
            case '<': return num(l) < num(r);
            case '>': return num(l) > num(r);
            case '<=': return num(l) <= num(r);
            case '>=': return num(l) >= num(r);
            // logical ops hand back an operand rather than a bool, same as js,
            // so OUTPUT a || "fallback" does something useful
            case '&&': return l ? r : l;
            case '||': return l ? l : r;
        }
        throw new Error(`no handler for operator ${expr.operator}`);
    }
}

function num(v) {
    if (v === null || v === undefined || v === '') return 0;
    const n = Number(v);
    return Number.isNaN(n) ? 0 : n;
}

function describe(expr) {
    if (!expr) return 'that';
    if (expr.type === 'IdentifierNode') return expr.name;
    if (expr.type === 'LiteralNode') return JSON.stringify(expr.value);
    return 'that expression';
}

export function runProgram(src, opts = {}) {
    const tokens = new Lexer(src).tokenize();
    const ast = new Parser(tokens).parseProgram();
    return new Evaluator(ast, opts).run();
}