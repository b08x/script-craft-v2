
export interface SourceDocument {
  id: string;
  name: string;
  content: string;
}

export enum CommunicationStyle {
  ANALYTICAL = 'Analytical',
  CONVERSATIONAL = 'Conversational',
  ENTHUSIASTIC = 'Enthusiastic',
  FORMAL = 'Formal',
  HUMOROUS = 'Humorous',
}

export enum ExpertiseLevel {
    BEGINNER = 'Beginner',
    INTERMEDIATE = 'Intermediate',
    EXPERT = 'Expert',
}

export enum SentenceLength {
    SHORT = 'Short',
    MEDIUM = 'Medium',
    LONG = 'Long',
}

export enum VocabComplexity {
    SIMPLE = 'Simple',
    AVERAGE = 'Average',
    COMPLEX = 'Complex',
}

export enum HumorLevel {
    NONE = 'None',
    SUBTLE = 'Subtle',
    FREQUENT = 'Frequent',
}

export interface Persona {
  id: string;
  name: string;
  role: string;
  communicationStyle: CommunicationStyle;
  expertiseLevel: ExpertiseLevel;
  personalityTraits: string[];
  speakingPatterns: {
    sentenceLength: SentenceLength;
    vocabularyComplexity: VocabComplexity;
    humorLevel: HumorLevel;
  };
  sourceDocuments: SourceDocument[];
}

export interface ScriptLine {
  id: string;
  speakerId: string;
  line: string;
}

export interface GenerationSettings {
    dialogueLengthInMinutes: number;
    conversationStyle: string;
    complexityLevel: string;
}