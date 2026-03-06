import { AndroidTestRequestJob } from "@/lib/android-test-request-store";

interface SlackTextObject {
  type: "mrkdwn" | "plain_text";
  text: string;
}

interface SlackBlock {
  type: "section" | "context";
  text?: SlackTextObject;
  fields?: SlackTextObject[];
  elements?: SlackTextObject[];
}

interface SlackWebhookPayload {
  text: string;
  blocks: SlackBlock[];
}

function buildSlackPayload(job: AndroidTestRequestJob): SlackWebhookPayload {
  const requesterEmail = job.requesterEmail || "(取得不可)";
  const adminPageUrl = process.env.ANDROID_REQUEST_ADMIN_PAGE_URL;
  const text = `【Android申請】新規受付 requestId=${job.requestId} / email=${requesterEmail}`;

  const blocks: SlackBlock[] = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*Androidクローズドテスト申請を新規受付しました*",
      },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*requestId*\n${job.requestId}` },
        { type: "mrkdwn", text: `*status*\n${job.status}` },
        { type: "mrkdwn", text: `*requesterEmail*\n${requesterEmail}` },
        { type: "mrkdwn", text: `*createdAt*\n${job.createdAt}` },
      ],
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `userId: ${job.userId}`,
        },
      ],
    },
  ];

  if (adminPageUrl) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*運用画面*\n${adminPageUrl}`,
      },
    });
  }

  return {
    text,
    blocks,
  };
}

export async function notifyManualAndroidRequestQueued(job: AndroidTestRequestJob): Promise<void> {
  const webhookUrl = process.env.ANDROID_REQUEST_NOTIFY_WEBHOOK_URL;
  if (!webhookUrl) {
    return;
  }

  const payload = buildSlackPayload(job);
  const token = process.env.ANDROID_REQUEST_NOTIFY_BEARER_TOKEN;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`MANUAL_NOTIFY_FAILED:${response.status}:${text}`);
    }
  } finally {
    clearTimeout(timer);
  }
}
