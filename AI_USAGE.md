# AI Usage — NFC-Based Security System

This document outlines how AI tools and assistants were leveraged during the design, coding, troubleshooting, and verification phases of this system.

---

## 🤖 AI Contribution Summary

AI was utilized as a pair programmer for the following objectives:
1.  **Architecture Design**: Designing the relational database entities and structuring the FastAPI routing slices.
2.  **Boilerplate Scaffolding**: Generating Pydantic verification models and standard Tailwind CSS configurations.
3.  **Troubleshooting Conflicts**: Resolving critical workspace compiler mismatches (Next.js CSS imports and Python 3.14/passlib dependencies).
4.  **Verification Automation**: Writing simulator logic and database record counts checks.

---

## 💡 Prompting & Engineering Strategy

### 1. Code Generation
*   **Approach**: Provided detailed requirements (YAML parameters, HTTP status requirements, database fields) to produce clean, strongly-typed code chunks.
*   **Example**: FastAPI router setups mapped parameters exactly to SQLAlchemy schemas using dependency guards.

### 2. Troubleshooting CSS Build Failures
*   **Problem**: Next.js production build broke due to missing Tailwind styles mappings.
*   **AI Action**: Analyzed webpack error streams in `build_log.txt`. Standardized `tailwind.config.ts` theme extender blocks and stripped outdated `@import` classes in `globals.css`.

### 3. Resolving Python 3.14 / Passlib Crash
*   **Problem**: Startup crashed with traceback: `TypeError: Can't replace canonical symbol for '__firstlineno__' with new int value 615`.
*   **AI Action**: Identified incompatibility between older SQLAlchemy/passlib libraries and CPython pre-release 3.14 class namespaces. Resolved by updating SQLAlchemy to standard 2.0.35 and replacing deprecating `passlib.context` with native `bcrypt.hashpw` / `bcrypt.checkpw` helpers inside `auth.py`.

---

## 🔍 Code Review & Verification Loop

All AI-generated snippets underwent:
- **Type Checking**: Validated with Next.js TypeScript compilation and standard FastAPI schema engines.
- **Integration Runs**: Ran automated simulators (`--auto`) to ensure seamless client-server network interactions and proper database commits.
