import { describe, afterEach, it, expect, vi } from 'vitest';
import ChildProcess from 'child_process';
import HTTPS from 'https';
import ConventionalCommitReleaseNotes from '../src/ConventionalCommitReleaseNotes';
import { ClientRequest, IncomingMessage } from 'http';

describe('ConventionalCommitReleaseNotes', () => {
	afterEach(async () => {
		vi.resetAllMocks();
	});

	describe('getReleaseNotes()', () => {
		it('Should return release notes with version header.', async () => {
			const gitTags = ['v2.1.0-rc', 'v2.0.0', 'v2.0.0-rc', 'v1.1.0', 'v1.0.0'];
			const gitCommits = [
				'Merge branch with branch|Firstname Lastname|example@example.se',
				'chore: [TASK-123] Update dependencies.|Firstname Lastname|example@example.se',
				'feat: [TASK-123] Add new feature.|Firstname Lastname|example@example.se',
				'feat: [TASK-123] Add another feature.|Firstname Lastname|example@example.se',
				'Merge branch with branch|Firstname Lastname|example@example.se',
				'fix: [TASK-123] Fix bug.|Firstname Lastname|example@example.se',
				'chore: [TASK-123] Update dependencies.|Firstname Lastname|example@example.se',
				'BREAKING CHANGE: [TASK-123] Breaking.|Firstname Lastname|example@example.se'
			];

			vi.spyOn(ChildProcess, 'exec').mockImplementation(
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				(command: string, callback: (error: Error | null, stdout: string) => void): void => {
					switch (command) {
						case 'git --no-pager log v2.0.0..v2.1.0-rc --pretty=format:"%s|%cn|%ce"':
							callback(null, gitCommits.join('\n'));
							break;
						case 'git --no-pager tag -l --sort -version:refname':
							callback(null, gitTags.join('\n'));
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

			const result = await ConventionalCommitReleaseNotes.getReleaseNotes({
				versionHeader: true
			});
			expect(result.replace(/\s/g, '')).toBe(
				`#v2.1.0-rc

                ### :bomb: Breaking Changes
                 - Breaking - In task TASK-123
                
                ### :art: Features
                 - Add new feature - In task TASK-123
                 - Add another feature - In task TASK-123
                
                ### :construction_worker_man: Patch fixes
                 - Fix bug - In task TASK-123`.replace(/\s/g, '')
			);
		});

		it('Should return release notes with markdown.', async () => {
			const gitTags = ['v2.1.0-rc', 'v2.0.0', 'v2.0.0-rc', 'v1.1.0', 'v1.0.0'];
			const gitCommits = [
				'Merge branch with branch|Firstname Lastname|example@example.se',
				'chore: [TASK-123] Update dependencies.|Firstname Lastname|example@example.se',
				'feat: [TASK-123] Add new feature.|Firstname Lastname|example@example.se',
				'feat: [TASK-123] Add another feature.|Firstname Lastname|example@example.se',
				'Merge branch with branch|Firstname Lastname|example@example.se',
				'fix: [TASK-123] Fix bug.|Firstname Lastname|example@example.se',
				'chore: [TASK-123] Update dependencies.|Firstname Lastname|example@example.se',
				'BREAKING CHANGE: [TASK-123] Breaking.|Firstname Lastname|example@example.se'
			];

			vi.spyOn(ChildProcess, 'exec').mockImplementation(
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				(command: string, callback: (error: Error | null, stdout: string) => void): void => {
					switch (command) {
						case 'git --no-pager log v2.0.0..v2.1.0-rc --pretty=format:"%s|%cn|%ce"':
							callback(null, gitCommits.join('\n'));
							break;
						case 'git --no-pager tag -l --sort -version:refname':
							callback(null, gitTags.join('\n'));
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

			const result = await ConventionalCommitReleaseNotes.getReleaseNotes({
				versionHeader: true
			});
			expect(result.replace(/\s/g, '')).toBe(
				`#v2.1.0-rc

                ### :bomb: Breaking Changes
                 - Breaking - In task TASK-123
                
                ### :art: Features
                 - Add new feature - In task TASK-123
                 - Add another feature - In task TASK-123
                
                ### :construction_worker_man: Patch fixes
                 - Fix bug - In task TASK-123`.replace(/\s/g, '')
			);
		});

		it('Should return release notes for multiple version from a specified version, which will force the version header to be shown.', async () => {
			const gitTags = ['v2.1.0-rc', 'v2.0.0', 'v2.0.0-rc', 'v1.1.0', 'v1.0.0'];
			const gitCommits = [
				'Merge branch with branch|Firstname Lastname|example@example.se',
				'chore: [TASK-123] Update dependencies.|Firstname Lastname|example@example.se',
				'feat: [TASK-123] Add new feature.|Firstname Lastname|example@example.se',
				'feat: [TASK-123] Add another feature.|Firstname Lastname|example@example.se',
				'Merge branch with branch|Firstname Lastname|example@example.se',
				'fix: [TASK-123] Fix bug.|Firstname Lastname|example@example.se',
				'chore: [TASK-123] Update dependencies.|Firstname Lastname|example@example.se',
				'BREAKING CHANGE: [TASK-123] Breaking.|Firstname Lastname|example@example.se'
			];

			vi.spyOn(ChildProcess, 'exec').mockImplementation(
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				(command: string, callback: (error: Error | null, stdout: string) => void): void => {
					switch (command) {
						case 'git --no-pager log v1.0.0..v1.1.0 --pretty=format:"%s|%cn|%ce"':
							callback(null, gitCommits.slice(0, 3).join('\n'));
							break;
						case 'git --no-pager log v1.1.0..v2.0.0 --pretty=format:"%s|%cn|%ce"':
							callback(null, gitCommits.slice(3, 5).join('\n'));
							break;
						case 'git --no-pager log v2.0.0..v2.1.0-rc --pretty=format:"%s|%cn|%ce"':
							callback(null, gitCommits.slice(5).join('\n'));
							break;
						case 'git --no-pager tag -l --sort -version:refname':
							callback(null, gitTags.join('\n'));
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

			const result = await ConventionalCommitReleaseNotes.getReleaseNotes({
				fromVersion: 'v1.0.0'
			});
			expect(result.replace(/\s/g, '')).toBe(
				`#v2.1.0-rc

                ### :bomb: Breaking Changes
                 - Breaking - In task TASK-123
                
                ### :construction_worker_man: Patch fixes
                 - Fix bug - In task TASK-123
                
                
                #v2.0.0
                
                ### :art: Features
                 - Add another feature - In task TASK-123
                
                
                #v1.1.0
                
                ### :art: Features
                 - Add new feature - In task TASK-123`.replace(/\s/g, '')
			);
		});

		it('Should return release notes from and to a specified version.', async () => {
			const gitTags = ['v2.1.0-rc', 'v2.0.0', 'v2.0.0-rc', 'v1.1.0', 'v1.1.1-rc', 'v1.0.0'];
			const gitCommits = [
				'Merge branch with branch|Firstname Lastname|example@example.se',
				'chore: [TASK-123] Update dependencies.|Firstname Lastname|example@example.se',
				'feat: [TASK-123] Add new feature.|Firstname Lastname|example@example.se',
				'feat: [TASK-123] Add another feature.|Firstname Lastname|example@example.se',
				'Merge branch with branch|Firstname Lastname|example@example.se',
				'fix: [TASK-123] Fix bug.|Firstname Lastname|example@example.se',
				'chore: [TASK-123] Update dependencies.|Firstname Lastname|example@example.se',
				'BREAKING CHANGE: [TASK-123] Breaking.|Firstname Lastname|example@example.se'
			];

			vi.spyOn(ChildProcess, 'exec').mockImplementation(
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				(command: string, callback: (error: Error | null, stdout: string) => void): void => {
					switch (command) {
						case 'git --no-pager log v1.0.0..v1.1.0 --pretty=format:"%s|%cn|%ce"':
							callback(null, gitCommits.join('\n'));
							break;
						case 'git --no-pager tag -l --sort -version:refname':
							callback(null, gitTags.join('\n'));
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

			const result = await ConventionalCommitReleaseNotes.getReleaseNotes({
				fromVersion: 'v1.0.0',
				toVersion: 'v1.1.0'
			});
			expect(result.replace(/\s/g, '')).toBe(
				`### :bomb: Breaking Changes
                - Breaking - In task TASK-123
               
               ### :art: Features
                - Add new feature - In task TASK-123
                - Add another feature - In task TASK-123
               
               ### :construction_worker_man: Patch fixes
                - Fix bug - In task TASK-123`.replace(/\s/g, '')
			);
		});

		it('Should support non conventional commits.', async () => {
			const gitTags = ['v2.1.0-rc', 'v2.0.0', 'v2.0.0-rc', 'v1.1.0', 'v1.1.1-rc', 'v1.0.0'];
			const gitCommits = [
				'Merge branch with branch|Firstname Lastname|example@example.se',
				'chore: [TASK-123] Update dependencies.|Firstname Lastname|example@example.se',
				'feat: [TASK-123] Add new feature.|Firstname Lastname|example@example.se',
				'feat: [TASK-123] Add another feature.|Firstname Lastname|example@example.se',
				'Merge branch with branch|Firstname Lastname|example@example.se',
				'fix: [TASK-123] Fix bug.|Firstname Lastname|example@example.se',
				'TASK-123 Non-conventional 1|Firstname Lastname|example@example.se',
				'TASK-123: Non-conventional 2|Firstname Lastname|example@example.se',
				'[TASK-123] Non-conventional 3|Firstname Lastname|example@example.se',
				'chore: [TASK-123] Update dependencies.|Firstname Lastname|example@example.se',
				'BREAKING CHANGE: [TASK-123] Breaking.|Firstname Lastname|example@example.se'
			];

			vi.spyOn(ChildProcess, 'exec').mockImplementation(
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				(command: string, callback: (error: Error | null, stdout: string) => void): void => {
					switch (command) {
						case 'git --no-pager log v1.0.0..v1.1.0 --pretty=format:"%s|%cn|%ce"':
							callback(null, gitCommits.join('\n'));
							break;
						case 'git --no-pager tag -l --sort -version:refname':
							callback(null, gitTags.join('\n'));
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

			const result = await ConventionalCommitReleaseNotes.getReleaseNotes({
				fromVersion: 'v1.0.0',
				toVersion: 'v1.1.0'
			});
			expect(result.replace(/\s/g, '')).toBe(
				`### :bomb: Breaking Changes
                - Breaking - In task TASK-123
               
               ### :art: Features
                - Add new feature - In task TASK-123
                - Add another feature - In task TASK-123
               
               ### :construction_worker_man: Patch fixes
                - Fix bug - In task TASK-123
                - TASK-123 Non-conventional 1
                - TASK-123: Non-conventional 2
                - Non-conventional 3 - In task TASK-123`.replace(/\s/g, '')
			);
		});

		it('Should support author by name and email.', async () => {
			const gitTags = ['v2.1.0-rc', 'v2.0.0', 'v2.0.0-rc', 'v1.1.0', 'v1.1.1-rc', 'v1.0.0'];
			const gitCommits = [
				'Merge branch with branch|Firstname Lastname|example@example.se',
				'chore: [#123] Update dependencies.|Firstname Lastname|example@example.se',
				'feat: [#123] Add new feature.|Firstname Lastname|example@example.se',
				'feat: [#123] Add another feature.|Firstname Lastname|example@example.se',
				'Merge branch with branch|Firstname Lastname|example@example.se',
				'fix: [#123] Fix bug.|Firstname Lastname|example@example.se',
				'#123 Non-conventional 1|Firstname Lastname|example@example.se',
				'#123: Non-conventional 2|Firstname Lastname|example@example.se',
				'[#123] Non-conventional 3|Firstname Lastname|example@example.se',
				'chore: [#123] Update dependencies.|Firstname Lastname|example@example.se',
				'BREAKING CHANGE: [#123] Breaking.|Firstname Lastname|example@example.se'
			];

			vi.spyOn(ChildProcess, 'exec').mockImplementation(
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				(command: string, callback: (error: Error | null, stdout: string) => void): void => {
					switch (command) {
						case 'git --no-pager log v1.0.0..v1.1.0 --pretty=format:"%s|%cn|%ce"':
							callback(null, gitCommits.join('\n'));
							break;
						case 'git --no-pager tag -l --sort -version:refname':
							callback(null, gitTags.join('\n'));
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

			const result = await ConventionalCommitReleaseNotes.getReleaseNotes({
				fromVersion: 'v1.0.0',
				toVersion: 'v1.1.0',
				author: 'nameAndEmail'
			});
			expect(result.replace(/\s/g, '')).toBe(
				`### :bomb: Breaking Changes
                - Breaking - By **Firstname Lastname (example@example.se)** in task #123
               
               ### :art: Features
                - Add new feature - By **Firstname Lastname (example@example.se)** in task #123
                - Add another feature - By **Firstname Lastname (example@example.se)** in task #123
               
               ### :construction_worker_man: Patch fixes
                - Fix bug - By **Firstname Lastname (example@example.se)** in task #123
                - Non-conventional 1 - By **Firstname Lastname (example@example.se)** in task #123
                - : Non-conventional 2 - By **Firstname Lastname (example@example.se)** in task #123
                - Non-conventional 3 - By **Firstname Lastname (example@example.se)** in task #123`.replace(
					/\s/g,
					''
				)
			);
		});

		it('Should support author by Github username.', async () => {
			const gitTags = ['v2.1.0-rc', 'v2.0.0', 'v2.0.0-rc', 'v1.1.0', 'v1.1.1-rc', 'v1.0.0'];
			const gitCommits = [
				'Merge branch with branch|Firstname Lastname|example@example.se',
				'chore: [#123] Update dependencies.|Firstname Lastname|example@example.se',
				'feat: [#123] Add new feature.|Firstname Lastname|example@example.se',
				'feat: [#123] Add another feature.|Firstname Lastname|example@example.se',
				'Merge branch with branch|Firstname Lastname|example@example.se',
				'fix: [#123] Fix bug.|Firstname Lastname|example@example.se',
				'#123 Non-conventional 1|Firstname Lastname|example@example.se',
				'#123: Non-conventional 2|Firstname Lastname|example@example.se',
				'[#123] Non-conventional 3|Firstname Lastname|example@example.se',
				'chore: [#123] Update dependencies.|Firstname Lastname|example@example.se',
				'BREAKING CHANGE: [#123] Breaking.|Firstname Lastname|example@example.se'
			];

			vi.spyOn(ChildProcess, 'exec').mockImplementation(
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				(command: string, callback: (error: Error | null, stdout: string) => void): void => {
					switch (command) {
						case 'git --no-pager log v1.0.0..v1.1.0 --pretty=format:"%s|%cn|%ce"':
							callback(null, gitCommits.join('\n'));
							break;
						case 'git --no-pager tag -l --sort -version:refname':
							callback(null, gitTags.join('\n'));
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

			vi.spyOn(HTTPS, 'get').mockImplementation((url, options, callback) => {
				expect(url).toBe('https://api.github.com/search/users?q=example@example.se');
				expect(options).toEqual({
					headers: {
						'User-Agent': 'nodejs'
					}
				});
				if (!callback) {
					throw new Error('Callback is undefined');
				}
				callback(<IncomingMessage>{
					on: (event, callback) => {
						if (event === 'data') {
							callback(
								JSON.stringify({
									items: [
										{
											login: 'testGithubUsername'
										}
									]
								})
							);
						} else if (event === 'end') {
							callback();
						}
					}
				});
				return <ClientRequest>{};
			});

			const result = await ConventionalCommitReleaseNotes.getReleaseNotes({
				fromVersion: 'v1.0.0',
				toVersion: 'v1.1.0',
				author: 'githubUsername'
			});
			expect(result.replace(/\s/g, '')).toBe(
				`### :bomb: Breaking Changes
                - Breaking - By **@testGithubUsername** in task #123
               
               ### :art: Features
                - Add new feature - By **@testGithubUsername** in task #123
                - Add another feature - By **@testGithubUsername** in task #123
               
               ### :construction_worker_man: Patch fixes
                - Fix bug - By **@testGithubUsername** in task #123
                - Non-conventional 1 - By **@testGithubUsername** in task #123
                - : Non-conventional 2 - By **@testGithubUsername** in task #123
                - Non-conventional 3 - By **@testGithubUsername** in task #123`.replace(/\s/g, '')
			);
		});

		it('Should support author by Github username and fallback username.', async () => {
			const gitTags = ['v2.1.0-rc', 'v2.0.0', 'v2.0.0-rc', 'v1.1.0', 'v1.1.1-rc', 'v1.0.0'];
			const gitCommits = [
				'Merge branch with branch|Firstname Lastname|example@example.se',
				'chore: [#123] Update dependencies.|Firstname Lastname|example@example.se',
				'feat: [#123] Add new feature.|Firstname Lastname|example@example.se',
				'feat: [#123] Add another feature.|Firstname Lastname|example@example.se',
				'Merge branch with branch|Firstname Lastname|example@example.se',
				'fix: [#123] Fix bug.|Firstname Lastname|example@example.se',
				'#123 Non-conventional 1|Firstname Lastname|example@example.se',
				'#123: Non-conventional 2|Firstname Lastname|example@example.se',
				'#123@minor: Non-conventional 3|Firstname Lastname|example@example.se',
				'chore: [#123] Update dependencies.|Firstname Lastname|example@example.se',
				'BREAKING CHANGE: [#123] Breaking.|Firstname2 Lastname2|example2@example.se'
			];

			vi.spyOn(ChildProcess, 'exec').mockImplementation(
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				(command: string, callback: (error: Error | null, stdout: string) => void): void => {
					switch (command) {
						case 'git --no-pager log v1.0.0..v1.1.0 --pretty=format:"%s|%cn|%ce"':
							callback(null, gitCommits.join('\n'));
							break;
						case 'git --no-pager tag -l --sort -version:refname':
							callback(null, gitTags.join('\n'));
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

			vi.spyOn(HTTPS, 'get').mockImplementation((url, _options, callback) => {
				if (!callback) {
					throw new Error('Callback is undefined');
				}
				callback(<IncomingMessage>{
					on: (event, callback) => {
						if (event === 'data') {
							callback(
								JSON.stringify(
									url.toString().includes('example@example.se')
										? {
												items: [
													{
														login: 'testGithubUsername'
													}
												]
											}
										: {}
								)
							);
						} else if (event === 'end') {
							callback();
						}
					}
				});
				return <ClientRequest>{};
			});

			const result = await ConventionalCommitReleaseNotes.getReleaseNotes({
				fromVersion: 'v1.0.0',
				toVersion: 'v1.1.0',
				author: 'githubUsername',
				authorUsername: 'fallbackUsername'
			});
			expect(result.replace(/\s/g, '')).toBe(
				`### :bomb: Breaking Changes
                - Breaking - By **@fallbackUsername** in task #123
               
               ### :art: Features
                - Add new feature - By **@testGithubUsername** in task #123
                - Add another feature - By **@testGithubUsername** in task #123
               
               ### :construction_worker_man: Patch fixes
                - Fix bug - By **@testGithubUsername** in task #123
                - Non-conventional 1 - By **@testGithubUsername** in task #123
                - : Non-conventional 2 - By **@testGithubUsername** in task #123
                - Minor: Non-conventional 3 - By **@testGithubUsername** in task #123`.replace(
					/\s/g,
					''
				)
			);
		});

		it('Should support author by fallback username.', async () => {
			const gitTags = ['v2.1.0-rc', 'v2.0.0', 'v2.0.0-rc', 'v1.1.0', 'v1.1.1-rc', 'v1.0.0'];
			const gitCommits = [
				'Merge branch with branch|Firstname Lastname|example@example.se',
				'chore: [#123] Update dependencies.|Firstname Lastname|example@example.se',
				'feat: [#123] Add new feature.|Firstname Lastname|example@example.se',
				'feat: [#123] Add another feature.|Firstname Lastname|example@example.se',
				'Merge branch with branch|Firstname Lastname|example@example.se',
				'fix: [#123] Fix bug.|Firstname Lastname|example@example.se',
				'#123 Non-conventional 1|Firstname Lastname|example@example.se',
				'#123: Non-conventional 2|Firstname Lastname|example@example.se',
				'#123@minor: Non-conventional 3|Firstname Lastname|example@example.se',
				'chore: [#123] Update dependencies.|Firstname Lastname|example@example.se',
				'BREAKING CHANGE: [#123] Breaking.|Firstname2 Lastname2|example2@example.se'
			];

			vi.spyOn(ChildProcess, 'exec').mockImplementation(
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				(command: string, callback: (error: Error | null, stdout: string) => void): void => {
					switch (command) {
						case 'git --no-pager log v1.0.0..v1.1.0 --pretty=format:"%s|%cn|%ce"':
							callback(null, gitCommits.join('\n'));
							break;
						case 'git --no-pager tag -l --sort -version:refname':
							callback(null, gitTags.join('\n'));
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

			const result = await ConventionalCommitReleaseNotes.getReleaseNotes({
				fromVersion: 'v1.0.0',
				toVersion: 'v1.1.0',
				authorUsername: 'fallbackUsername'
			});

			expect(result.replace(/\s/g, '')).toBe(
				`### :bomb: Breaking Changes
                - Breaking - By **@fallbackUsername** in task #123
               
               ### :art: Features
                - Add new feature - By **@fallbackUsername** in task #123
                - Add another feature - By **@fallbackUsername** in task #123
               
               ### :construction_worker_man: Patch fixes
                - Fix bug - By **@fallbackUsername** in task #123
                - Non-conventional 1 - By **@fallbackUsername** in task #123
                - : Non-conventional 2 - By **@fallbackUsername** in task #123
                - Minor: Non-conventional 3 - By **@fallbackUsername** in task #123`.replace(
					/\s/g,
					''
				)
			);
		});
	});
});
