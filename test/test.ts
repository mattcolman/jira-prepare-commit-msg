import test, { ExecutionContext } from 'ava';
import * as git from '../src/git'
import { defaultConfig as testConfig } from '../src/config'

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
