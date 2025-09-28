#!/usr/bin/env node
'use strict';

/* eslint-disable no-console */

const Path = require('path');
const FS = require('fs');
const { glob } = require('glob');

const SHELL_CODES = {
	reset: '\x1b[0m',
	bold: '\x1b[1m',
	blue: '\x1b[34m',
	red: '\x1b[31m',
	gray: '\x1b[90m',
	green: '\x1b[32m'
};

const VERSION_REGEXP = /[0-9]+\.[0-9]+\.[0-9]+/;

process.on('unhandledRejection', (reason) => {
	console.error(SHELL_CODES.red, reason, SHELL_CODES.reset);
	process.exit(1);
});

main();

/**
 * Returns arguments.
 *
 * @returns {object} Arguments.
 */
function getArguments() {
	const args = {
		version: null
	};

	for (const arg of process.argv) {
		if (arg.startsWith('--version=')) {
			args.version = arg.split('=')[1];
		}
	}

	return args;
}

async function getWorkspacePackages() {
	const rootPackageJsonFilepath = Path.resolve('package.json');
	const rootPackageJson = require(rootPackageJsonFilepath);
	const workspaces = rootPackageJson.workspaces;
	const rootDirectory = Path.dirname(rootPackageJsonFilepath);

	if (!workspaces) {
		return { root: { path: rootDirectory, packageJson: rootPackageJson } };
	}

	const workspacePackages = {};
	const promises = [];

	for (const workspace of workspaces) {
		promises.push(glob(workspace, { cwd: Path.dirname(rootPackageJsonFilepath) }));
	}

	const workspaceMatches = await Promise.all(promises);

	for (const workspaceMatch of workspaceMatches) {
		for (const directory of workspaceMatch) {
			let packageJson;

            try{
               packageJson = require(Path.join(rootDirectory, directory, 'package.json'));
            } catch(e){
                // Ignore
            }

			if (packageJson && !packageJson.private) {
				workspacePackages[packageJson.name] = {
					path: Path.join(rootDirectory, directory),
					packageJson
				};
			}
		}
	}

	return workspacePackages;
}

/**
 * Main method.
 */
async function main() {
	const args = getArguments();

	if (!args.version) {
		throw new Error('Invalid arguments. Expected "--version={version}".');
	}

	const version = args.version.replace('v', '');
	const workspacePackages = await getWorkspacePackages();
	const promises = [];

	console.log(
		SHELL_CODES.blue,
		SHELL_CODES.bold,
		`Setting workspace version to ${version}:`,
		SHELL_CODES.reset
	);

	for (const workspacePackageName of Object.keys(workspacePackages)) {
		const workspacePackage = workspacePackages[workspacePackageName];

		console.log(
			SHELL_CODES.gray,
			SHELL_CODES.bold,
			` - ${workspacePackage.path}`,
			SHELL_CODES.reset
		);

		workspacePackage.packageJson.version = version;

		const dependencies = workspacePackage.packageJson.dependencies;
		if (dependencies) {
			for (const dependency of Object.keys(dependencies)) {
				if (workspacePackages[dependency]) {
					dependencies[dependency] = dependencies[dependency].replace(VERSION_REGEXP, version);
				}
			}
		}

		promises.push(
			FS.promises.writeFile(
				Path.join(workspacePackage.path, 'package.json'),
				JSON.stringify(workspacePackage.packageJson, null, 2)
			)
		);
	}

	console.log(SHELL_CODES.green, SHELL_CODES.bold, 'Done.', SHELL_CODES.reset);

	await Promise.all(promises);
}
