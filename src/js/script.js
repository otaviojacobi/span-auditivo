// --- CONSTANTS ---
const DIRECT_SEQUENCES = [
  { span: 2, sequences: [{ sequence: [3, 8], correct: [3, 8] }, { sequence: [5, 1], correct: [5, 1] }] },
  { span: 3, sequences: [{ sequence: [6, 2, 9], correct: [6, 2, 9] }, { sequence: [4, 7, 1], correct: [4, 7, 1] }] },
  { span: 4, sequences: [{ sequence: [1, 5, 4, 7], correct: [1, 5, 4, 7] }, { sequence: [8, 2, 3, 6], correct: [8, 2, 3, 6] }] },
  { span: 5, sequences: [{ sequence: [9, 3, 1, 4, 8], correct: [9, 3, 1, 4, 8] }, { sequence: [7, 2, 5, 1, 6], correct: [7, 2, 5, 1, 6] }] },
  { span: 6, sequences: [{ sequence: [2, 6, 8, 5, 9, 1], correct: [2, 6, 8, 5, 9, 1] }, { sequence: [4, 8, 3, 7, 1, 2], correct: [4, 8, 3, 7, 1, 2] }] },
  { span: 7, sequences: [{ sequence: [5, 9, 2, 7, 6, 3, 4], correct: [5, 9, 2, 7, 6, 3, 4] }, { sequence: [1, 6, 8, 3, 5, 9, 7], correct: [1, 6, 8, 3, 5, 9, 7] }] },
  { span: 8, sequences: [{ sequence: [6, 4, 8, 1, 3, 7, 2, 5], correct: [6, 4, 8, 1, 3, 7, 2, 5] }, { sequence: [3, 9, 8, 2, 4, 6, 7, 1], correct: [3, 9, 8, 2, 4, 6, 7, 1] }] },
  { span: 9, sequences: [{ sequence: [7, 1, 5, 6, 3, 8, 2, 9, 4], correct: [7, 1, 5, 6, 3, 8, 2, 9, 4] }, { sequence: [6, 2, 9, 4, 1, 7, 8, 5, 3], correct: [6, 2, 9, 4, 1, 7, 8, 5, 3] }] },
];

const INVERSE_SEQUENCES = [
  { span: 2, sequences: [{ sequence: [5, 2], correct: [2, 5] }, { sequence: [9, 1], correct: [1, 9] }] },
  { span: 3, sequences: [{ sequence: [7, 2, 3], correct: [3, 2, 7] }, { sequence: [4, 8, 6], correct: [6, 8, 4] }] },
  { span: 4, sequences: [{ sequence: [1, 9, 2, 5], correct: [5, 2, 9, 1] }, { sequence: [3, 6, 4, 7], correct: [7, 4, 6, 3] }] },
  { span: 5, sequences: [{ sequence: [8, 4, 1, 5, 7], correct: [7, 5, 1, 4, 8] }, { sequence: [2, 5, 9, 3, 6], correct: [6, 3, 9, 5, 2] }] },
  { span: 6, sequences: [{ sequence: [9, 7, 3, 8, 2, 1], correct: [1, 2, 8, 3, 7, 9] }, { sequence: [5, 4, 9, 6, 1, 3], correct: [3, 1, 6, 9, 4, 5] }] },
  { span: 7, sequences: [{ sequence: [6, 1, 8, 5, 2, 7, 4], correct: [4, 7, 2, 5, 8, 1, 6] }, { sequence: [9, 5, 3, 1, 4, 8, 2], correct: [2, 8, 4, 1, 3, 5, 9] }] },
  { span: 8, sequences: [{ sequence: [3, 7, 4, 9, 5, 2, 6, 1], correct: [1, 6, 2, 5, 9, 4, 7, 3] }, { sequence: [8, 2, 4, 1, 6, 3, 9, 7], correct: [7, 9, 3, 6, 1, 4, 2, 8] }] },
  { span: 9, sequences: [{ sequence: [1, 5, 8, 3, 9, 7, 2, 4, 6], correct: [6, 4, 2, 7, 9, 3, 8, 5, 1] }, { sequence: [9, 4, 7, 1, 6, 2, 5, 8, 3], correct: [3, 8, 5, 2, 6, 1, 7, 4, 9] }] },
];

const ICONS = {
    CHECK: '✅',
    X: '❌',
    SPEAKER: '🔊'
};

// --- AUDIO PLAYER ---
async function playSequence(sequence, onSequenceEnd) {
    try {
        // Preload all audio files for the sequence to prevent delays
        const audioElements = sequence.map(digit => new Audio(`src/audio/${digit}.mp3`));
        
        for (const audio of audioElements) {
            // Await for the current audio to finish playing
            await new Promise(resolve => {
                audio.onended = resolve;
                // Play and immediately catch potential errors, resolving the promise to avoid getting stuck.
                audio.play().catch(err => {
                    console.error(`Error playing audio ${audio.src}:`, err);
                    resolve(); // Move to the next step even if one sound fails
                });
            });

            // Wait 1000ms after the digit sound has finished.
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    } catch (error) {
        console.error("Failed to play audio sequence:", error);
    } finally {
        if (onSequenceEnd) onSequenceEnd();
    }
}


// --- APP LOGIC ---
document.addEventListener('DOMContentLoaded', () => {

    // --- State ---
    let state = {
        gamePhase: 'welcome',
        results: { direct: [], inverse: [] },
        currentTest: {
            stage: null,
            sequences: [],
            pairIndex: 0,
            trialIndex: 0,
            errorsInPair: 0,
            userInput: [],
            lastTyped: null,
        },
        audioTest: {
            attempts: 0,
            userInput: '',
            isPlaying: false,
            feedback: '',
            showError: false
        }
    };
    
    const resetState = () => {
        state = {
            gamePhase: 'welcome',
            results: { direct: [], inverse: [] },
            currentTest: { stage: null, sequences: [], pairIndex: 0, trialIndex: 0, errorsInPair: 0, userInput: [], lastTyped: null },
            audioTest: { attempts: 0, userInput: '', isPlaying: false, feedback: '', showError: false }
        };
        showScreen('screen-welcome');
    };

    // --- DOM Elements ---
    const screens = document.querySelectorAll('.screen');
    
    // --- Screen Switching ---
    const showScreen = (screenId) => {
        screens.forEach(s => s.hidden = true);
        const activeScreen = document.getElementById(screenId);
        if (activeScreen) {
            activeScreen.hidden = false;
        }
    };

    // --- Welcome Screen ---
    document.getElementById('btn-start').addEventListener('click', () => {
        state.gamePhase = 'audio_test';
        initAudioTest();
        showScreen('screen-audio-test');
    });

    // --- Audio Test Screen ---
    const audioTestContent = document.getElementById('audio-test-content');
    const btnPlayAudio = document.getElementById('btn-play-audio');
    const playAudioText = document.getElementById('play-audio-text');
    const audioTestInputDisplay = document.getElementById('audio-test-input-display');
    const btnCheckAudio = document.getElementById('btn-check-audio');
    const audioTestFeedback = document.getElementById('audio-test-feedback');
    const btnStartTest = document.getElementById('btn-start-test');
    const btnReloadPage = document.getElementById('btn-reload-page');

    const initAudioTest = () => {
        state.audioTest = { attempts: 0, userInput: '', isPlaying: false, feedback: '', showError: false };
        updateAudioTestUI();
    };

    const updateAudioTestUI = () => {
        audioTestInputDisplay.textContent = state.audioTest.userInput;
        btnPlayAudio.disabled = state.audioTest.isPlaying;
        playAudioText.innerHTML = state.audioTest.isPlaying ? `${ICONS.SPEAKER} Reproduzindo...` : 'Reproduzir Áudio';
        btnCheckAudio.disabled = state.audioTest.isPlaying || state.audioTest.userInput.length === 0;

        audioTestFeedback.textContent = state.audioTest.feedback;
        audioTestFeedback.className = 'feedback';
        if (state.audioTest.feedback === 'Correto!') {
            audioTestFeedback.classList.add('correct');
            btnStartTest.hidden = false;
            audioTestContent.hidden = true;
        } else if (state.audioTest.feedback) {
            audioTestFeedback.classList.add('incorrect');
        }

        if(state.audioTest.showError) {
            audioTestContent.hidden = true;
            btnReloadPage.hidden = false;
        } else {
             audioTestContent.hidden = false;
            btnReloadPage.hidden = true;
        }
    };

    btnPlayAudio.addEventListener('click', () => {
        state.audioTest.isPlaying = true;
        state.audioTest.feedback = '';
        updateAudioTestUI();
        playSequence([1, 5, 7], () => {
            state.audioTest.isPlaying = false;
            updateAudioTestUI();
        });
    });

    btnCheckAudio.addEventListener('click', () => {
        if (state.audioTest.userInput === '157') {
            state.audioTest.feedback = 'Correto!';
        } else {
            state.audioTest.attempts++;
            state.audioTest.userInput = '';
            if (state.audioTest.attempts >= 5) {
                state.audioTest.showError = true;
                state.audioTest.feedback = `Você provavelmente está com um problema em seu áudio. Por favor, contate o avaliador para obter auxílio.`;
            } else {
                state.audioTest.feedback = 'Incorreto. Tente novamente!';
            }
        }
        updateAudioTestUI();
    });

    btnStartTest.addEventListener('click', () => {
        state.gamePhase = 'direct_instructions';
        setupInstructions('direct');
        showScreen('screen-instructions');
    });

    btnReloadPage.addEventListener('click', () => window.location.reload());

    // --- Instructions Screen ---
    const instructionTitle = document.getElementById('instruction-title');
    const instructionContent = document.getElementById('instruction-content');
    const btnReady = document.getElementById('btn-ready');

    const setupInstructions = (type) => {
        if (type === 'direct') {
            instructionTitle.textContent = "Etapa Direta";
            instructionContent.innerHTML = `
                <p>Você está prestes a iniciar a <strong>Etapa Direta</strong>.</p>
                <p>Lembre-se: digite os números na <strong>mesma ordem</strong> que os ouviu.</p>
                <p>Clique em <strong>"Estou Pronto"</strong> para começar.</p>
            `;
            btnReady.onclick = () => {
                state.gamePhase = 'direct_test';
                startTest('direct');
            };
        } else { // inverse
            instructionTitle.textContent = "Etapa Inversa";
            instructionContent.innerHTML = `
                <p>Nessa próxima etapa você vai ouvir uma sequência de números em áudio, assim como na parte anterior.</p>
                <p>No entanto, desta vez, sua tarefa será digitar esses números na ordem inversa (de trás para frente) no teclado do seu computador.</p>
                <p>Por exemplo, se você ouvir "1, 2, 3", deverá digitar "3, 2, 1".</p>
                <p class="font-bold">Importante:</p>
                <ul class="list">
                    <li>A sequência será reproduzida uma única vez, e não pode ser ouvida novamente, por isso, preste muita atenção.</li>
                </ul>
            `;
            btnReady.onclick = () => {
                state.gamePhase = 'inverse_test';
                startTest('inverse');
            };
        }
    };
    
    // --- Test Screen ---
    const testPreparing = document.getElementById('test-preparing');
    const testPlaying = document.getElementById('test-playing');
    const testInputting = document.getElementById('test-inputting');
    const lastTypedDigit = document.getElementById('last-typed-digit');
    const btnRedo = document.getElementById('btn-redo');
    const btnNext = document.getElementById('btn-next');
    
    const startTest = (stage) => {
        state.currentTest = {
            stage,
            sequences: stage === 'direct' ? DIRECT_SEQUENCES : INVERSE_SEQUENCES,
            pairIndex: 0,
            trialIndex: 0,
            errorsInPair: 0,
            userInput: [],
            lastTyped: null,
        };
        showScreen('screen-test');
        runTestFlow();
    };

    const runTestFlow = () => {
        const { pairIndex, trialIndex, sequences } = state.currentTest;
        const currentSequence = sequences[pairIndex]?.sequences[trialIndex];
        
        if (!currentSequence) { // Test finished
            completeTestStage();
            return;
        }

        testPreparing.hidden = false;
        testPlaying.hidden = true;
        testInputting.hidden = true;
        
        setTimeout(() => {
            testPreparing.hidden = true;
            testPlaying.hidden = false;
            playSequence(currentSequence.sequence, () => {
                testPlaying.hidden = true;
                testInputting.hidden = false;
                state.gamePhase = 'inputting'; // Allow keyboard input
            });
        }, 2000);
    };
    
    const completeTestStage = () => {
        const stage = state.currentTest.stage;
        if (stage === 'direct') {
            state.gamePhase = 'inverse_instructions';
            setupInstructions('inverse');
            showScreen('screen-instructions');
        } else {
            state.gamePhase = 'results';
            showScreen('screen-results');
        }
    };

    btnRedo.addEventListener('click', () => {
        state.currentTest.userInput = [];
        state.currentTest.lastTyped = null;
        updateLastTypedUI();
    });

    btnNext.addEventListener('click', () => {
        const { pairIndex, trialIndex, sequences, userInput, errorsInPair } = state.currentTest;
        const currentSeqData = sequences[pairIndex].sequences[trialIndex];
        const isCorrect = JSON.stringify(userInput) === JSON.stringify(currentSeqData.correct);

        const newResult = {
            span: sequences[pairIndex].span,
            sequence: currentSeqData.sequence,
            userAnswer: userInput,
            isCorrect,
        };
        state.results[state.currentTest.stage].push(newResult);

        const currentErrors = errorsInPair + (isCorrect ? 0 : 1);

        if (currentErrors >= 2 || (pairIndex >= sequences.length - 1 && trialIndex === 1)) {
            completeTestStage();
            return;
        }
        
        if (trialIndex === 1) { // End of pair
            state.currentTest.pairIndex++;
            state.currentTest.trialIndex = 0;
            state.currentTest.errorsInPair = 0;
        } else { // Next trial in same pair
            state.currentTest.trialIndex = 1;
            state.currentTest.errorsInPair = currentErrors;
        }
        
        state.currentTest.userInput = [];
        state.currentTest.lastTyped = null;
        updateLastTypedUI();
        runTestFlow();
    });

    const updateLastTypedUI = () => {
        const digit = state.currentTest.lastTyped;
        if (digit !== null) {
            lastTypedDigit.textContent = digit;
            lastTypedDigit.style.opacity = '1';
            setTimeout(() => {
                lastTypedDigit.style.opacity = '0';
                state.currentTest.lastTyped = null;
            }, 1000);
        } else {
            lastTypedDigit.textContent = '';
            lastTypedDigit.style.opacity = '0';
        }
    };
    
    // --- Results Screen ---
    const downloadCSV = () => {
        const fields = ['etapa', 'span', 'sequencia_apresentada', 'resposta_usuario', 'acertou'];
        const buildRows = (stage, list) => list.map(r => [
            stage,
            r.span,
            `"${r.sequence.join(' ')}"`,
            `"${r.userAnswer.join(' ')}"`,
            r.isCorrect ? 'sim' : 'nao'
        ]);
        const rows = [
            ...buildRows('direta', state.results.direct),
            ...buildRows('inversa', state.results.inverse)
        ];
        const headerRow = ['campo', ...rows.map((_, i) => i + 1)];
        const fieldRows = fields.map((field, fi) => [field, ...rows.map(row => row[fi])]);
        const csv = [headerRow, ...fieldRows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `resultados-span-auditivo-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    document.getElementById('btn-download-csv').addEventListener('click', downloadCSV);
    document.getElementById('btn-restart').addEventListener('click', resetState);

    // --- Global Keyboard Listener ---
    window.addEventListener('keydown', (e) => {
        if (!e.key.match(/^[0-9]$/) && e.key !== 'Backspace') return;
        
        if (state.gamePhase === 'audio_test' && !state.audioTest.isPlaying && !state.audioTest.showError && state.audioTest.feedback !== 'Correto!') {
            if (e.key >= '0' && e.key <= '9') {
                state.audioTest.userInput += e.key;
            } else if (e.key === 'Backspace') {
                state.audioTest.userInput = state.audioTest.userInput.slice(0, -1);
            }
            updateAudioTestUI();
        } else if (state.gamePhase === 'inputting') { // Phase during the main test
            if (e.key >= '0' && e.key <= '9') {
                const digit = parseInt(e.key, 10);
                state.currentTest.userInput.push(digit);
                state.currentTest.lastTyped = digit;
                updateLastTypedUI();
            }
        }
    });

    // --- Initial Load ---
    showScreen('screen-welcome');
});