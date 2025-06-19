// Importação do Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js'; 
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'; 

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCFQCgGzitreC4TP7gXnEOcxD6UcY3j3jo",
  authDomain: "agenda-sea-c53f6.firebaseapp.com",
  projectId: "agenda-sea-c53f6",
  storageBucket: "agenda-sea-c53f6.firebasestorage.app",
  messagingSenderId: "205972566423",
  appId: "1:205972566423:web:4e7e90216137a3efe354d2",
  measurementId: "G-X824L5R790"
};

// Inicialização do Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Variáveis globais
let currentDate = new Date();
let events = [];
const months = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const weekdays = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

// Funções utilitárias para datas
function createLocalDate(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getTodayDate() {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

// Funções de interface
function showLoading(message = '💾 Salvando...') {
  const loading = document.getElementById('loading');
  loading.textContent = message;
  loading.classList.add('show');
  setTimeout(() => loading.classList.remove('show'), 2000);
}

function updateStatus(online) {
  const indicator = document.getElementById('statusIndicator');
  if (online) {
    indicator.textContent = '🟢 Online';
    indicator.className = 'status-indicator status-online';
  } else {
    indicator.textContent = '🔴 Offline';
    indicator.className = 'status-indicator status-offline';
  }
}

// Funções do Firebase
async function loadEventsFromFirebase() {
  try {
    showLoading('📥 Carregando dados...');
    const querySnapshot = await getDocs(collection(db, "events"));
    events = [];
    querySnapshot.forEach((doc) => {
      events.push({
        id: doc.id,
        ...doc.data()
      });
    });
    updateStatus(true);
    renderCalendar();
    renderEvents();
  } catch (error) {
    console.error("Erro ao carregar eventos:", error);
    updateStatus(false);
    loadFromLocalStorage();
  }
}

async function saveEventToFirebase(eventData) {
  try {
    showLoading('💾 Salvando evento...');
    const docRef = await addDoc(collection(db, "events"), eventData);
    eventData.id = docRef.id;
    events.push(eventData);
    updateStatus(true);
    return docRef.id;
  } catch (error) {
    console.error("Erro ao salvar evento:", error);
    updateStatus(false);
    events.push(eventData);
    saveToLocalStorage();
    throw error;
  }
}

async function deleteEventFromFirebase(eventId, index) {
  try {
    showLoading('🗑️ Excluindo evento...');
    if (eventId) {
      await deleteDoc(doc(db, "events", eventId));
    }
    events.splice(index, 1);
    updateStatus(true);
  } catch (error) {
    console.error("Erro ao excluir evento:", error);
    updateStatus(false);
    events.splice(index, 1);
    saveToLocalStorage();
    throw error;
  }
}

// Funções de armazenamento local
function loadFromLocalStorage() {
  const saved = localStorage.getItem('agendaEvents');
  if (saved) {
    events = JSON.parse(saved);
  } else {
    events = [
      {date: '2025-07-08', title: 'Visita à COPPA', time: '09h', description: 'Projeto Adolecer +'},
      {date: '2025-07-09', title: 'Escola Maringuela', time: '08h às 12h', description: ''},
      {date: '2025-07-22', title: 'Educação ambiental para surdos', time: '', description: 'Manter contato com CB PM Teles - 71988941109'}
    ];
    saveToLocalStorage();
  }
  renderCalendar();
  renderEvents();
}

function saveToLocalStorage() {
  localStorage.setItem('agendaEvents', JSON.stringify(events));
}

// Configuração de listener em tempo real
function setupRealtimeListener() {
  try {
    const unsubscribe = onSnapshot(collection(db, "events"), (snapshot) => {
      events = [];
      snapshot.forEach((doc) => {
        events.push({
          id: doc.id,
          ...doc.data()
        });
      });
      renderCalendar();
      renderEvents();
      updateStatus(true);
    });
    return unsubscribe;
  } catch (error) {
    console.error("Erro ao configurar listener:", error);
    updateStatus(false);
  }
}

// Renderização do calendário
function renderCalendar() {
  const calendar = document.getElementById('calendar');
  const monthYear = document.getElementById('monthYear');
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  monthYear.textContent = `${months[month]} ${year}`;
  calendar.innerHTML = '';
  
  // Adicionar cabeçalhos dos dias da semana
  weekdays.forEach(day => {
    const div = document.createElement('div');
    div.className = 'weekday';
    div.textContent = day;
    calendar.appendChild(div);
  });
  
  // Calcular primeiro dia do calendário
  const firstDay = new Date(year, month, 1);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());
  
  const today = getTodayDate();
  
  // Gerar 42 dias (6 semanas)
  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    
    const dayEl = document.createElement('div');
    dayEl.className = 'day';
    
    const dayNum = document.createElement('div');
    dayNum.textContent = date.getDate();
    dayEl.appendChild(dayNum);
    
    // Marcar dias de outros meses
    if (date.getMonth() !== month) {
      dayEl.classList.add('other-month');
    }
    
    // Marcar dia atual
    if (date.getTime() === today.getTime()) {
      dayEl.classList.add('today');
    }
    
    // Verificar se há eventos neste dia
    const dateStr = formatDateString(date);
    const dayEvents = events.filter(e => e.date === dateStr);
    if (dayEvents.length > 0) {
      dayEl.classList.add('has-event');
      
      const dots = document.createElement('div');
      dots.className = 'event-dots';
      
      dayEvents.forEach(() => {
        const dot = document.createElement('div');
        dot.className = 'dot';
        dots.appendChild(dot);
      });
      
      dayEl.appendChild(dots);
    }
    
    // Adicionar evento de clique
    dayEl.addEventListener('click', () => {
      document.querySelectorAll('.day.selected').forEach(el => el.classList.remove('selected'));
      dayEl.classList.add('selected');
      document.getElementById('eventDate').value = dateStr;
    });
    
    calendar.appendChild(dayEl);
  }
}

// Renderização da lista de eventos
function renderEvents() {
  const list = document.getElementById('eventsList');
  
  if (events.length === 0) {
    list.innerHTML = '<div class="no-events">✨ Nenhum evento cadastrado</div>';
    return;
  }
  
  const today = getTodayDate();
  
  // Ordenar eventos
  const sorted = [...events].sort((a, b) => {
    const dateA = createLocalDate(a.date);
    const dateB = createLocalDate(b.date);
    const aFuture = dateA >= today;
    const bFuture = dateB >= today;
    if (aFuture && !bFuture) return -1;
    if (!aFuture && bFuture) return 1;
    return aFuture ? dateA - dateB : dateB - dateA;
  });
  
  list.innerHTML = '';
  
  sorted.forEach((event, sortedIndex) => {
    const eventDate = createLocalDate(event.date);
    const isToday = eventDate.getTime() === today.getTime();
    const isPast = eventDate < today;
    
    const formattedDate = eventDate.toLocaleDateString('pt-BR', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    
    const diffDays = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));
    
    let statusText = '';
    let statusClass = '';
    
    if (isToday) {
      statusText = '🔥 HOJE';
      statusClass = 'status-today';
    } else if (diffDays === 1) {
      statusText = '⚡ AMANHÃ';
      statusClass = 'status-future';
    } else if (diffDays > 0) {
      statusText = `📅 Em ${diffDays} dias`;
      statusClass = 'status-future';
    } else {
      statusText = `📜 Há ${Math.abs(diffDays)} dias`;
      statusClass = 'status-past';
    }
    
    const originalIndex = events.findIndex(e => e === event);
    
    const eventEl = document.createElement('div');
    eventEl.className = `event-item ${isToday ? 'event-today' : ''} ${isPast ? 'event-past' : ''}`;
    eventEl.innerHTML = `
      <div class="event-header">
        <div style="font-size: 14px; font-weight: 700; color: #4facfe; text-transform: uppercase;">${formattedDate}</div>
        <span class="event-status ${statusClass}">${statusText}</span>
      </div>
      <div style="font-size: 20px; font-weight: 700; color: #2d3748; margin-bottom: 10px;">${event.title}</div>
      ${event.time ? `<div style="font-size: 16px; color: #4a5568; margin-bottom: 10px;">⏰ ${event.time}</div>` : ''}
      ${event.description ? `<div style="font-size: 14px; color: #718096; line-height: 1.6;">${event.description}</div>` : ''}
      <button class="delete-btn" onclick="deleteEvent(${originalIndex})">×</button>
    `;
    
    list.appendChild(eventEl);
  });
}

// Funções de manipulação de eventos
window.addEvent = async function addEvent(e) {
  e.preventDefault();
  
  const date = document.getElementById('eventDate').value;
  const title = document.getElementById('eventTitle').value;
  const time = document.getElementById('eventTime').value;
  const description = document.getElementById('eventDescription').value;
  
  if (!date || !title) {
    alert('Preencha pelo menos a data e o título!');
    return;
  }
  
  const eventData = {date, title, time, description};
  
  try {
    await saveEventToFirebase(eventData);
    document.getElementById('eventForm').reset();
    document.getElementById('eventDate').value = formatDateString(new Date());
    renderCalendar();
    renderEvents();
    
    const btn = document.querySelector('.btn-primary');
    const orig = btn.textContent;
    btn.textContent =
