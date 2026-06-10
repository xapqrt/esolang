# Esolang

A tiny programming language with AI flavoured keywords, running entirely in the browser.

No build step, no npm install, no server. Just open the html and write nonsense.

 Features
Real lexer, parser and evaluator: Hand written tokeniser with proper multi character operators, a recursive descent parser with operator precedence, and an evaluator that runs the tree it produces.

If and else: REWARD_IF and PENALIZE are an if and an else. Blocks are indented and end when the next line dedents, same as Python.

Runtime checks: DO_NOT_HALLUCINATE throws if a variable turns out to be empty. Which is a joke, but it also stops you shipping undefined behaviour.

Step through debugging: Hit Step and walk the program one node at a time. Pause freezes it between steps, Reset kills a run that is stuck in a loop.

Live variables: Every assignment updates the variable panel as it happens.

Editor with line numbers: Line numbers in the gutter and real syntax highlighting for keywords, strings and numbers.

Saved snippets: Name a program and it sticks around in localStorage. Save and Load buttons handle the whole buffer in one go.

 Samples
Three samples ship in the dropdown and they all actually run.

 The Language
Blocks after REWARD_IF and PENALIZE are indented two spaces or a tab. Anything at the same indent as the REWARD_IF ends the block.

```
ACT_AS Checker
TAKE_INPUT x = 0
REWARD_IF x == 0 THEN
  OUTPUT "x is zero"
PENALIZE
  OUTPUT "x is not zero"
DO_NOT_HALLUCINATE x
```

 Keywords
ACT_AS name sets the role your program is pretending to be. Cosmetic, but the evaluator keeps track of it.

TAKE_INPUT name = expression declares a variable.

OUTPUT expression prints something. Expressions work too, so OUTPUT a + b is fine.

REWARD_IF expression THEN starts a conditional. PENALIZE on its own line starts the else branch.

DO_NOT_HALLUCINATE expression throws a GaslightError if the value is empty, undefined or an empty string.

THINK_STEP_BY_STEP turns on a pause between every step. The Slow Steps checkbox in the toolbar does the same thing without editing the source.

 Operators
Math: + - * /

Compare: == != < > <= >=

Logic: && ||

Unary minus works too, so OUTPUT -3 is legal.

Groups: parentheses, so OUTPUT (a + b) * 2 is fine.

Strings use double quotes and understand \\n, \\t and \\" escapes.

 How To Use
1. Open index.html in a browser
2. Pick a sample from the dropdown or write something
3. Hit Run, or Ctrl+Enter
4. Step walks it node by node, Pause holds it, Reset stops it
5. Slow Steps slows every node down so you can watch the variables move
6. Name a program in the snippet bar and Save to keep it in the browser

 Files
index.html - the IDE shell

app.js - dom wiring, editor, snippets, stepping

engine.js - lexer, parser, evaluator

styles.css - the dracula-ish theme

 Notes
Variables declared inside a REWARD_IF or PENALIZE block go out of scope when the block ends. Declare them before the conditional if you need them afterwards.

There are no loops yet. That is why Reset exists.

Errors print into the console with the line number, and the status badge tells you whether it was a ParseError or a GaslightError.

This is a toy. It will happily divide by zero and complain about it afterwards.