import fs from 'fs';
import path from 'path';
import csvStringify from 'csv-stringify/lib/sync';
import { TravelStopScript } from "../types";

const OUTPUT_FILE_NAME = 'contributors-over-time.csv'; 

const CMD = {
  repoContributors: (from: string, to: string) => ({
    template: `git log --format="%an" --after="${from}" --before="${to}" HEAD`,
  }),
};

interface Data {
  date: string;
  nContributors: number;
  nCommits: number;
}

const results: Data[] = [];

const emptyStopScript: TravelStopScript = {
  getMaximumDurationSeconds: (defaultExecTimeout) => defaultExecTimeout,
  explore: (previousDate, currentDate, commit, exec) => {
    try {
      const cmdOutput = exec(CMD.repoContributors(previousDate.toDateString(), currentDate.toDateString())).split('\n');
      const lastMonthContributors = new Set(cmdOutput);
      results.push({
        date: currentDate.toDateString(),
        nContributors: lastMonthContributors.size,
        nCommits: cmdOutput.length,
      });
    } catch (error) {
      console.log('Had error, skipping it gently', error); 
    }
  },
  wrapUp: (gitRepoPath) => {
    console.log(`\nDone ! Collected ${results.length} data points`);

    const resultPath = path.join(gitRepoPath, OUTPUT_FILE_NAME);
    const csv = csvStringify(results, { 
      header: true,
      columns: [
        { key: 'date' },
        { key: 'nContributors' },
        { key: 'nCommits' },
      ],
    });
    fs.writeFileSync(resultPath, csv);

    console.log(`\nWrote the result in ${resultPath}`);
  },
};

export default emptyStopScript;
