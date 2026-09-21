const STORAGE_KEY = 'agenda-harian-records';

const seedAgenda = [
  { id: crypto.randomUUID(), tanggal: '2026-09-22', pemakai: 'Rina Pratiwi', acara: 'Rapat koordinasi bulanan' },
  { id: crypto.randomUUID(), tanggal: '2026-09-24', pemakai: 'Dimas Ardi', acara: 'Presentasi proyek kuartal tiga' },
  { id: crypto.randomUUID(), tanggal: '2026-09-28', pemakai: 'Sari Wulandari', acara: 'Pelatihan penggunaan ruang meeting' }
];

let records = loadRecords();
let editingId = null;

const elements = {
  body: document.querySelector('#agendaBody'), empty: document.querySelector('#emptyState'), modal: document.querySelector('#modalBackdrop'),
  form: document.querySelector('#agendaForm'), date: document.querySelector('#dateInput'), user: document.querySelector('#userInput'), event: document.querySelector('#eventInput'),
  search: document.querySelector('#searchInput'), modalTitle: document.querySelector('#modalTitle'), modalKicker: document.querySelector('#modalKicker'), toast: document.querySelector('#toast')
};

function loadRecords() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) return JSON.parse(stored);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seedAgenda));
  return seedAgenda;
}

function saveRecords() { localStorage.setItem(STORAGE_KEY, JSON.stringify(records)); }
function formatDate(dateString) { return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${dateString}T00:00:00`)); }
function formatWeekday(dateString) { return new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(new Date(`${dateString}T00:00:00`)); }
function todayString() { return new Date().toISOString().slice(0, 10); }
function showToast(message) { elements.toast.textContent = message; elements.toast.classList.add('show'); window.clearTimeout(showToast.timeout); showToast.timeout = window.setTimeout(() => elements.toast.classList.remove('show'), 2300); }

function render() {
  const query = elements.search.value.trim().toLowerCase();
  const visibleRecords = records.filter((record) => `${record.tanggal} ${record.pemakai} ${record.acara}`.toLowerCase().includes(query)).sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  elements.body.innerHTML = visibleRecords.map((record) => `
    <tr>
      <td><span class="date-label">${formatDate(record.tanggal)}</span><span class="date-week">${formatWeekday(record.tanggal)}</span></td>
      <td>${escapeHtml(record.pemakai)}</td>
      <td class="event-title">${escapeHtml(record.acara)}</td>
      <td><div class="row-actions"><button class="icon-button" type="button" data-action="edit" data-id="${record.id}" aria-label="Edit ${escapeHtml(record.acara)}">✎</button><button class="icon-button delete" type="button" data-action="delete" data-id="${record.id}" aria-label="Hapus ${escapeHtml(record.acara)}">⌫</button></div></td>
    </tr>`).join('');
  elements.empty.hidden = visibleRecords.length > 0;
  document.querySelector('#totalCount').textContent = records.length;
  document.querySelector('#upcomingCount').textContent = records.filter((record) => record.tanggal >= todayString()).length;
  document.querySelector('#userCount').textContent = new Set(records.map((record) => record.pemakai.toLowerCase())).size;
}

function escapeHtml(value) { return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[character])); }
function openModal(record) { editingId = record?.id ?? null; elements.modalTitle.textContent = editingId ? 'Edit agenda' : 'Tambah agenda'; elements.modalKicker.textContent = editingId ? 'Perbarui detail' : 'Agenda baru'; elements.date.value = record?.tanggal ?? todayString(); elements.user.value = record?.pemakai ?? ''; elements.event.value = record?.acara ?? ''; elements.modal.hidden = false; document.body.style.overflow = 'hidden'; window.setTimeout(() => elements.user.focus(), 30); }
function closeModal() { elements.modal.hidden = true; elements.form.reset(); editingId = null; document.body.style.overflow = ''; }

 document.querySelector('#addButton').addEventListener('click', () => openModal());
document.querySelector('#emptyAddButton').addEventListener('click', () => openModal());
document.querySelector('#closeButton').addEventListener('click', closeModal);
document.querySelector('#cancelButton').addEventListener('click', closeModal);
elements.modal.addEventListener('click', (event) => { if (event.target === elements.modal) closeModal(); });
document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !elements.modal.hidden) closeModal(); });
elements.search.addEventListener('input', render);

elements.form.addEventListener('submit', (event) => {
  event.preventDefault();
  const wasEditing = Boolean(editingId);
  const data = { tanggal: elements.date.value, pemakai: elements.user.value.trim(), acara: elements.event.value.trim() };
  if (editingId) records = records.map((record) => record.id === editingId ? { ...record, ...data } : record);
  else records.push({ id: crypto.randomUUID(), ...data });
  saveRecords(); render(); closeModal(); showToast(wasEditing ? 'Agenda berhasil diperbarui' : 'Agenda berhasil ditambahkan');
});

elements.body.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const record = records.find((item) => item.id === button.dataset.id);
  if (button.dataset.action === 'edit') openModal(record);
  if (button.dataset.action === 'delete' && record && window.confirm(`Hapus agenda "${record.acara}"?`)) { records = records.filter((item) => item.id !== record.id); saveRecords(); render(); showToast('Agenda berhasil dihapus'); }
});

document.querySelector('#todayLabel').textContent = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
render();
