import React, { useState } from 'react';
import { Persona, ScriptLine, GenerationSettings } from '../types';
import { generateScript } from '../services/geminiService';
import Button from './common/Button';
import Card from './common/Card';
import Select from './common/Select';
import Loader from './common/Loader';
import { MIN_DIALOGUE_LENGTH_MINUTES, MAX_DIALOGUE_LENGTH_MINUTES, CONVERSATION_STYLE_OPTIONS, COMPLEXITY_LEVEL_OPTIONS } from '../constants';
import { ArrowLeftIcon, ArrowRightIcon } from './icons/Icons';

interface DialogueGeneratorProps {
  personas: Persona[];
  showIntro: string;
  setScript: (script: ScriptLine[]) => void;
  settings: GenerationSettings;
  setSettings: (settings: GenerationSettings) => void;
  onBack: () => void;
  onComplete: () => void;
}

const DialogueGenerator: React.FC<DialogueGeneratorProps> = ({ personas, showIntro, setScript, settings, setSettings, onBack, onComplete }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const generatedScript = await generateScript(personas, settings, showIntro);
      setScript(generatedScript);
      onComplete();
    } catch (e: any) {
      setError(e.message || "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-text-primary">Step 3: Generate Dialogue</h2>
      <p className="text-text-secondary">Review the settings below and generate the first draft of your script. The AI will use the show intro, personas, and their source documents to create a conversation.</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h3 className="text-xl font-semibold text-text-primary mb-4">Generation Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
              <div className="md:col-span-2">
                <label htmlFor="dialogue-length" className="block text-sm font-medium text-text-secondary mb-2">
                    Dialogue Length: <span className="font-bold text-text-primary">{settings.dialogueLengthInMinutes} min</span>
                </label>
                <input
                    id="dialogue-length"
                    type="range"
                    min={MIN_DIALOGUE_LENGTH_MINUTES}
                    max={MAX_DIALOGUE_LENGTH_MINUTES}
                    value={settings.dialogueLengthInMinutes}
                    onChange={e => setSettings({...settings, dialogueLengthInMinutes: parseInt(e.target.value, 10)})}
                    className="w-full h-2 bg-divider rounded-lg appearance-none cursor-pointer accent-accent-primary"
                />
                <div className="flex justify-between text-xs text-text-secondary mt-1">
                    <span>{MIN_DIALOGUE_LENGTH_MINUTES} min (short)</span>
                    <span>{MAX_DIALOGUE_LENGTH_MINUTES} min (long)</span>
                </div>
              </div>
              <Select label="Conversation Style" options={CONVERSATION_STYLE_OPTIONS} value={settings.conversationStyle} onChange={e => setSettings({...settings, conversationStyle: e.target.value})} />
              <Select label="Complexity Level" options={COMPLEXITY_LEVEL_OPTIONS} value={settings.complexityLevel} onChange={e => setSettings({...settings, complexityLevel: e.target.value})} />
            </div>
          </Card>
          {isLoading && <Loader text="Crafting your dialogue script... This may take a moment." />}
          {error && <Card className="border border-red-600"><p className="text-red-300">{error}</p></Card>}
        </div>
        
        <div className="space-y-4">
          <Card>
            <h3 className="text-lg font-semibold text-text-primary mb-3">Speakers</h3>
            <ul className="space-y-2">
              {personas.map(p => (
                <li key={p.id} className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-secondary text-sm font-bold text-white">{p.name.charAt(0)}</span>
                  <div>
                    <p className="font-medium text-text-primary">{p.name}</p>
                    <p className="text-xs text-text-secondary">{p.role}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
      
      <div className="flex justify-between pt-4">
        <Button onClick={onBack} variant="secondary" leftIcon={<ArrowLeftIcon />}>
          Back to Show Flow
        </Button>
        <Button onClick={handleGenerate} disabled={isLoading} rightIcon={<ArrowRightIcon />}>
          {isLoading ? 'Generating...' : 'Generate Script'}
        </Button>
      </div>
    </div>
  );
};

export default DialogueGenerator;