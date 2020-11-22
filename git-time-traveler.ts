import { execSync } from "child_process";
import {
  ShellCommand,
  ShellCommandsMap,
  TravelStopScript,
  isTravelStopScript,
} from "./types";

console.log(`Checkout stuff in a Git repo for each month of it's existence`);
console.log(`-------------------------------------------------------------`);

const help = `
This command need two parameters: 
- a path to the Git repository to work on
- a path to the "TravelStop" user script that we'll be run
`;

const [, , gitRepoPath, travelStopScriptPath] = process.argv;
if (!gitRepoPath || !travelStopScriptPath) {
  console.error(help);
  process.exit(1);
}
console.log(`Git repos: ${gitRepoPath}`);
console.log(`TravelStrop script: ${travelStopScriptPath}`);

// eslint-disable-next-line @typescript-eslint/no-var-requires
const TravelStopModule = require(travelStopScriptPath);

let travelStop: TravelStopScript;
if(!isTravelStopScript(TravelStopModule.default)) {
  console.error(`Provided TravelStrop script ${travelStopScriptPath} doesn't look like one`);
  console.log(TravelStopModule);
  process.exit(1);
} else {
  travelStop = TravelStopModule.default;
}


// Git operations
// --------------

const MAX_MONTH_CHECKED = 24;
const DEFAULT_CMD_TIMEOUT = 5;


const GIT_CMD: ShellCommandsMap = {
  getFirstCommitOfRepo: () => ({
    template: 'git rev-list --max-parents=0 --format="%at" master',
  }),
  getLastCommitBefore: (dateStr: string) => ({
    template: `git rev-list -n 1 --before="${dateStr}" master`,
  }),
  forceCheckout: (commitSha: string) => ({
    template: `git checkout -f ${commitSha}`,
  }),
};

const exec = (cmd: ShellCommand): string =>
  execSync(cmd.template, {
    cwd: gitRepoPath,
    timeout: DEFAULT_CMD_TIMEOUT * 1000,
    stdio: "pipe", // shut up
    ...cmd.opt,
    encoding: "utf-8",
  }).trim();

// Months interval
// ---------------

const firstCommitUnixTimestamp: string = exec(GIT_CMD.getFirstCommitOfRepo()).split("\n")[1];
const firstCommitDate = new Date(parseInt(firstCommitUnixTimestamp) * 1000);
console.log(`First commit was on: ${firstCommitDate.toDateString()}`);

const roundToStartOfMonth = (date: Date) => {
  const [year, month] = [date.getUTCFullYear(), date.getUTCMonth()];
  const d = new Date(0);
  d.setUTCFullYear(year);
  d.setUTCMonth(month);
  return d;
};

const getNextMonth = (date: Date) => {
  const d = new Date(date);
  const followingMonth = d.getUTCMonth() + (1 % 12);
  d.setUTCMonth(followingMonth);
  if (followingMonth === 0) {
    d.setUTCFullYear(d.getUTCFullYear() + 1);
  }
  return d;
};

const currentMonth = roundToStartOfMonth(new Date());
let months = [getNextMonth(roundToStartOfMonth(firstCommitDate))];
const getLastMonthsAdded = () => months[months.length - 1];
while (getLastMonthsAdded() < currentMonth) {
  months.push(getNextMonth(getLastMonthsAdded()));
}

console.log(`That's ${months.length} months total`);

// Checks loop
// -----------

months.reverse();
months = months.slice(0, MAX_MONTH_CHECKED);

const MAX_RUN_DURATION = travelStop.TIMEOUT_SEC * months.length;
console.log(`But ${months.length} months will be checked out
Cmd timeout is ${travelStop.TIMEOUT_SEC} second, this will take ${(
  MAX_RUN_DURATION / 60
).toFixed(1)} min max
Let's go!
`);

let n = 1;
for (const checkedMonth of months) {
  const lastCommitBeforeMonth = exec(
    GIT_CMD.getLastCommitBefore(checkedMonth.toISOString())
  );
  console.log(
    `[${n}/${
      months.length
    }] ${checkedMonth.toDateString()}, ${lastCommitBeforeMonth}`
  );
  exec(GIT_CMD.forceCheckout(lastCommitBeforeMonth));
  travelStop.explore(checkedMonth, lastCommitBeforeMonth);
  n++;
}

travelStop.wrapUp();

exec(GIT_CMD.forceCheckout("master"));
