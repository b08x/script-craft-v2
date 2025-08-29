
import { CommunicationStyle, ExpertiseLevel, SentenceLength, VocabComplexity, HumorLevel } from './types';

export const COMMUNICATION_STYLES = Object.values(CommunicationStyle);
export const EXPERTISE_LEVELS = Object.values(ExpertiseLevel);
export const SENTENCE_LENGTHS = Object.values(SentenceLength);
export const VOCAB_COMPLEXITIES = Object.values(VocabComplexity);
export const HUMOR_LEVELS = Object.values(HumorLevel);

export const PERSONALITY_TRAIT_OPTIONS = [
    'Curious', 'Skeptical', 'Supportive', 'Challenging', 'Optimistic', 'Pessimistic', 'Pragmatic', 'Creative'
];

export const MIN_DIALOGUE_LENGTH_MINUTES = 1;
export const MAX_DIALOGUE_LENGTH_MINUTES = 60;
export const DEFAULT_DIALOGUE_LENGTH_MINUTES = 10;

export const CONVERSATION_STYLE_OPTIONS = ['Interview', 'Discussion', 'Monologue with Interjections', 'Debate'];
export const COMPLEXITY_LEVEL_OPTIONS = ['Highly Technical', 'Accessible', 'Simplified for Beginners'];