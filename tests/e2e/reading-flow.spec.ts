import { test, expect } from "@playwright/test";

test("full 3-card reading flow", async ({ request, page }) => {
  const createRes = await request.post("/api/v1/readings", {
    data: { num_cartas: 3 },
  });
  expect(createRes.ok()).toBeTruthy();
  const { id, num_cartas } = await createRes.json();
  expect(num_cartas).toBe(3);

  await page.goto(`/reading/${id}`);
  await expect(page.locator("h1")).toContainText("Sua Tiragem");

  for (let i = 0; i < 3; i++) {
    const unrevealed = page.locator("button.perspective:not([disabled])");
    await expect(unrevealed.first()).toBeVisible();
    await unrevealed.first().click();
    await page.waitForTimeout(800);
  }

  await expect(page.getByText("3 de 3")).toBeVisible();

  const finalizeBtn = page.getByRole("button", { name: "Ver Resultado" });
  await expect(finalizeBtn).toBeVisible();
  await finalizeBtn.click();

  await page.waitForURL(`**/reading/${id}/result`);
  await expect(page.locator("h1")).toContainText("Resultado");

  const resultCards = page.locator(".flex.flex-col.gap-4 > div.animate-fade-up");
  await expect(resultCards).toHaveCount(3);
});

test("API never exposes deck_order or reverseds", async ({ request }) => {
  const createRes = await request.post("/api/v1/readings", {
    data: { num_cartas: 1 },
  });
  const reading = await createRes.json();
  expect(reading).not.toHaveProperty("deck_order");
  expect(reading).not.toHaveProperty("reverseds");

  const getRes = await request.get(`/api/v1/readings/${reading.id}`);
  const fetched = await getRes.json();
  expect(fetched).not.toHaveProperty("deck_order");
  expect(fetched).not.toHaveProperty("reverseds");
});
