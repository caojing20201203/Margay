/**
 * @license
 * Copyright 2025 Margay
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Adapter facade for @margay/agent-core (Google gemini-cli-core).
 *
 * Every Margay file that needs gemini-cli symbols MUST import from here
 * (or from auth-compat.ts for extended auth types), never directly from
 * '@margay/agent-core'. This gives us a single file to update when the
 * upstream gemini-cli version changes.
 *
 * Current upstream: google-gemini/gemini-cli v0.28.0 (submodule at vendor/gemini-cli)
 */

export * from '@margay/agent-core';

// ---------------------------------------------------------------------------
// Adapter shims — symbols removed or changed in newer gemini-cli versions
// ---------------------------------------------------------------------------

import { CoreToolScheduler } from '@margay/agent-core';
import type { ToolCallRequestInfo, Config, type CompletedToolCall } from '@margay/agent-core';

/**
 * Executes a single tool call non-interactively using CoreToolScheduler.
 *
 * Removed from gemini-cli in v0.28.0 (was in core/nonInteractiveToolExecutor.ts).
 * Kept here as an adapter shim so Margay consumer code (utils.ts) is unaffected.
 */
export async function executeToolCall(config: Config, toolCallRequest: ToolCallRequestInfo, abortSignal: AbortSignal): Promise<CompletedToolCall> {
  return new Promise<CompletedToolCall>((resolve, reject) => {
    const scheduler = new CoreToolScheduler({
      config,
      getPreferredEditor: () => undefined,
      onAllToolCallsComplete: async (completedToolCalls) => {
        if (completedToolCalls.length > 0) {
          resolve(completedToolCalls[0]);
        } else {
          reject(new Error('No completed tool calls returned.'));
        }
      },
    });

    scheduler.schedule(toolCallRequest, abortSignal).catch((error) => {
      reject(error);
    });
  });
}
