import type { ChatAiProvider, ChatGenerateInput, ChatGenerateResult } from "./chat-ai-provider.js";

export class MockChatAiProvider implements ChatAiProvider {
  async generateChatResponse(input: ChatGenerateInput): Promise<ChatGenerateResult> {
    const start = Date.now();
    const lastMessage = input.messages[input.messages.length - 1];
    const content =
      lastMessage?.role === "user"
        ? `Based on your data, I'd suggest focusing on getting enough protein throughout the day. ` +
          `A good target would be 20-30g per meal. Your current meals look balanced, but adding a ` +
          `source of lean protein like grilled chicken, paneer, or lentils could help you meet your goals.\n\n` +
          `**Key takeaways:**\n` +
          `- Your meal distribution looks well-balanced\n` +
          `- Stay hydrated throughout the day\n` +
          `- Consider adding more leafy greens for fiber`
        : "Hello! I'm your AI Nutritionist. I can see you've been tracking your meals. How can I help you today?";

    return {
      content,
      inputTokens: input.messages.length * 50,
      outputTokens: content.length / 4,
      latencyMs: Date.now() - start,
    };
  }
}
