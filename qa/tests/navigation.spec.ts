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
  // click via DOM: o click() do Playwright rola a página antes de clicar (card sobe no hover e fica "instável"),
  // o que invalidaria o "antes". Mede o scrollY na mesma avaliação do clique.
  const antes = await post.evaluate((el) => {
    const y = Math.round(window.scrollY);
    (el as HTMLElement).click();
    return y;
  });
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

test("[KB-04] menu mobile (overlay modal, D20): abre com foco no 1º link, Tab preso, Esc/X fecham, body sem scroll @dod", async ({ page }, testInfo) => {
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

  // abre pelo teclado: aria-expanded=true e foco no 1º link
  await toggle.focus();
  await page.keyboard.press("Enter");
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  const menuId = await toggle.getAttribute("aria-controls");
  const menu = page.locator(`#${menuId}`);
  await expect(menu).toBeVisible();
  await page.screenshot({ path: `${testInfo.outputPath("menu-aberto.png")}` });
  await expect
    .poll(() => page.evaluate((id) => document.activeElement === document.querySelector(`#${id} a`), menuId), {
      message: "ao abrir, o foco deve ir para o 1º link do menu",
    })
    .toBe(true);

  // body sem scroll enquanto aberto
  const overflow = await page.evaluate(() => getComputedStyle(document.body).overflow + "|" + getComputedStyle(document.documentElement).overflow);
  expect.soft(overflow, "body/html com overflow hidden com o menu aberto").toContain("hidden");
  const y0 = await page.evaluate(() => scrollY);
  await page.mouse.wheel(0, 600);
  await page.waitForTimeout(300);
  expect.soft(await page.evaluate(() => scrollY), "a página não deve rolar com o menu aberto").toBe(y0);

  // Tab preso dentro do menu (o botão X também conta como dentro do modal)
  const n = await menu.locator("a").count();
  const fora: string[] = [];
  for (let i = 0; i < n + 4; i++) {
    await page.keyboard.press("Tab");
    const ok = await page.evaluate((id) => {
      const el = document.activeElement;
      return !!el && (!!el.closest(`#${id}`) || el.closest("header")?.contains(document.querySelector(`button[aria-controls="${id}"]`)) && el.matches(`button[aria-controls="${id}"]`));
    }, menuId);
    if (!ok) fora.push(await page.evaluate(() => `${document.activeElement?.tagName}:${document.activeElement?.textContent?.trim().slice(0, 20)}`));
  }
  expect.soft(fora, "o Tab não pode sair do menu enquanto aberto").toEqual([]);
  await expect(toggle, "Tab não deve fechar o menu").toHaveAttribute("aria-expanded", "true");

  // Esc fecha e devolve o foco ao botão
  await page.keyboard.press("Escape");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  expect.soft(await toggle.evaluate((b) => document.activeElement === b), "Esc deve devolver o foco ao botão do menu").toBe(true);
  expect.soft(await page.evaluate(() => getComputedStyle(document.body).overflow), "body volta a rolar ao fechar").not.toBe("hidden");

  // botão X (o próprio toggle, com ícone de fechar) fecha
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await toggle.click();
  await expect(toggle, "o botão X deve fechar o menu").toHaveAttribute("aria-expanded", "false");

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

test("[KB-05] header mapa de missão: compacto no desktop, fixo no celular, volta cheio com foco/hover (H4, WCAG 2.4.11) @dod", async ({ page }, testInfo) => {
  test.skip(!["w1280", "w375"].includes(testInfo.project.name), "1280 e 375");
  const desktop = testInfo.project.name === "w1280";
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await settle(page);
  await page.addStyleTag({ content: "html{scroll-behavior:auto!important}" });

  const altura = () => page.evaluate(() => Math.round(document.querySelector("header")!.getBoundingClientRect().height));
  const cheia = await altura();

  // rola para baixo, fora do hero, em passos
  for (let i = 0; i < 14; i++) {
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(80);
  }
  await page.waitForTimeout(900);
  const rolado = await navState(page);
  const hAbaixo = await altura();
  await attachJson(testInfo, "header-rolado", { cheia, hAbaixo, rolado });
  // NÃO some mais (H4): continua na tela nas duas larguras
  expect.soft(rolado?.visivel && (rolado?.top ?? -1) >= 0, "o header não pode sumir ao rolar (H4)").toBe(true);
  if (desktop) {
    expect.soft(await page.evaluate(() => document.documentElement.dataset.header), "desktop: html[data-header=compact] ao descer").toBe("compact");
    expect.soft(hAbaixo, "desktop: trilha de ~10px").toBeLessThanOrEqual(12);
  } else {
    expect.soft(hAbaixo, "celular: header fixo com a mesma altura").toBe(cheia);
    // (html[data-header] também é marcado no celular, mas o header não encolhe: o que vale é a altura)
  }

  // foco de teclado volta o header cheio (desktop) / mantém visível (celular), sem rolar
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  const y0 = await page.evaluate(() => window.scrollY);
  await page.keyboard.press("Tab");
  await page.waitForTimeout(900);
  const y1 = await page.evaluate(() => window.scrollY);
  const comFoco = await navState(page);
  const hFoco = await altura();
  await attachJson(testInfo, "header-com-foco", { comFoco, hFoco, y0, y1 });
  expect.soft(comFoco?.visivel && (comFoco?.top ?? -1) >= 0, "com foco, o header inteiro na tela").toBe(true);
  if (desktop && (await page.evaluate(() => !!document.activeElement?.closest("header")))) {
    expect.soft(hFoco, "desktop: com foco de teclado dentro, o header volta cheio").toBe(cheia);
  }
  await page.screenshot({ path: testInfo.outputPath("header-com-foco.png") });

  // hover volta cheio no desktop
  if (desktop) {
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.mouse.move(640, 400);
    await page.waitForTimeout(700);
    await page.mouse.move(640, 5);
    await page.waitForTimeout(900);
    expect.soft(await altura(), "desktop: hover no header volta cheio").toBe(cheia);
  }
});

test("[NAV-URL] cliques de seção no header mantêm a URL em / (sem #) @dod", async ({ page }, testInfo) => {
  test.skip(!["w1280", "w375"].includes(testInfo.project.name), "1280 e 375");
  const con = watchConsole(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await settle(page);
  const mobile = testInfo.project.name === "w375";
  const urls: string[] = [];
  for (const alvo of ["projetos", "contato"]) {
    if (mobile) await page.locator("button[aria-controls][aria-expanded]").first().click();
    const link = page.locator(`${mobile ? "#menu-mobile" : "header nav"} a[href*="#${alvo}"]`).first();
    test.skip((await link.count()) === 0, `sem link para #${alvo} no header`);
    await link.click();
    await page.waitForTimeout(1500);
    urls.push(page.url());
    const visivel = await page.evaluate((id) => {
      const r = document.getElementById(id)?.getBoundingClientRect();
      return !!r && r.top < innerHeight && r.bottom > 0;
    }, alvo);
    expect.soft(visivel, `#${alvo} deve estar na tela depois do clique`).toBe(true);
  }
  await attachJson(testInfo, "urls", urls);
  expect.soft(urls.filter((u) => u.includes("#")), "a URL não pode ganhar #").toEqual([]);
  expect.soft(con.issues, formatIssues(con.issues)).toEqual([]);
});

test("[NAV-HASH] /#contato digitado rola até a seção e limpa o # @dod", async ({ page }, testInfo) => {
  test.skip(!["w1280", "w375"].includes(testInfo.project.name), "1280 e 375");
  const con = watchConsole(page);
  await page.goto("/#contato", { waitUntil: "domcontentloaded" });
  await settle(page);
  await expect
    .poll(() => page.evaluate(() => { const r = document.getElementById("contato")?.getBoundingClientRect(); return !!r && r.top < innerHeight && r.bottom > 0; }), { timeout: 8000, message: "/#contato deve rolar até a seção" })
    .toBe(true);
  await expect.poll(() => page.url(), { timeout: 3000, message: "o # deve sair da URL" }).not.toContain("#");
  // já na Home: digitar outro hash (navegação no mesmo documento) também rola e limpa
  await page.evaluate(() => { location.hash = "#projetos"; });
  await expect
    .poll(() => page.evaluate(() => { const r = document.getElementById("projetos")?.getBoundingClientRect(); return !!r && r.top < innerHeight && r.bottom > 0; }), { timeout: 8000, message: "#projetos digitado na Home deve rolar" })
    .toBe(true);
  await expect.poll(() => page.url(), { timeout: 3000 }).not.toContain("#");
  expect.soft(con.issues, formatIssues(con.issues)).toEqual([]);
});
