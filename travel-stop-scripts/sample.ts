import { TravelStopScript } from "../types";

let result = 0;

const emptyStopScript: TravelStopScript = {
  TIMEOUT_SEC: 1,
  explore: (currentDate, commit) => {
    console.log(`  - I don't care about ${commit}`);
    result++;
  },
  wrapUp: () => {
    console.log(`\nDid not cared ${result} times in a row`);
  },
};

export default emptyStopScript;
