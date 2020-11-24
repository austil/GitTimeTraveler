/*
Here is a 100% concrete use case on a code base were we want to observe :

- Storybook adoption
- Karma to Jest transition as the test runner
- Angular to Vue as the UI Framework
- JS to TS transition, both in "vanilla files" and Vue single files components

Yup, all of this !
*/

import fs from 'fs';
import path from 'path';
import csvStringify from 'csv-stringify/lib/sync';
import { ShellCommand, TravelStopScript } from "../types";

const OUTPUT_FILE_NAME = 'codebase-metrics.csv';

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

/* eslint-disable no-useless-escape */
const CMD = {
  // Cloc
  clocAll: () => ({
    template: 'cloc --json ./src ./app ./test/unit ./test/stories',
    opt: { timeout: 20 * 1000 },
  }),
  clocPlainSources: () => ({
    template: 'cloc --not-match-f="\.vue|specs\.|test\.|storybook\." --json ./src ./app',
  }),
  clocStorybook: () => ({
    template: 'cloc --match-f="story(book)?\.(js|ts|coffee)" --json ./src ./app ./test/stories',
  }),
  clocKarma: () => ({
    template: 'cloc --match-f="specs?\.(js|ts|coffee)" --json ./src ./app ./test/unit',
  }),
  clocJest: () => ({
    template: 'cloc --match-f="test.(js|ts|coffee)" --json ./src ./app ./test/unit',
  }),
  // Grep + cloc
  clocTypeScriptVueComponents: () => ({
    template: [
      'grep --include=\\*.vue -rlw \'lang="ts"\' . > ts-vue-files.tmp',
      'cloc --list-file=ts-vue-files.tmp --json ./src ./app',
      'rm ts-vue-files.tmp || true'
    ].join(' && '),
  }),
  clocJavaScriptVueComponents: () => ({
    template: [
      'grep --include=\\*.vue -rLw \'lang="ts"\' . > js-vue-files.tmp',
      'cloc --list-file=js-vue-files.tmp --json ./src ./app',
      'rm js-vue-files.tmp || true'
    ].join(' && '),
  }),
};

const getMaximumDurationSeconds = (defaultExecTimeoutSeconds: number): number => {
  return (Object.values(CMD) as (() => ShellCommand)[])
    .map(fun => {
      const opts = fun().opt;
      return opts?.timeout ? opts?.timeout / 1000 : defaultExecTimeoutSeconds
    })
    .reduce((sum, curr) => sum + curr);
};

interface Data extends ClocStats {
  type: string;
  language: string;
  date: string;
}

const results: Data[] = [];

const pushClocResults = (cmdOutput: string, date: Date, type: string) => {
  if(cmdOutput.length === 0) throw new Error(`Empty output for command`);
  const stats: ClocResult = JSON.parse(cmdOutput);
  delete stats.header;
  Object.entries(stats).forEach(([language, stats]) => {
    results.push({ ...stats, type, language, date: date.toDateString(), });
  });
};

const logProgress = (str?: string) => {
  process.stdout.write(str || `·`);
};

const emptyStopScript: TravelStopScript = {
  getMaximumDurationSeconds,

  explore: (previousDate, currentDate, commit, exec) => {
    [
      () => pushClocResults(exec(CMD.clocAll()), currentDate, 'ALL'),
      () => pushClocResults(exec(CMD.clocPlainSources()), currentDate, 'Plain Source'),
      () => pushClocResults(exec(CMD.clocStorybook()), currentDate, 'Storybook'),
      () => pushClocResults(exec(CMD.clocKarma()), currentDate, 'Karma test'),
      () => pushClocResults(exec(CMD.clocJest()), currentDate, 'Jest test'),
      () => {
        const cmdOutput = exec(CMD.clocTypeScriptVueComponents());
        if(cmdOutput.length === 0) throw new Error(`Empty output for clocTypeScriptVueComponents`);
        const tsVueStats: ClocResult = JSON.parse(cmdOutput);
        results.push({ ...tsVueStats['Vuejs Component'], type: 'Vue Component', language: 'TypeScript', date: currentDate.toDateString(), });
        results.push({ ...tsVueStats['Vuejs Component'], type: 'Vue Component', language: 'SUM', date: currentDate.toDateString(), });
      },
      () => {
        const cmdOutput = exec(CMD.clocJavaScriptVueComponents());
        if(cmdOutput.length === 0) throw new Error(`Empty output for clocJavaScriptVueComponents`);
        const jsVueStats: ClocResult = JSON.parse(cmdOutput);
        results.push({ ...jsVueStats['Vuejs Component'], type: 'Vue Component', language: 'JavaScript', date: currentDate.toDateString(), });
        results.push({ ...jsVueStats['Vuejs Component'], type: 'Vue Component', language: 'SUM', date: currentDate.toDateString(), });
      },
    ].forEach(step => {
      try {
        step();
        logProgress();
      } catch (error) {
        logProgress('⨯');
        // throw error;
      }
    });

    logProgress('\n');
  },

  wrapUp: (gitRepoPath) => {
    console.log(`\nDone ! Collected ${results.length} data points\n`);

    const existingProperties = new Set(results.flatMap(r => Object.keys(r)));
    const propertiesList = [...existingProperties.values()].map(p => `- ${p}`).join('\n');
    console.log(`Properties (${existingProperties.size}) :\n${propertiesList}`);
  
    const resultPath = path.join(gitRepoPath, OUTPUT_FILE_NAME);
    const csv = csvStringify(results, { 
      header: true,
      columns: [
        { key: 'type' }, 
        { key: 'language' }, 
        { key: 'date' }, 
        { key: 'nFiles' }, 
        { key: 'code' }, 
      ],
    });
    fs.writeFileSync(resultPath, csv);
  
    console.log(`\nWrote the result in ${resultPath}`);
  },
};

export default emptyStopScript;
