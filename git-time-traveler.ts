import { execSync } from "child_process";
import { program } from "commander";
import {
  ShellCommandExec,
  TravelStopScript,
  isTravelStopScript,
} from "./types";

program
  .version('1.0.0')
  .description('Go back in time, month by month, running scripts that does whatever you want')
  .requiredOption('-r, --repo <path>', 'Git repository to work on')
  .requiredOption('-s, --script <path>', 'JS or TS Script ran at each travel stop')
  .option('-s, --stop-after <numberOfMonths>', 'Stop after checking a certain number of monts')
  .option(
    '-t, --cmd-timeout <seconds>', 'Default timeout for each command in second',
    (val, curr) => val ? parseInt(val) : curr,
    5
  )
  .parse(process.argv);

console.log(`Git Time Traveler`);
console.log(`-----------------`);

console.log(`Repos: ${program.repo}`);
console.log(`TravelStop script: ${program.script}`);

// eslint-disable-next-line @typescript-eslint/no-var-requires
const TravelStopModule = require(program.script);

let travelStop: TravelStopScript;
if(!isTravelStopScript(TravelStopModule.default)) {
  console.error(`Provided TravelStrop script ${program.script} doesn't look like one`);
  console.log(TravelStopModule);
  process.exit(1);
} else {
  travelStop = TravelStopModule.default;
}

// Git operations
// --------------

const GIT_CMD = {
  getFirstCommitOfRepo: () => ({
    template: 'git log --max-parents=0 --format="%at" HEAD',
  }),
  getLastCommitBefore: (dateStr: string) => ({
    template: `git rev-list -n 1 --before="${dateStr}" HEAD`,
  }),
  getCurrentBranch: () => ({
    template: `git rev-parse --abbrev-ref HEAD`,
  }),
  stashPush: () => ({
    template: `git stash push -m  "GitTimeTraveler backup"`,
  }),
  forceCheckout: (commitSha: string) => ({
    template: `git checkout -f ${commitSha}`,
  }),
};

const exec: ShellCommandExec = (cmd) =>
  execSync(cmd.template, {
    cwd: program.repo,
    timeout: program.cmdTimeout * 1000,
    stdio: "pipe", // shut up
    ...cmd.opt,
    encoding: "utf-8",
  }).trim();

// Months interval
// ---------------
const initialBranch = exec(GIT_CMD.getCurrentBranch());
console.log(`Branch: ${initialBranch}\n`);
if(initialBranch === 'HEAD') {
  console.error(`Target repos branch is 'HEAD', I'm not working on that`);
  process.exit(2);
}

const firstCommitUnixTimestamp: string = exec(GIT_CMD.getFirstCommitOfRepo());
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

type TimeInterval = [from: Date, to: Date];
const firstMonth = roundToStartOfMonth(firstCommitDate);
const currentMonth = roundToStartOfMonth(new Date());
let months: TimeInterval[] = [[firstMonth, getNextMonth(firstMonth)]];
const getLastMonthsAdded = () => months[months.length - 1][1];
while (getLastMonthsAdded() < currentMonth) {
  months.push([getLastMonthsAdded(), getNextMonth(getLastMonthsAdded())]);
}

console.log(`That's ${months.length} months total`);

// Checks loop
// -----------

months.reverse();

if (program.stopAfter) {
  months = months.slice(0, program.stopAfter);
  console.log(`But ${months.length} months will be checked out`);
}

const stopDurationSeconds = travelStop.getMaximumDurationSeconds(program.cmdTimeout);
const totalTravelDurationSeconds = stopDurationSeconds * months.length;
const totalTravelDurationMinutes = ( totalTravelDurationSeconds / 60 ).toFixed(1)

console.log(`Travel stop maximum duration is ${stopDurationSeconds} seconds
Overall travel will take ${totalTravelDurationMinutes} minutes max
Stashing your stuff (if any)`);

exec(GIT_CMD.stashPush());
console.log("Let's go !\n");

let n = 1;
for (const [previousDate, currentDate] of months) {
  const lastCommitBeforeMonth = exec(GIT_CMD.getLastCommitBefore(currentDate.toISOString()));
  console.log(`[${n}/${ months.length }] ${currentDate.toDateString()}, ${lastCommitBeforeMonth}`);
  exec(GIT_CMD.forceCheckout(lastCommitBeforeMonth));
  travelStop.explore(previousDate, currentDate, lastCommitBeforeMonth, exec);
  n++;
}

travelStop.wrapUp(program.repo);

exec(GIT_CMD.forceCheckout(initialBranch));
