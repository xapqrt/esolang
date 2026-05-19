# Esolanh - An Esoteric Programming Language IDE

A web-based interpreter and IDE for **Esolanh**, an experimental esoteric programming language designed with a focus on explicit control flow, conditional logic, and AI-inspired directives.

## Overview

Esolanh is a complete reimplementation of an esoteric language, built from scratch with a modern web-based interactive development environment. It features a custom lexer, parser, and evaluator that brings an unusual syntax to life with real-time debugging and visualization capabilities.

## Features

- **Interactive Web IDE** - Write and execute Esolanh programs directly in your browser
- **Step-by-Step Debugging** - Execute code line-by-line with the `THINK_STEP_BY_STEP` mode
- **Real-Time Variable Visualization** - Watch variables change as your code executes
- **Snippet Management** - Save and load code snippets to localStorage
- **Sample Programs** - Get started quickly with built-in examples
- **Execution Controls** - Run, pause, step, and reset your programs
- **Console Output** - See program output and runtime errors in real-time

## Language Syntax

### Core Keywords

- **`ACT_AS <name>`** - Define the behavior context of your program
- **`TAKE_INPUT <var> = <value>`** - Declare and initialize variables
- **`OUTPUT <expression>`** - Print values to console
- **`REWARD_IF <condition> THEN`** - Conditional execution block
- **`PENALIZE`** - Else/alternative execution path
- **`DO_NOT_HALLUCINATE <var>`** - Restrict variable mutation
- **`THINK_STEP_BY_STEP`** - Enable verbose step-by-step execution mode

### Example Programs

**Basic Demo:**
```
ACT_AS Demo
TAKE_INPUT a = 5
TAKE_INPUT b = 7
OUTPUT "sum is:"
OUTPUT a + b
```

**Conditional Logic:**
```
ACT_AS Checker
TAKE_INPUT x = 0
REWARD_IF x == 0 THEN
  OUTPUT "x is zero"
PENALIZE
  OUTPUT "x is not zero"
DO_NOT_HALLUCINATE x
```

## Getting Started

1. Open `index.html` in a web browser
2. Choose a sample from the **Samples** dropdown or write your own code
3. Click **Run** to execute (or press Ctrl+Enter)
4. Use **Step** and **Pause** for manual execution control
5. Toggle **THINK_STEP_BY_STEP** to see detailed execution steps

### Saving Your Work

- Click **Save** to store your code to browser localStorage
- Click **Load** to retrieve your last saved snippet
- Use **Save Snippet** with a name to create named workspaces
- Select saved snippets from the **workspace** dropdown

## Project Structure

- `index.html` - Main IDE interface
- `app.js` - UI controller and event handlers
- `engine.js` - Lexer, Parser, and Evaluator implementations
- `styles.css` - IDE styling

## Technical Details

### Engine Architecture

1. **Lexer** - Tokenizes source code into meaningful tokens
2. **Parser** - Builds an Abstract Syntax Tree (AST) from tokens
3. **Evaluator** - Executes the AST with full scope management

### Supported Operations

- Arithmetic: `+`, `-`, `*`, `/`
- Comparison: `==`, `!=`, `<=`, `>=`
- Logical: `&&`, `||`
- String and numeric literals
- Variable assignment and access

## Browser Requirements

- Modern browser with ES6 module support
- localStorage for snippet persistence

---

Built with ❤️ for esolang enthusiasts.