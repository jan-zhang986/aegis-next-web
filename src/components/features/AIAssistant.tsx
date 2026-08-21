interface AIAssistantProps {
  currentContext?: string;
}

/**
 * Compatibility shell for the legacy floating AI assistant.
 *
 * The product currently uses the routed AI assistant page instead of this
 * embedded drawer. Keep this component minimal so the app can compile while
 * the future floating-assistant redesign happens in a separate phase.
 */
export function AIAssistant(_props: AIAssistantProps) {
  return null;
}
