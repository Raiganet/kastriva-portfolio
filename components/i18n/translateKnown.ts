export function translateKnown(value: string, english: boolean, dictionary: Record<string, string>): string {
  return english ? dictionary[value] ?? value : value;
}
