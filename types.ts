import { ExecSyncOptions } from "child_process";

export interface ShellCommand {
  template: string;
  opt?: ExecSyncOptions;
}
export type ShellCommandExec = (cmd: ShellCommand) => string;

export interface TravelStopScript {
  getMaximumDurationSeconds: (defaultExecTimeoutSeconds: number) => number;
  explore: (pointInTime: Date, commit: string, exec: ShellCommandExec) => void;
  wrapUp: (gitRepoPath: string) => void;
}

export const isTravelStopScript = (script: unknown): script is TravelStopScript => {
  if (typeof script !== "object" || script === null) {
    return false;
  }
  const { getMaximumDurationSeconds, explore, wrapUp } = script as Record<string, unknown>;
  return typeof getMaximumDurationSeconds === "function"
    && typeof explore === "function"
    && typeof wrapUp === "function";
};
