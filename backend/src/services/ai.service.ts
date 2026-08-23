import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/index';
import { PostVisitAiOutput, PreVisitAiOutput, UrgencyLevel } from '../types/index';

let genAI: GoogleGenerativeAI | null = null;
if (config.geminiApiKey) {
  genAI = new GoogleGenerativeAI(config.geminiApiKey);
}

export async function generatePreVisitSummary(symptomsText: string): Promise<PreVisitAiOutput> {
  if (!symptomsText || !symptomsText.trim()) {
    return {
      urgencyLevel: 'LOW',
      chiefComplaint: 'Routine Consultation / General Checkup',
      suggestedQuestions: [
        'How long have you had these symptoms?',
        'Have you noticed any triggers or changes?',
        'Are you currently taking any medications for this?',
      ],
      triageNotes: 'Patient has booked for a standard health consultation.',
    };
  }

  if (genAI && config.geminiApiKey) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `You are an expert clinical triage assistant.
Analyse these patient-reported symptoms and return a strictly valid JSON object matching this schema:
{
  "urgencyLevel": "Low" | "Medium" | "High",
  "chiefComplaint": "Concise summary of main medical concern (10 words max)",
  "suggestedQuestions": ["Question 1 for doctor", "Question 2 for doctor", "Question 3 for doctor"],
  "triageNotes": "Brief 1-2 sentence clinical context for the doctor"
}

Prompt Instruction:
Analyse these symptoms and return: urgency level (Low / Medium / High), chief complaint, and three suggested questions for the doctor. Symptoms: "${symptomsText}"

IMPORTANT: Output ONLY the raw JSON string without markdown code fences or backticks.`;

      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      const cleanedJson = text.replace(/\`\`\`json/gi, '').replace(/\`\`\`/g, '').trim();
      const parsed = JSON.parse(cleanedJson);

      const urgencyUpper = (parsed.urgencyLevel || 'LOW').toUpperCase();
      const validUrgency: UrgencyLevel =
        urgencyUpper === 'HIGH' ? 'HIGH' : urgencyUpper === 'MEDIUM' ? 'MEDIUM' : 'LOW';

      return {
        urgencyLevel: validUrgency,
        chiefComplaint: parsed.chiefComplaint || symptomsText.slice(0, 50),
        suggestedQuestions: Array.isArray(parsed.suggestedQuestions) && parsed.suggestedQuestions.length > 0
          ? parsed.suggestedQuestions.slice(0, 3)
          : [
              'When did these symptoms first manifest?',
              'Have you experienced any similar episodes in the past?',
              'What remedies or treatments have you tried so far?',
            ],
        triageNotes: parsed.triageNotes || `Clinical assessment for reported: ${symptomsText}`,
      };
    } catch (error) {
      console.warn('[AI Service] Gemini API call fallback active');
    }
  }

  return fallbackPreVisitAnalysis(symptomsText);
}

export async function generatePostVisitSummary(clinicalNotes: string, diagnosis?: string): Promise<PostVisitAiOutput> {
  const combinedNotes = `Diagnosis: ${diagnosis || 'Not specified'}\nClinical Notes: ${clinicalNotes}`;

  if (genAI && config.geminiApiKey) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `You are a patient-centered medical communicator.
Convert the doctor's clinical notes into a patient-friendly summary with medication schedule and follow-up steps.

Return a strictly valid JSON object matching this schema:
{
  "patientFriendlySummary": "Clear, empathetic, jargon-free summary explaining what was diagnosed and the overall recovery plan.",
  "medicationSchedule": [
    {
      "medication": "Name of drug",
      "dosage": "e.g. 500mg",
      "frequency": "e.g. Twice daily",
      "timing": "Morning and Evening after meals",
      "duration": "7 days",
      "instructions": "Take with a full glass of water"
    }
  ],
  "followUpSteps": [
    "Step 1 (e.g. Monitor temperature twice daily)",
    "Step 2 (e.g. Schedule follow-up visit in 2 weeks)"
  ],
  "lifestyleAdvice": [
    "Advice 1 (e.g. Stay hydrated, drink at least 2L of water)",
    "Advice 2 (e.g. Avoid heavy lifting for 3 days)"
  ]
}

Prompt Instruction:
Convert these clinical notes into a patient-friendly summary with medication schedule and follow-up steps: "${combinedNotes}"

IMPORTANT: Output ONLY the raw JSON string without markdown code fences.`;

      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      const cleanedJson = text.replace(/\`\`\`json/gi, '').replace(/\`\`\`/g, '').trim();
      const parsed = JSON.parse(cleanedJson);

      return {
        patientFriendlySummary: parsed.patientFriendlySummary || 'Your consultation notes have been summarized by your physician.',
        medicationSchedule: Array.isArray(parsed.medicationSchedule) ? parsed.medicationSchedule : [],
        followUpSteps: Array.isArray(parsed.followUpSteps) ? parsed.followUpSteps : ['Rest and hydrate', 'Return if symptoms worsen'],
        lifestyleAdvice: Array.isArray(parsed.lifestyleAdvice) ? parsed.lifestyleAdvice : ['Adequate rest', 'Maintain balanced diet'],
      };
    } catch (error) {
      console.warn('[AI Service] Gemini Post-Visit fallback active');
    }
  }

  return fallbackPostVisitAnalysis(clinicalNotes, diagnosis);
}

function fallbackPreVisitAnalysis(symptoms: string): PreVisitAiOutput {
  const lower = symptoms.toLowerCase();

  const highUrgencyKeywords = [
    'chest pain', 'shortness of breath', 'difficulty breathing', 'sudden numbness',
    'severe bleeding', 'unconscious', 'fainting', 'stroke', 'heart attack', 'severe burn',
    'high fever 104', 'worst headache', 'seizure', 'anaphylaxis', 'suicidal'
  ];

  const mediumUrgencyKeywords = [
    'fever', 'vomiting', 'diarrhea', 'persistent cough', 'severe pain', 'fracture',
    'sprain', 'migraine', 'infection', 'rash', 'dizziness', 'abdominal pain', 'earache',
    'blurred vision', 'asthma'
  ];

  let urgency: UrgencyLevel = 'LOW';
  if (highUrgencyKeywords.some(kw => lower.includes(kw))) {
    urgency = 'HIGH';
  } else if (mediumUrgencyKeywords.some(kw => lower.includes(kw))) {
    urgency = 'MEDIUM';
  }

  const sentences = symptoms.split(/[.\n]/).filter(s => s.trim().length > 0);
  const firstSentence = sentences[0]?.trim() || symptoms;
  const chiefComplaint = firstSentence.length > 80 ? firstSentence.slice(0, 77) + '...' : firstSentence;

  const suggestedQuestions: string[] = [];
  if (urgency === 'HIGH') {
    suggestedQuestions.push('Have the symptoms worsened rapidly over the past 24 hours?');
    suggestedQuestions.push('Are you experiencing any radiating pain or shortness of breath?');
    suggestedQuestions.push('Do you have a history of cardiovascular or respiratory conditions?');
  } else if (urgency === 'MEDIUM') {
    suggestedQuestions.push('How many days have you been feeling this way?');
    suggestedQuestions.push('Does anything specific make the pain or discomfort better or worse?');
    suggestedQuestions.push('Have you taken any over-the-counter medication with relief?');
  } else {
    suggestedQuestions.push('What specific activities or times of day trigger this?');
    suggestedQuestions.push('Have you experienced similar symptoms before?');
    suggestedQuestions.push('Are you managing any concurrent chronic conditions?');
  }

  return {
    urgencyLevel: urgency,
    chiefComplaint: chiefComplaint || 'General health evaluation',
    suggestedQuestions,
    triageNotes: `Triage evaluation (${urgency} priority): Patient reported symptoms including "${chiefComplaint}". Recommended prompt clinical review.`,
  };
}

function fallbackPostVisitAnalysis(notes: string, diagnosis?: string): PostVisitAiOutput {
  const diagnosisText = diagnosis ? `Diagnosis: ${diagnosis}. ` : '';

  return {
    patientFriendlySummary: `${diagnosisText}During your consultation, your doctor evaluated your symptoms and documented clinical findings. Please adhere strictly to the prescribed regimen, allow time for recovery, and keep track of your daily improvements.`,
    medicationSchedule: [
      {
        medication: 'Prescribed Regimen',
        dosage: 'As indicated on prescription bottle',
        frequency: 'As directed by physician',
        timing: 'Take with food and water',
        duration: 'Complete full course as prescribed',
        instructions: 'Do not stop early even if feeling better',
      },
    ],
    followUpSteps: [
      'Take all medications on schedule according to instructions',
      'Monitor your symptoms daily and record any adverse reactions',
      'Book a follow-up consultation in 7-14 days or earlier if symptoms persist',
      'Seek immediate emergency care if you experience chest pain, severe breathing difficulty, or high fever',
    ],
    lifestyleAdvice: [
      'Drink plenty of fluids (2-3 liters/day) to support recovery',
      'Get 7-8 hours of restful sleep every night',
      'Avoid strenuous physical exertion until cleared by your doctor',
    ],
  };
}
