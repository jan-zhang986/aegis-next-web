/**
 * 造数工厂脚本异步执行
 * 方案 A：先提交拿 jobId，再轮询结果，避免网关 ~5s 超时导致 500
 */
import { http } from '@/utils/request';

const RUN_ASYNC_URL = '/spotter-data-forge/data/code/run-async';
const TEST_ASYNC_URL = '/spotter-data-forge/project/script/test-async';
const RUN_RESULT_URL = (jobId: string) => `/spotter-data-forge/data/code/run-result/${jobId}`;

const POLL_INTERVAL_MS = 1500;
const POLL_TIMEOUT_MS = 5 * 60 * 1000; // 5 分钟

export interface RunAsyncRequest {
  textCode?: string;
  bizCode?: string;
  author?: string;
}

export interface RunAsyncResult {
  success: boolean;
  output: string;
  message?: string;
  /** project/script/test 轮询结果可能带回 */
  results?: any[];
  execution_count?: number;
}

/** 轮询结果接口返回的数据（业务 code 200 时拦截器返回的 data） */
interface PollData {
  jobId: string;
  status: 'running' | 'done' | 'failed';
  message?: string;
  result?: {
    success?: boolean;
    message?: string;
    output?: string;
    results?: any[];
    execution_count?: number;
  };
}

function normalizeOutput(raw: string | undefined): string {
  if (raw == null || raw === '') return '';
  let s = String(raw);
  if (s.includes('\\n')) {
    s = s.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\t/g, '\t').replace(/\\r/g, '\r');
  }
  return s;
}

/** 轮询 run-result 直到完成/失败/过期/超时 */
async function pollRunResult(
  jobId: string,
  onStatus?: (message: string) => void
): Promise<RunAsyncResult> {
  onStatus?.('执行中…');
  const deadline = Date.now() + POLL_TIMEOUT_MS;

  while (Date.now() < deadline) {
    try {
      const data = await http.get<PollData>(RUN_RESULT_URL(jobId));

      if (data?.status === 'running') {
        onStatus?.('执行中…');
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
        continue;
      }

      if (data?.status === 'done') {
        const result = data.result;
        const output = normalizeOutput(result?.output);
        const success = result?.success !== false;
        const message = result?.message;
        return {
          success,
          output,
          message,
          results: result?.results,
          execution_count: result?.execution_count,
        };
      }

      if (data?.status === 'failed') {
        const result = data.result;
        const message = result?.message || '执行失败';
        const output = normalizeOutput(result?.output);
        return {
          success: false,
          output: output || message,
          message,
          results: result?.results,
          execution_count: result?.execution_count,
        };
      }

      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('任务不存在') || msg.includes('已过期') || msg.includes('404')) {
        throw new Error('任务不存在或已过期');
      }
      throw err;
    }
  }

  throw new Error('执行超时，请稍后在历史记录中查看结果');
}

/**
 * 提交脚本异步执行并轮询直到完成/失败/过期/超时
 * @param requestData 与原 POST /data/code/run 一致
 * @param onStatus 可选，轮询时回调（如「执行中…」）
 */
export async function runDataCodeAsync(
  requestData: RunAsyncRequest,
  onStatus?: (message: string) => void
): Promise<RunAsyncResult> {
  const submitPayload = await http.post<{ jobId: string; message?: string }>(RUN_ASYNC_URL, requestData);
  const jobId = submitPayload?.jobId;
  if (!jobId) {
    throw new Error((submitPayload as any)?.message || '未返回 jobId');
  }
  return pollRunResult(jobId, onStatus);
}

/**
 * 提交 project/script/test 异步执行，轮询方式与 data/code/run-async 一致
 * 请求体：type, script, chainCallTemplate?, params, projectId, executionCount, environmentId?
 */
export async function runProjectScriptTestAsync(
  requestData: Record<string, unknown>,
  onStatus?: (message: string) => void
): Promise<RunAsyncResult> {
  const submitPayload = await http.post<{ jobId: string; message?: string }>(TEST_ASYNC_URL, requestData);
  const jobId = submitPayload?.jobId;
  if (!jobId) {
    throw new Error((submitPayload as any)?.message || '未返回 jobId');
  }
  return pollRunResult(jobId, onStatus);
}
