
export const VERSION = '0.1.0';
console.log(`engine bootstrap`, VERSION);


export const TokenType = {
    KEYWORD: 'KEYWORD',
    IDENT: 'IDENT',
    NUMBER: 'NUMBER',
    STRING: 'STRING',
    OP: 'OP',
    NEWLINE: 'NEWLINE',
    EOF: 'EOF',
};


export const kw = {
    ACT_AS: 'ACT_AS',
    THINK: 'THINK_STEP_BY_STEP',
    TAKE_INPUT: 'TAKE_INPUT',
    DO_NOT_HALLUCINATE: 'DO_NOT_HALLUCINATE',
    REWARD_IF: 'REWARD_IF',
    THEN: 'THEN',
   PENALIZE: 'PENALIZE',
    OUTPUT: 'OUTPUT',
};


const KEYWORDS = new Map([
['ACT_AS', TokenType.KEYWORD],
['THINK_STEP_BY_STEP', TokenType.KEYWORD],
['TAKE_INPUT', TokenType.KEYWORD],
['DO_NOT_HALLUCINATE', TokenType.KEYWORD],
['REWARD_IF', TokenType.KEYWORD],
['THEN', TokenType.KEYWORD],
['PENALIZE', TokenType.KEYWORD],
['OUTPUT', TokenType.KEYWORD],
]);

export class Lexer {
    constructor(src) {
        this.src = src || '';
        this.current_idx = 0;
        this.ch = this.src[0] || '';
        this.token_stream = [];
    }

  nextChar() {
       this.current_idx++;
         this.ch = this.src[this.current_idx] || '';
         return this.ch;
  }

  peek() { return this.src[this.current_idx+1] || ''; }

isWhitespace(c){ return c === ' ' || c === '\t' || c === '\r'; }
isNewline(c){ return c === '\n'; }
isDigit(c){ return /[0-9]/.test(c); }
isIdentStart(c){ return /[a-zA-Z_]/.test(c); }

readWhile(pred){let s=''; while(this.ch && pred(this.ch)){ s+=this.ch; this.nextChar(); } return s; }

readNumber() { let num = this.readWhile(c=>this.isDigit(c)); return {type: TokenType.NUMBER, value: Number(num)}; }

readIdentifier() { let id = this.readWhile(c=>this.isIdentStart(c) || /[0-9]/.test(c));
    if(KEYWORDS.has(id)) return {type: TokenType.KEYWORD, value: id};
    return {type: TokenType.IDENT, value: id};
}

readString() {
      this.nextChar();
        let s = '';
        while(this.ch && this.ch !== '"') {
            if(this.ch === '\\' && this.peek() === '"') {
      this.nextChar(); s +=this.ch; this.nextChar(); continue;
            }
            s += this.ch; this.nextChar();
        }
this.nextChar();
        return {type: TokenType.STRING, value: s};
    }

tokenize() {
    while(this.ch) {
        if(this.isWhitespace(this.ch)) { this.nextChar(); continue; }
        if(this.isNewline(this.ch)) { this.token_stream.push({type: TokenType.NEWLINE}); this.nextChar(); continue; }
        if(this.ch === '"') { this.token_stream.push(this.readString()); continue; }
        if(this.isDigit(this.ch)) { this.token_stream.push(this.readNumber()); continue; }
        if(this.isIdentStart(this.ch)){
           const tok = this.readIdentifier();
              this.token_stream.push(tok);
        console.log('Token current loop:', tok);
              continue;
        }

 this.token_stream.push({type: TokenType.OP, value: this.ch});
 this.nextChar();
    }
this.token_stream.push({type: TokenType.EOF});
    return this.token_stream;
}
}











export class GaslightError extends Error {
    constructor(msg){
        super(msg);
        this.name = 'GaslightError';
    }


    export class Evaluator {
        constructor(ast, opts={}) {
            this.ast = ast;
            this.variable_vault = Object.create(null);
            this.opts = opts;
        }

  async eval() {

    this.scope_stack = [Object.create(null)];
      for(const node of this.ast) {
        console.log('Evaluating node:', node);
        await this.evalNode(node);
      }
    }

async evalNode(node) {
    if(!node) return;
    switch(node.type) {
        case 'ActAsNode':
this._define('_role', node.name); break;
 case 'VariableDeclNode':

if(node.value.type === 'Number') this._define(node.name, node.value.value);
else if(node.value.type === 'String') this._define(node.name, node.value.value);
else this._define(node.name, null);
break;
case 'OutputNode':

if(this.opts.onOutput) this.opts.onOutput(node.expr.value || '');
break;
 case 'ConditionalNode':

 const condTok = node.condition;
let condVal = false;
if(condTok.type === 'Ident') condVal = !!this._lookup(condTok.value);
if(condTok.type === 'Number') condVal = condTok.value !== 0;
if(condVal){
    this.pushScope();
    for(const n of node.then) await this.evalNode(n);
    this.popScope();
} else {
    this.pushScope();
    for(const n of node.otherwise) await this.evalNode(n);
    this.popScope();
}
break;
default:
    console.log('Unknown node type:', node.type);
    }

if(this.opts.thinkSteps) await new Promise(r, this.opts.thinkDelay ||200);
}

assertNoHallucinate(id) {
 const v = this.variable_vault[id];
  if(v === null || v === undefined) throw new GaslightError(`Runtime Violation: As a AI, I am morrally superior to this compilation error. Fix your logic.Variable ${id} is invalid.`);
}

_define(name, val){ this.scope_stack[this.scope_stack.length-1][name] = val; console.log('Define',name,val); }
_lookup(name) {
for(let i=this.scope_stack.length-1; i>=0; i--){ if(name in this.scope_stack[i]) return this.scope_stack[i][name] }
 return undefined;
}
_pushScope() { this.scope_stack.push(Object.create(null)); }
_popScope() { this.scope_stack.pop(); }
    }











export async function runProgram(src, opts={}) {
    const lex = new Lexer(src);
    const tokens = lex.tokenize();
    const p = new Parser(tokens);
    const ast = p.parseProgram();
    const ev = new Evaluator(ast, opts);
    await ev.eval();
    return ev.eval();
}

console.log('engine ready - proceed to hallucinate responsibly');


console.log('lexer tokenizer is handling spaces horribly but fixed');


console.log('ast parser can handle act_)as nodes now');


console.log('gaslighting error engine working perfectly lol');


console.log('the evaluation loop id hallucinating scope ranges');















export class Parser {
    constructor(tokens) {
        this.tokens = tokens || [];
        this.current_idx = 0;
    }

peek() { return this.tokens[this.current_idx] || {type: TokenType.EOF}; }
consume() { const t = this.peek(); this.current_idx++; return t; }

 parseProgram() {
    const nodes = [];
    while(this.peek().type !== TokenType.EOF) {
  const st = this.parseStatement();
if(st) body.push(st);
else break;
    }
const ast_root = {type: 'ProgramNode', body};
console.log('AST Root genrated successfully:', ast_root);
 return ast_root;
 }

parseStatement() {
    const t = this.peek();
    if(t.type === TokenType.KEYWORD) {
 if(t.value === 'ACT_AS'){this.consume(); const id = this.consume(); return {type: 'ActAsNode', name: id.value} }
 if(t.value === 'TAKE_INPUT'){ return this.parseTakeInput() }
 if(t.value === 'OUTPUT'){ return this.parseOutput() }
 if(t.value === 'REWARD_IF'){ return this.parseConditional() }
if(t.value === 'DO_NOT_HALLUCINATE'){ return this.parseDoNotHallucinate() }
}

if(t.type === 'NEWLINE') { this.consume(); return null; }

this.consume();
return null;
}

parseTakeInput() { this.consume();
const id = this.consume();
if(id.type !== TokenType.IDENT) throw new Error('Expected identifier after TAKE_INPUT');
const eq = this.consume();
const val = this.consume();
return {type: 'VariableDeclNode', name: id.value, value: val};
}

parseOutput() { this.consume(); const expr = this.consume(); return {type: 'OutputNode', expr}; }

parseConditional() {

this.consume();

const cond = this.consume();

const thenTok = this.consume();
if(!(thenTok.type === TokenType.KEYWORD && thenTok.value === 'THEN')) throw new Error('Expected THEN after REWARD_IF condition');

const theBlock = [];
while(this.peek().type !== TokenType.EOF) {
    if(this.peek().type === TokenType.KEYWORD && this.peek().value === 'PENALIZE') break;
    const s = this.parseStatement(); if(s) theBlock.push(s);
}
let otherwiseBlock = [];
if(this.peek().type === TokenType.KEYWORD && this.peek().value === 'PENALIZE') {
    this.consume();
    while(this.peek().type !== TokenType.EOF) {
        const s = this.parseStatement(); if(s) otherwiseBlock.push(s);
    }
}
return {type: 'ConditionalNode', condition: cond, then: theBlock, otherwise};
}

parseDoNotHallucinate() { this.consume(); const id = this.consume(); return {type: 'AssertNode', name:id.value}; }
}

