import { useMemo } from "react";

const VARIABLE_REGEX = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g;

export function extractVariables(text: string): string[] {
  const matches = new Set<string>();
  let match: RegExpExecArray | null;
  const regex = new RegExp(VARIABLE_REGEX.source, "g");
  while ((match = regex.exec(text)) !== null) {
    matches.add(match[1]);
  }
  return Array.from(matches);
}

export function fillVariables(
  template: string,
  values: Record<string, string>
): string {
  return template.replace(VARIABLE_REGEX, (fullMatch, varName) => {
    return values[varName] !== undefined && values[varName] !== ""
      ? values[varName]
      : fullMatch;
  });
}

export function useVariableDetection(text: string) {
  const variables = useMemo(() => extractVariables(text), [text]);
  return variables;
}
