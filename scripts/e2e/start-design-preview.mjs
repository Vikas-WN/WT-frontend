// UI-only QA against synthetic fixtures, bound to loopback. No production credentials.
import { spawn } from "node:child_process";
import { startMockApi } from "./mock-api.mjs";
const appPort=3111;
const apiPort=3211;
const mock=await startMockApi({port:apiPort,designPreview:true,appPort});
const app=spawn(process.execPath,["node_modules/next/dist/bin/next","dev","--webpack","--hostname","127.0.0.1","--port",String(appPort)],{
  cwd:process.cwd(),stdio:"inherit",env:{...process.env,NEXT_BUILD_DIR:".next-preview",API_BASE_URL:`http://127.0.0.1:${apiPort}`,NEXT_PUBLIC_API_BASE_URL:"",APP_URL:`http://127.0.0.1:${appPort}`,NEXT_TELEMETRY_DISABLED:"1"},
});
let stopping=false;
async function stop(){if(stopping)return;stopping=true;app.kill("SIGTERM");await mock.close();}
process.on("SIGINT",()=>void stop());process.on("SIGTERM",()=>void stop());
app.on("exit",async()=>{await stop();process.exitCode=0;});
console.log(`Synthetic preview entry: http://127.0.0.1:${apiPort}/__preview`);
