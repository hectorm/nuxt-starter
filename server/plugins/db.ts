import cluster from "node:cluster";

import { defineNitroPlugin } from "nitropack/runtime/plugin";
import { runTask } from "nitropack/runtime/task";

export default defineNitroPlugin(async (): Promise<void> => {
  if (cluster.isWorker) return;

  await runTask("db:migrate");
  await runTask("db:seed");
});
