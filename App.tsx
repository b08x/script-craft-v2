import React, { useState } from 'react';
import { Persona, ScriptLine, GenerationSettings } from './types';
import Stepper from './components/Stepper';
import PersonaBuilder from './components/PersonaBuilder';
import DialogueGenerator from './components/DialogueGenerator';
import ScriptEditor from './components/ScriptEditor';
import ReviewAndExport from './components/ReviewAndExport';
import { LogoIcon } from './components/icons/Icons';
import ShowFlowEditor from './components/ShowFlowEditor';
import { DEFAULT_DIALOGUE_LENGTH_MINUTES } from './constants';

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [showIntro, setShowIntro] = useState<string>('');
  const [script, setScript] = useState<ScriptLine[]>([]);
  const [generationSettings, setGenerationSettings] = useState<GenerationSettings>({
    dialogueLengthInMinutes: DEFAULT_DIALOGUE_LENGTH_MINUTES,
    conversationStyle: 'Discussion',
    complexityLevel: 'Accessible',
  });
  
  const STEPS = [
    'Personas & Sources',
    'Show Flow',
    'Generate',
    'Edit',
    'Review & Export',
  ];

  const handleNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };
  
  const handleRestart = () => {
      setPersonas([]);
      setScript([]);
      setShowIntro('');
      setGenerationSettings({
        dialogueLengthInMinutes: DEFAULT_DIALOGUE_LENGTH_MINUTES,
        conversationStyle: 'Discussion',
        complexityLevel: 'Accessible',
      });
      setCurrentStep(1);
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <PersonaBuilder
            personas={personas}
            setPersonas={setPersonas}
            onComplete={handleNext}
          />
        );
      case 2:
        return (
            <ShowFlowEditor
                personas={personas}
                showIntro={showIntro}
                setShowIntro={setShowIntro}
                onBack={handleBack}
                onComplete={handleNext}
            />
        );
      case 3:
        return (
          <DialogueGenerator
            personas={personas}
            showIntro={showIntro}
            setScript={setScript}
            settings={generationSettings}
            setSettings={setGenerationSettings}
            onBack={handleBack}
            onComplete={handleNext}
          />
        );
      case 4:
        return (
          <ScriptEditor
            script={script}
            setScript={setScript}
            personas={personas}
            onBack={handleBack}
            onComplete={handleNext}
          />
        );
      case 5:
        return (
            <ReviewAndExport
                script={script}
                personas={personas}
                onBack={handleBack}
                onRestart={handleRestart}
            />
        );
      default:
        return <div>Unknown Step</div>;
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
                <LogoIcon className="h-10 w-10 text-accent-primary" />
                <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
                    Script Craft
                </h1>
            </div>
        </header>
        
        <main>
          <Stepper steps={STEPS} currentStep={currentStep} />
          <div className="mt-16">{renderStep()}</div>
        </main>
      </div>
    </div>
  );
};

export default App;