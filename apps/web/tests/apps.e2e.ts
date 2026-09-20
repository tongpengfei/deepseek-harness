// Web e2e scenario for the shipped Apps catalog and C Tutor onboarding. It uses
// no model fixture: both views are client composition and a stray stream fails loud.
import { fileURLToPath } from 'node:url'
import type { Browser, Page } from 'playwright'
import { chromium } from 'playwright'
import { afterAll, beforeAll, describe, expect, it, onTestFailed } from 'vitest'
import { join } from 'node:path'
import {
  assertFixtureInventory, captureStableAria, compareOrRefreshGolden,
  launchWebScaffold, watchConsole, webSnapshotMode, type WebScaffold,
} from './scaffold.ts'
import { ZH_BROWSER_LOCALE, saveFailureShot } from './support.ts'

const SNAPSHOT_DIR = fileURLToPath(new URL('./expected/apps', import.meta.url))
const CATALOG_EXPECTED = join(SNAPSHOT_DIR, 'catalog.expected.md')
const C_LESSON_EXPECTED = join(SNAPSHOT_DIR, 'c-lesson.expected.md')
const MODE = webSnapshotMode()

describe('web e2e: Apps catalog', () => {
  let scaffold: WebScaffold
  let browser: Browser
  let page: Page
  let tripwire: ReturnType<typeof watchConsole>

  beforeAll(async () => {
    scaffold = await launchWebScaffold()
    browser = await chromium.launch()
    page = await browser.newPage({ viewport: { width: 1680, height: 1000 }, locale: ZH_BROWSER_LOCALE })
    tripwire = watchConsole(page)
    await page.goto(scaffold.authenticatedUrl, { waitUntil: 'load' })
    await page.waitForSelector('[class*="frame"]', { timeout: 30_000 })
  }, 120_000)

  afterAll(async () => {
    await browser?.close()
    await scaffold?.close()
  })

  it('opens the shipped catalog and C course from the global sidebar', async () => {
    onTestFailed(() => saveFailureShot(page, 'web-e2e-apps-c-course'))
    await page.getByRole('navigation', { name: '全局面板' }).getByRole('button', { name: '应用', exact: true }).click()
    const panel = page.locator('[data-apps-panel]')
    const app = panel.getByRole('button', { name: /C 语言学习/ })
    await app.waitFor({ timeout: 10_000 })
    const catalogSnapshot = await captureStableAria(page, '[data-apps-panel]', scaffold.workspaceCwd)
    await compareOrRefreshGolden(CATALOG_EXPECTED, catalogSnapshot, MODE)

    await app.click()
    const course = page.locator('[data-code-learning-app]')
    await course.getByRole('heading', { name: '和 AI 导师一起开始' }).waitFor({ timeout: 10_000 })
    const lessonSnapshot = await captureStableAria(page, '[data-code-learning-app]', scaffold.workspaceCwd)
    await compareOrRefreshGolden(C_LESSON_EXPECTED, lessonSnapshot, MODE)
    expect(tripwire.pageErrors).toEqual([])
  }, 60_000)

  it.skipIf(MODE === 'record')('keeps the fixture inventory closed', async () => {
    expect(tripwire.warnings).toEqual([])
    await assertFixtureInventory(SNAPSHOT_DIR, ['catalog.expected.md', 'c-lesson.expected.md'])
  })
})
