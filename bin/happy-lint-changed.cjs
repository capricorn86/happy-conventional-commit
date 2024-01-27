#!/usr/bin/env node
'use strict';

/* eslint-disable no-console */

const ChildProcess = require('child_process');
const Path = require('path');
const FS = require('fs');
const SHELL_CODES = {
	reset: '\x1b[0m',
	bold: '\x1b[1m',
	blue: '\x1b[34m',
	red: '\x1b[31m',
	green: '\x1b[32m'
};

process.on('unhandledRejection', (reason) => {
	console.error('');
	console.error(SHELL_CODES.red, reason, SHELL_CODES.reset);
	console.error('');
	process.exit(1);
});

main();

/**
 * Main method.
 */
async function main() {
	const packageJson = require(Path.resolve('package.json'));
	const rules = packageJson['happyLintChanged']?.rules || [
		{
			regexp: '^[a-zA-Z0-9_].*\\.(cjs|mjs|js|jsx|ts|tsx|json)$',
			command: `eslint --max-warnings 0 --fix`
		}
	];
	let failed = false;

	for (const rule of rules) {
		if (!rule.regexp || !rule.command) {
			throw new Error(
				'Invalid rule defined in "package.json" in the "happyLintChanged" property. Each rule must have the properties "regexp" and "command".'
			);
		}

		process.stdout.write(
			`\n${SHELL_CODES.blue}${SHELL_CODES.bold}Running rule:${SHELL_CODES.reset} ${rule.command} (${rule.regexp})\n`
		);

		const changedFiles = await execChildProcess(
			`git diff --diff-filter=d --name-only HEAD | grep -E '${rule.regexp}' | xargs`
		);
		const trimmedChangedFiles = changedFiles.trim();

		if (trimmedChangedFiles) {
			const exitCode = await streamChildProcess(`${rule.command} ${trimmedChangedFiles}`);
			if (exitCode !== 0) {
				failed = true;
			}
		}
	}

	if (failed) {
		process.stdout.write(
			`\n${SHELL_CODES.red}${SHELL_CODES.bold}Linting failed.${SHELL_CODES.reset}\n\n`
		);
		process.exit(1);
	} else {
		process.stdout.write(
			`\n${SHELL_CODES.green}${SHELL_CODES.bold}Linting was successful.${SHELL_CODES.reset}\n\n`
		);
	}
}

function streamChildProcess(command) {
	return new Promise((resolve) => {
		const [commandName, ...commandArgs] = command.split(' ');
		const commandPath = require.resolve(Path.join('.bin', commandName));
		const childProcess = ChildProcess.spawn(commandPath, commandArgs, {
			cwd: process.cwd(),
			stdio: 'inherit'
		});

		childProcess.on('close', (code) => {
			resolve(code);
		});
	});
}

function execChildProcess(command) {
	return new Promise((resolve, reject) => {
		ChildProcess.exec(
			command,
			{ cwd: process.cwd(), stdio: 'inherit' },
			(error, stdout, stderr) => {
				if (stderr) {
					process.stderr.write(stderr);
				}
				if (error) {
					reject(error);
				} else {
					resolve(stdout);
				}
			}
		);
	});
}
