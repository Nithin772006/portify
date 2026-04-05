import nlp from 'compromise';

export function extractSkillsFromJD(jdText: string): string[] {
  const doc = nlp(jdText);
  
  // Extract nouns and noun phrases that look like skills
  const nouns = doc.nouns().out('array') as string[];
  
  // Common tech/skill patterns
  const skillPatterns = [
    /\b(javascript|typescript|python|java|c\+\+|c#|ruby|go|rust|swift|kotlin)\b/gi,
    /\b(react|angular|vue|svelte|next\.?js|express|django|flask|spring|rails)\b/gi,
    /\b(docker|kubernetes|aws|azure|gcp|jenkins|terraform|ansible)\b/gi,
    /\b(sql|nosql|mongodb|postgresql|mysql|redis|elasticsearch)\b/gi,
    /\b(git|ci\/cd|agile|scrum|kanban|devops|microservices)\b/gi,
    /\b(figma|sketch|photoshop|illustrator|adobe\s*xd)\b/gi,
    /\b(machine\s*learning|deep\s*learning|nlp|computer\s*vision|ai)\b/gi,
    /\b(html|css|sass|tailwind|bootstrap)\b/gi,
    /\b(node\.?js|deno|bun)\b/gi,
    /\b(rest\s*api|graphql|grpc|websocket)\b/gi,
    /\b(testing|jest|mocha|cypress|selenium)\b/gi,
    /\b(linux|unix|windows\s*server)\b/gi,
  ];

  const extracted = new Set<string>();

  // Extract from regex patterns
  for (const pattern of skillPatterns) {
    const matches = jdText.match(pattern);
    if (matches) {
      matches.forEach(m => extracted.add(m.toLowerCase().trim()));
    }
  }

  // Extract noun phrases that might be skills (2-3 word phrases)
  const terms = doc.match('#Adjective? #Noun+').out('array') as string[];
  terms.forEach(t => {
    const cleaned = t.toLowerCase().trim();
    if (cleaned.length > 2 && cleaned.length < 40) {
      extracted.add(cleaned);
    }
  });

  return Array.from(extracted);
}

export function compareSkills(userSkills: string[], jdSkills: string[]): { matched: string[]; missing: string[] } {
  const userSet = new Set(userSkills.map(s => s.toLowerCase()));
  const matched: string[] = [];
  const missing: string[] = [];

  for (const skill of jdSkills) {
    const lower = skill.toLowerCase();
    if (userSet.has(lower) || [...userSet].some(u => u.includes(lower) || lower.includes(u))) {
      matched.push(skill);
    } else {
      missing.push(skill);
    }
  }

  return { matched, missing };
}
