import { MoyasarClient, WebhookError } from "@/index";
import { ALL_WEBHOOK_EVENTS, WebhookHttpMethods } from "@webhook";
describe("Test Webhook", async () => {
  const client = new MoyasarClient({
    apiKey: Bun.env.MOYASAR_API_KEY!,
  });
  let created_web_hook_id = "";
  it("should register a webhook", async () => {
    try {
      const webhook = await client.webhook.create({
        http_method: WebhookHttpMethods.POST,
        url: "https://api.sahabaplus.com/api/moyasar_webhook",
        events: ALL_WEBHOOK_EVENTS,
        shared_secret: "TEST_SHARED_SECRET",
      });

      created_web_hook_id = webhook.id;
      // console.log(webhook);
    } catch (error) {
      if (error instanceof WebhookError) {
        console.log(error.details);
      }
      throw error;
    }
  }, 20_000);

  it("should list first webhooks page", async () => {
    try {
      const webhook = await client.webhook.list({});
      // console.log(webhook);
    } catch (error) {
      if (error instanceof WebhookError) {
        console.log(error.details);
      }
      throw error;
    }
  }, 20_000);

  it("should delete", async () => {
    try {
      const webhook = await client.webhook.delete(created_web_hook_id);
    } catch (error) {
      if (error instanceof WebhookError) {
        console.log(error.details);
      }
      throw error;
    }
  }, 20_000);
});
