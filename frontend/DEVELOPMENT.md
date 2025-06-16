# Development Setup

This document outlines the development setup and code quality tools configured for this project.

## Code Quality Tools

### 1. Prettier (Code Formatting)

Prettier is configured to automatically format code with consistent styling.

**Configuration:** `.prettierrc`

- Single quotes for strings
- Semicolons enabled
- 2-space indentation
- 80 character line width
- Trailing commas in ES5
- LF line endings

**Available commands:**

```bash
npm run format        # Format all files
npm run format:check  # Check if files are formatted
```

### 2. ESLint (Code Linting)

ESLint is configured with comprehensive rules for React, TypeScript, and code quality.

**Configuration:** `eslint.config.js`

**Features:**

- React and React Hooks support
- TypeScript integration
- Prettier integration (no conflicts)
- Moderate strictness for maintainable code

**Key rules:**

- TypeScript: Warns on `any` usage, unused variables
- React: Modern JSX transform support, no prop-types needed
- General: Warns on console statements, prefers const

**Available commands:**

```bash
npm run lint      # Check for linting issues
npm run lint:fix  # Auto-fix linting issues
npm run type-check # Run TypeScript compiler check
```

### 3. Husky (Git Hooks)

Husky is configured to run quality checks before commits and pushes.

#### Pre-commit Hook

Runs `lint-staged` to check only staged files:

- Runs ESLint with auto-fix
- Runs Prettier formatting
- Only processes staged `.js`, `.jsx`, `.ts`, `.tsx` files
- Formats `.json`, `.css`, `.md`, `.html` files

#### Pre-push Hook

Runs comprehensive checks before pushing:

- Full ESLint check
- TypeScript compilation check
- Production build test

### 4. Lint-staged

Configured in `package.json` to process only staged files:

```json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,css,md,html}": ["prettier --write"]
  }
}
```

## Workflow

### Daily Development

1. Write code normally
2. Commit changes - pre-commit hooks automatically format and lint
3. Push changes - pre-push hooks ensure build integrity

### Manual Quality Checks

```bash
# Format all files
npm run format

# Check linting
npm run lint

# Fix auto-fixable linting issues
npm run lint:fix

# Check TypeScript compilation
npm run type-check

# Test production build
npm run build
```

## IDE Setup Recommendations

### VS Code

Install these extensions:

- ESLint
- Prettier - Code formatter

Configure VS Code settings:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

## Troubleshooting

### Pre-commit hooks not running

```bash
# Reinstall husky hooks
npm run prepare
```

### ESLint errors

```bash
# Try auto-fixing
npm run lint:fix

# For persistent issues, check the ESLint configuration
```

### Build failures

```bash
# Check TypeScript errors
npm run type-check

# Check for console.log statements (warnings)
npm run lint
```

## Configuration Files

- `.prettierrc` - Prettier configuration
- `.prettierignore` - Files to ignore in formatting
- `eslint.config.js` - ESLint configuration
- `.husky/pre-commit` - Pre-commit hook script
- `.husky/pre-push` - Pre-push hook script
- `package.json` - lint-staged configuration and scripts

## Benefits

1. **Consistency**: All code follows the same formatting and style rules
2. **Quality**: Automatic linting catches common issues
3. **Team Collaboration**: Git hooks ensure all committed code meets standards
4. **CI/CD Ready**: Build process validates code quality
5. **Developer Experience**: Automatic formatting reduces manual work

This setup ensures high code quality while maintaining developer productivity and team collaboration.
