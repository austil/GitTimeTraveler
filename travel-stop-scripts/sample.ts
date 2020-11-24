/*
Here is a minimal example of what this script need to run
Useless but educational
*/

import { TravelStopScript } from "../types";

let result = 0;

const emptyStopScript: TravelStopScript = {
  getMaximumDurationSeconds: () =>  1,
  explore: (previousDate, currentDate, commit) => {
    console.log(`  - I don't care about ${commit}`);
    result++;
  },
  wrapUp: () => {
    console.log(`\nDid not cared ${result} times in a row`);
  },
};

export default emptyStopScript;
