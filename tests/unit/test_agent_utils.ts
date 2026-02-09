import { describe, it, expect } from '@jest/globals';
import path from 'path';
import { prepareFirstMessage, normalizeAdditionalDirs } from '@process/task/agentUtils';

describe('prepareFirstMessage', () => {
  it('returns original content when no preset context or additional dirs are provided', async () => {
    const content = 'hello world';
    const result = await prepareFirstMessage(content, {});
    expect(result).toBe(content);
  });

  it('injects preset context block when presetContext is provided', async () => {
    const result = await prepareFirstMessage('do work', {
      presetContext: 'Always answer in JSON',
    });

    expect(result).toContain('[Assistant Rules - You MUST follow these instructions]');
    expect(result).toContain('Always answer in JSON');
    expect(result).toContain('[User Request]\ndo work');
  });

  it('injects workspace access block when additional dirs are provided', async () => {
    const result = await prepareFirstMessage('read files', {
      workspace: '/repo/main',
      additionalDirs: ['/repo/shared', '   ', '/tmp/data'],
    });

    expect(result).toContain('[Workspace Access]');
    expect(result).toContain('Primary workspace (cwd): /repo/main');
    expect(result).toContain('- /repo/shared');
    expect(result).toContain('- /tmp/data');
    expect(result).toContain('Use absolute paths when operating outside the primary workspace.');
  });

  it('injects both preset and workspace blocks when both are provided', async () => {
    const result = await prepareFirstMessage('run task', {
      presetContext: 'Use concise replies',
      workspace: '/repo/main',
      additionalDirs: ['/repo/shared'],
    });

    expect(result).toContain('[Assistant Rules - You MUST follow these instructions]');
    expect(result).toContain('[Workspace Access]');
    expect(result).toContain('[User Request]\nrun task');
  });
});

describe('normalizeAdditionalDirs', () => {
  it('returns undefined for undefined input', () => {
    expect(normalizeAdditionalDirs('/workspace')).toBeUndefined();
  });

  it('returns undefined for empty array', () => {
    expect(normalizeAdditionalDirs('/workspace', [])).toBeUndefined();
  });

  it('returns undefined for array of only whitespace strings', () => {
    expect(normalizeAdditionalDirs('/workspace', ['  ', '', '\t'])).toBeUndefined();
  });

  it('trims whitespace from directory paths', () => {
    const result = normalizeAdditionalDirs('/workspace', ['  /foo/bar  ', ' /baz ']);
    expect(result).toEqual(['/foo/bar', '/baz']);
  });

  it('removes duplicate paths', () => {
    const result = normalizeAdditionalDirs('/workspace', ['/foo', '/bar', '/foo']);
    expect(result).toEqual(['/foo', '/bar']);
  });

  it('removes paths that resolve to the workspace root', () => {
    const result = normalizeAdditionalDirs('/workspace', ['/workspace', '/other']);
    expect(result).toEqual(['/other']);
  });

  it('returns undefined when all paths are workspace duplicates', () => {
    const result = normalizeAdditionalDirs('/workspace', ['/workspace']);
    expect(result).toBeUndefined();
  });

  it('resolves relative paths to absolute', () => {
    const result = normalizeAdditionalDirs('/workspace', ['relative/path']);
    expect(result).toBeDefined();
    // Should be resolved to an absolute path (cwd + relative/path)
    result!.forEach((dir) => {
      expect(path.isAbsolute(dir)).toBe(true);
    });
    // Should not contain the raw relative path
    expect(result).not.toContain('relative/path');
  });

  it('filters out non-string entries gracefully', () => {
    // normalizeAdditionalDirs guards against non-string with typeof check
    const result = normalizeAdditionalDirs('/workspace', ['/valid', null as unknown as string, 42 as unknown as string, '/also-valid']);
    expect(result).toEqual(['/valid', '/also-valid']);
  });
});
