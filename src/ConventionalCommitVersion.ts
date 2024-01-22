import ChildProcess from 'child_process';

/**
 * Conventional commit version.
 */
export default class ConventionalCommitVersion {
	/**
	 * Returns next version based on commit messages.
	 *
	 * @returns Next version.
	 */
	public static async getNextVersion(): Promise<string> {
		const currentVersionString = await this.getCurrentVersion();
		const commits = await this.getCommitMessages();
		const currentVersionParts = currentVersionString.split('-')[0].replace('v', '').split('.');
		const change = {
			major: false,
			minor: false,
			patch: false
		};
		const currentVersion = {
			major: Number(currentVersionParts[0]),
			minor: Number(currentVersionParts[1]),
			patch: Number(currentVersionParts[2])
		};
		const version = {
			major: currentVersion.major,
			minor: currentVersion.minor,
			patch: currentVersion.patch
		};

		if (isNaN(version.major) || isNaN(version.minor) || isNaN(version.patch)) {
			throw new Error(
				'Failed to get current version based on commits. Is Git not fetching all commits in a Github action? Try setting fetch-depth to "0".'
			);
		}

		for (const commit of commits.split(/[\n\r]/gm)) {
			const parts = commit.trim().split(':');
			if (parts.length === 1 && !commit.startsWith('Merge ')) {
				if (parts[0]) {
					change.patch = true;
				}
			} else {
				const type = parts[0];
				switch (type) {
					case 'BREAKING CHANGE':
						change.major = true;
						break;
					case 'feat':
						change.minor = true;
						break;
					case 'fix':
						change.patch = true;
						break;
				}
			}
		}

		if (change.major) {
			version.major++;
			version.minor = 0;
			version.patch = 0;
		} else if (change.minor) {
			version.minor++;
			version.patch = 0;
		} else if (change.patch) {
			version.patch++;
		}

		if (
			version.major !== currentVersion.major ||
			version.minor !== currentVersion.minor ||
			version.patch !== currentVersion.patch
		) {
			return `${version.major}.${version.minor}.${version.patch}`;
		}

		return null;
	}

	/**
	 * Returns current version from Git tags.
	 *
	 * @returns Current version.
	 */
	public static async getCurrentVersion(): Promise<string> {
		await this.fetchGitTags();
		return await this.getCurrentVersionFromGitTags();
	}

	/**
	 * Returns current version from Git tags.
	 *
	 * @returns Current version.
	 */
	private static getCurrentVersionFromGitTags(): Promise<string> {
		return new Promise((resolve, reject) => {
			ChildProcess.exec('git tag | sort -V | tail -1', (error, stdout) => {
				if (error) {
					reject(error);
				} else {
					const currentVersion = stdout.trim().split('-')[0].replace('v', '');
					if (!currentVersion) {
						reject(new Error('Failed to get current version from Git tags.'));
					} else {
						resolve(currentVersion);
					}
				}
			});
		});
	}

	/**
	 * Fetches Git tags from remote source.
	 *
	 * @returns Promise.
	 */
	private static fetchGitTags(): Promise<void> {
		return new Promise((resolve, reject) => {
			ChildProcess.exec(`git fetch --all --tags`, (error) => {
				if (error) {
					reject(error);
				} else {
					resolve();
				}
			});
		});
	}

	/**
	 * Returns commit messages.
	 *
	 * @returns Commit messages.
	 */
	private static getCommitMessages(): Promise<string> {
		return new Promise((resolve, reject) => {
			ChildProcess.exec(
				'git --no-pager log $(git describe --tags --abbrev=0)..HEAD --pretty=format:"%s" --simplify-merges --dense',
				(error, stdout) => {
					if (error) {
						reject(error);
					} else {
						resolve(stdout.trim());
					}
				}
			);
		});
	}
}
