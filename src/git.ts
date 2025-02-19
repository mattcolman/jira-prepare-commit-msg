import * as fs from 'fs';
import * as path from 'path';
import * as cp from 'child_process';
import { JPCMConfig } from './config';
import { debug, error, log } from './log';
import chalk from 'chalk';

interface MessageInfo {
  originalMessage: string;
  cleanMessage: string;
  hasAnyText: boolean;
  hasUserText: boolean;
  hasVerboseText: boolean;
}

// eslint-disable-next-line max-len
const conventionalCommitRegExp =
  /^(build|chore|ci|docs|feat|fix|perf|refactor|revert|style|test)(\([a-z- ]+\)!?)?: ([\w \S]+)$/g;
const gitVerboseStatusSeparator = '------------------------ >8 ------------------------';

export function getMsgFilePath(index = 0): string {
  debug('getMsgFilePath');

  // It is Husky 5
  if (process.env.HUSKY_GIT_PARAMS === undefined) {
    const messageFilePath = process.argv.find((arg) => arg.includes('.git'));
    if (messageFilePath) {
      return messageFilePath;
    } else {
      throw new Error(`You are using Husky 5. Please add $1 to jira-pre-commit-msg's parameters.`);
    }
  }

  // Husky 2-4 stashes git hook parameters $* into a HUSKY_GIT_PARAMS env var.
  const gitParams = process.env.HUSKY_GIT_PARAMS || '';

  // Throw a friendly error if the git params environment variable can't be found – the user may be missing Husky.
  if (!gitParams) {
    throw new Error(`The process.env.HUSKY_GIT_PARAMS isn't set. Is supported Husky version installed?`);
  }

  // Unfortunately, this will break if there are escaped spaces within a single argument;
  // I don't believe there's a workaround for this without modifying Husky itself
  return gitParams.split(' ')[index];
}

export function getMessage(messageFilePath: string): string {
  let message;
  // Read file with commit message
  try {
    message = fs.readFileSync(messageFilePath, { encoding: 'utf-8' });
  } catch (ex) {
    throw new Error(`Unable to read the file "${messageFilePath}".`);
  }
  return message;
}

function escapeReplacement(str: string): string {
  return str.replace(/[$]/, '$$$$'); // In replacement to escape $ needs $$
}

function replaceMessageByPattern(jiraTicket: string, message: string, pattern: string): string {
  const result = pattern.replace('$J', escapeReplacement(jiraTicket)).replace('$M', escapeReplacement(message));
  debug(`Replacing message: ${result}`);
  return result;
}

function getMessageInfo(message: string, config: JPCMConfig): MessageInfo {
  debug(`Original commit message: ${message}`);

  const messageSections = message.split(gitVerboseStatusSeparator)[0];
  const lines = messageSections
    .trim()
    .split('\n')
    .map((line) => line.trimLeft())
    .filter((line) => !line.startsWith(config.commentChar));

  const cleanMessage = lines.join('\n').trim();

  debug(`Clean commit message (${cleanMessage.length}): ${cleanMessage}`);

  return {
    originalMessage: message,
    cleanMessage: cleanMessage,
    hasAnyText: message.length !== 0,
    hasUserText: cleanMessage.length !== 0,
    hasVerboseText: message.includes(gitVerboseStatusSeparator),
  };
}

function findFirstLineToInsert(lines: string[], config: JPCMConfig): number {
  let firstNotEmptyLine = -1;

  for (let i = 0; i < lines.length; ++i) {
    const line = lines[i];

    // ignore everything after commentChar or the scissors comment, which present when doing a --verbose commit,
    // or `git config commit.status true`
    if (line === gitVerboseStatusSeparator) {
      break;
    }

    if (line.startsWith(config.commentChar)) {
      continue;
    }

    if (firstNotEmptyLine === -1) {
      firstNotEmptyLine = i;
      break;
    }
  }

  return firstNotEmptyLine;
}

export function insertJiraTicketIntoMessage(message: string, branchTicket: string, config: JPCMConfig): string {
  const messageInfo = getMessageInfo(message, config);
  const messageTicket = getJiraTicket(message, config);

  if (!messageTicket && !branchTicket) {
    error(
      `${chalk.white.bgRed.bold('No Jira ticket found')}. 
In future versions this may become mandatory with the option of committing with --no-verify to bypass the check`,
    );
    return message;
  }

  if (messageTicket && !branchTicket) {
    log(`nothing to do. Message already contains issue key ${chalk.white.bgBlue.bold(messageTicket)}`);
    return message;
  }

  if (messageTicket === branchTicket) {
    log(`nothing to do. Message already contains issue key ${chalk.white.bgBlue.bold(branchTicket)}`);
    return message;
  }

  const lines = message.split('\n').map((line) => line.trimLeft());

  if (!messageInfo.hasUserText) {
    debug(`User didn't write the message. Allow empty commit is ${String(config.allowEmptyCommitMessage)}`);

    const preparedMessage = replaceMessageByPattern(branchTicket, '', config.messagePattern);

    if (messageInfo.hasAnyText) {
      const insertedMessage = config.allowEmptyCommitMessage
        ? preparedMessage
        : `# ${preparedMessage}\n` +
          '# Jira prepare commit msg > ' +
          'Please uncomment the line above if you want to insert Jira ticket into commit message';

      lines.unshift(insertedMessage);
    } else {
      if (config.allowEmptyCommitMessage) {
        lines.unshift(preparedMessage);
      } else {
        debug(`Commit message is empty. Skipping...`);
      }
    }
  } else {
    const firstLineToInsert = findFirstLineToInsert(lines, config);

    debug(`First line to insert is: ${firstLineToInsert > -1 ? lines[firstLineToInsert] : ''} (${firstLineToInsert})`);

    if (firstLineToInsert !== -1) {
      const line = lines[firstLineToInsert];

      if (config.isConventionalCommit) {
        debug(`Finding conventional commit in: ${line}`);
        conventionalCommitRegExp.lastIndex = -1;
        const [match, type, scope, msg] = conventionalCommitRegExp.exec(line) ?? [];
        if (match) {
          debug(`Conventional commit message: ${match}`);
          lines[firstLineToInsert] = `${type}${scope || ''}: ${replaceMessageByPattern(
            branchTicket,
            msg,
            config.messagePattern,
          )}`;
        }
      } else if (!line.includes(branchTicket)) {
        lines[firstLineToInsert] = replaceMessageByPattern(branchTicket, line || '', config.messagePattern);
      }
    }

    // Add jira ticket into the message in case of missing
    if (lines.every((line) => !line.includes(branchTicket))) {
      lines[0] = replaceMessageByPattern(branchTicket, lines[0] || '', config.messagePattern);
    }
  }

  log(`add issue key ${chalk.white.bgBlue.bold(branchTicket)}`);
  return lines.join('\n');
}

export type GitRevParseResult = {
  prefix: string;
  gitCommonDir: string;
};

export function gitRevParse(cwd = process.cwd()): GitRevParseResult {
  // https://github.com/typicode/husky/issues/580
  // https://github.com/typicode/husky/issues/587
  const { status, stderr, stdout } = cp.spawnSync('git', ['rev-parse', '--show-prefix', '--git-common-dir'], { cwd });

  if (status !== 0) {
    throw new Error(stderr.toString());
  }

  const [prefix, gitCommonDir] = stdout
    .toString()
    .split('\n')
    .map((s) => s.trim())
    // Normalize for Windows
    .map((s) => s.replace(/\\\\/, '/'));

  return { prefix, gitCommonDir };
}

export function getRoot(): string {
  debug('getRoot');

  const cwd = process.cwd();

  const { gitCommonDir } = gitRevParse(cwd);

  // Git rev-parse returns unknown options as is.
  // If we get --absolute-git-dir in the output,
  // it probably means that an old version of Git has been used.
  // There seem to be a bug with --git-common-dir that was fixed in 2.13.0.
  // See issues above.
  if (gitCommonDir === '--git-common-dir') {
    throw new Error('Husky requires Git >= 2.13.0, please upgrade Git');
  }

  return path.resolve(cwd, gitCommonDir);
}

export async function getBranchName(): Promise<string> {
  const gitRoot = getRoot();
  debug('gitBranchName');

  return new Promise((resolve, reject) => {
    cp.exec(`git --git-dir="${gitRoot}" symbolic-ref --short HEAD`, { encoding: 'utf-8' }, (err, stdout, stderr) => {
      if (err) {
        return reject(err);
      }

      if (stderr) {
        return reject(new Error(String(stderr)));
      }

      resolve(String(stdout).trim());
    });
  });
}

export function getJiraTicket(branchName: string, config: JPCMConfig): string {
  debug('getJiraTicket');

  const jiraIdPattern = new RegExp(config.jiraTicketPattern, 'g');

  const matched = jiraIdPattern.exec(branchName);
  const jiraTicket = matched && matched[0];

  if (!jiraTicket) {
    debug('No Jira key found in branch name');
    return '';
  }

  return jiraTicket;
}
