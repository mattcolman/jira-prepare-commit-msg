#!/usr/bin/env node

import * as fs from 'fs';
import * as git from './git';
import { loadConfig } from './config';
import { debug, log, error } from './log';

// eslint-disable-next-line @typescript-eslint/no-floating-promises
(async (): Promise<void> => {
  debug('start');

  try {
    const config = await loadConfig();

    const messageFilePath = git.getMsgFilePath();
    const message = git.getMessage(messageFilePath);
    const branch = await git.getBranchName();
    const ticket = git.getJiraTicket(branch, config);
    log(`The JIRA ticket ID is: ${ticket}`);
    const messageWithJiraTicket = git.insertJiraTicketIntoMessage(message, ticket, config);

    debug(messageWithJiraTicket);

    // Write message back to file
    try {
      fs.writeFileSync(messageFilePath, messageWithJiraTicket, { encoding: 'utf-8' });
    } catch (ex) {
      throw new Error(`Unable to write the file "${messageFilePath}".`);
    }
  } catch (err) {
    console.log('what err', err);
    error(err);
  }

  debug('done');
})();
