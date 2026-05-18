import { test, expect } from "@playwright/test";

test("full 3-card reading flow", async ({ request, page }) => {
  const createRes = await request.post("/api/v1/readings", {
    data: { num_cartas: 3 },
  });
  expect(createRes.ok()).toBeTruthy();
  const { id, num_cartas } = await createRes.json();
  expect(num_cartas).toBe(3);

  await page.goto(`/reading/${id}`);
  await expect(page.getByText("Escolha suas cartas")).toBeVisible();
  await expect(page.getByText("0/3")).toBeVisible();

  for (let i = 0; i < 3; i++) {
    const cards = page.locator("button.perspective:not([disabled])");
    await cards.first().click();
    await page.waitForTimeout(800);
  }

  await expect(page.getByText("Resultado")).toBeVisible({ timeout: 5000 });
  await expect(page.getByText("Gerar Imagem")).toBeVisible();
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
