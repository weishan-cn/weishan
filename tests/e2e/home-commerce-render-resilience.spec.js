const { test, expect } = require('@playwright/test');
const { launchWeishan, gotoRoute, cleanupE2EData } = require('./helpers');

test.describe.serial('Home and Global Shopping render resilience', () => {
  let app;
  let page;
  const runId = 'HOME-COMMERCE-RENDER-' + Date.now();
  const runtimeErrors = [];

  test.beforeAll(async () => {
    app = await launchWeishan(null);
    page = app.page;
    page.on('console', (message) => {
      if (message.type() === 'error') runtimeErrors.push('console:' + message.text());
    });
    page.on('pageerror', (error) => runtimeErrors.push('pageerror:' + (error && error.message || String(error))));
  });

  test.afterAll(async () => {
    if (page) {
      await page.evaluate(() => {
        if (window.__WEISHAN_TEST_ORIGINAL_COMMERCE_GET_TASKS__) {
          window.WeishanCommerceAgent.getCommerceTasks = window.__WEISHAN_TEST_ORIGINAL_COMMERCE_GET_TASKS__;
          delete window.__WEISHAN_TEST_ORIGINAL_COMMERCE_GET_TASKS__;
        }
      }).catch(() => {});
      await cleanupE2EData(page, runId);
    }
    if (app) await app.close();
  });

  test('renders Home results above the bottom composer without intercepting Start', async () => {
    await gotoRoute(page, 'home');
    await page.evaluate((id) => {
      window.CommandApi.enqueue(id + ' 检查首页结果与输入区顺序');
      const host = document.getElementById('pageHost');
      if (host && window.HomePage && typeof window.HomePage.mount === 'function') window.HomePage.mount(host);
    }, runId);

    const consoleCard = page.locator('.home-v205-main > .cmd-console-card');
    const inputCard = page.locator('.home-v205-main > .cmd-input-card');
    const start = page.locator('#runBtn');
    await expect(consoleCard).toBeVisible();
    await expect(inputCard).toBeVisible();
    await expect(start).toBeVisible();
    await expect(page.locator('#cmdHistory')).toBeVisible();

    const layout = await page.evaluate(() => {
      const consoleCard = document.querySelector('.home-v205-main > .cmd-console-card');
      const inputCard = document.querySelector('.home-v205-main > .cmd-input-card');
      const start = document.querySelector('#runBtn');
      const consoleRect = consoleCard.getBoundingClientRect();
      const inputRect = inputCard.getBoundingClientRect();
      const startRect = start.getBoundingClientRect();
      const hit = document.elementFromPoint(startRect.left + startRect.width / 2, startRect.top + startRect.height / 2);
      return {
        domBefore:!!(consoleCard.compareDocumentPosition(inputCard) & Node.DOCUMENT_POSITION_FOLLOWING),
        visualBefore:consoleRect.top < inputRect.top && consoleRect.bottom <= inputRect.bottom,
        composerNearBottom:inputRect.bottom <= window.innerHeight && inputRect.bottom > window.innerHeight * 0.68,
        startHit:start === hit || start.contains(hit),
        horizontalOverflow:document.documentElement.scrollWidth > document.documentElement.clientWidth
      };
    });
    expect(layout).toEqual({
      domBefore:true,
      visualBefore:true,
      composerNearBottom:true,
      startHit:true,
      horizontalOverflow:false
    });

    await start.focus();
    await expect(start).toBeFocused();
    await page.setViewportSize({ width:800, height:800 });
    await expect(page.locator('#commandInput')).toBeVisible();
    await expect(page.locator('#runBtn')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await page.setViewportSize({ width:1440, height:900 });
  });

  test('keeps Global Shopping visible for empty, searched, away/back, and repeated-entry states', async () => {
    await page.evaluate(() => {
      window.localStorage.removeItem('weishan:commerceAgent:lastPlan:v1');
      window.localStorage.removeItem('weishan:commerceAgent:tasks:v1');
    });
    await gotoRoute(page, 'commerce');
    await expect(page.locator('.commerce-page.commerce-workbench')).toBeVisible();
    await expect(page.locator('#commerceInput')).toBeVisible();
    await expect(page.locator('#commerceGenerate')).toBeVisible();
    await expect(page.locator('.commerce-detail-empty')).toBeVisible();
    await expect(page.locator('.commerce-detail-empty')).toContainText(/选择左侧采购计划|搜索商品|描述想买什么/);

    await page.locator('#commerceInput').fill(runId + ' Sony WH-1000XM5 全球比价');
    await page.locator('#commerceGenerate').click();
    await expect(page.locator('[data-commerce-detail]')).toBeVisible({ timeout:15000 });
    await expect(page.locator('.commerce-page.commerce-workbench')).toContainText(/Sony WH-1000XM5|全球采购/);

    let blankRenderCount = 0;
    for (let index = 0; index < 20; index += 1) {
      await page.locator('.nav-item[data-route="home"]').first().click();
      await expect(page.locator('.home-v205-page')).toBeVisible();
      await page.locator('.nav-item[data-route="commerce"]').first().click();
      await expect(page.locator('.commerce-page.commerce-workbench')).toBeVisible({ timeout:15000 });
      const snapshot = await page.evaluate(() => {
        const host = document.getElementById('pageHost');
        const rect = host.getBoundingClientRect();
        return {
          childCount:host.children.length,
          textLength:String(host.textContent || '').trim().length,
          display:getComputedStyle(host).display,
          visibility:getComputedStyle(host).visibility,
          height:rect.height,
          input:!!host.querySelector('#commerceInput, #commerceFallbackInput')
        };
      });
      if (!snapshot.childCount || !snapshot.textLength || snapshot.display === 'none' || snapshot.visibility === 'hidden' || !snapshot.height || !snapshot.input) {
        blankRenderCount += 1;
      }
    }
    expect(blankRenderCount).toBe(0);
    expect(runtimeErrors).toEqual([]);
  });

  test('fails closed to a usable Basic Mode shell when stored Shopping state initialization fails', async () => {
    await page.evaluate(() => {
      window.__WEISHAN_TEST_ORIGINAL_COMMERCE_GET_TASKS__ = window.WeishanCommerceAgent.getCommerceTasks;
      window.WeishanCommerceAgent.getCommerceTasks = function(){
        throw new Error('SYNTHETIC_PERSISTED_STATE_NORMALIZATION_FAILURE');
      };
    });
    await page.locator('.nav-item[data-route="home"]').first().click();
    await page.locator('.nav-item[data-route="commerce"]').first().click();
    await expect(page.locator('.commerce-page.commerce-workbench')).toBeVisible({ timeout:15000 });
    await expect(page.locator('#commerceInput')).toBeVisible();
    await expect(page.locator('#commerceGenerate')).toBeVisible();
    await expect(page.locator('[data-commerce-state-unavailable="true"]')).toBeVisible();
    await expect(page.locator('[data-commerce-state-unavailable="true"]')).toContainText('从新的搜索开始');
    await expect(page.locator('[data-commerce-state-unavailable="true"]')).not.toContainText(/needs_review|executionGate|authorizesExecution|fallback/i);
    expect(runtimeErrors).toEqual([]);

    await page.evaluate(() => {
      window.WeishanCommerceAgent.getCommerceTasks = window.__WEISHAN_TEST_ORIGINAL_COMMERCE_GET_TASKS__;
      delete window.__WEISHAN_TEST_ORIGINAL_COMMERCE_GET_TASKS__;
    });
  });
});
