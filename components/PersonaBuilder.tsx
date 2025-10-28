
import React, { useState, useRef } from 'react';
import { Persona, CommunicationStyle, ExpertiseLevel, SentenceLength, VocabComplexity, HumorLevel, SourceDocument } from '../types';
import { COMMUNICATION_STYLES, EXPERTISE_LEVELS, SENTENCE_LENGTHS, VOCAB_COMPLEXITIES, HUMOR_LEVELS, PERSONALITY_TRAIT_OPTIONS } from '../constants';
import Button from './common/Button';
import Card from './common/Card';
import Input from './common/Input';
import Select from './common/Select';
import Textarea from './common/Textarea';
import { PlusIcon, TrashIcon, ArrowRightIcon, UploadIcon, ArrowDownTrayIcon } from './icons/Icons';

interface PersonaBuilderProps {
  personas: Persona[];
  setPersonas: React.Dispatch<React.SetStateAction<Persona[]>>;
  onComplete: () => void;
}

const emptyPersona: Omit<Persona, 'id' | 'sourceDocuments' | 'avatarUrl'> = {
  name: '',
  role: '',
  communicationStyle: CommunicationStyle.CONVERSATIONAL,
  expertiseLevel: ExpertiseLevel.INTERMEDIATE,
  personalityTraits: [],
  quirks: '',
  motivations: '',
  emotionalRange: '',
  speakingPatterns: {
    sentenceLength: SentenceLength.MEDIUM,
    vocabularyComplexity: VocabComplexity.AVERAGE,
    humorLevel: HumorLevel.SUBTLE,
  },
};

const PersonaSources: React.FC<{
  persona: Persona;
  onUpdatePersona: (updatedPersona: Persona) => void;
}> = ({ persona, onUpdatePersona }) => {

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (persona.sourceDocuments.length + files.length > 3) {
      alert("You can upload a maximum of 3 documents per persona.");
      return;
    }

    const newDocuments: SourceDocument[] = [...persona.sourceDocuments];

    for (const file of Array.from(files)) {
      if(newDocuments.length >= 3) break;
      try {
        const content = await file.text();
        newDocuments.push({
          id: `${Date.now()}-${file.name}`,
          name: file.name,
          content: content,
        });
// FIX: Explicitly type the error in the catch block to 'any' to avoid issues with the default 'unknown' type.
      } catch (error: any) {
        console.error("Error reading file:", error);
        alert(`Could not read file ${file.name}. Please ensure it is a text-based file (e.g., .txt, .md).`);
      }
    }

    onUpdatePersona({ ...persona, sourceDocuments: newDocuments });
    // Reset file input value to allow re-uploading the same file
    event.target.value = '';
  };

  const removeDocument = (docId: string) => {
    const updatedDocs = persona.sourceDocuments.filter(doc => doc.id !== docId);
    onUpdatePersona({ ...persona, sourceDocuments: updatedDocs });
  };

  return (
    <div className="mt-4 pt-4 border-t border-divider">
      <h5 className="text-sm font-semibold text-text-primary mb-2">Source Materials ({persona.sourceDocuments.length}/3)</h5>
      <div className="space-y-2">
        {persona.sourceDocuments.map(doc => (
          <div key={doc.id} className="flex items-center justify-between bg-bg-primary p-2 rounded-md text-left">
            <p className="text-xs text-text-secondary truncate pr-2" title={doc.name}>{doc.name}</p>
            <button onClick={() => removeDocument(doc.id)} className="text-gray-500 hover:text-red-400 flex-shrink-0">
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      {persona.sourceDocuments.length < 3 && (
        <div className="mt-3">
          <label
            htmlFor={`file-upload-${persona.id}`}
            className="w-full flex justify-center items-center px-4 py-2 border-2 border-dashed border-divider rounded-md cursor-pointer hover:border-accent-primary transition-colors"
          >
            <UploadIcon className="w-5 h-5 text-text-secondary mr-2"/>
            <span className="text-sm font-medium text-text-secondary">Add Document(s)</span>
          </label>
          <input
            id={`file-upload-${persona.id}`}
            name={`file-upload-${persona.id}`}
            type="file"
            className="sr-only"
            accept=".txt,.md"
            onChange={handleFileChange}
            multiple
          />
        </div>
      )}
    </div>
  );
};


const PersonaForm: React.FC<{ onAddPersona: (persona: Omit<Persona, 'id' | 'sourceDocuments'>) => void }> = ({ onAddPersona }) => {
    const [persona, setPersona] = useState(emptyPersona);

    const handleTraitToggle = (trait: string) => {
        setPersona(p => ({
            ...p,
            personalityTraits: p.personalityTraits.includes(trait)
                ? p.personalityTraits.filter(t => t !== trait)
                : [...p.personalityTraits, trait]
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(persona.name && persona.role) {
            onAddPersona(persona);
            setPersona(emptyPersona);
        }
    };

    return (
        <Card>
            <form onSubmit={handleSubmit} className="space-y-6">
                <h3 className="text-xl font-semibold text-text-primary">Create New Persona</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input id="name" label="Speaker Name" value={persona.name} onChange={e => setPersona(p => ({...p, name: e.target.value}))} required />
                    <Input id="role" label="Role (e.g., Host, Expert)" value={persona.role} onChange={e => setPersona(p => ({...p, role: e.target.value}))} required />
                    <Select id="style" label="Communication Style" options={COMMUNICATION_STYLES} value={persona.communicationStyle} onChange={e => setPersona(p => ({...p, communicationStyle: e.target.value as CommunicationStyle}))} />
                    <Select id="expertise" label="Expertise Level" options={EXPERTISE_LEVELS} value={persona.expertiseLevel} onChange={e => setPersona(p => ({...p, expertiseLevel: e.target.value as ExpertiseLevel}))} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">Personality Traits</label>
                    <div className="flex flex-wrap gap-2">
                        {PERSONALITY_TRAIT_OPTIONS.map(trait => (
                            <button key={trait} type="button" onClick={() => handleTraitToggle(trait)}
                                className={`px-3 py-1 text-sm rounded-full transition-colors ${persona.personalityTraits.includes(trait) ? 'bg-accent-secondary text-white' : 'bg-bg-secondary text-text-secondary hover:bg-divider'}`}>
                                {trait}
                            </button>
                        ))}
                    </div>
                </div>
                 <div className="pt-6 mt-6 border-t border-divider space-y-6">
                    <h4 className="text-md font-semibold text-text-primary">Deeper Characteristics <span className="text-text-secondary font-normal">(Optional)</span></h4>
                    <Textarea id="quirks" label="Quirks" value={persona.quirks} onChange={e => setPersona(p => ({...p, quirks: e.target.value}))} rows={2} placeholder="e.g., Tends to use analogies, often fidgets with a pen" />
                    <Textarea id="motivations" label="Motivations" value={persona.motivations} onChange={e => setPersona(p => ({...p, motivations: e.target.value}))} rows={2} placeholder="e.g., Driven by a desire for accuracy, wants to make complex topics accessible" />
                    <Input id="emotionalRange" label="Emotional Range" value={persona.emotionalRange} onChange={e => setPersona(p => ({...p, emotionalRange: e.target.value}))} placeholder="e.g., Calm and measured, excitable, prone to sarcasm" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-divider">
                    <Select id="sentence" label="Sentence Length" options={SENTENCE_LENGTHS} value={persona.speakingPatterns.sentenceLength} onChange={e => setPersona(p => ({...p, speakingPatterns: {...p.speakingPatterns, sentenceLength: e.target.value as SentenceLength}}))} />
                    <Select id="vocab" label="Vocabulary Complexity" options={VOCAB_COMPLEXITIES} value={persona.speakingPatterns.vocabularyComplexity} onChange={e => setPersona(p => ({...p, speakingPatterns: {...p.speakingPatterns, vocabularyComplexity: e.target.value as VocabComplexity}}))} />
                    <Select id="humor" label="Humor Level" options={HUMOR_LEVELS} value={persona.speakingPatterns.humorLevel} onChange={e => setPersona(p => ({...p, speakingPatterns: {...p.speakingPatterns, humorLevel: e.target.value as HumorLevel}}))} />
                </div>
                <div className="text-right">
                    <Button type="submit" leftIcon={<PlusIcon />}>Add Persona</Button>
                </div>
            </form>
        </Card>
    );
};

const PersonaBuilder: React.FC<PersonaBuilderProps> = ({ personas, setPersonas, onComplete }) => {
    const importFileInputRef = useRef<HTMLInputElement>(null);

    const addPersona = (persona: Omit<Persona, 'id' | 'sourceDocuments'>) => {
        setPersonas([...personas, { ...persona, id: `${Date.now()}`, sourceDocuments: [] }]);
    };

    const removePersona = (id: string) => {
        setPersonas(personas.filter(p => p.id !== id));
    };
    
    const updatePersona = (updatedPersona: Persona) => {
        setPersonas(personas.map(p => p.id === updatedPersona.id ? updatedPersona : p));
    };

    const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>, personaId: string) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.size > 1024 * 1024) { // 1MB limit
            alert("Image is too large. Please select an image under 1MB.");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const avatarUrl = e.target?.result as string;
            const personaToUpdate = personas.find(p => p.id === personaId);
            if (personaToUpdate) {
                updatePersona({ ...personaToUpdate, avatarUrl });
            }
        };
        reader.readAsDataURL(file);
        if (event.target) event.target.value = '';
    };

    const handleExportPersonas = () => {
        if (personas.length === 0) {
            alert("No personas to export.");
            return;
        }
        const dataStr = JSON.stringify(personas, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'script-craft-personas.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleImportClick = () => {
        importFileInputRef.current?.click();
    };

    const handleImportPersonas = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error("File content is not readable.");
                
                const imported = JSON.parse(text);

                if (!Array.isArray(imported)) throw new Error("Imported file is not a valid persona array.");

                const validNewPersonas = imported
                    .filter(p => p && typeof p === 'object' && p.name && p.role)
                    .map((p: any) => {
                        const { id, ...personaData } = p; // Remove existing ID to assign a new one
                        return {
                            ...emptyPersona,
                            ...personaData,
                            id: `${Date.now()}-${p.name.replace(/\s+/g, '-')}`, // Assign new unique ID
                            sourceDocuments: p.sourceDocuments || [],
                            avatarUrl: p.avatarUrl || undefined,
                        };
                    });

                if (validNewPersonas.length === 0 && imported.length > 0) {
                    throw new Error("No valid personas found in the file. Ensure each persona has a 'name' and 'role'.");
                }
                
                setPersonas(prev => [...prev, ...validNewPersonas]);
                alert(`${validNewPersonas.length} persona(s) imported successfully.`);

            } catch (error: any) {
                console.error("Failed to import personas:", error);
                alert(`Error importing file: ${error.message}`);
            } finally {
                if (event.target) event.target.value = '';
            }
        };
        reader.onerror = () => alert(`Error reading file: ${reader.error}`);
        reader.readAsText(file);
    };

    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-bold text-text-primary">Step 1: Define Personas & Sources</h2>
            <p className="text-text-secondary">Create at least two speaker personas. For each persona, you can add up to three source documents (e.g., .txt files) that the AI will use as their knowledge base.</p>

            <PersonaForm onAddPersona={addPersona} />
            
            <div className="flex justify-between items-center py-4 border-t border-b border-divider">
                <h3 className="text-xl font-semibold text-text-primary">Defined Personas ({personas.length})</h3>
                <div className="flex gap-2">
                    <input
                        type="file"
                        ref={importFileInputRef}
                        className="hidden"
                        accept=".json"
                        onChange={handleImportPersonas}
                    />
                    <Button variant="secondary" onClick={handleImportClick} leftIcon={<UploadIcon />}>
                        Import
                    </Button>
                    <Button variant="secondary" onClick={handleExportPersonas} leftIcon={<ArrowDownTrayIcon />} disabled={personas.length === 0}>
                        Export
                    </Button>
                </div>
            </div>
            
            {personas.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {personas.map(p => (
                        <Card key={p.id} className="flex flex-col">
                           <div className="flex items-start gap-4">
                                <div className="relative flex-shrink-0">
                                    {p.avatarUrl ? (
                                        <img src={p.avatarUrl} alt={p.name} className="h-16 w-16 rounded-full object-cover bg-bg-primary" />
                                    ) : (
                                        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-secondary text-2xl font-bold text-white">
                                            {p.name.charAt(0) || '?'}
                                        </span>
                                    )}
                                    <label htmlFor={`avatar-upload-${p.id}`} className="absolute -bottom-1 -right-1 flex items-center justify-center h-6 w-6 bg-bg-primary rounded-full cursor-pointer hover:bg-divider ring-2 ring-bg-secondary transition-colors" title="Upload Avatar">
                                        <UploadIcon className="w-4 h-4 text-text-secondary" />
                                        <input
                                            id={`avatar-upload-${p.id}`}
                                            type="file"
                                            className="sr-only"
                                            accept="image/png, image/jpeg, image/webp"
                                            onChange={(e) => handleAvatarChange(e, p.id)}
                                        />
                                    </label>
                                </div>
                                
                                <div className="flex-grow">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="text-lg font-bold text-accent-primary">{p.name}</h4>
                                            <p className="text-sm text-text-secondary font-medium">{p.role}</p>
                                        </div>
                                        <button onClick={() => removePersona(p.id)} className="text-gray-400 hover:text-red-400 transition-colors">
                                            <TrashIcon className="w-5 h-5"/>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 space-y-2 text-sm flex-grow">
                                <p><span className="font-semibold text-text-secondary">Style:</span> {p.communicationStyle}</p>
                                <p><span className="font-semibold text-text-secondary">Expertise:</span> {p.expertiseLevel}</p>
                                {p.quirks && <p><span className="font-semibold text-text-secondary">Quirks:</span> <span className="text-text-primary">{p.quirks}</span></p>}
                                {p.motivations && <p><span className="font-semibold text-text-secondary">Motivations:</span> <span className="text-text-primary">{p.motivations}</span></p>}
                                {p.emotionalRange && <p><span className="font-semibold text-text-secondary">Emotional Range:</span> <span className="text-text-primary">{p.emotionalRange}</span></p>}

                                <div className="flex flex-wrap gap-1 pt-1">
                                    {p.personalityTraits.slice(0, 3).map(t => <span key={t} className="bg-bg-primary text-xs font-medium px-2 py-1 rounded-full">{t}</span>)}
                                    {p.personalityTraits.length > 3 && <span className="bg-bg-primary text-xs font-medium px-2 py-1 rounded-full">+{p.personalityTraits.length-3} more</span>}
                                </div>
                            </div>

                            <div className="mt-auto">
                               <PersonaSources persona={p} onUpdatePersona={updatePersona} />
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8 bg-bg-secondary rounded-lg">
                    <p className="text-text-secondary">No personas defined yet.</p>
                    <p className="text-sm text-text-secondary mt-2">Create a new persona above or import a list.</p>
                </div>
            )}


            <div className="flex justify-end pt-4">
                <Button onClick={onComplete} disabled={personas.length < 2} rightIcon={<ArrowRightIcon />}>
                    Next: Define Show Flow
                </Button>
            </div>
        </div>
    );
};

export default PersonaBuilder;