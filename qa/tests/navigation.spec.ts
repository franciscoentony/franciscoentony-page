import { test, type Page } from "@playwright/test";
import { settle, watchConsole, formatIssues, attachJson, expect } from "./helpers";

/** Retângulo do header/nav fixo e se ele está visível na viewport. */
async function navState(page: Page) {
  return page.evaluate(() => {
    const el = document.querySelector("header") ?? document.querySelector("nav");
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { top: Math.round(r.top), bottom: Math.round(r.bottom), visivel: r.bottom > 1 };
  });
}

test("[RT-08] Voltar do post mantém a posição do scroll na Home (R1 #2) @dod", async ({ page }, testInfo) => {
  test.skip(!["w1280", "w375"].includes(testInfo.project.name), "1280 e 375");
  const con = watchConsole(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await settle(page);

  // vai até o link de post mais abaixo na Home (Diário de bordo)
  const post = page.locator('main a[href*="/blog/"]').first();
  test.skip((await post.count()) === 0, "Home sem links para posts");
  await post.scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  const antes = await page.evaluate(() => Math.round(window.scrollY));

  await post.click();
  await expect(page).toHaveURL(/\/blog\/[^/]+$/);
  await expect(page.locator("h1").first()).toBeVisible();
  await page.waitForTimeout(300); // um frame + margem: o post tem que abrir no topo, sem animação longa
  const noPost = await page.evaluate(() => Math.round(window.scrollY));
  const maxNoPost = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);

  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await settle(page);
  await page.waitForTimeout(1200);
  const depois = await page.evaluate(() => Math.round(window.scrollY));

  await attachJson(testInfo, "scroll", { antes, noPost, depois, maxNoPost });
  // se "depois" == scroll máximo do post, o navegador restaurou antes da Home montar
  testInfo.annotations.push({ type: "scroll", description: `antes=${antes} post=${noPost} depois=${depois} maxScrollDoPost=${maxNoPost}` });
  expect.soft(noPost, "o post deve abrir no topo").toBeLessThan(50);
  expect.soft(Math.abs(depois - antes), `Voltar deveria manter ~${antes}px, ficou em ${depois}px`).toBeLessThanOrEqual(80);
  expect.soft(con.issues, formatIssues(con.issues)).toEqual([]);
});

test("[KB-04] menu mobile: abre, foca, fecha com Esc/clique fora e não deixa links ocultos focáveis (R1 #3) @dod", async ({ page }, testInfo) => {
  test.skip(!["w375", "w768"].includes(testInfo.project.name), "abaixo de 860px");
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await settle(page);

  const toggle = page.locator("button[aria-controls][aria-expanded]").first();
  await expect(toggle, "botão do menu mobile com aria-expanded/aria-controls").toBeVisible();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  const nome = (await toggle.getAttribute("aria-label")) ?? (await toggle.innerText());
  expect.soft(nome.trim().length, "botão do menu precisa de nome acessível").toBeGreaterThan(0);

  // fechado: nenhum link de seção visível nem focável fora da barra
  const linksOcultosFocaveis = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>("header a, header button")]
      .filter((el) => {
        // display:none / visibility:hidden / inert não recebem foco: não contam.
        if (!el.checkVisibility({ visibilityProperty: true }) || el.closest("[inert]") || el.tabIndex < 0) return false;
        // recebe foco, mas não dá para ver: opacidade 0, tamanho 0 ou fora da tela
        const r = el.getBoundingClientRect();
        const invisivel = !el.checkVisibility({ opacityProperty: true }) || r.width === 0 || r.height === 0;
        const foraDaTela = r.bottom <= 0 || r.right <= 0 || r.left >= innerWidth;
        return invisivel || foraDaTela;
      })
      .map((el) => el.textContent?.trim()),
  );
  expect.soft(linksOcultosFocaveis, "links escondidos do menu ainda entram no Tab").toEqual([]);

  // abre pelo teclado
  await toggle.focus();
  await page.keyboard.press("Enter");
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  const menuId = await toggle.getAttribute("aria-controls");
  const menu = page.locator(`#${menuId}`);
  await expect(menu).toBeVisible();
  await page.screenshot({ path: `${testInfo.outputPath("menu-aberto.png")}` });

  // Tab entra no menu
  await page.keyboard.press("Tab");
  const dentro = await page.evaluate((id) => !!document.activeElement?.closest(`#${id}`), menuId);
  expect.soft(dentro, "o próximo Tab depois do botão deve entrar nos links do menu").toBe(true);

  // Esc fecha e devolve o foco ao botão
  await page.keyboard.press("Escape");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  const focoNoBotao = await toggle.evaluate((b) => document.activeElement === b);
  expect.soft(focoNoBotao, "Esc deve devolver o foco ao botão do menu").toBe(true);

  // clique fora fecha
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await page.mouse.click(10, page.viewportSize()!.height - 10);
  await expect(toggle, "clique fora deve fechar o menu").toHaveAttribute("aria-expanded", "false");

  // Tab para fora do menu fecha (focusout)
  await toggle.click();
  const n = await menu.locator("a").count();
  await toggle.focus();
  for (let i = 0; i < n + 1; i++) await page.keyboard.press("Tab");
  await page.waitForTimeout(200);
  expect.soft(await toggle.getAttribute("aria-expanded"), "Tab para fora do menu deve fechá-lo").toBe("false");

  // link do menu navega e fecha
  await toggle.click();
  const alvo = menu.locator('a[href*="#"]').first();
  const href = await alvo.getAttribute("href");
  await alvo.click();
  await page.waitForTimeout(300);
  expect.soft(await toggle.getAttribute("aria-expanded"), "escolher um item deve fechar o menu").toBe("false");
  // scroll suave de várias telas (Universe tem 520vh): espera até 5s
  await expect
    .poll(
      () =>
        page.evaluate((h) => {
          const id = h?.split("#")[1];
          const el = id ? document.getElementById(id) : null;
          if (!el) return false;
          const r = el.getBoundingClientRect();
          return r.top < innerHeight && r.bottom > 0;
        }, href),
      { timeout: 5000, message: `o item ${href} deve levar à seção` },
    )
    .toBe(true);
});

test("[KB-05] navbar escondida pelo scroll reaparece ao receber foco (R1 #1, WCAG 2.4.11) @dod", async ({ page }, testInfo) => {
  test.skip(!["w1280", "w375"].includes(testInfo.project.name), "1280 e 375");
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await settle(page);
  await page.addStyleTag({ content: "html{scroll-behavior:auto!important}" });

  // rola para baixo em passos (o hook esconde ao rolar para baixo depois de 200px)
  for (let i = 0; i < 8; i++) {
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(80);
  }
  await page.waitForTimeout(800);
  const escondida = await navState(page);
  await attachJson(testInfo, "nav-escondida", escondida);
  expect.soft(escondida?.visivel, "sanidade: a navbar deveria sumir ao rolar para baixo").toBe(false);

  // foca o primeiro elemento da navbar pelo teclado, sem rolar
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  const y0 = await page.evaluate(() => window.scrollY);
  await page.evaluate(() => {
    // equivalente a Shift+Tab vindo do conteúdo: o foco entra no header
    const first = document.querySelector<HTMLElement>("header a, header button");
    first?.focus({ preventScroll: true });
  });
  await page.waitForTimeout(700); // transição de .5s
  const comFoco = await navState(page);
  const y1 = await page.evaluate(() => window.scrollY);
  await attachJson(testInfo, "nav-com-foco", { comFoco, y0, y1 });
  expect.soft(comFoco?.visivel && (comFoco?.top ?? -1) >= 0, "com foco dentro, a navbar tem que estar inteira na tela").toBe(true);
  await page.screenshot({ path: testInfo.outputPath("nav-com-foco.png") });
});
