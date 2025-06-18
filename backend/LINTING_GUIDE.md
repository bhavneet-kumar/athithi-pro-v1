# Linting Setup Guide

## Overview

The project now includes automatic linting before server startup to ensure code quality and prevent servers from starting with lint errors.

## How It Works

### Pre-Start Process
1. **Auto-fix**: Automatically fixes all fixable linting issues
2. **Validation**: Checks for remaining unfixable issues
3. **Server Block**: Prevents server start if issues remain
4. **Clear Feedback**: Shows exactly what needs to be fixed

## Available Commands

### Production Scripts (Strict)
```bash
npm start              # Blocks on ANY warnings/errors
npm run start:production # Explicit production start with full lint check
```

### Development Scripts (Lenient)
```bash
npm run dev            # Only blocks on ERRORS (allows warnings)
npm run dev:skip-lint  # Skip linting entirely for quick dev
```

### Emergency Scripts
```bash
npm run start:skip-lint # Start without any linting (emergency only)
```

### Linting Commands
```bash
npm run lint           # Check all issues
npm run lint-fix       # Auto-fix all fixable issues
npm run lint-check     # Check with zero tolerance (used by production)
npm run lint-check-errors # Check errors only (used by development)
npm run lint:report    # Detailed table format report
```

## Example Workflow

### Normal Development
```bash
npm run dev
# ✅ Auto-fixes issues → Shows warnings → Starts server (warnings allowed)
```

### Production Deployment
```bash
npm start
# ✅ Auto-fixes issues → ❌ Blocks if ANY warnings remain
```

### Manual Fixing
```bash
npm run lint:report    # See all issues in table format
npm run lint-fix       # Fix what can be auto-fixed
# Manually fix remaining issues
npm run lint-check     # Verify all issues resolved
```

## Current Status

The project currently has **50 JSDoc warnings** that need manual fixing:
- Missing `@param` descriptions in controllers
- Missing `@returns` and `@throws` declarations

### To Fix JSDoc Issues

Add proper JSDoc comments like:
```typescript
/**
 * Create a new agency
 * @param req - Express request object
 * @param res - Express response object  
 * @param next - Express next function
 * @returns Promise<void>
 * @throws {Error} When validation fails
 */
```

## Benefits

✅ **Prevents bugs** from reaching production  
✅ **Enforces code quality** standards  
✅ **Auto-fixes** common issues  
✅ **Clear feedback** on what needs fixing  
✅ **Flexible** for development vs production  
✅ **Emergency bypasses** available when needed  

## Configuration

The linting rules are configured in `eslint.config.mjs` with enterprise-grade rules including:
- TypeScript type safety
- Security vulnerability detection  
- Code complexity limits
- Modern JavaScript best practices
- JSDoc documentation requirements 