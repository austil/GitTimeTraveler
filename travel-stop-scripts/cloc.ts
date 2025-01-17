/*
Here is a concrete use case accumulating cloc results on each "travel stop"
and saving everything in a "ready to plot" csv at the end
*/

import fs from 'fs';
import path from 'path';
import csvStringify from 'csv-stringify/lib/sync';
import { TravelStopScript } from "../types";

const OUTPUT_FILE_NAME = 'cloc-over-time.csv'; 

interface ClocStats {
  nFiles: number;
  blank: number;
  comment: number;
  code: number;
}

interface ClocResult {
  header: never;
  [language: string]: ClocStats;
}

const CMD = {
  cloc: () => ({
    template: 'cloc --exclude-dir=node_modules --json .',
  }),
};

interface Data extends ClocStats {
  language: string;
  date: string;
}

const results: Data[] = [];

const emptyStopScript: TravelStopScript = {
  getMaximumDurationSeconds: (defaultExecTimeout) => defaultExecTimeout,
  explore: (previousDate, currentDate, commit, exec) => {
    const cmdOutput = exec(CMD.cloc());
    if(cmdOutput.length === 0) return;
    const stats: ClocResult = JSON.parse(cmdOutput);
    delete stats.header;
    Object.entries(stats).forEach(([language, stats]) => {
      results.push({ ...stats, language, date: currentDate.toDateString() });
    });
  },
  wrapUp: (gitRepoPath) => {
    console.log(`\nDone ! Collected ${results.length} data points`);

    const resultPath = path.join(gitRepoPath, OUTPUT_FILE_NAME);
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
