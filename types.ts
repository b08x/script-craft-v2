export enum CommunicationStyle {
    CONVERSATIONAL = 'Conversational',
    ANALYTICAL = 'Analytical',
    STORYTELLING = 'Storytelling',
    INSTRUCTIONAL = 'Instructional',
    DEBATE = 'Debate'
}

export enum ExpertiseLevel {
    BEGINNER = 'Beginner',
    INTERMEDIATE = 'Intermediate',
    ADVANCED = 'Advanced',
    EXPERT = 'Expert'
}

export enum SentenceLength {
    SHORT = 'Short',
    MEDIUM = 'Medium',
    LONG = 'Long',
    VARIED = 'Varied'
}

export enum VocabComplexity {
    SIMPLE = 'Simple',
    AVERAGE = 'Average',
    COMPLEX = 'Complex',
    ACADEMIC = 'Academic'
}

export enum HumorLevel {
    NONE = 'None',
    SUBTLE = 'Subtle',
    WITTY = 'Witty',
    FREQUENT = 'Frequent'
}

export interface DocumentMetadata {
    author?: string;
    date?: string;
    domain?: string;
    fileType?: string;
}

export interface DocumentChunk {
    id: string;
    content: string;
    topics: string[];
    startIndex?: number;
}

export interface SourceDocument {
    id: string;
    name: string;
    content: string;
    metadata?: DocumentMetadata;
    chunks?: DocumentChunk[];
    topics?: string[];
    processingStatus: 'processing' | 'completed' | 'error';
    errorMessage?: string;
}

export interface ContextFile {
    name: string;
    type: string;
    data: string; // base64 string
}

export interface SpeakingPatterns {
    sentenceLength: SentenceLength | string;
    vocabularyComplexity: VocabComplexity | string;
    humorLevel: HumorLevel | string;
    fillerWords?: string;
    commonPauses?: string;
    speechImpediments?: string;
    speakingContextFile?: ContextFile;
}

export interface Persona {
    id: string;
    name: string;
    role: string;
    communicationStyle: CommunicationStyle | string;
    expertiseLevel: ExpertiseLevel | string;
    personalityTraits: string[];
    quirks?: string;
    motivations?: string;
    backstory?: string;
    emotionalRange?: string;
    sourceDocuments: SourceDocument[];
    speakingPatterns: SpeakingPatterns;
    deeperCharsContextFile?: ContextFile;
    avatarUrl?: string;
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
    modelName: string;
    temperature: number;
    enableSearchGrounding: boolean;
    thinkingBudget: number;
}

export interface PersonaAnalysisResult {
    name?: string;
    role?: string;
    communicationStyle?: CommunicationStyle;
    expertiseLevel?: ExpertiseLevel;
    personalityTraits?: string[];
    quirks?: string;
    motivations?: string;
    backstory?: string;
    emotionalRange?: string;
    speakingPatterns?: Partial<SpeakingPatterns>;
}
