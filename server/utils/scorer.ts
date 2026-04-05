// Scoring algorithm for portfolios
// Each dimension scores 0-20 for a total of 0-100

const skillsDb: Record<string, string[]> = {
  'software-engineer': ['javascript', 'typescript', 'react', 'node.js', 'python', 'git', 'docker', 'aws', 'sql', 'rest api', 'graphql', 'ci/cd'],
  'ui-ux-designer': ['figma', 'sketch', 'adobe xd', 'prototyping', 'user research', 'wireframing', 'design systems', 'typography', 'color theory', 'usability testing'],
  'data-scientist': ['python', 'r', 'sql', 'tensorflow', 'pytorch', 'pandas', 'numpy', 'machine learning', 'deep learning', 'statistics', 'data visualization', 'scikit-learn'],
  'doctor': ['patient care', 'diagnosis', 'treatment planning', 'ehr systems', 'clinical research', 'medical documentation', 'telemedicine'],
  'lawyer': ['legal research', 'litigation', 'contract drafting', 'negotiation', 'compliance', 'case management', 'legal writing', 'due diligence'],
  'marketing-manager': ['seo', 'content marketing', 'google analytics', 'social media', 'email marketing', 'ppc', 'brand strategy', 'copywriting', 'crm', 'a/b testing'],
  'architect': ['autocad', 'revit', 'sketchup', '3d modeling', 'sustainable design', 'building codes', 'project management', 'bim', 'rendering'],
  'photographer': ['lightroom', 'photoshop', 'composition', 'lighting', 'portrait photography', 'color grading', 'retouching', 'studio photography'],
  'chef': ['menu development', 'food safety', 'kitchen management', 'recipe creation', 'inventory management', 'culinary techniques', 'food presentation'],
  'freelancer': ['project management', 'client communication', 'time management', 'invoicing', 'proposal writing', 'negotiation', 'self-marketing'],
  'researcher': ['research methodology', 'data analysis', 'academic writing', 'literature review', 'statistical analysis', 'grant writing', 'peer review', 'matlab', 'spss'],
  'mechanical-engineer': ['solidworks', 'autocad', 'ansys', 'matlab', 'thermodynamics', 'fluid mechanics', 'fea', 'cad', 'manufacturing', 'gd&t'],
};

const atsKeywordsDb: Record<string, string[]> = {
  'software-engineer': ['agile', 'scrum', 'full-stack', 'microservices', 'api', 'scalable', 'performance', 'testing', 'deployment', 'architecture', 'optimization', 'collaboration'],
  'ui-ux-designer': ['user-centered', 'accessibility', 'responsive', 'interaction design', 'design thinking', 'prototype', 'stakeholder', 'iteration', 'conversion', 'engagement'],
  'data-scientist': ['predictive modeling', 'feature engineering', 'big data', 'etl', 'pipeline', 'insights', 'stakeholder', 'dashboard', 'accuracy', 'production'],
  'doctor': ['evidence-based', 'patient outcomes', 'multidisciplinary', 'clinical trials', 'protocols', 'quality improvement', 'patient safety'],
  'lawyer': ['precedent', 'jurisdiction', 'counsel', 'regulatory', 'fiduciary', 'arbitration', 'mediation', 'statutory'],
  'marketing-manager': ['roi', 'conversion rate', 'lead generation', 'brand awareness', 'market research', 'campaign', 'analytics', 'growth', 'engagement', 'funnel'],
  'architect': ['leed', 'sustainability', 'zoning', 'stakeholder', 'code compliance', 'design development', 'schematic', 'construction documents'],
  'photographer': ['portfolio', 'client management', 'post-production', 'creative direction', 'brand identity', 'visual storytelling'],
  'chef': ['haccp', 'cost control', 'team management', 'seasonal menus', 'farm-to-table', 'quality control', 'consistency'],
  'freelancer': ['deliverables', 'milestones', 'scope', 'budget', 'stakeholder', 'deadline', 'portfolio', 'contract'],
  'researcher': ['peer-reviewed', 'methodology', 'hypothesis', 'publication', 'citation', 'IRB', 'longitudinal', 'quantitative', 'qualitative'],
  'mechanical-engineer': ['tolerance', 'stress analysis', 'prototype', 'manufacturing', 'quality assurance', 'iso', 'lean', 'six sigma', 'validation'],
};

export function scorePortfolio(data: any, profession: string) {
  const profKey = profession.toLowerCase().replace(/\s+/g, '-');

  // Dimension 1: Completeness (20pts)
  const required = ['name', 'title', 'bio', 'skills', 'location'];
  const filled = required.filter(f => data[f] && (Array.isArray(data[f]) ? data[f].length > 0 : data[f].length > 0));
  const completeness = (filled.length / required.length) * 20;

  // Dimension 2: Skill Relevance (20pts)
  const demanded = skillsDb[profKey] || [];
  const userSkills = (data.skills || []).map((s: string) => s.toLowerCase());
  const matched = userSkills.filter((s: string) => demanded.includes(s));
  const skillScore = Math.min((matched.length / 6) * 20, 20);

  // Dimension 3: Project Quality (20pts)
  const projects = data.projects || [];
  const projectScore = Math.min(
    projects.reduce((acc: number, p: any) => {
      let pts = 0;
      if (p.description?.length > 50) pts += 3;
      if (p.githubUrl) pts += 2;
      if (p.liveUrl) pts += 2;
      if (p.techStack?.length > 0) pts += 1;
      return acc + Math.min(pts, 8);
    }, 0),
    20
  );

  // Dimension 4: ATS Keywords (20pts)
  const keywords = atsKeywordsDb[profKey] || [];
  const fullText = `${data.bio || ''} ${(data.experience || []).map((e: any) => e.description || '').join(' ')}`;
  const found = keywords.filter(k => fullText.toLowerCase().includes(k.toLowerCase()));
  const atsScore = Math.min((found.length / 8) * 20, 20);

  // Dimension 5: Bio Strength (20pts)
  const words = data.bio?.split(' ').length || 0;
  let bioScore = 0;
  if (words >= 40 && words <= 100) bioScore += 8;
  else if (words >= 20) bioScore += 4;
  if (/\d+/.test(data.bio || '')) bioScore += 6;
  if (/built|led|improved|reduced|scaled|created|designed|managed|developed|launched/.test((data.bio || '').toLowerCase())) bioScore += 6;
  bioScore = Math.min(bioScore, 20);

  const total = Math.round(completeness + skillScore + projectScore + atsScore + bioScore);

  const suggestions: Array<{ text: string; pts: number; priority: string }> = [];
  if (completeness < 15) suggestions.push({ text: 'Complete all profile sections', pts: 8, priority: 'high' });
  if (skillScore < 10) suggestions.push({ text: 'Add more role-relevant skills', pts: 10, priority: 'high' });
  if (projectScore < 10) suggestions.push({ text: 'Add projects with live URLs and GitHub links', pts: 12, priority: 'critical' });
  if (atsScore < 10) suggestions.push({ text: 'Your bio needs more industry keywords', pts: 10, priority: 'high' });
  if (bioScore < 10) suggestions.push({ text: 'Add metrics and action verbs to your bio', pts: 8, priority: 'medium' });

  return {
    total,
    breakdown: { completeness: Math.round(completeness), skillScore: Math.round(skillScore), projectScore: Math.round(projectScore), atsScore: Math.round(atsScore), bioScore: Math.round(bioScore) },
    suggestions: suggestions.sort((a, b) => b.pts - a.pts),
  };
}

export { skillsDb, atsKeywordsDb };
