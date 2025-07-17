// Test server

import { Hono } from "hono";
import { MoyasarClient } from "@client";
import { logger } from "hono/logger";

const moyasar = new MoyasarClient({
  apiKey: "your-api-key",
});

moyasar.webhook.onAnyPaymentEvent(payload => {
  console.log("--------------------------------");
  console.log("--------- PAYMENT EVENT ---------");
  console.log(payload);
  console.log("--------------------------------");
});

const app = new Hono();

app.use(logger());
const html = await Bun.file("./assets/test_html.html").text();
app.get("/", c => {
  return c.html(html);
});
app.post("/webhook", async c => {
  try {
    const payload = await moyasar.webhook.processWebhook(await c.req.json(), {
      secret_token: "your-secret-token",
    });
    return c.status(200);
  } catch (error) {
    c.status(400);
    return c.json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default {
  port: process.env.PORT || 3033,
  fetch: app.fetch,
};
