![Happy Conventional Commit Logo](https://raw.githubusercontent.com/capricorn86/happy-conventional-commit/main/docs/logo.jpg)

# About

[Happy Conventional Commit](https://github.com/capricorn86/happy-conventional-commit) contains CLI scripts for working with [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).

# Installation

```bash
npm install --save-dev happy-conventional-commit
```

# Tools

- [Current Version](#current-version)
- [Next Version](#next-version)
- [Release Notes](#release-notes)
- [Validate Commit Message](#validate-commit-message)
- [Lint Changed Files](#lint-changed-files)

# Usage

## Current Version

```bash
happy-current-version
```

## Next Version

```bash
happy-next-version
```

## Release Notes

**Basic Usage**

```bash
happy-release-notes
```

**Pipe to file**

```bash
happy-release-notes > release-notes.md
```

### Arguments

| Argument                                  | Description                                                                             | Default         |
| ----------------------------------------- | --------------------------------------------------------------------------------------- | --------------- |
| --from={version}                          | The version to generate release notes from.                                             | Latest version. |
| --to={version}                            | The version to generate release notes to.                                               |                 |
| --versionHeader                           | Set to show version header. Useful when generating release notes for multiple releases. |                 |
| --author={githubUsername \| nameAndEmail} | Set to show author for each entry.                                                      |                 |

## Validate Commit Message

**Basic Usage**

```bash
happy-validate-commit-message --commitFile={commitFile}
```

**With Husky**

1. Install [Husky](https://www.npmjs.com/package/husky)
2. Create the file ".husky/commit-msg"
3. Add the following to the file ".husky/commit-msg":
   ```bash
   #!/bin/sh
   . "$(dirname "$0")/_/husky.sh"
   node ./node_modules/.bin/happy-validate-commit-message --commitFile=$1
   ```

### Arguments

| Argument                  | Description                             | Default |
| ------------------------- | --------------------------------------- | ------- |
| --commitFile={commitFile} | The file containing the commit message. |         |

## Lint Changed Files

**Basic Usage**

```bash
happy-lint-changed-files
```

**With Husky**

1. Install [Husky](https://www.npmjs.com/package/husky)
2. Create the file ".husky/pre-commit"
3. Add the following to the file ".husky/pre-commit":
   ```bash
   #!/bin/sh
   . "$(dirname "$0")/_/husky.sh"
   node ./node_modules/.bin/happy-lint-changed
   ```

### Configuration

Configurations are defined in `package.json`.

#### Rules

```json
{
  "happyLintChanged": {
    "rules": [
      {
        "command": "eslint --ignore-path .lintignore --max-warnings 0 --fix",
        "regex": "^[a-zA-Z0-9_].*\\.(cjs|mjs|js|jsx|ts|tsx|json)$"
      }
    ]
  }
}
```

_The rules defaults to the same as in the example above._
