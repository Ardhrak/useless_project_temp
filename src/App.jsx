import React, { useState, useEffect } from 'react';
import { Sparkles, RotateCcw, AlertCircle, Tag, FileText, Lightbulb } from 'lucide-react';
import "./App.css";




const MinimalisticDramaGenerator = () => {
  const [scenario, setScenario] = useState('');
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [themeAnalysis, setThemeAnalysis] = useState(null);
  const [dramaScript, setDramaScript] = useState('');
  const [loading, setLoading] = useState(false);
  const [analyzingTheme, setAnalyzingTheme] = useState(false);
  const [error, setError] = useState(null);

  // Get API key from environment
  //const apiKey = "AIzaSyDPKPPxWJjGIRdM6g7e9R8jNDjWSFht8F4";
  // const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  console.log(apiKey)

  useEffect(() => {
    if (!apiKey) {
      setError('Gemini API key not found. Please add REACT_APP_GEMINI_API_KEY to your .env file');
    }
  }, [apiKey]);

  // Drama themes and their characteristics
  const dramaThemes = {
    'romantic': {
      name: 'Romantic Drama',
      description: 'Love, relationships, heartbreak, and emotional connections',
      scriptElements: ['dialogue-heavy scenes', 'emotional monologues', 'intimate conversations', 'romantic tension']
    },
    'family': {
      name: 'Family Drama',
      description: 'Family conflicts, generational gaps, loyalty, and household dynamics',
      scriptElements: ['family confrontations', 'dinner table scenes', 'generational dialogue', 'sibling rivalry']
    },
    'friendship': {
      name: 'Friendship Drama',
      description: 'Loyalty, betrayal, growing apart, and social dynamics',
      scriptElements: ['group conversations', 'loyalty tests', 'confrontation scenes', 'reconciliation moments']
    },
    'workplace': {
      name: 'Workplace Drama',
      description: 'Professional conflicts, ambition, competition, and office politics',
      scriptElements: ['boardroom scenes', 'performance reviews', 'office confrontations', 'career dilemmas']
    },
    'school': {
      name: 'School/Academic Drama',
      description: 'Academic pressure, social hierarchies, coming-of-age conflicts',
      scriptElements: ['classroom scenes', 'hallway confrontations', 'study group dynamics', 'teacher-student interactions']
    },
    'social': {
      name: 'Social Drama',
      description: 'Social status, reputation, community conflicts, and public perception',
      scriptElements: ['public confrontations', 'social media scenarios', 'reputation management', 'community meetings']
    }
  };

  // Feature categories for script enhancement
  const scriptFeatures = {
    'Format': [
      { id: 'dialogue_heavy', label: 'Dialogue-heavy scenes' },
      { id: 'monologue', label: 'Dramatic monologues' },
      { id: 'ensemble', label: 'Ensemble cast scenes' },
      { id: 'two_person', label: 'Intimate two-person scenes' }
    ],
    'Dramatic Elements': [
      { id: 'revelation', label: 'Major revelation scene' },
      { id: 'confrontation', label: 'Heated confrontation' },
      { id: 'reconciliation', label: 'Emotional reconciliation' },
      { id: 'climax', label: 'Dramatic climax' }
    ],
    'Script Style': [
      { id: 'realistic', label: 'Realistic dialogue' },
      { id: 'theatrical', label: 'Theatrical/heightened' },
      { id: 'naturalistic', label: 'Naturalistic conversations' },
      { id: 'poetic', label: 'Poetic/lyrical language' }
    ]
  };

  const handleFeatureToggle = (featureId) => {
    setSelectedFeatures(prev => 
      prev.includes(featureId)
        ? prev.filter(id => id !== featureId)
        : [...prev, featureId]
    );
  };

  // Call Gemini API for theme analysis
  const analyzeTheme = async (scenario) => {
    if (!apiKey) {
      throw new Error('API key not available');
    }

    const prompt = `Analyze this drama scenario and determine its primary theme and characteristics:

Scenario: "${scenario}"

Please provide a JSON response with the following structure:
{
  "primaryTheme": "one of: romantic, family, friendship, workplace, school, social",
  "secondaryThemes": ["array of other relevant themes"],
  "dramaticElements": ["key dramatic elements present"],
  "suggestedTone": "dramatic tone (e.g., intense, melancholic, suspenseful, etc.)",
  "targetAudience": "suggested target audience",
  "conflictType": "type of conflict (interpersonal, internal, societal, etc.)",
  "settingImplications": "what the setting suggests for the drama"
}

Be specific and analytical. Focus on what makes this scenario dramatically compelling.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API Error: ${errorData.error?.message || 'Failed to analyze theme'}`);
    }

    const data = await response.json();
    const responseText = data.candidates[0].content.parts[0].text;
    
    // Parse JSON response
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('JSON parsing failed, using text response');
    }
    
    return { rawAnalysis: responseText };
  };

  // Generate drama script based on theme and features
  const generateScript = async () => {
    if (!apiKey) {
      throw new Error('API key not available');
    }

    const selectedFeatureLabels = selectedFeatures.map(featureId => {
      const allFeatures = Object.values(scriptFeatures).flat();
      return allFeatures.find(f => f.id === featureId)?.label;
    }).filter(Boolean);

    const themeInfo = themeAnalysis?.primaryTheme ? dramaThemes[themeAnalysis.primaryTheme] : null;

    let prompt = `Create a compelling drama script based on this analyzed scenario:

Original Scenario: "${scenario}"

Theme Analysis:
${themeAnalysis ? `
- Primary Theme: ${themeInfo?.name || themeAnalysis.primaryTheme}
- Dramatic Elements: ${themeAnalysis.dramaticElements?.join(', ')}
- Tone: ${themeAnalysis.suggestedTone}
- Conflict Type: ${themeAnalysis.conflictType}
` : 'Theme analysis not available'}

Script Requirements:
- Format: Professional screenplay format with character names, dialogue, and stage directions
- Length: 3-5 scenes or 800-1200 words
- Include realistic character development and progression
- Build dramatic tension naturally
`;

    if (selectedFeatureLabels.length > 0) {
      prompt += `- Incorporate these specific elements: ${selectedFeatureLabels.join(', ')}
`;
    }

    if (themeInfo) {
      prompt += `- Include theme-appropriate elements: ${themeInfo.scriptElements.join(', ')}
`;
    }

    prompt += `
Please write a complete, performable script with:
1. Character names in ALL CAPS
2. Stage directions in (parentheses)
3. Natural, believable dialogue
4. Clear scene breaks
5. Dramatic arc with setup, conflict, and resolution/cliffhanger

Focus on authenticity and emotional depth.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API Error: ${errorData.error?.message || 'Failed to generate script'}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  };

  // Analyze theme first, then generate script
  const handleAnalyzeAndGenerate = async () => {
    if (!scenario.trim()) {
      setError('Please enter a scenario first');
      return;
    }

    setError(null);
    setAnalyzingTheme(true);

    try {
      // Step 1: Analyze theme
      const analysis = await analyzeTheme(scenario);
      setThemeAnalysis(analysis);
      
      setAnalyzingTheme(false);
      setLoading(true);

      // Step 2: Generate script based on theme
      const script = await generateScript();
      setDramaScript(script);
      
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Failed to process your request');
    } finally {
      setAnalyzingTheme(false);
      setLoading(false);
    }
  };

  const resetAll = () => {
    setScenario('');
    setSelectedFeatures([]);
    setThemeAnalysis(null);
    setDramaScript('');
    setError(null);
  };

  return (
    <div className="app-container">
      <div className="main-wrapper">
        {/* Header */}
        <div className="header">
          <h1 className="main-title">CHAI WAALA</h1>
          <p className="subtitle">Drop Your Ingredients Here...We Will Cook The TEA</p>
        </div>

        <div className="grid-layout">
          {/* Input Section */}
          <div className="input-section">
            {/* Scenario Input */}
            <div className="card">
              <h2 className="section-title">Enter Your Drama Scenario</h2>
              <textarea
                value={scenario}
                onChange={(e) => setScenario(e.target.value)}
                placeholder="Describe your drama scenario in detail... e.g., 'A successful lawyer discovers their best friend has been secretly dating their ex-spouse for months, and they all have to work together on a high-profile case.'"
                className="scenario-textarea"
                maxLength={800}
                rows={4}
              />
              <div className="character-count">
                {scenario.length}/800 characters
              </div>
            </div>

            {/* Theme Analysis Results */}
            {themeAnalysis && (
              <div className="card theme-analysis">
                <h2 className="section-title">
                  <Tag className="section-icon" />
                  Theme Analysis
                </h2>
                <div className="theme-results">
                  <div className="primary-theme">
                    <strong>Primary Theme:</strong> {dramaThemes[themeAnalysis.primaryTheme]?.name || themeAnalysis.primaryTheme}
                  </div>
                  {themeAnalysis.dramaticElements && (
                    <div className="dramatic-elements">
                      <strong>Key Elements:</strong> {themeAnalysis.dramaticElements.join(', ')}
                    </div>
                  )}
                  {themeAnalysis.suggestedTone && (
                    <div className="suggested-tone">
                      <strong>Suggested Tone:</strong> {themeAnalysis.suggestedTone}
                    </div>
                  )}
                  {themeAnalysis.conflictType && (
                    <div className="conflict-type">
                      <strong>Conflict Type:</strong> {themeAnalysis.conflictType}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Script Features Selection */}
            <div className="card">
              <div className="features-header">
                <h2 className="section-title">Script Enhancement Features</h2>
                <span className="selected-count">
                  {selectedFeatures.length} selected
                </span>
              </div>

              <div className="features-container">
                {Object.entries(scriptFeatures).map(([category, features]) => (
                  <div key={category} className="feature-category">
                    <h3 className="category-title">
                      {category}
                    </h3>
                    <div className="features-grid">
                      {features.map((feature) => (
                        <label
                          key={feature.id}
                          className="feature-checkbox"
                        >
                          <input
                            type="checkbox"
                            checked={selectedFeatures.includes(feature.id)}
                            onChange={() => handleFeatureToggle(feature.id)}
                            className="checkbox-input"
                          />
                          <span className="checkbox-label">{feature.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="error-message">
                <AlertCircle className="error-icon" />
                <span>{error}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="button-container">
              <button
                onClick={handleAnalyzeAndGenerate}
                disabled={analyzingTheme || loading || !scenario.trim() || !apiKey}
                className={`generate-btn ${(analyzingTheme || loading) ? 'loading' : ''}`}
              >
                {analyzingTheme ? (
                  <>
                    <div className="loading-spinner"></div>
                    Analyzing Theme...
                  </>
                ) : loading ? (
                  <>
                    <div className="loading-spinner"></div>
                    Generating Script...
                  </>
                ) : (
                  <>
                    <Lightbulb className="btn-icon" />
                    Analyze Theme & Generate Script
                  </>
                )}
              </button>
              
              <button
                onClick={resetAll}
                className="reset-btn"
              >
                <RotateCcw className="btn-icon" />
                Reset All
              </button>
            </div>
          </div>

          {/* Output Section */}
          <div className="output-section">
            <h2 className="section-title">
              <FileText className="section-icon" />
              Generated Drama Script
            </h2>
            
            {dramaScript ? (
              <div className="output-content">
                <div className="script-output">
                  <div className="script-text">
                    {dramaScript.split('\n').map((line, index) => (
                      <div 
                        key={index} 
                        className={`script-line ${
                          line.trim().match(/^[A-Z\s]+:/) ? 'character-name' :
                          line.trim().startsWith('(') && line.trim().endsWith(')') ? 'stage-direction' :
                          line.trim().startsWith('SCENE') || line.trim().startsWith('ACT') ? 'scene-heading' :
                          'dialogue'
                        }`}
                      >
                        {line || <br />}
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Script Stats */}
                <div className="script-stats">
                  <h3 className="stats-title">Script Details:</h3>
                  <div className="stats-grid">
                    <div className="stat-item">
                      <strong>Word Count:</strong> ~{dramaScript.split(' ').length}
                    </div>
                    <div className="stat-item">
                      <strong>Theme:</strong> {themeAnalysis?.primaryTheme ? dramaThemes[themeAnalysis.primaryTheme]?.name : 'Mixed'}
                    </div>
                    <div className="stat-item">
                      <strong>Features Used:</strong> {selectedFeatures.length}
                    </div>
                  </div>
                  
                  {selectedFeatures.length > 0 && (
                    <div className="tags-container">
                      {selectedFeatures.map((feature) => {
                        const featureLabel = Object.values(scriptFeatures)
                          .flat()
                          .find(f => f.id === feature)?.label;
                        return (
                          <span key={feature} className="feature-tag">
                            {featureLabel}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Action buttons for output */}
                <div className="output-actions">
                  <button
                    onClick={() => navigator.clipboard.writeText(dramaScript)}
                    className="copy-btn"
                  >
                    Copy Script
                  </button>
                  <button
                    onClick={() => {
                      const blob = new Blob([dramaScript], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `drama-script-${Date.now()}.txt`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="download-btn"
                  >
                    Download Script
                  </button>
                  <button
                    onClick={handleAnalyzeAndGenerate}
                    disabled={analyzingTheme || loading}
                    className="regenerate-btn"
                  >
                    Generate New Version
                  </button>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">🎭</div>
                <h3 className="empty-title">Ready to Create Drama</h3>
                <p className="empty-text">
                  Enter your scenario and I'll analyze the theme, then generate a professional drama script tailored to your story
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="footer">
          <p className="footer-text">
            Powered by Google Gemini AI • Professional Drama Script Generation with Theme Analysis
          </p>
        </div>
      </div>
    </div>
  );
};

export default MinimalisticDramaGenerator;