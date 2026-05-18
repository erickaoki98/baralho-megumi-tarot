import { test, expect } from "@playwright/test";

test("full 3-card reading flow", async ({ request, page }) => {
  const createRes = await request.post("/api/v1/readings", {
    data: { tipo: "3_cartas" },
  });
  expect(createRes.ok()).toBeTruthy();
  const { id, num_cartas } = await createRes.json();
  expect(num_cartas).toBe(3);

  await page.goto(`/reading/${id}`);
  await expect(page.locator("h1")).toContainText("Sua Tiragem");

  for (let i = 0; i < 3; i++) {
    const unrevealed = page.locator("button.bg-gray-300");
    await expect(unrevealed.first()).toBeVisible();
    await unrevealed.first().click();
    await page.waitForSelector("button.bg-white.border-purple-500", {
      state: "attached",
    });
  }

  await expect(page.getByText("3/3")).toBeVisible();

  const finalizeBtn = page.getByRole("button", { name: "Finalizar" });
  await expect(finalizeBtn).toBeVisible();
  await finalizeBtn.click();

  await page.waitForURL(`**/reading/${id}/result`);
  await expect(page.locator("h1")).toContainText("Resultado");

  const resultCards = page.locator(".space-y-4 > div");
  await expect(resultCards).toHaveCount(3);
});

test("API never exposes deck_order or reverseds", async ({ request }) => {
  const createRes = await request.post("/api/v1/readings", {
    data: { tipo: "1_carta" },
  });
  const reading = await createRes.json();
  expect(reading).not.toHaveProperty("deck_order");
  expect(reading).not.toHaveProperty("reverseds");

  const getRes = await request.get(`/api/v1/readings/${reading.id}`);
  const fetched = await getRes.json();
  expect(fetched).not.toHaveProperty("deck_order");
  expect(fetched).not.toHaveProperty("reverseds");
});
