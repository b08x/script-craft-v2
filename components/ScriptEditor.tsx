
import React, { useState, useEffect, useRef } from 'react';
import { ScriptLine, Persona } from '../types';
import Button from './common/Button';
import Card from './common/Card';
import Input from './common/Input';
import { ArrowLeftIcon, ArrowRightIcon, PlusIcon, TrashIcon, SwitchIcon, SparklesIcon } from './icons/Icons';
import { reviseLineWithPrompt, generateNextLine } from '../services/geminiService';
import Loader from './common/Loader';


interface ScriptEditorProps {
  script: ScriptLine[];
  setScript: React.Dispatch<React.SetStateAction<ScriptLine[]>>;
  personas: Persona[];
  onBack: () => void;
  onComplete: () => void;
}

const ScriptEditor: React.FC<ScriptEditorProps> = ({ script, setScript, personas, onBack, onComplete }) => {
  const [editingWithPromptId, setEditingWithPromptId] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [revisingLineId, setRevisingLineId] = useState<string | null>(null);
  const [isGeneratingNext, setIsGeneratingNext] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lineRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  useEffect(() => {
    // Prune stale refs for deleted lines
    const scriptIds = new Set(script.map(item => item.id));
    Object.keys(lineRefs.current).forEach(id => {
      if (!scriptIds.has(id)) {
        delete lineRefs.current[id];
      }
    });

    // Resize all textareas
    script.forEach(item => {
      const el = lineRefs.current[item.id];
      if (el) {
        el.style.height = 'auto'; // Reset height to recalculate
        el.style.height = `${el.scrollHeight}px`;
      }
    });
  }, [script]);


  const updateLine = (id: string, newLine: string) => {
    setScript(script.map(line => line.id === id ? { ...line, line: newLine } : line));
  };

  const switchSpeaker = (id: string, newSpeakerId: string) => {
    setScript(script.map(line => line.id === id ? { ...line, speakerId: newSpeakerId } : line));
  };

  const deleteLine = (id: string) => {
    setScript(script.filter(line => line.id !== id));
  };
  
  const addLineAfter = (id: string) => {
    const index = script.findIndex(line => line.id === id);
    if(index > -1) {
        const currentSpeakerId = script[index].speakerId;
        const currentSpeakerIndex = personas.findIndex(p => p.id === currentSpeakerId);
        const nextSpeakerIndex = (currentSpeakerIndex + 1) % personas.length;
        const nextSpeakerId = personas[nextSpeakerIndex]?.id || personas[0].id;
        const newLine: ScriptLine = { id: `${Date.now()}`, speakerId: nextSpeakerId, line: '' };
        const newScript = [...script];
        newScript.splice(index + 1, 0, newLine);
        setScript(newScript);
    }
  };
  
  const getPersona = (id: string) => personas.find(p => p.id === id);

  const handleStartAIPrompt = (lineId: string) => {
    setEditingWithPromptId(lineId);
    setAiPrompt('');
    setError(null);
  };

  const handleReviseWithPrompt = async (lineId: string) => {
    if (!aiPrompt.trim()) return;
    setRevisingLineId(lineId);
    setError(null);
    try {
        const revisedLine = await reviseLineWithPrompt(lineId, aiPrompt, script, personas);
        updateLine(lineId, revisedLine);
        setEditingWithPromptId(null);
        setAiPrompt('');
    } catch (e: any) {
        setError(e.message || 'An unknown error occurred during revision.');
    } finally {
        setRevisingLineId(null);
    }
  };

  const handleGenerateNextLine = async () => {
    setIsGeneratingNext(true);
    setError(null);
    try {
        const nextLine = await generateNextLine(script, personas);
        setScript(prevScript => [...prevScript, nextLine]);
    } catch (e: any) {
        setError(e.message || 'An unknown error occurred while generating the next line.');
    } finally {
        setIsGeneratingNext(false);
    }
  };


  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-text-primary">Step 4: Interactive Script Editing</h2>
      <p className="text-text-secondary">Refine your script. Click on any line to edit, use AI to revise, or generate new lines to continue the conversation.</p>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
            <Card>
                <div className="flow-root">
                <ul role="list" className="-mb-8">
                    {script.map((item, itemIdx) => (
                    <li key={item.id}>
                        <div className="relative pb-8">
                        {itemIdx !== script.length - 1 ? (
                            <span className="absolute left-5 top-5 -ml-px h-full w-0.5 bg-divider" aria-hidden="true" />
                        ) : null}
                        <div className="relative flex items-start space-x-4">
                            <div className="flex-shrink-0">
                                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-secondary text-lg font-bold text-white">
                                    {getPersona(item.speakerId)?.name.charAt(0) || '?'}
                                </span>
                            </div>
                            <div className="min-w-0 flex-1">
                                <div>
                                    <div className="text-sm">
                                        <p className="font-medium text-text-primary">{getPersona(item.speakerId)?.name || 'Unknown'}</p>
                                    </div>
                                    {revisingLineId === item.id ? (
                                        <div className="mt-2"><Loader text="Revising line..." /></div>
                                    ) : (
                                      <textarea
                                          ref={el => { lineRefs.current[item.id] = el; }}
                                          rows={1}
                                          value={item.line}
                                          onChange={(e) => updateLine(item.id, e.target.value)}
                                          className="mt-2 w-full rounded-md border-0 bg-bg-primary py-2 px-3 text-text-secondary shadow-sm ring-1 ring-inset ring-divider focus:ring-2 focus:ring-inset focus:ring-accent-primary sm:text-sm"
                                          style={{ resize: 'none', overflow: 'hidden' }}
                                      />
                                    )}
                                </div>
                                <div className="mt-2 flex items-center gap-3">
                                    <select
                                        value={item.speakerId}
                                        onChange={(e) => switchSpeaker(item.id, e.target.value)}
                                        className="rounded-md border-0 bg-bg-secondary py-1 pl-2 pr-8 text-xs font-medium text-text-secondary hover:bg-divider focus:ring-1 focus:ring-accent-primary"
                                    >
                                        {personas.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                    <button onClick={() => addLineAfter(item.id)} className="text-gray-400 hover:text-accent-primary" title="Add empty line below"><PlusIcon className="w-5 h-5"/></button>
                                    <button onClick={() => handleStartAIPrompt(item.id)} className="text-gray-400 hover:text-accent-primary" title="Edit with AI"><SparklesIcon className="w-5 h-5" /></button>
                                    <button onClick={() => deleteLine(item.id)} className="text-gray-400 hover:text-red-400" title="Delete line"><TrashIcon className="w-5 h-5"/></button>
                                </div>
                                {editingWithPromptId === item.id && (
                                  <div className="mt-3 space-y-2 p-3 bg-bg-primary rounded-md">
                                    <Input 
                                      label="How should the AI revise this line?"
                                      id={`ai-prompt-${item.id}`}
                                      value={aiPrompt}
                                      onChange={(e) => setAiPrompt(e.target.value)}
                                      placeholder="e.g., 'Make this more skeptical and concise'"
                                    />
                                    <div className="flex items-center gap-2 pt-2">
                                      <Button onClick={() => handleReviseWithPrompt(item.id)} disabled={revisingLineId !== null || !aiPrompt.trim()}>
                                        Revise with AI
                                      </Button>
                                      <Button variant="secondary" onClick={() => setEditingWithPromptId(null)}>Cancel</Button>
                                    </div>
                                  </div>
                                )}
                            </div>
                        </div>
                        </div>
                    </li>
                    ))}
                </ul>
                </div>

                <div className="flex justify-center mt-8 border-t border-divider pt-6">
                    <Button
                        onClick={handleGenerateNextLine}
                        disabled={isGeneratingNext || script.length === 0}
                        leftIcon={<PlusIcon />}
                        variant="secondary"
                    >
                        {isGeneratingNext ? 'Generating...' : 'Generate Next Line'}
                    </Button>
                </div>
                {isGeneratingNext && <div className="mt-4"><Loader text="Thinking of what to say next..."/></div>}

            </Card>
             {error && <Card className="border border-red-600 mt-4"><p className="text-red-300">{error}</p></Card>}
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
          Back to Generate
        </Button>
        <Button onClick={onComplete} rightIcon={<ArrowRightIcon />}>
          Final Review
        </Button>
      </div>
    </div>
  );
};

export default ScriptEditor;
