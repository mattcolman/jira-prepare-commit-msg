import test, { ExecutionContext } from 'ava';
import * as git from '../src/git';
import { defaultConfig as testConfig } from '../src/config';

// test('add ticket from branch name', async (t: ExecutionContext) => {
//   const MESSAGE = 'hello there';
//   const testCases = [
//     {
//       branchName: 'TASK-100',
//       expectedIssueKey: 'TASK-100',
//       result: '[TASK-100] hello there',
//     },
//     {
//       branchName: 'JIRA-1-is-the-best',
//       expectedIssueKey: 'JIRA-1',
//       result: '[JIRA-1] hello there',
//     },
//     {
//       branchName: 'ROBOT-777-LETS-get-it-done-2',
//       expectedIssueKey: 'ROBOT-777',
//       result: '[ROBOT-777] hello there',
//     },
//     {
//       // with an issue directory
//       branchName: 'issue/EASY-42-its-too-easy-baby',
//       expectedIssueKey: 'EASY-42',
//       result: '[EASY-42] hello there',
//     },
//     {
//       // issue key as a directory
//       branchName: 'TST-123/test-branch-name',
//       expectedIssueKey: 'TST-123',
//       result: '[TST-123] hello there',
//     },
//     {
//       // two issue keys in a branch does not work
//       // it just takes the first key
//       description: `Lowercase key won't work`,
//       branchName: 'TST-123-TST-456/test-branch-name',
//       expectedIssueKey: 'TST-123',
//       result: '[TST-123] hello there',
//     },
//     {
//       // Lowercase key won't work
//       branchName: 'test-500-lowercase-wont-work',
//       expectedIssueKey: '',
//       result: 'hello there',
//     },
//     {
//       // Issue key must include a dash
//       branchName: 'TEST100-nope-not-like-this',
//       expectedIssueKey: '',
//       result: 'hello there',
//     },
//     {
//       // Same issue key found in branch and message, just leave message as is.
//       branchName: 'TEST-100-branch-name',
//       expectedIssueKey: 'TEST-100',
//       message: 'TEST-100 hello there',
//       result: 'TEST-100 hello there',
//     },
//     {
//       // Different key found in message to branch. Include both.
//       branchName: 'TEST-100-branch-name',
//       expectedIssueKey: 'TEST-100',
//       message: 'DIFF-123 hello there',
//       result: '[TEST-100] DIFF-123 hello there',
//     },
//     {
//       // No key in branch name, but key in message.
//       branchName: 'branch-name',
//       expectedIssueKey: '',
//       message: 'TEST-123 hello there',
//       result: 'TEST-123 hello there',
//     },
//     {
//       // No key in branch name or in message.
//       // a console warning is displayed.
//       branchName: 'branch-name',
//       expectedIssueKey: '',
//       message: 'hello there',
//       result: 'hello there',
//     },
//     {
//       // numbers and letters in the branch name
//       branchName: 'issue/P2X-543-refactor-externalAssetsType-to-assetsScriptType*',
//       expectedIssueKey: 'P2X-543',
//       message: 'hello there',
//       result: '[P2X-543] hello there',
//     },
//     {
//       // Conventional commits.
//       branchName: 'issue/CC-420-refactor-externalAssetsType-to-assetsScriptType*',
//       expectedIssueKey: 'CC-420',
//       message: 'build: hello there',
//       result: 'build: [CC-420] hello there',
//     },
//   ];

//   testCases.forEach((testCase) => {
//     if (testCase == testCases[13]) {
//       const ticket = git.getJiraTicket(testCase.branchName, testConfig);
//       t.is(ticket, testCase.expectedIssueKey);
//       t.is(git.insertJiraTicketIntoMessage(testCase.message ?? MESSAGE, ticket, testConfig), testCase.result);
//     }
//   });
// });

//---getJiraTicket START--//
test('getJiraTicket returns a ticket given a basic branch name', async (t: ExecutionContext) => {
  const testCase = {
    branchName: 'TASK-100',
    expectedIssueKey: 'TASK-100',
  };
  const ticket = git.getJiraTicket(testCase.branchName, testConfig);
  t.is(ticket, testCase.expectedIssueKey);
});
test('getJiraTicket returns a ticket given a compound branch name', async (t: ExecutionContext) => {
  const testCase = {
    branchName: 'JIRA-100-add-feature',
    expectedIssueKey: 'JIRA-100',
  };
  const ticket = git.getJiraTicket(testCase.branchName, testConfig);
  t.is(ticket, testCase.expectedIssueKey);
});
test('getJiraTicket returns a empty ticket given a mixed case branch name', async (t: ExecutionContext) => {
  const testCase = {
    branchName: 'Jira-100',
    expectedIssueKey: '',
  };
  const ticket = git.getJiraTicket(testCase.branchName, testConfig);
  t.is(ticket, testCase.expectedIssueKey);
});

test('getJiraTicket returns a ticket given a mixed type branch name', async (t: ExecutionContext) => {
  const testCase = {
    branchName: 'ROBOT-777-LETS-get-it-done-2',
    expectedIssueKey: 'ROBOT-777',
  };
  const ticket = git.getJiraTicket(testCase.branchName, testConfig);
  t.is(ticket, testCase.expectedIssueKey);
});
test('getJiraTicket returns a ticket given a directory branch name', async (t: ExecutionContext) => {
  const testCase = {
    branchName: 'issue/EASY-42-its-too-easy-baby',
    expectedIssueKey: 'EASY-42',
  };
  const ticket = git.getJiraTicket(testCase.branchName, testConfig);
  t.is(ticket, testCase.expectedIssueKey);
});
test('getJiraTicket returns a ticket given a ticket directory branch name', async (t: ExecutionContext) => {
  const testCase = {
    branchName: 'BOSS-42/its-too-easy-baby',
    expectedIssueKey: 'BOSS-42',
  };
  const ticket = git.getJiraTicket(testCase.branchName, testConfig);
  t.is(ticket, testCase.expectedIssueKey);
});
test('getJiraTicket returns the first ticket given a multi-ticket branch name', async (t: ExecutionContext) => {
  const testCase = {
    branchName: 'BOSS-42-ABC-123',
    expectedIssueKey: 'BOSS-42',
  };
  const ticket = git.getJiraTicket(testCase.branchName, testConfig);
  t.is(ticket, testCase.expectedIssueKey);
});

test('getJiraTicket returns an empty ticket when theres no dash number', async (t: ExecutionContext) => {
  const testCase = {
    branchName: 'BOSS42',
    expectedIssueKey: '',
  };
  const ticket = git.getJiraTicket(testCase.branchName, testConfig);
  t.is(ticket, testCase.expectedIssueKey);
});
//---getJiraTicket END--//

//--insertJiraTicketIntoMessage START--//

test('insertJiraTicketIntoMessage adds a jira ticket to a message given a ticket and config.', async (t: ExecutionContext) => {
  const testCase = {
    identifiedTicket: 'BOSS-420',
    message: 'Added feature.',
    pattern: testConfig,
    expectedMessage: '[BOSS-420] Added feature.',
  };
  const message = git.insertJiraTicketIntoMessage(testCase.message, testCase.identifiedTicket, testCase.pattern);
  t.is(message, testCase.expectedMessage);
});
test('insertJiraTicketIntoMessage adds a jira ticket to a message with comments given a ticket and config.', async (t: ExecutionContext) => {
  const testCase = {
    identifiedTicket: 'BOSS-420',
    message: '# this is a comment with encouraging words! \nAdded feature.\n#Great job!',
    pattern: testConfig,
    expectedMessage: '# this is a comment with encouraging words! \n[BOSS-420] Added feature.\n#Great job!',
  };
  const message = git.insertJiraTicketIntoMessage(testCase.message, testCase.identifiedTicket, testCase.pattern);
  t.is(message, testCase.expectedMessage);
});
test('insertJiraTicketIntoMessage adds a jira ticket to a empty message with comments given a ticket and config.', async (t: ExecutionContext) => {
  const testCase = {
    identifiedTicket: 'BOSS-420',
    message: '# this is a comment with encouraging words! \n\n#Great job!',
    pattern: testConfig,
    expectedMessage: '[BOSS-420] \n# this is a comment with encouraging words! \n\n#Great job!',
  };
  const message = git.insertJiraTicketIntoMessage(testCase.message, testCase.identifiedTicket, testCase.pattern);
  t.is(message, testCase.expectedMessage);
});
test('insertJiraTicketIntoMessage wont add a message after a verbose separator given a ticket and config.', async (t: ExecutionContext) => {
  const testCase = {
    identifiedTicket: 'BOSS-420',
    message: '# this is a comment with encouraging words! \n------------------------ >8 ------------------------\nSome logs',
    pattern: testConfig,
    expectedMessage: '[BOSS-420] \n# this is a comment with encouraging words! \n------------------------ >8 ------------------------\nSome logs',
  };
  const message = git.insertJiraTicketIntoMessage(testCase.message, testCase.identifiedTicket, testCase.pattern);
  t.is(message, testCase.expectedMessage);
});

test('insertJiraTicketIntoMessage will respect conventional commits given a ticket and config.', async (t: ExecutionContext) => {
  const testCase = {
    identifiedTicket: 'BOSS-420',
    message: 'build: Added feature',
    pattern: testConfig,
    expectedMessage: 'build: [BOSS-420] Added feature',
  };
  const message = git.insertJiraTicketIntoMessage(testCase.message, testCase.identifiedTicket, testCase.pattern);
  t.is(message, testCase.expectedMessage);
});
test('insertJiraTicketIntoMessage will respect conventional commits with scopes given a ticket and config.', async (t: ExecutionContext) => {
  const testCase = {
    identifiedTicket: 'BOSS-420',
    message: 'build(top-secret): Added feature',
    pattern: testConfig,
    expectedMessage: 'build(top-secret): [BOSS-420] Added feature',
  };
  const message = git.insertJiraTicketIntoMessage(testCase.message, testCase.identifiedTicket, testCase.pattern);
  t.is(message, testCase.expectedMessage);
});

test('insertJiraTicketIntoMessage will respect conventional commits with scopes containing spaces given a ticket and config.', async (t: ExecutionContext) => {
  const testCase = {
    identifiedTicket: 'BOSS-420',
    message: 'build(top secret): Added feature',
    pattern: testConfig,
    expectedMessage: 'build(top secret): [BOSS-420] Added feature',
  };
  const message = git.insertJiraTicketIntoMessage(testCase.message, testCase.identifiedTicket, testCase.pattern);
  t.is(message, testCase.expectedMessage);
});

test('insertJiraTicketIntoMessage will not be fooled by non conventional commits given a ticket and config.', async (t: ExecutionContext) => {
  const testCase = {
    identifiedTicket: 'BOSS-420',
    message: 'nonsense(top secret): Added feature',
    pattern: testConfig,
    expectedMessage: '[BOSS-420] nonsense(top secret): Added feature',
  };
  const message = git.insertJiraTicketIntoMessage(testCase.message, testCase.identifiedTicket, testCase.pattern);
  t.is(message, testCase.expectedMessage);
});test('insertJiraTicketIntoMessage will add a ticket to a message that already contains one', async (t: ExecutionContext) => {
  const testCase = {
    identifiedTicket: 'BOSS-420',
    message: '[BOSS-456] Added feature',
    pattern: testConfig,
    expectedMessage: '[BOSS-420] [BOSS-456] Added feature',
  };
  const message = git.insertJiraTicketIntoMessage(testCase.message, testCase.identifiedTicket, testCase.pattern);
  t.is(message, testCase.expectedMessage);
});
//--insertJiraTicketIntoMessage END--//

//--shouldAddTicketToMessage START--//

test('shouldAddTicketToMessage return false when both message and branch dont have a ticket', async (t: ExecutionContext) => {
  const testCase = {
    identifiedTicket: '',
    message: 'nonsense(top secret): Added feature',
    pattern: testConfig,
    expectedValue: false,
  };
  const message = git.shouldAddTicketToMessage(testCase.message, testCase.identifiedTicket, testCase.pattern);
  t.is(message, testCase.expectedValue);
});

test('shouldAddTicketToMessage return false when the message contains a ticket but not the branch', async (t: ExecutionContext) => {
  const testCase = {
    identifiedTicket: '',
    message: 'ABC-123 Added feature',
    pattern: testConfig,
    expectedValue: false,
  };
  const message = git.shouldAddTicketToMessage(testCase.message, testCase.identifiedTicket, testCase.pattern);
  t.is(message, testCase.expectedValue);
});
test('shouldAddTicketToMessage return false when the message contains the same ticket as the branch', async (t: ExecutionContext) => {
  const testCase = {
    identifiedTicket: 'ABC-123',
    message: 'ABC-123 Added feature',
    pattern: testConfig,
    expectedValue: false,
  };
  const message = git.shouldAddTicketToMessage(testCase.message, testCase.identifiedTicket, testCase.pattern);
  t.is(message, testCase.expectedValue);
});

test('shouldAddTicketToMessage return true when the message contains a different ticket to the branch', async (t: ExecutionContext) => {
  const testCase = {
    identifiedTicket: 'ABC-124',
    message: 'ABC-123 Added feature',
    pattern: testConfig,
    expectedValue: true,
  };
  const message = git.shouldAddTicketToMessage(testCase.message, testCase.identifiedTicket, testCase.pattern);
  t.is(message, testCase.expectedValue);
});

test('shouldAddTicketToMessage return true when the message doesnt contains a ticket but the branch does', async (t: ExecutionContext) => {
  const testCase = {
    identifiedTicket: 'ABC-124',
    message: 'Added feature',
    pattern: testConfig,
    expectedValue: true,
  };
  const message = git.shouldAddTicketToMessage(testCase.message, testCase.identifiedTicket, testCase.pattern);
  t.is(message, testCase.expectedValue);
});
//--shouldAddTicketToMessage END--//
