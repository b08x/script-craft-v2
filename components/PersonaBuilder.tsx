import React, { useState, useRef, useMemo } from 'react';
import { Persona, CommunicationStyle, ExpertiseLevel, SentenceLength, VocabComplexity, HumorLevel, SourceDocument, ContextFile, PersonaAnalysisResult } from '../types';
import { COMMUNICATION_STYLES, EXPERTISE_LEVELS, SENTENCE_LENGTHS, VOCAB_COMPLEXITIES, HUMOR_LEVELS, PERSONALITY_TRAIT_OPTIONS } from '../constants';
import Button from './common/Button';
import Card from './common/Card';
import Input from './common/Input';
import Select from './common/Select';
import Textarea from './common/Textarea';
import { PlusIcon, TrashIcon, ArrowRightIcon, UploadIcon, ArrowDownTrayIcon, DocumentIcon, VideoCameraIcon, MusicalNoteIcon, MicrophoneIcon, SparklesIcon } from './icons/Icons';
import AudioAnalysisModal from './AudioAnalysisModal';
import { analyzeDocumentsForPersona, processDocument } from '../services/geminiService';
import Loader from './common/Loader';

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
  backstory: '',
  emotionalRange: '',
  speakingPatterns: {
    sentenceLength: SentenceLength.MEDIUM,
    vocabularyComplexity: VocabComplexity.AVERAGE,
    humorLevel: HumorLevel.SUBTLE,
    commonPauses: '',
    fillerWords: '',
    speechImpediments: '',
  },
};

const PersonaSources: React.FC<{
  persona: Persona;
  onUpdatePersona: (updatedPersona: Persona) => void;
}> = ({ persona, onUpdatePersona }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [selectedDocForDetails, setSelectedDocForDetails] = useState<SourceDocument | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (persona.sourceDocuments.length + files.length > 3) {
      alert("You can upload a maximum of 3 documents per persona.");
      return;
    }

    setIsUploading(true);
    const newDocuments: SourceDocument[] = [...persona.sourceDocuments];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file) continue;
      
      const tempId = `${Date.now()}-${file.name}`;
      
      // Add placeholder state
      const placeholderDoc: SourceDocument = {
          id: tempId,
          name: file.name,
          content: '',
          processingStatus: 'processing'
      };
      
      try {
          // Optimistically update state would happen here in a real redux loop, 
          // but we just wait for processing to finish before updating local component state 
          // to avoid complex management in this simple parent-child setup.
          const processedData = await processDocument(file);
          newDocuments.push({
              id: tempId,
              name: file.name,
              content: processedData.content || '',
              metadata: processedData.metadata,
              chunks: processedData.chunks,
              topics: processedData.topics,
              processingStatus: 'completed'
          });
      } catch (error: any) {
          console.error("Error processing file:", error);
           newDocuments.push({
              id: tempId,
              name: file.name,
              content: '',
              processingStatus: 'error',
              errorMessage: error.message
          });
      }
    }

    onUpdatePersona({ ...persona, sourceDocuments: newDocuments });
    setIsUploading(false);
    event.target.value = '';
  };

  const removeDocument = (docId: string) => {
    const updatedDocs = persona.sourceDocuments.filter(doc => doc.id !== docId);
    onUpdatePersona({ ...persona, sourceDocuments: updatedDocs });
  };
  
  const getStatusIcon = (status: string) => {
      switch(status) {
          case 'processing': return <span className="animate-spin h-3 w-3 rounded-full border-2 border-accent-primary border-t-transparent mr-2"></span>;
          case 'error': return <span className="text-red-500 mr-2 text-xs">⚠️</span>;
          case 'completed': return <span className="text-green-500 mr-2 text-xs">✓</span>;
          default: return null;
      }
  }

  // Cross-document clustering and visualization
  const aggregatedTopics = useMemo(() => {
    const allTopics = new Set<string>();
    persona.sourceDocuments.forEach(doc => {
        if (doc.topics) doc.topics.forEach(t => allTopics.add(t));
    });
    return Array.from(allTopics);
  }, [persona.sourceDocuments]);

  // Simple heuristic for consistency: Do documents share *any* topics?
  // Only applicable if we have > 1 document.
  const consistencyWarning = useMemo(() => {
      if (persona.sourceDocuments.length < 2) return null;
      
      const docsWithTopics = persona.sourceDocuments.filter(d => d.topics && d.topics.length > 0);
      if (docsWithTopics.length < 2) return null;

      // Check intersection between first doc and others (simplified check)
      const baseTopics = new Set(docsWithTopics[0].topics);
      let hasOverlap = false;
      
      for (let i = 1; i < docsWithTopics.length; i++) {
          const currentTopics = docsWithTopics[i].topics || [];
          if (currentTopics.some(t => baseTopics.has(t))) {
              hasOverlap = true;
              break;
          }
      }
      
      // If we looked at >1 docs and found NO overlap, return warning
      return hasOverlap ? null : "Sources appear to cover disjointed topics.";
  }, [persona.sourceDocuments]);


  return (
    <div className="mt-4 pt-4 border-t border-divider">
      <h5 className="text-sm font-semibold text-text-primary mb-2">Knowledge Base ({persona.sourceDocuments.length}/3)</h5>
      
      {/* Topic Cluster */}
      {aggregatedTopics.length > 0 && (
          <div className="mb-3">
              <p className="text-xs text-text-secondary mb-1">Detected Themes:</p>
              <div className="flex flex-wrap gap-1">
                  {aggregatedTopics.slice(0, 8).map(topic => (
                      <span key={topic} className="bg-bg-primary border border-divider text-[10px] px-2 py-0.5 rounded-full text-text-secondary">
                          {topic}
                      </span>
                  ))}
                  {aggregatedTopics.length > 8 && (
                      <span className="text-[10px] text-text-secondary px-1 self-center">+{aggregatedTopics.length - 8} more</span>
                  )}
              </div>
          </div>
      )}

      {consistencyWarning && (
          <div className="mb-3 p-2 bg-yellow-900/20 border border-yellow-700/50 rounded text-xs text-yellow-500">
              ⚠️ {consistencyWarning} Consider checking if these documents belong to the same persona.
          </div>
      )}

      <div className="space-y-2">
        {persona.sourceDocuments.map(doc => (
          <div key={doc.id} className="bg-bg-primary p-2 rounded-md text-left transition-colors hover:bg-bg-secondary group">
             <div className="flex items-center justify-between cursor-pointer" onClick={() => setSelectedDocForDetails(doc)}>
                <div className="flex items-center overflow-hidden">
                    {getStatusIcon(doc.processingStatus)}
                    <p className="text-xs text-text-secondary truncate pr-2" title={doc.name}>{doc.name}</p>
                </div>
                <div className="flex items-center">
                    <button onClick={(e) => { e.stopPropagation(); removeDocument(doc.id); }} className="text-gray-500 hover:text-red-400 flex-shrink-0">
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
            {doc.metadata && (
                <div className="mt-1 flex gap-2 text-[10px] text-text-secondary opacity-75">
                    {doc.metadata.author && <span>Auth: {doc.metadata.author}</span>}
                    {doc.chunks && <span>• {doc.chunks.length} chunks</span>}
                    <span className="hidden group-hover:inline text-accent-primary ml-auto text-[9px]">View Details</span>
                </div>
            )}
             {doc.processingStatus === 'error' && <p className="text-[10px] text-red-400 mt-1">{doc.errorMessage || 'Processing failed'}</p>}
          </div>
        ))}
      </div>
      
      {persona.sourceDocuments.length < 3 && (
        <div className="mt-3">
            {isUploading ? (
                <div className="text-xs text-text-secondary text-center py-2">Processing documents...</div>
            ) : (
              <>
                  <label
                    htmlFor={`file-upload-${persona.id}`}
                    className="w-full flex justify-center items-center px-4 py-2 border-2 border-dashed border-divider rounded-md cursor-pointer hover:border-accent-primary transition-colors"
                  >
                    <UploadIcon className="w-5 h-5 text-text-secondary mr-2"/>
                    <span className="text-sm font-medium text-text-secondary">Add Document (PDF, Word, Text)</span>
                  </label>
                  <input
                    id={`file-upload-${persona.id}`}
                    name={`file-upload-${persona.id}`}
                    type="file"
                    className="sr-only"
                    accept=".txt,.md,.pdf,.docx,.doc"
                    onChange={handleFileChange}
                    multiple
                  />
              </>
            )}
        </div>
      )}

      {/* Document Details Modal */}
      {selectedDocForDetails && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-bg-secondary rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col">
                  <div className="p-4 border-b border-divider flex justify-between items-center">
                      <h4 className="font-semibold text-text-primary truncate">{selectedDocForDetails.name}</h4>
                      <button onClick={() => setSelectedDocForDetails(null)} className="text-text-secondary hover:text-white">&times;</button>
                  </div>
                  <div className="p-4 overflow-y-auto space-y-4">
                      <div>
                          <h5 className="text-xs font-bold text-text-secondary uppercase mb-1">Metadata</h5>
                          <pre className="text-xs text-text-primary bg-bg-primary p-2 rounded overflow-auto">
                              {JSON.stringify(selectedDocForDetails.metadata, null, 2)}
                          </pre>
                      </div>
                      {selectedDocForDetails.topics && (
                          <div>
                            <h5 className="text-xs font-bold text-text-secondary uppercase mb-1">Extracted Topics</h5>
                            <div className="flex flex-wrap gap-1">
                                {selectedDocForDetails.topics.map(t => (
                                    <span key={t} className="bg-bg-primary text-[10px] px-2 py-1 rounded text-accent-primary">{t}</span>
                                ))}
                            </div>
                          </div>
                      )}
                      {selectedDocForDetails.chunks && (
                          <div>
                              <h5 className="text-xs font-bold text-text-secondary uppercase mb-1">Semantic Chunks ({selectedDocForDetails.chunks.length})</h5>
                              <div className="space-y-2">
                                  {selectedDocForDetails.chunks.slice(0, 5).map((chunk, idx) => (
                                      <div key={idx} className="bg-bg-primary p-2 rounded text-xs border border-divider">
                                          <p className="text-text-secondary mb-1 font-mono text-[9px]">Topics: {chunk.topics.join(', ')}</p>
                                          <p className="text-text-primary line-clamp-2">{chunk.content}</p>
                                      </div>
                                  ))}
                                  {selectedDocForDetails.chunks.length > 5 && (
                                      <p className="text-xs text-center text-text-secondary italic">...and {selectedDocForDetails.chunks.length - 5} more chunks.</p>
                                  )}
                              </div>
                          </div>
                      )}
                  </div>
                  <div className="p-4 border-t border-divider text-right">
                      <Button variant="secondary" onClick={() => setSelectedDocForDetails(null)}>Close</Button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};


const PersonaForm: React.FC<{ onAddPersona: (persona: Omit<Persona, 'id' | 'sourceDocuments'>, documents: SourceDocument[]) => void }> = ({ onAddPersona }) => {
    const [persona, setPersona] = useState(emptyPersona);
    const [sourceDocuments, setSourceDocuments] = useState<SourceDocument[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisError, setAnalysisError] = useState<string | null>(null);
    const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);


    const handleTraitToggle = (trait: string) => {
        setPersona(p => ({
            ...p,
            personalityTraits: p.personalityTraits.includes(trait)
                ? p.personalityTraits.filter(t => t !== trait)
                : [...p.personalityTraits, trait]
        }));
    };

    const handleAnalysisComplete = (analysis: PersonaAnalysisResult) => {
        setPersona(prev => {
            const newTraits = analysis.personalityTraits && analysis.personalityTraits.length > 0
                ? [...new Set([...prev.personalityTraits, ...analysis.personalityTraits])]
                : prev.personalityTraits;
            
            const mergedSpeakingPatterns = {
                ...prev.speakingPatterns,
                ...(analysis.speakingPatterns || {}),
            };
    
            return {
                ...prev,
                name: analysis.name || prev.name,
                role: analysis.role || prev.role,
                communicationStyle: analysis.communicationStyle || prev.communicationStyle,
                expertiseLevel: analysis.expertiseLevel || prev.expertiseLevel,
                personalityTraits: newTraits,
                quirks: analysis.quirks || prev.quirks,
                motivations: analysis.motivations || prev.motivations,
                backstory: analysis.backstory || prev.backstory,
                emotionalRange: analysis.emotionalRange || prev.emotionalRange,
                speakingPatterns: mergedSpeakingPatterns
            };
        });
        setIsAudioModalOpen(false);
    };

    const handleContextFileChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        setFileCallback: (file: ContextFile) => void,
        allowedTypes: string,
        maxSizeMB: number
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > maxSizeMB * 1024 * 1024) {
            alert(`File is too large. Please select a file under ${maxSizeMB}MB.`);
            e.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const data = event.target?.result as string;
            setFileCallback({
                name: file.name,
                type: file.type,
                data: data,
            });
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const handleSourceDocChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;
    
        setIsUploading(true);
        const newDocuments: SourceDocument[] = [...sourceDocuments];
    
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          if (!file) continue;
          
          const tempId = `${Date.now()}-${file.name}`;
          
          // Optimistic UI
          newDocuments.push({
             id: tempId,
             name: file.name,
             content: '',
             processingStatus: 'processing'
          });
          setSourceDocuments([...newDocuments]); // Force update to show loading state

          try {
            const processed = await processDocument(file);
             // Find and update
             const index = newDocuments.findIndex(d => d.id === tempId);
             if (index !== -1) {
                 newDocuments[index] = {
                     id: tempId,
                     name: file.name,
                     content: processed.content || '',
                     metadata: processed.metadata,
                     chunks: processed.chunks,
                     topics: processed.topics,
                     processingStatus: 'completed'
                 };
             }
          } catch (error: any) {
            console.error("Error processing file:", error);
             const index = newDocuments.findIndex(d => d.id === tempId);
             if (index !== -1) {
                 newDocuments[index] = {
                     ...newDocuments[index],
                     processingStatus: 'error',
                     errorMessage: error.message
                 };
             }
          }
        }
    
        setSourceDocuments(newDocuments);
        setIsUploading(false);
        event.target.value = '';
      };

    const removeSourceDoc = (docId: string) => {
        setSourceDocuments(docs => docs.filter(doc => doc.id !== docId));
    };

    const handleAnalyzeDocuments = async () => {
        // Filter only completed docs
        const completedDocs = sourceDocuments.filter(d => d.processingStatus === 'completed');
        if (completedDocs.length === 0) return;
        
        setIsAnalyzing(true);
        setAnalysisError(null);
        try {
            const analysis = await analyzeDocumentsForPersona(completedDocs);
            handleAnalysisComplete(analysis);
        } catch (e: any) {
            setAnalysisError(e.message || "An unknown error occurred.");
        } finally {
            setIsAnalyzing(false);
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(persona.name && persona.role) {
            // Only allow valid docs? or all? Assuming all so user can retry errors if they want, but usually better to filter.
            const validDocs = sourceDocuments.filter(d => d.processingStatus === 'completed');
            onAddPersona(persona, validDocs);
            setPersona(emptyPersona);
            setSourceDocuments([]);
            setAnalysisError(null);
        }
    };
    
    const getStatusIcon = (status: string) => {
      switch(status) {
          case 'processing': return <span className="animate-spin h-3 w-3 rounded-full border-2 border-accent-primary border-t-transparent mr-2"></span>;
          case 'error': return <span className="text-red-500 mr-2 text-xs">⚠️</span>;
          case 'completed': return <span className="text-green-500 mr-2 text-xs">✓</span>;
          default: return null;
      }
    }

    return (
        <Card>
            <AudioAnalysisModal
                isOpen={isAudioModalOpen}
                onClose={() => setIsAudioModalOpen(false)}
                onAnalysisComplete={handleAnalysisComplete}
            />
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex flex-wrap justify-between items-center gap-4">
                    <h3 className="text-xl font-semibold text-text-primary">Create New Persona</h3>
                    <Button type="button" variant="secondary" leftIcon={<MicrophoneIcon />} onClick={() => setIsAudioModalOpen(true)}>
                        Analyze from Audio
                    </Button>
                </div>

                <div className="p-4 rounded-lg bg-bg-primary space-y-3 border border-divider">
                    <h4 className="text-md font-semibold text-text-primary">Create from Documents</h4>
                    <p className="text-sm text-text-secondary">Upload documents (PDF, Word, Text) to have the AI analyze them and auto-fill the persona details below.</p>

                    <div className="space-y-2">
                        {sourceDocuments.map(doc => (
                        <div key={doc.id} className="bg-bg-secondary p-2 rounded-md text-left">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center overflow-hidden">
                                    {getStatusIcon(doc.processingStatus)}
                                    <p className="text-xs text-text-secondary truncate pr-2" title={doc.name}>{doc.name}</p>
                                </div>
                                <button onClick={() => removeSourceDoc(doc.id)} className="text-gray-500 hover:text-red-400 flex-shrink-0">
                                <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                            {doc.processingStatus === 'error' && <p className="text-[10px] text-red-400 mt-1">{doc.errorMessage || 'Processing failed'}</p>}
                            {doc.metadata && (
                                <div className="mt-1 flex gap-2 text-[10px] text-text-secondary opacity-75">
                                    {doc.metadata.author && <span>Auth: {doc.metadata.author}</span>}
                                    {doc.chunks && <span>Chunks: {doc.chunks.length}</span>}
                                </div>
                            )}
                        </div>
                        ))}
                    </div>

                    <label htmlFor="doc-upload" className={`w-full flex justify-center items-center px-4 py-2 border-2 border-dashed border-divider rounded-md cursor-pointer hover:border-accent-primary transition-colors ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                        <UploadIcon className="w-5 h-5 text-text-secondary mr-2"/>
                        <span className="text-sm font-medium text-text-secondary">{isUploading ? 'Uploading & Processing...' : 'Add Document(s)'}</span>
                    </label>
                    <input id="doc-upload" type="file" className="sr-only" onChange={handleSourceDocChange} multiple accept=".txt,.md,.pdf,.docx,.doc" disabled={isUploading} />

                    {sourceDocuments.length > 0 && !isAnalyzing && !isUploading && (
                        <div className="pt-2">
                            <Button type="button" onClick={handleAnalyzeDocuments} disabled={isAnalyzing || sourceDocuments.every(d => d.processingStatus !== 'completed')} leftIcon={<SparklesIcon />}>
                                Analyze & Auto-fill Form
                            </Button>
                        </div>
                    )}
                    {isAnalyzing && <Loader text="Analyzing documents..." />}
                    {analysisError && <div className="text-red-400 text-sm mt-2">{analysisError}</div>}
                </div>

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
                    <Textarea id="backstory" label="Backstory" value={persona.backstory} onChange={e => setPersona(p => ({...p, backstory: e.target.value}))} rows={3} placeholder="e.g., Grew up in a small town, which sparked a lifelong interest in community-driven technology." />
                    <Input id="emotionalRange" label="Emotional Range" value={persona.emotionalRange} onChange={e => setPersona(p => ({...p, emotionalRange: e.target.value}))} placeholder="e.g., Calm and measured, excitable, prone to sarcasm" />
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Context (Audio/Video)</label>
                        {!persona.deeperCharsContextFile ? (
                             <label htmlFor="deeper-chars-upload" className="w-full flex justify-center items-center px-4 py-2 border-2 border-dashed border-divider rounded-md cursor-pointer hover:border-accent-primary transition-colors">
                                <UploadIcon className="w-5 h-5 text-text-secondary mr-2"/>
                                <span className="text-sm font-medium text-text-secondary">Upload Audio/Video (max 10MB)</span>
                            </label>
                        ) : (
                             <div className="flex items-center justify-between bg-bg-primary p-2 rounded-md text-left">
                                <p className="text-xs text-text-secondary truncate pr-2" title={persona.deeperCharsContextFile.name}>{persona.deeperCharsContextFile.name}</p>
                                <button type="button" onClick={() => setPersona(p => ({...p, deeperCharsContextFile: undefined}))} className="text-gray-500 hover:text-red-400 flex-shrink-0">
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                        <input id="deeper-chars-upload" type="file" className="sr-only" accept="audio/*,video/*" onChange={e => handleContextFileChange(e, (file) => setPersona(p => ({...p, deeperCharsContextFile: file})), "audio/*,video/*", 10)} />
                    </div>
                </div>
                <div className="pt-6 border-t border-divider space-y-6">
                    <h4 className="text-md font-semibold text-text-primary">Speaking Patterns</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Select id="sentence" label="Sentence Length" options={SENTENCE_LENGTHS} value={persona.speakingPatterns.sentenceLength} onChange={e => setPersona(p => ({...p, speakingPatterns: {...p.speakingPatterns, sentenceLength: e.target.value as SentenceLength}}))} />
                        <Select id="vocab" label="Vocabulary Complexity" options={VOCAB_COMPLEXITIES} value={persona.speakingPatterns.vocabularyComplexity} onChange={e => setPersona(p => ({...p, speakingPatterns: {...p.speakingPatterns, vocabularyComplexity: e.target.value as VocabComplexity}}))} />
                        <Select id="humor" label="Humor Level" options={HUMOR_LEVELS} value={persona.speakingPatterns.humorLevel} onChange={e => setPersona(p => ({...p, speakingPatterns: {...p.speakingPatterns, humorLevel: e.target.value as HumorLevel}}))} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                        <Input id="pauses" label="Common Pauses (Optional)" value={persona.speakingPatterns.commonPauses} onChange={e => setPersona(p => ({...p, speakingPatterns: {...p.speakingPatterns, commonPauses: e.target.value }}))} placeholder="e.g., Uses '...' often" />
                        <Input id="fillers" label="Filler Words (Optional)" value={persona.speakingPatterns.fillerWords} onChange={e => setPersona(p => ({...p, speakingPatterns: {...p.speakingPatterns, fillerWords: e.target.value }}))} placeholder="e.g., 'um', 'like', 'you know'" />
                        <Input id="impediments" label="Speech Impediments (Optional)" value={persona.speakingPatterns.speechImpediments} onChange={e => setPersona(p => ({...p, speakingPatterns: {...p.speakingPatterns, speechImpediments: e.target.value }}))} placeholder="e.g., Slight stutter on 's'" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Context (Text/PDF)</label>
                        {!persona.speakingPatterns.speakingContextFile ? (
                             <label htmlFor="speaking-context-upload" className="w-full flex justify-center items-center px-4 py-2 border-2 border-dashed border-divider rounded-md cursor-pointer hover:border-accent-primary transition-colors">
                                <UploadIcon className="w-5 h-5 text-text-secondary mr-2"/>
                                <span className="text-sm font-medium text-text-secondary">Upload Document (max 2MB)</span>
                            </label>
                        ) : (
                             <div className="flex items-center justify-between bg-bg-primary p-2 rounded-md text-left">
                                <p className="text-xs text-text-secondary truncate pr-2" title={persona.speakingPatterns.speakingContextFile.name}>{persona.speakingPatterns.speakingContextFile.name}</p>
                                <button type="button" onClick={() => setPersona(p => ({...p, speakingPatterns: {...p.speakingPatterns, speakingContextFile: undefined}}))} className="text-gray-500 hover:text-red-400 flex-shrink-0">
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                        <input id="speaking-context-upload" type="file" className="sr-only" accept=".md,.txt,.html,.pdf" onChange={e => handleContextFileChange(e, (file) => setPersona(p => ({...p, speakingPatterns: {...p.speakingPatterns, speakingContextFile: file}})), ".md,.txt,.html,.pdf", 2)} />
                    </div>
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

    const addPersona = (persona: Omit<Persona, 'id' | 'sourceDocuments'>, documents: SourceDocument[]) => {
        setPersonas([...personas, { ...persona, id: `${Date.now()}`, sourceDocuments: documents }]);
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
                            id: `${Date.now()}-${p.name.replace(/\s+/g, '-')}`,
                            sourceDocuments: p.sourceDocuments || [],
                            avatarUrl: p.avatarUrl || undefined,
                            speakingPatterns: {
                                ...emptyPersona.speakingPatterns,
                                ...(personaData.speakingPatterns || {}),
                            },
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
    
    const renderContextFile = (file: ContextFile) => {
        const fileType = file.type.split('/')[0];
        let icon = <DocumentIcon className="w-4 h-4 text-text-secondary mr-1.5" />;
        if (fileType === 'video') {
            icon = <VideoCameraIcon className="w-4 h-4 text-text-secondary mr-1.5" />;
        } else if (fileType === 'audio') {
            icon = <MusicalNoteIcon className="w-4 h-4 text-text-secondary mr-1.5" />;
        }
        
        return (
             <div className="flex items-center text-xs bg-bg-primary p-1.5 rounded-md mt-2" title={file.name}>
                {icon}
                <span className="truncate text-text-secondary">{file.name}</span>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-bold text-text-primary">Step 1: Define Personas & Sources</h2>
            <p className="text-text-secondary">Create at least two speaker personas. For each persona, you can add up to three source documents that the AI will use as their knowledge base.</p>

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
                                {p.backstory && <p><span className="font-semibold text-text-secondary">Backstory:</span> <span className="text-text-primary">{p.backstory}</span></p>}
                                {p.emotionalRange && <p><span className="font-semibold text-text-secondary">Emotional Range:</span> <span className="text-text-primary">{p.emotionalRange}</span></p>}
                                {p.deeperCharsContextFile && renderContextFile(p.deeperCharsContextFile)}
                                
                                {p.speakingPatterns.commonPauses && <p><span className="font-semibold text-text-secondary">Pauses:</span> <span className="text-text-primary">{p.speakingPatterns.commonPauses}</span></p>}
                                {p.speakingPatterns.fillerWords && <p><span className="font-semibold text-text-secondary">Fillers:</span> <span className="text-text-primary">{p.speakingPatterns.fillerWords}</span></p>}
                                {p.speakingPatterns.speechImpediments && <p><span className="font-semibold text-text-secondary">Impediments:</span> <span className="text-text-primary">{p.speakingPatterns.speechImpediments}</span></p>}
                                {p.speakingPatterns.speakingContextFile && renderContextFile(p.speakingPatterns.speakingContextFile)}


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