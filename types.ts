import { ExecSyncOptions } from "child_process";

export interface ShellCommand {
  template: string;
  opt?: ExecSyncOptions;
}
export type ShellCommandExec = (cmd: ShellCommand) => string;

export interface TravelStopScript {
  TIMEOUT_SEC: number;
  explore: (pointInTime: Date, commit: string, exec: ShellCommandExec) => void;
  wrapUp: (gitRepoPath: string) => void;
}

export const isTravelStopScript = (script: unknown): script is TravelStopScript => {
  if (typeof script !== "object" || script === null) {
    return false;
  }
  const { TIMEOUT_SEC, explore, wrapUp } = script as Record<string, unknown>;
  return typeof TIMEOUT_SEC === "number"
    && typeof explore === "function"
    && typeof wrapUp === "function";
};
