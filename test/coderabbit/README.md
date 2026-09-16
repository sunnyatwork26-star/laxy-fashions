# CodeRabbit Integration — Technical Explanation

## What Is CodeRabbit?

CodeRabbit is an **AI-powered code review platform** that automatically analyzes your code for bugs, security issues, performance problems, and best practices. It works at two levels:

### 1. CodeRabbit SaaS (PR Reviews)
- **How it works**: When you open a Pull Request on GitHub, CodeRabbit's cloud service automatically reviews the diff
- **Authentication**: Uses an API key (`cr-XXXX...`) to authenticate your account
- **Scope**: Reviews the *changed files* in a PR, understanding the full context of the repository
- **Output**: Posts review comments directly on the PR, like a human reviewer would

### 2. CodeRabbit MCP / Code-Review-Graph (Local Analysis)
- **How it works**: An MCP (Model Context Protocol) server runs locally alongside your IDE
- **Technology**: Uses **Tree-sitter** (a parser generator) to parse your source code into an Abstract Syntax Tree (AST)
- **What it builds**: Creates a structural **knowledge graph** of your codebase — mapping functions, classes, imports, data flow, and dependencies
- **Purpose**: Provides context-aware analysis for:
  - Impact radius (what does changing file X affect?)
  - Architecture overview (how is the codebase organized?)
  - Review context (what surrounding code is relevant to this change?)
  - Semantic search (find code by meaning, not just text)

## How It Was Used In This Audit

### Interface Used
The **code-review-graph MCP server** was the available CodeRabbit tooling. This is the local structural analysis engine, not the SaaS PR review service.

### Authentication
The CodeRabbit API key was provided by the project owner but was **NOT written to any file, report, or committed to git**. The code-review-graph MCP does not require the SaaS API key — it operates purely locally using Tree-sitter parsing.

### What Was Attempted
1. `build_or_update_graph_tool` — Full rebuild with Tree-sitter parsing of all source files
2. `list_repos_tool` — Check for existing graph data
3. `get_architecture_overview_tool` — Generate architecture map

### Result
The full graph build **timed out** (3-minute MCP timeout exceeded) because the repository includes a large `node_modules` directory and the Tree-sitter parser needs to process many files. This is a known limitation with large JavaScript/TypeScript projects.

### Alternative Review Approach
Since the CodeRabbit graph build timed out, the audit was performed using:
1. **ESLint** — Static analysis with React 19 and TypeScript rules
2. **TypeScript compiler** — Strict type checking via `next build`
3. **Manual code review** — Security-focused review of all server actions, auth, middleware, and data flow
4. **Git history analysis** — Checked for accidentally committed secrets
5. **HTTP smoke testing** — Verified production endpoints

## How to Introduce CodeRabbit to a Newbie

### The Simple Explanation
> "CodeRabbit is like having a senior developer who reviews every line of code you change, automatically. When you push code to GitHub, it reads your changes, understands the context, and leaves helpful comments about bugs, security issues, or improvements — just like a human code reviewer, but instant."

### For a Developer New to Code Review
1. **Sign up** at coderabbit.ai
2. **Connect your GitHub** repository
3. **Open a Pull Request** — CodeRabbit automatically reviews it
4. **Read the comments** — It explains what it found and why
5. **Fix or dismiss** — Address the real issues, dismiss false positives
6. **Learn patterns** — Over time, you learn to avoid common mistakes

### Why It's Valuable
- **Speed**: Reviews happen in minutes, not hours/days
- **Consistency**: Never misses a review, never gets tired
- **Learning**: Explains *why* something is a problem, teaching you as you code
- **Security**: Catches auth bugs, injection risks, and secret leaks that humans often miss
- **Context-aware**: Understands your codebase structure, not just individual files

### Limitations
- Can produce **false positives** — not every finding is a real bug
- Works best on **PR diffs** — a full-repo scan can be overwhelming
- **Not a replacement** for human judgment on architecture decisions
- Requires **verification** — always check findings against actual code before fixing

## Files Generated
- `test/coderabbit/README.md` — This file (explanation)
- `test/analysis/code-review.md` — Manual code review findings
- `test/security/security-audit.md` — Security analysis
