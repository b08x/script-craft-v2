import React, { useState } from 'react';
import { Persona, ScriptLine, GenerationSettings } from '../types';
import { generateScript } from '../services/geminiService';
import Button from './common/Button';
import Card from './common/Card';
import Select from './common/Select';
import Loader from './common/Loader';
import { MIN_DIALOGUE_LENGTH_MINUTES, MAX_DIALOGUE_LENGTH_MINUTES, CONVERSATION_STYLE_OPTIONS, COMPLEXITY_LEVEL_OPTIONS, AVAILABLE_MODELS, MAX_THINKING_BUDGET } from '../constants';
import { ArrowLeftIcon, ArrowRightIcon, SparklesIcon } from './icons/Icons';

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

  // Thinking is supported on Gemini 2.5 series and Gemini 3.0 Pro
  const isThinkingSupported = settings.modelName.includes('2.5') || settings.modelName.includes('3-pro');

  // Determine max budget based on model (simplified logic: 24k for Flash, 32k for Pro)
  const currentMaxBudget = settings.modelName.includes('flash') ? 24576 : MAX_THINKING_BUDGET;

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-text-primary">Step 3: Generate Dialogue</h2>
      <p className="text-text-secondary">Review the settings below and generate the first draft of your script. The AI will use the show intro, personas, and their source documents to create a conversation.</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h3 className="text-xl font-semibold text-text-primary mb-4">Content Settings</h3>
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

           <Card>
            <h3 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
                <SparklesIcon className="w-5 h-5 text-accent-primary" />
                Advanced Model Settings
            </h3>
            <div className="grid grid-cols-1 gap-6">
                <div>
                  <label htmlFor="model-select" className="block text-sm font-medium text-text-secondary mb-1">
                    Model
                  </label>
                  <select
                    id="model-select"
                    className="block w-full rounded-md border-0 bg-bg-primary py-2 px-3 text-text-primary shadow-sm ring-1 ring-inset ring-divider focus:ring-2 focus:ring-inset focus:ring-accent-primary sm:text-sm sm:leading-6"
                    value={settings.modelName}
                    onChange={(e) => setSettings({...settings, modelName: e.target.value, thinkingBudget: 0})}
                  >
                    {AVAILABLE_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>

                <div>
                    <label htmlFor="temperature" className="block text-sm font-medium text-text-secondary mb-2">
                        Temperature (Creativity): <span className="font-bold text-text-primary">{settings.temperature}</span>
                    </label>
                    <input
                        id="temperature"
                        type="range"
                        min="0"
                        max="2"
                        step="0.1"
                        value={settings.temperature}
                        onChange={e => setSettings({...settings, temperature: parseFloat(e.target.value)})}
                        className="w-full h-2 bg-divider rounded-lg appearance-none cursor-pointer accent-accent-secondary"
                    />
                    <div className="flex justify-between text-xs text-text-secondary mt-1">
                        <span>0.0 (Precise)</span>
                        <span>1.0 (Balanced)</span>
                        <span>2.0 (Creative)</span>
                    </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-bg-primary rounded-md border border-divider">
                    <input
                        id="search-grounding"
                        type="checkbox"
                        checked={settings.enableSearchGrounding}
                        onChange={e => setSettings({...settings, enableSearchGrounding: e.target.checked})}
                        className="h-4 w-4 rounded border-divider bg-bg-secondary text-accent-primary focus:ring-accent-primary"
                    />
                    <label htmlFor="search-grounding" className="text-sm font-medium text-text-primary select-none cursor-pointer">
                        Enable Google Search Grounding
                        <span className="block text-xs text-text-secondary font-normal">Allows the model to check recent information. May affect generation time.</span>
                    </label>
                </div>
                
                {isThinkingSupported ? (
                    <div>
                         <label htmlFor="thinking-budget" className="block text-sm font-medium text-text-secondary mb-2">
                            Thinking Budget: <span className="font-bold text-text-primary">{settings.thinkingBudget > 0 ? `${settings.thinkingBudget} tokens` : 'Disabled'}</span>
                        </label>
                        <input
                            id="thinking-budget"
                            type="range"
                            min="0"
                            max={currentMaxBudget}
                            step="1024"
                            value={settings.thinkingBudget}
                            onChange={e => setSettings({...settings, thinkingBudget: parseInt(e.target.value, 10)})}
                            className="w-full h-2 bg-divider rounded-lg appearance-none cursor-pointer accent-accent-secondary"
                        />
                         <div className="flex justify-between text-xs text-text-secondary mt-1">
                            <span>0 (Off)</span>
                            <span>{currentMaxBudget} (Max)</span>
                        </div>
                        <p className="text-xs text-text-secondary mt-2">Allocates tokens for reasoning before generating text. Useful for complex logic.</p>
                    </div>
                ) : (
                    <div className="p-3 bg-bg-primary rounded-md border border-divider opacity-50">
                        <p className="text-sm text-text-secondary">Thinking Budget is not supported for the selected model.</p>
                    </div>
                )}
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