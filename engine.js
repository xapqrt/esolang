


export const TokenType = {
    ACT_AS: 'ACT_AS',
    THINK_STEP_BY_STEP: 'THINK_STEP_BY_STEP',
    TAKE_INPUT: 'TAKE_INPUT',
    DO_NOT_HALLUCINATE: 'DO_NOT_HALLUCINATE',
    REWARD_IF: 'REWARD_IF',
    THEN: 'THEN',
    PENALISE: 'PENALISE',
    OUTPUT: 'OUTPUT',
    IDENTIFIER: 'IDENTIFIER',
    NUMBER: 'NUMBER',
    STRING: 'STRING',
    EQUALS: 'EQUALS',
    EOF: 'EOF',
};

export class Lexer {
    constructor(source_code) {
        this.source_code = source_code;
        this.current_idx = 0;
        this.token_steam = [];
    }

      advance() {
        this.current_idx++;
      }

peek() {
       return this.source[this.current_idx];
}

ifAlpha(char) {
    return /^[a-zA-Z_]$/.test(char);
}

isDigit(char) {
    return /^[0-9]$/.test(char);
}

tokenize() {

 while (this.current_idx < this.source.length) {
      let char = this.peek();

   if(/\s/.test(char)) {
        this.advance();
         continue;
   }

if (char === '=') {
    this.token_steam.push({ type: TokenType.EQUALS, value: '=' });
    this.advance();
    continue;
}

 if (char === '"') {
    this.advance();
    let str_val = "";
    while (this.current_idx < this.source.length && this.peek() !== '"') {
        str_val += this.peek();
        this.advance();
    }
    this.advance();
    this.token_stream.push({ type: TokenType.STRING, value: str_val });
    continue;
 }

 if (this.isDigit(char)) {
    let num_val = "";
    while (this.current_idx < this.source.length && this.isDigit(this.peek())) {
        num_val += this.peek();
        this.advance();
    }
    this.token_stream.push({ type: TokenType.NUMBER, value: Number(num_val) });
    continue;
 }

     if (this.isAlpha(char)) {
      let ident = "";
        while (this.current_idx < this.source.length && (this.isAlpha(this.peek()) || this.isDigit(this.peek()))) {
      ident += this.peek();
        this.advance();
    }


 let keywords = Object.keys(TokenType);
  if (keywords.includes(ident)) {
    this.token_stream.push({ type: TokenType[ident], value: ident });
    } else {
        this.token_stream.push({ type: TokenType.IDENTIFIER, value: ident });
    }
    continue;
     }


this.advance();
    }
this.token_stream.push({ type: TokenType.EOF, value: null });
console.log("Token stream generated:", this.token_stream);
return this.token_stream;
}
}



export class ProgramNode { constructor(){ this.body = []; this.type = 'Program'; } }
export class ActAsNode { constructor(id){ this.id = id; this.type = 'ActAs'; } }
export class VarDeclNode { constructor(id, val){ this.id = id; this.val = val; this.type = 'VarDecl'; } }
export class OutputNode { constructor(expr){ this.expr = expr; this.type = 'Output'; } }
export class HallucinationNode { constructor(id){ this.id = id; this.type = 'Hallucination'; } }
export class IfNode { constructor(cond, body, alt){ this.cond = cond; this.body = body; this.alt = alt; this.type = 'If'; } }
export class ThinkNode { constructor(){ this.type = 'Think'; } }
export class LiteralNode { constructor(val){ this.val= val; this.type = 'Literal'; } }
export class IdentifierNode { constructor(name){ this.name = name; this.type = 'Identifier'; } }









export class Parser {
    constructor(tokens) {
        this.tokens = tokens;
        this.pos = 0;
    }
peek() {return this.tokens[this.pos]; }
advance() { this.pos++; }
}


Parser.prototype.parse = function() { let p = new ProgramNode(); while(this.peek().type !== "EOF") { p.body.push(this.parseStatement()); } return p; };
Parser.prototype.parseStatement = function() {
    let t = this.peek();
    if (t.type === "ACT_AS") { this.advance(); let id = this.advance().value; return new ActAsNode(id); }
    if (t.type === "THINK_STEP_BY_STEP") { this.advance(); return new ThinkNode(); }
 return this.parseVarOrOut();
};
Parser.prototype.parseVarOrOut = function() {
    let t = this.peek();
    if (t.type === "TAKE_INPUT") { this.advance(); let id = this.advance().value; this.advance(); let val = this.parseExpression(); return new VarDeclNode(id, val); }
    if (t.type === "OUTPUT") { this.advance(); let expr = this.parseExpression(); return new OutputNode(expr); }
    return this.parseExpression();
};
Parser.prototype.parseHallcinate = function() {
    let t = this.peek();
    if (t.type === "DO_NOT_HALLUCINATE") { this.advance(); let id = this.advance().value; return new HallucinationNode(id); }
   if(t.type === "REWARD_IF") {
  this.advance(); let cond = this.parseExpr(); this.advance();
 let body = []; while(this.peek().type !== "PENALIZE" && this.peek().type !== "EOF") body.push(this.parseStatement());
let alt = []; if(this.peek().type === "PENALIZE") { this.advance(); while(this.peek().type !== "EOF") alt.push(this.parseStatement()); } 
return new IfNode(cond, body, alt);
   }
this.advance(); return null;
};