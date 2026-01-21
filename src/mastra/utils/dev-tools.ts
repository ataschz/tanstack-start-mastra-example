import { devToolsMiddleware } from "@ai-sdk/devtools";
import { wrapLanguageModel } from "ai";
import { type LanguageModelV3 } from "@ai-sdk/provider";

export function useDevTools(model: LanguageModelV3) {
    if (process.env.USE_AI_SDK_DEV_TOOLS) {
        return wrapLanguageModel({
            model,
            middleware: devToolsMiddleware(),
        })
    }

    return model
}