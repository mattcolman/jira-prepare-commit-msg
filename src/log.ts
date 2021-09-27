const verbose = process.argv.find((arg) => arg === '--verbose');

export function debug(message: string): void {
  if (!verbose) {
    return;
  }

  console.log(`JIRA prepare commit msg > DEBUG: ${message}`);
}

export function log(message: string): void {
  console.log(`JIRA prepare commit msg > ${message}`);
}

export function error(err: unknown): void {
  if (typeof err === 'string') {
    console.error(`JIRA prepare commit msg > ${err}`);
  }
}
