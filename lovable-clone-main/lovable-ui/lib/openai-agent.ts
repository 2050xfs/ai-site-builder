import OpenAI from "openai";

export type SiteBuilderEvent =
  | { type: "status"; message: string }
  | { type: "assistant_message"; content: string }
  | {
      type: "plan";
      title: string;
      steps: string[];
      stack: string[];
    }
  | {
      type: "deployment";
      environment: "preview" | "production";
      url: string;
      notes?: string;
    }
  | {
      type: "complete";
      summary: string;
      previewUrl?: string;
    };

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

function extractText(response: Awaited<ReturnType<ReturnType<typeof getOpenAIClient>["chat"]["completions"]["create"]>>) {
  const choice = response.choices[0];
  if (!choice) {
    return "";
  }

  if (typeof choice.message.content === "string") {
    return choice.message.content;
  }

  if (Array.isArray(choice.message.content)) {
    return choice.message.content
      .map((part) => (part.type === "text" ? part.text : ""))
      .join("\n");
  }

  return "";
}

export async function* runSiteBuilderAgent(
  prompt: string
): AsyncGenerator<SiteBuilderEvent> {
  const client = getOpenAIClient();

  yield {
    type: "status",
    message: "Initializing OpenAI Codex site builder agent",
  };

  const planningPrompt = `You are an autonomous full-stack web engineer tasked with creating production-ready web experiences. The user request is: "${prompt}".

Create a concise execution plan for building and shipping a Next.js + Tailwind CSS application that can be deployed to a live domain. Your response must be valid JSON with the following shape:
{
  "title": string,
  "steps": string[],
  "stack": string[],
  "deployment": {
    "environments": string[],
    "notes": string
  }
}

Focus on developer operations and automation. Include high-level steps only.`;

  const planningResponse = await client.chat.completions.create({
    model: process.env.OPENAI_CODE_MODEL ?? "gpt-4o-mini",
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are an OpenAI Codex agent that architects production-grade websites. Always respond with JSON when asked to.",
      },
      {
        role: "user",
        content: planningPrompt,
      },
    ],
  });

  const rawPlanningText = extractText(planningResponse);

  let plan: {
    title: string;
    steps: string[];
    stack: string[];
    deployment?: { environments?: string[]; notes?: string };
  } | null = null;

  try {
    plan = JSON.parse(rawPlanningText);
  } catch (error) {
    // If JSON parsing fails, fall back to plain text messaging
  }

  if (plan) {
    yield {
      type: "plan",
      title: plan.title,
      steps: plan.steps,
      stack: plan.stack,
    };

    if (plan.deployment?.environments?.length || plan.deployment?.notes) {
      yield {
        type: "deployment",
        environment: "preview",
        url: "",
        notes: plan.deployment.notes ?? "",
      };
    }
  } else if (rawPlanningText) {
    yield {
      type: "assistant_message",
      content: rawPlanningText,
    };
  }

  const buildResponse = await client.chat.completions.create({
    model: process.env.OPENAI_CODE_MODEL ?? "gpt-4o-mini",
    temperature: 0.4,
    messages: [
      {
        role: "system",
        content:
          "You are an OpenAI Codex agent that generates high-quality Next.js + Tailwind code and DevOps automation plans.",
      },
      {
        role: "user",
        content: `Create the production implementation checklist for the project described earlier. Provide numbered steps focused on shipping to production and handover notes. Prompt: ${prompt}`,
      },
    ],
  });

  const buildText = extractText(buildResponse);

  if (buildText) {
    yield {
      type: "assistant_message",
      content: buildText,
    };
  }

  yield {
    type: "complete",
    summary:
      "Generated an OpenAI Codex plan for building and deploying the requested site. Review the plan and execute the automation pipeline.",
  };
}
