import { test as base, type Page, type TestInfo } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Saves the video with a human-readable name derived from the test title.
 * Output: test-results/{RUN_ID}/{project}/{StepID}_Test-Title.webm
 */
export async function saveNamedVideo(page: Page, testInfo: TestInfo) {
  try {
    const video = page.video();
    if (!video) return;

    const slug = testInfo.title
      .replace(/[^a-zA-Z0-9_-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const projectDir = path.join(testInfo.outputDir, '..', testInfo.project.name);
    fs.mkdirSync(projectDir, { recursive: true });

    const dest = path.join(projectDir, `${slug}.webm`);

    // Race between saveAs and a 5-second timeout
    await Promise.race([
      video.saveAs(dest),
      new Promise((_, reject) => setTimeout(() => reject(new Error('video save timeout')), 5_000)),
    ]);
  } catch {
    // Ignore — video save can fail if test timed out or page closed early
  }
}

/**
 * Extended test fixture that auto-saves named videos after each test.
 */
export const test = base.extend({});

test.afterEach(async ({ page }, testInfo) => {
  await saveNamedVideo(page, testInfo);
});
