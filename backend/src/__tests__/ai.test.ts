import { generatePostVisitSummary, generatePreVisitSummary } from '../services/ai.service';

describe('AI Pre-Visit Triage & Post-Visit Summary Service', () => {
  it('generates high urgency score for critical cardiovascular symptoms', async () => {
    const symptoms = 'Experiencing severe crushing chest pain radiating to left arm and shortness of breath.';
    const result = await generatePreVisitSummary(symptoms);

    expect(result.urgencyLevel).toBe('HIGH');
    expect(result.chiefComplaint).toBeDefined();
    expect(result.suggestedQuestions.length).toBeGreaterThanOrEqual(1);
  });

  it('generates low urgency for routine wellness checkups', async () => {
    const symptoms = 'Routine annual physical examination and wellness checkup.';
    const result = await generatePreVisitSummary(symptoms);

    expect(result.urgencyLevel).toBe('LOW');
    expect(result.suggestedQuestions.length).toBeGreaterThanOrEqual(1);
  });

  it('converts doctor notes into patient-friendly summary and follow-up plan', async () => {
    const notes = 'Diagnosed with acute pharyngitis. Prescribed Amoxicillin 500mg TID for 7 days. Rest and hydration.';
    const result = await generatePostVisitSummary(notes, 'Acute Pharyngitis');

    expect(result.patientFriendlySummary).toBeDefined();
    expect(result.followUpSteps.length).toBeGreaterThan(0);
    expect(result.lifestyleAdvice.length).toBeGreaterThan(0);
  });
});
