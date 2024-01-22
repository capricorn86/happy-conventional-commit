import { describe, afterEach, it, expect, vi } from 'vitest';
import ChildProcess from 'child_process';
import ConventionalCommitVersion from '../src/ConventionalCommitVersion';

describe('ConventionalCommitVersion', () => {
	afterEach(() => {
		vi.resetAllMocks();
	});

	describe('getNextVersion()', () => {
		it('Should return next patch version.', async () => {
			const currentVersion = '2.1.0';
			const gitCommits = [
				'Merge branch with branch',
				'chore: [TASK-123] Update dependencies.',
				'fix: [TASK-123] Fix bug.',
				'fix: [TASK-123] Fix another bug.',
				'chore: [TASK-123] Update dependencies.'
			];

			vi.spyOn(ChildProcess, 'exec').mockImplementation(
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				(command: string, callback: (error: Error | null, stdout: string) => void): void => {
					switch (command) {
						case 'git tag | sort -V | tail -1':
							callback(null, `v${currentVersion}-rc`);
							break;
						case 'git --no-pager log $(git describe --tags --abbrev=0)..HEAD --pretty=format:"%s" --simplify-merges --dense':
							callback(null, gitCommits.join('\n'));
							break;
						case 'git fetch --all --tags':
							callback(null, '');
							break;
						default:
							callback(new Error(`Command failed: ${command}`), '');
							break;
					}
				}
			);

			const result = await ConventionalCommitVersion.getNextVersion();
			expect(result).toBe('2.1.1');
		});

		it('Should return next minor version.', async () => {
			const currentVersion = '2.1.0';
			const gitCommits = [
				'Merge branch with branch',
				'chore: [TASK-123] Update dependencies.',
				'feat: [TASK-123] Add new feature.',
				'feat: [TASK-123] Add another feature.',
				'Merge branch with branch',
				'fix: [TASK-123] Fix bug.',
				'chore: [TASK-123] Update dependencies.'
			];

			vi.spyOn(ChildProcess, 'exec').mockImplementation(
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				(command: string, callback: (error: Error | null, stdout: string) => void): void => {
					switch (command) {
						case 'git tag | sort -V | tail -1':
							callback(null, `v${currentVersion}-rc`);
							break;
						case 'git --no-pager log $(git describe --tags --abbrev=0)..HEAD --pretty=format:"%s" --simplify-merges --dense':
							callback(null, gitCommits.join('\n'));
							break;
						case 'git fetch --all --tags':
							callback(null, '');
							break;
						default:
							callback(new Error(`Command failed: ${command}`), '');
							break;
					}
				}
			);

			const result = await ConventionalCommitVersion.getNextVersion();
			expect(result).toBe('2.2.0');
		});

		it('Should return next major version.', async () => {
			const currentVersion = '2.1.0';
			const gitCommits = [
				'Merge branch with branch',
				'chore: [TASK-123] Update dependencies.',
				'feat: [TASK-123] Add new feature.',
				'feat: [TASK-123] Add another feature.',
				'Merge branch with branch',
				'fix: [TASK-123] Fix bug.',
				'chore: [TASK-123] Update dependencies.',
				'BREAKING CHANGE: [TASK-123] Breakes stuff.'
			];

			vi.spyOn(ChildProcess, 'exec').mockImplementation(
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				(command: string, callback: (error: Error | null, stdout: string) => void): void => {
					switch (command) {
						case 'git tag | sort -V | tail -1':
							callback(null, `v${currentVersion}-rc`);
							break;
						case 'git --no-pager log $(git describe --tags --abbrev=0)..HEAD --pretty=format:"%s" --simplify-merges --dense':
							callback(null, gitCommits.join('\n'));
							break;
						case 'git fetch --all --tags':
							callback(null, '');
							break;
						default:
							callback(new Error(`Command failed: ${command}`), '');
							break;
					}
				}
			);

			const result = await ConventionalCommitVersion.getNextVersion();
			expect(result).toBe('3.0.0');
		});

		it('Should support non conventional commits.', async () => {
			const currentVersion = '2.1.0';
			const gitCommits = [
				'Merge branch with branch',
				'chore: [TASK-123] Update dependencies.',
				'TASK-123 Fix bug',
				'chore: [TASK-123] Update dependencies.'
			];

			vi.spyOn(ChildProcess, 'exec').mockImplementation(
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				(command: string, callback: (error: Error | null, stdout: string) => void): void => {
					switch (command) {
						case 'git tag | sort -V | tail -1':
							callback(null, `v${currentVersion}-rc`);
							break;
						case 'git --no-pager log $(git describe --tags --abbrev=0)..HEAD --pretty=format:"%s" --simplify-merges --dense':
							callback(null, gitCommits.join('\n'));
							break;
						case 'git fetch --all --tags':
							callback(null, '');
							break;
						default:
							callback(new Error(`Command failed: ${command}`), '');
							break;
					}
				}
			);

			const result = await ConventionalCommitVersion.getNextVersion();
			expect(result).toBe('2.1.1');
		});

		it('Returns null there is no new version.', async () => {
			const currentVersion = '2.1.0';
			const gitCommits = [];

			vi.spyOn(ChildProcess, 'exec').mockImplementation(
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				(command: string, callback: (error: Error | null, stdout: string) => void): void => {
					switch (command) {
						case 'git tag | sort -V | tail -1':
							callback(null, `v${currentVersion}-rc`);
							break;
						case 'git --no-pager log $(git describe --tags --abbrev=0)..HEAD --pretty=format:"%s" --simplify-merges --dense':
							callback(null, gitCommits.join('\n'));
							break;
						case 'git fetch --all --tags':
							callback(null, '');
							break;
						default:
							callback(new Error(`Command failed: ${command}`), '');
							break;
					}
				}
			);

			const result = await ConventionalCommitVersion.getNextVersion();
			expect(result).toBe(null);
		});
	});

	describe('getCurrentVersion()', () => {
		it('Should return current version.', async () => {
			const currentVersion = '2.1.0';

			vi.spyOn(ChildProcess, 'exec').mockImplementation(
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				(command: string, callback: (error: Error | null, stdout: string) => void): void => {
					switch (command) {
						case 'git tag | sort -V | tail -1':
							callback(null, `v${currentVersion}-rc`);
							break;
						case 'git fetch --all --tags':
							callback(null, '');
							break;
						default:
							callback(new Error(`Command failed: ${command}`), '');
							break;
					}
				}
			);

			const result = await ConventionalCommitVersion.getCurrentVersion();
			expect(result).toBe('2.1.0');
		});
	});
});
