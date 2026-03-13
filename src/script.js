/**
 * WWE / WWF Superfan Quiz
 * Vanilla JavaScript Logic
 */

// --- CONFIGURATION ---
const SUPABASE_URL = 'https://svtklroagedvdpmvdjzb.supabase.co';
const SUPABASE_KEY = 'sb_publishable_lzQbnhirzUZ4d15N-bnPuw_W4BgKhKo';
const TABLE_NAME = 'highscores';

// Initialize Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- UTILS ---
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// --- QUESTION DATABASE ---
import { ALL_QUESTIONS } from './questions.js';

// --- STATE ---
let currentQuiz = {
    difficulty: 'easy',
    questions: [],
    currentIndex: 0,
    score: 0,
    correctCount: 0,
    totalQuestions: 0,
    currentAnswers: [] // Stores shuffled answers for current question
};

// --- UI ELEMENTS ---
const screens = {
    start: document.getElementById('start-screen'),
    difficulty: document.getElementById('difficulty-screen'),
    instructions: document.getElementById('instructions-screen'),
    quiz: document.getElementById('quiz-screen'),
    result: document.getElementById('result-screen'),
    leaderboard: document.getElementById('leaderboard-screen')
};

// --- NAVIGATION ---
function showScreen(screenId) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[screenId].classList.add('active');
}

// --- GAME LOGIC ---
function initQuiz(difficulty) {
    currentQuiz.difficulty = difficulty;
    
    let count = 15;
    if (difficulty === 'medium') count = 25;
    if (difficulty === 'hard') count = 40;
    
    currentQuiz.totalQuestions = count;
    
    let pool = [...ALL_QUESTIONS];
    shuffleArray(pool);
    currentQuiz.questions = pool.slice(0, count);
    
    currentQuiz.currentIndex = 0;
    currentQuiz.score = 0;
    currentQuiz.correctCount = 0;
    
    showScreen('instructions');
}

function startQuiz() {
    showScreen('quiz');
    renderQuestion();
}

function renderQuestion() {
    const q = currentQuiz.questions[currentQuiz.currentIndex];
    
    // Shuffle answers for this question
    currentQuiz.currentAnswers = shuffleArray([...q.answers]);
    
    document.getElementById('current-question-num').textContent = currentQuiz.currentIndex + 1;
    document.getElementById('total-questions-num').textContent = currentQuiz.totalQuestions;
    document.getElementById('current-score').textContent = currentQuiz.score;
    
    const progress = ((currentQuiz.currentIndex) / currentQuiz.totalQuestions) * 100;
    document.getElementById('progress-bar-fill').style.width = `${progress}%`;
    
    document.getElementById('question-text').textContent = q.text;
    
    const imgContainer = document.getElementById('question-image-container');
    const imgElement = document.getElementById('question-image');
    if (q.image) {
        imgElement.src = q.image;
        imgContainer.classList.remove('hidden');
    } else {
        imgContainer.classList.add('hidden');
    }
    
    const answerGrid = document.getElementById('answer-options');
    answerGrid.innerHTML = '';
    
    currentQuiz.currentAnswers.forEach((answer) => {
        const btn = document.createElement('button');
        btn.className = 'btn-answer';
        btn.textContent = answer.text;
        btn.onclick = () => handleAnswer(answer, btn);
        answerGrid.appendChild(btn);
    });
}

function handleAnswer(selectedAnswer, clickedBtn) {
    const buttons = document.querySelectorAll('.btn-answer');
    buttons.forEach(btn => btn.disabled = true);
    
    if (selectedAnswer.isCorrect) {
        clickedBtn.classList.add('correct');
        currentQuiz.correctCount++;
        let multiplier = 10;
        if (currentQuiz.difficulty === 'medium') multiplier = 20;
        if (currentQuiz.difficulty === 'hard') multiplier = 30;
        currentQuiz.score += multiplier;
    } else {
        clickedBtn.classList.add('wrong');
        // Find and highlight correct button
        buttons.forEach((btn, idx) => {
            if (currentQuiz.currentAnswers[idx].isCorrect) {
                btn.classList.add('correct');
            }
        });
    }
    
    setTimeout(() => {
        currentQuiz.currentIndex++;
        if (currentQuiz.currentIndex < currentQuiz.questions.length) {
            renderQuestion();
        } else {
            finishQuiz();
        }
    }, 1500);
}

function finishQuiz() {
    document.getElementById('res-correct').textContent = currentQuiz.correctCount;
    document.getElementById('res-total').textContent = currentQuiz.totalQuestions;
    document.getElementById('res-score').textContent = currentQuiz.score;
    
    const percent = Math.round((currentQuiz.correctCount / currentQuiz.totalQuestions) * 100);
    document.getElementById('res-percent').textContent = `${percent}%`;
    
    showScreen('result');
}

// --- SUPABASE INTEGRATION ---
async function saveScore() {
    const name = document.getElementById('player-name').value.trim() || 'Anonym';
    const btn = document.getElementById('btn-submit-score');
    
    btn.disabled = true;
    btn.textContent = 'Wird gesendet...';
    
    try {
        const { error } = await supabase
            .from(TABLE_NAME)
            .insert([
                { 
                    player_name: name, 
                    score: currentQuiz.score, 
                    difficulty: currentQuiz.difficulty,
                    correct_answers: currentQuiz.correctCount,
                    total_questions: currentQuiz.totalQuestions
                }
            ]);
            
        if (error) throw error;
        
        alert('Score erfolgreich gespeichert!');
        loadLeaderboard(currentQuiz.difficulty);
        showScreen('leaderboard');
    } catch (err) {
        console.error('Error saving score:', err);
        alert('Fehler beim Speichern des Scores.');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Score Absenden';
    }
}

async function loadLeaderboard(filter = 'all') {
    const loading = document.getElementById('leaderboard-loading');
    const tbody = document.getElementById('leaderboard-body');
    
    loading.classList.remove('hidden');
    tbody.innerHTML = '';
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
    });
    
    try {
        let query = supabase
            .from(TABLE_NAME)
            .select('*')
            .order('score', { ascending: false })
            .limit(10);
            
        if (filter !== 'all') {
            query = query.eq('difficulty', filter);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">Noch keine Einträge</td></tr>';
        } else {
            data.forEach((row, index) => {
                const tr = document.createElement('tr');
                const date = new Date(row.created_at).toLocaleDateString('de-DE');
                tr.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${row.player_name}</td>
                    <td>${row.score}</td>
                    <td>${row.difficulty.toUpperCase()}</td>
                    <td>${date}</td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (err) {
        console.error('Error loading leaderboard:', err);
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">Fehler beim Laden</td></tr>';
    } finally {
        loading.classList.add('hidden');
    }
}

// --- EVENT LISTENERS ---
document.getElementById('btn-start-game').onclick = () => showScreen('difficulty');
document.getElementById('btn-show-leaderboard').onclick = () => {
    loadLeaderboard();
    showScreen('leaderboard');
};

document.querySelectorAll('.btn-diff').forEach(btn => {
    btn.onclick = () => initQuiz(btn.dataset.diff);
});

document.querySelectorAll('.btn-back').forEach(btn => {
    btn.onclick = () => showScreen('start');
});

document.getElementById('btn-begin-quiz').onclick = startQuiz;
document.getElementById('btn-restart').onclick = () => showScreen('difficulty');
document.getElementById('btn-go-home').onclick = () => showScreen('start');
document.getElementById('btn-submit-score').onclick = saveScore;

document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.onclick = () => loadLeaderboard(btn.dataset.filter);
});

showScreen('start');
