import test, { ExecutionContext } from 'ava';
import * as fs from 'fs';
import * as path from 'path';
import * as childProcess from 'child_process';
import * as git from '../src/git'
import { defaultConfig as testConfig } from '../src/config'

interface CommitMessageToTest {
  initialMessage: string[];
  expectedMessage: string;
  flags?: string;
}

const singleScopeMessage: CommitMessageToTest = {
  initialMessage: ['chore(deps): Finally solved that problem!'],
  expectedMessage: 'chore(deps): [JIRA-4321]. Finally solved that problem!',
};

const hyphenatedScopeMessage: CommitMessageToTest = {
  initialMessage: ['feat(new-service): Finally solved that problem!'],
  expectedMessage: 'feat(new-service): [JIRA-4321]. Finally solved that problem!',
};

const firstLineWithCommentMessage: CommitMessageToTest = {
  initialMessage: ['# This line is comment', 'chore(deps): Finally solved that problem!'],
  expectedMessage: 'chore(deps): [JIRA-4321]. Finally solved that problem!',
};

const imitateVerboseCommit: CommitMessageToTest = {
  initialMessage: [
    '\u00A0',
    '# Please enter the commit message for your changes. Lines starting',
    "# with '#' will be ignored, and an empty message aborts the commit.",
    '#',
    '# On branch master',
    "# Your branch is up to date with 'origin/master'.",
    '#',
    '# Changes to be committed:',
    '# ------------------------ >8 ------------------------',
  ],
  expectedMessage: '[JIRA-4321].',
};

function exec(cmd: string, cwd: string, t: ExecutionContext): Promise<string> {
  return new Promise((resolve, reject) => {
    console.log(`${t.title}. Exec ${cmd}`);

    childProcess.exec(cmd, { encoding: 'utf-8', cwd }, (err, stdout, stderr) => {
      err && console.error(`\t <= exec error: ${err}`);
      stdout && console.log(`\t <= exec stdout: ${stdout}`);
      stderr && console.error(`\t <= exec stderr: ${stderr}`);

      if (err) {
        return reject(err);
      }

      resolve(String(stdout).trim());
    });
  });
}

async function testCommitMessage(
  commitMessageToTest: CommitMessageToTest,
  folder: string,
  t: ExecutionContext,
): Promise<void> {
  const cwd = path.join(__dirname, folder);
  await exec('git config user.email "you@example.com"', cwd, t);
  await exec('git config user.name "Your Name"', cwd, t);
  await exec('git add .gitignore', cwd, t);

  // Because I can't imitate multiline commit in Windows CLI, I decided to use file
  const pathToTempFile = path.join(cwd, '.git', 'preparedCommitMessage');
  fs.writeFileSync(pathToTempFile, commitMessageToTest.initialMessage.join('\n'));

  await exec(
    `git commit --cleanup=strip ${commitMessageToTest.initialMessage.length !== 0 ? `-F ${pathToTempFile}` : '-m ""'}`,
    cwd,
    t,
  );

  const stdout = await exec('git log', cwd, t);
  const index = stdout.search(/(\[[A-Z]+-\d+])/i);
  t.is(index > -1, true, `Expected message: ${commitMessageToTest.expectedMessage}`);
  const index2 = stdout.includes(commitMessageToTest.expectedMessage);
  t.is(index2, true, `Expected message: ${commitMessageToTest.expectedMessage}`);
}

test('add ticket from branch name', async (t: ExecutionContext) => {
  const MESSAGE = "hello there";
  const testCases = [
    {
      branchName: "TASK-100",
      expectedIssueKey: "TASK-100",
      result: "[TASK-100] hello there",
    },
    {
      branchName: "JIRA-1-is-the-best",
      expectedIssueKey: "JIRA-1",
      result: "[JIRA-1] hello there",
    },
    {
      branchName: "ROBOT-777-LETS-get-it-done-2",
      expectedIssueKey: "ROBOT-777",
      result: "[ROBOT-777] hello there",
    },
    {
      // with an issue directory
      branchName: "issue/EASY-42-its-too-easy-baby",
      expectedIssueKey: "EASY-42",
      result: "[EASY-42] hello there",
    },
    {
      // issue key as a directory
      branchName: "TST-123/test-branch-name",
      expectedIssueKey: "TST-123",
      result: "[TST-123] hello there",
    },
    {
      // two issue keys in a branch does not work
      // it just takes the first key
      description: `Lowercase key won't work`,
      branchName: "TST-123-TST-456/test-branch-name",
      expectedIssueKey: "TST-123",
      result: "[TST-123] hello there",
    },
    {
      // Lowercase key won't work
      branchName: "test-500-lowercase-wont-work",
      expectedIssueKey: '',
      result: "hello there",
    },
    {
      // Issue key must include a dash
      branchName: "TEST100-nope-not-like-this",
      expectedIssueKey: '',
      result: "hello there",
    },
    {
      // Same issue key found in branch and message, just leave message as is.
      branchName: "TEST-100-branch-name",
      expectedIssueKey: 'TEST-100',
      message: 'TEST-100 hello there',
      result: "TEST-100 hello there",
    },
    {
      // Different key found in message to branch. Include both.
      branchName: "TEST-100-branch-name",
      expectedIssueKey: 'TEST-100',
      message: 'DIFF-123 hello there',
      result: "[TEST-100] DIFF-123 hello there",
    },
    {
      // No key in branch name, but key in message.
      branchName: "branch-name",
      expectedIssueKey: '',
      message: 'TEST-123 hello there',
      result: "TEST-123 hello there",
    },
    {
      // No key in branch name or in message.
      // a console warning is displayed.
      branchName: "branch-name",
      expectedIssueKey: '',
      message: 'hello there',
      result: "hello there",
    },
    {
      // numbers and letters in the branch name
      branchName: "issue/P2X-543-refactor-externalAssetsType-to-assetsScriptType*",
      expectedIssueKey: 'P2X-543',
      message: 'hello there',
      result: "[P2X-543] hello there",
    },
  ];  

  testCases.forEach((testCase) => {
    const ticket = git.getJiraTicket(testCase.branchName, testConfig);
    t.is(ticket, testCase.expectedIssueKey);
    t.is(git.insertJiraTicketIntoMessage(testCase.message ?? MESSAGE, ticket, testConfig), testCase.result);
  });
});

test.skip('husky2 Jira ticket ID should be in commit message', async (t: ExecutionContext) => {
  await testCommitMessage(singleScopeMessage, 'husky2', t);
  await exec('npm run cleanup:husky:2 && npm run prepare:husky:2', './', t);
  await testCommitMessage(hyphenatedScopeMessage, 'husky2', t);
  await exec('npm run cleanup:husky:2 && npm run prepare:husky:2', './', t);
  await testCommitMessage(firstLineWithCommentMessage, 'husky2', t);
  await exec('npm run cleanup:husky:2 && npm run prepare:husky:2', './', t);
  await testCommitMessage(imitateVerboseCommit, 'husky2', t);
});

test.skip('husky3 Jira ticket ID should be in commit message', async (t: ExecutionContext) => {
  await testCommitMessage(singleScopeMessage, 'husky3', t);
  await exec('npm run cleanup:husky:3 && npm run prepare:husky:3', './', t);
  await testCommitMessage(hyphenatedScopeMessage, 'husky3', t);
  await exec('npm run cleanup:husky:3 && npm run prepare:husky:3', './', t);
  await testCommitMessage(firstLineWithCommentMessage, 'husky3', t);
  await exec('npm run cleanup:husky:3 && npm run prepare:husky:3', './', t);
  await testCommitMessage(imitateVerboseCommit, 'husky3', t);
});

test.skip('husky4 Jira ticket ID should be in commit message', async (t: ExecutionContext) => {
  await testCommitMessage(singleScopeMessage, 'husky4', t);
  await exec('npm run cleanup:husky:4 && npm run prepare:husky:4', './', t);
  await testCommitMessage(hyphenatedScopeMessage, 'husky4', t);
  await exec('npm run cleanup:husky:4 && npm run prepare:husky:4', './', t);
  await testCommitMessage(firstLineWithCommentMessage, 'husky4', t);
  await exec('npm run cleanup:husky:4 && npm run prepare:husky:4', './', t);
  await testCommitMessage(imitateVerboseCommit, 'husky4', t);
});

test.skip('husky5 Jira ticket ID should be in commit message', async (t: ExecutionContext) => {
  await testCommitMessage(singleScopeMessage, 'husky5', t);
  await exec('npm run cleanup:husky:5 && npm run prepare:husky:5', './', t);
  await testCommitMessage(hyphenatedScopeMessage, 'husky5', t);
  await exec('npm run cleanup:husky:5 && npm run prepare:husky:5', './', t);
  await testCommitMessage(firstLineWithCommentMessage, 'husky5', t);
  await exec('npm run cleanup:husky:5 && npm run prepare:husky:5', './', t);
  await testCommitMessage(imitateVerboseCommit, 'husky5', t);
});
