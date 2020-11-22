import fs from 'fs';
import path from 'path';
import csvStringify from 'csv-stringify/lib/sync';
import { TravelStopScript, ShellCommandsMap } from "../types";

interface ClocResult {
  header: never;
  [language: string]: {
    nFiles: number;
    blank: number;
    comment: number;
    code: number;
  };
}

const CMD: ShellCommandsMap = {
  cloc: () => ({
    template: 'cloc --exclude-dir=node_modules --json .',
    opt: { timeout: 20 * 1000 },
  }),
};

const results: unknown[] = [];

const emptyStopScript: TravelStopScript = {
  TIMEOUT_SEC: 20,
  explore: (currentDate, commit, exec) => {
    try {
      const cmdOutput = exec(CMD.cloc());
      if(cmdOutput.length === 0) return;
      const stats: ClocResult = JSON.parse(cmdOutput);
      delete stats.header;
      Object.entries(stats).forEach(([language, stats]) => {
        results.push({ ...stats, language, date: currentDate.toDateString() });
      });
    } catch (error) {
      console.log('Had error, skipping it gently', error); 
    }
  },
  wrapUp: (gitRepoPath) => {
    console.log(`\nDone ! Collected ${results.length} data points`);

    const resultPath = path.join(gitRepoPath, 'cloc-over-time.csv');
    const csv = csvStringify(results, { 
      header: true,
      columns: [
        { key: 'date' }, 
        { key: 'language' }, 
        { key: 'nFiles' }, 
        { key: 'code' }, 
      ],
    });
    fs.writeFileSync(resultPath, csv);

    console.log(`\nWrote the result in ${resultPath}`);
  },
};

export default emptyStopScript;
