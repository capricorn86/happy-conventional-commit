import { describe, it, expect } from 'vitest';
import ConventionalCommitValidator from '../src/ConventionalCommitValidator';

describe('ConventionalCommitValidator', () => {
	describe('validate()', () => {
		it('Validates commits.', () => {
			expect(ConventionalCommitValidator.validate('Wrong')).toEqual([
				'Wrong format. Use the format: "{type}: [{taskID}] {description}". Acceptable types: "chore", "fix", "feat", "BREAKING CHANGE".'
			]);

			expect(ConventionalCommitValidator.validate('arne: [#123] Wrong commit type')).toEqual([
				'Unknown commit type. Acceptable types: "chore", "fix", "feat", "BREAKING CHANGE".'
			]);

			expect(ConventionalCommitValidator.validate('chore: Missing task id')).toEqual([
				'Wrong format. Use the format: "{type}: [{taskID}] {description}". Acceptable types: "chore", "fix", "feat", "BREAKING CHANGE".'
			]);

			expect(
				ConventionalCommitValidator.validate(
					'chore: [#123] description should start with an upper case character'
				)
			).toEqual(['The description should start with an upper case character.']);

			expect(ConventionalCommitValidator.validate('chore: [ABC-12345] With punctuation.')).toEqual([
				'The description should not end with a punctuation (.), unless there are multiple sentences.'
			]);

			expect(
				ConventionalCommitValidator.validate('chore: [ABC-12345] Without punctuation')
			).toEqual([]);

			expect(
				ConventionalCommitValidator.validate('chore: [ABC-12345] Multiple. Sentences.')
			).toEqual([]);

			expect(ConventionalCommitValidator.validate('chore: [#123] Github task')).toEqual([]);

			expect(ConventionalCommitValidator.validate('fix: [#123] Fix')).toEqual([]);

			expect(ConventionalCommitValidator.validate('feat: [#123] Feature')).toEqual([]);

			expect(ConventionalCommitValidator.validate('BREAKING CHANGE: [#123] Breaking')).toEqual([]);

			expect(ConventionalCommitValidator.validate('Merge branch with branch')).toEqual([]);
		});
	});
});
