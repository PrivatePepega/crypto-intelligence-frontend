import type { z } from "zod";

import type {
  authUserSchema,
  chatMessageSchema,
  chatSchema,
} from "./zodSchemas";

export type AuthUser = z.infer<typeof authUserSchema>;
export type Chat = z.infer<typeof chatSchema>;
export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type ChatRole = ChatMessage["role"];
