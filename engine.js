


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