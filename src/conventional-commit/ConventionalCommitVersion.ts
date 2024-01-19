import ChildProcess from "child_process";

/**
 * Conventional commit version.
 */
export default class ConventionalCommitVersion {
  /**
   * Returns next version based on commit messages.
   *
   * @param [options] Options.
   * @param [options.allowNonConventionalCommits] "true" to allow non conventional commits and consider them as a "patch" version.
   * @returns Next version.
   */
  public static async getNextVersion(options?: {
    allowNonConventionalCommits?: boolean;
  }): Promise<string> {
    const commits = await this.getCommitMessages();
    const currentVersion = await this.getCurrentVersion();
    const currentVersionParts = currentVersion
      .split("-")[0]
      .replace("v", "")
      .split(".");
    const change = {
      major: false,
      minor: false,
      patch: false,
    };
    const version = {
      major: Number(currentVersionParts[0]),
      minor: Number(currentVersionParts[1]),
      patch: Number(currentVersionParts[2]),
    };

    if (isNaN(version.major) || isNaN(version.minor) || isNaN(version.patch)) {
      throw new Error(
        'Failed to get current version based on commits. Is Git not fetching all commits in a Github action? Try setting fetch-depth to "0".'
      );
    }

    for (const commit of commits.split(/[\n\r]/gm)) {
      const parts = commit.trim().split(":");
      if (
        parts.length === 1 &&
        options?.allowNonConventionalCommits &&
        !commit.startsWith("Merge ")
      ) {
        change.patch = true;
      } else {
        const type = parts[0];
        switch (type) {
          case "BREAKING CHANGE":
            change.major = true;
            break;
          case "feat":
            change.minor = true;
            break;
          case "fix":
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

    return `${version.major}.${version.minor}.${version.patch}`;
  }

  /**
   * Returns current version from Git tags.
   *
   * @returns Current version.
   */
  public static getCurrentVersion(): Promise<string> {
    return new Promise((resolve, reject) => {
      ChildProcess.exec("git tag | sort -V | tail -1", (error, stdout) => {
        if (error) {
          reject(error);
        } else {
          resolve(stdout.trim().split("-")[0].replace("v", ""));
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
