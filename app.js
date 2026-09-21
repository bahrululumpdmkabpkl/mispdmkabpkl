const STORAGE_KEY = 'agenda-harian-records';
const cloudConfig = window.SUPABASE_CONFIG ?? {};
const cloudEnabled = Boolean(cloudConfig.url && cloudConfig.anonKey);

const seedAgenda = [
  { id: crypto.randomUUID(), tanggal: '2026-09-22', pemakai: 'Rina Pratiwi', acara: 'Rapat koordinasi bulanan' },
  { id: crypto.randomUUID(), tanggal: '2026-09-24', pemakai: 'Dimas Ardi', acara: 'Presentasi proyek kuartal tiga' },
  { id: crypto.randomUUID(), tanggal: '2026-09-28', pemakai: 'Sari Wulandari', acara: 'Pelatihan penggunaan ruang meeting' }
];

let records = loadLocalRecords();
let editingId = null;

const elements = {
  body: document.querySelector('#agendaBody'), empty: document.querySelector('#emptyState'), modal: document.querySelector('#modalBackdrop'),
  form: document.querySelector('#agendaForm'), date: document.querySelector('#dateInput'), user: document.querySelector('#userInput'), event: document.querySelector('#eventInput'),
  search: document.querySelector('#searchInput'), modalTitle: document.querySelector('#modalTitle'), modalKicker: document.querySelector('#modalKicker'), toast: document.querySelector('#toast')
};

function loadLocalRecords() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) return JSON.parse(stored);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seedAgenda));
  return seedAgenda;
}

function saveLocalRecords() { localStorage.setItem(STORAGE_KEY, JSON.stringify(records)); }
function cloudHeaders() { return { apikey: cloudConfig.anonKey, Authorization: `Bearer ${cloudConfig.anonKey}`, 'Content-Type': 'application/json' }; }
async function loadRecords() {
  if (!cloudEnabled) return loadLocalRecords();
  const response = await fetch(`${cloudConfig.url}/rest/v1/agenda?select=id,tanggal,pemakai,acara&order=tanggal.asc`, { headers: cloudHeaders() });
  if (!response.ok) throw new Error('Gagal mengambil agenda dari Supabase');
  return response.json();
}
async function createRecord(data) {
  if (!cloudEnabled) { const record = { id: crypto.randomUUID(), ...data }; records.push(record); saveLocalRecords(); return record; }
  const response = await fetch(`${cloudConfig.url}/rest/v1/agenda`, { method: 'POST', headers: { ...cloudHeaders(), Prefer: 'return=representation' }, body: JSON.stringify(data) });
  if (!response.ok) throw new Error('Gagal menambahkan agenda');
  return (await response.json())[0];
}
async function updateRecord(id, data) {
  if (!cloudEnabled) { records = records.map((record) => record.id === id ? { ...record, ...data } : record); saveLocalRecords(); return; }
  const response = await fetch(`${cloudConfig.url}/rest/v1/agenda?id=eq.${id}`, { method: 'PATCH', headers: { ...cloudHeaders(), Prefer: 'return=minimal' }, body: JSON.stringify(data) });
  if (!response.ok) throw new Error('Gagal memperbarui agenda');
}
async function deleteRecord(id) {
  if (!cloudEnabled) { records = records.filter((record) => record.id !== id); saveLocalRecords(); return; }
  const response = await fetch(`${cloudConfig.url}/rest/v1/agenda?id=eq.${id}`, { method: 'DELETE', headers: cloudHeaders() });
  if (!response.ok) throw new Error('Gagal menghapus agenda');
}
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
  submitForm();
});

async function submitForm() {
  const wasEditing = Boolean(editingId);
  const data = { tanggal: elements.date.value, pemakai: elements.user.value.trim(), acara: elements.event.value.trim() };
  try {
    if (editingId) await updateRecord(editingId, data);
    else await createRecord(data);
    records = await loadRecords(); render(); closeModal(); showToast(wasEditing ? 'Agenda berhasil diperbarui' : 'Agenda berhasil ditambahkan');
  } catch (error) { showToast(error.message); }
}

elements.body.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const record = records.find((item) => item.id === button.dataset.id);
  if (button.dataset.action === 'edit') openModal(record);
  if (button.dataset.action === 'delete' && record && window.confirm(`Hapus agenda "${record.acara}"?`)) deleteAgenda(record);
});

document.querySelector('#todayLabel').textContent = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
async function deleteAgenda(record) {
  try { await deleteRecord(record.id); records = await loadRecords(); render(); showToast('Agenda berhasil dihapus'); }
  catch (error) { showToast(error.message); }
}

async function initialize() {
  try { records = await loadRecords(); render(); }
  catch (error) { render(); showToast(error.message); }
}
initialize();

let editingLetterId = null;
let letters = [];
const letterElements = {
  body: document.querySelector('#letterBody'), empty: document.querySelector('#letterEmptyState'), modal: document.querySelector('#letterModalBackdrop'),
  form: document.querySelector('#letterForm'), date: document.querySelector('#letterDateInput'), sender: document.querySelector('#senderInput'), subject: document.querySelector('#subjectInput'),
  file: document.querySelector('#pdfInput'), search: document.querySelector('#letterSearchInput'), title: document.querySelector('#letterModalTitle'), kicker: document.querySelector('#letterModalKicker'), note: document.querySelector('#currentFileNote')
};

async function loadLetters() {
  if (!cloudEnabled) return JSON.parse(localStorage.getItem('surat-masuk-records') || '[]');
  const response = await fetch(`${cloudConfig.url}/rest/v1/surat_masuk?select=id,tanggal,pengirim,perihal,file_path,file_name&order=tanggal.desc`, { headers: cloudHeaders() });
  if (!response.ok) throw new Error('Gagal mengambil surat masuk dari Supabase');
  return response.json();
}

async function uploadPdf(file) {
  if (!file) return null;
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) throw new Error('File harus berformat PDF');
  if (file.size > 10 * 1024 * 1024) throw new Error('Ukuran PDF maksimal 10 MB');
  if (!cloudEnabled) return { file_path: '', file_name: file.name };
  const path = `${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`;
  const response = await fetch(`${cloudConfig.url}/storage/v1/object/surat-masuk/${path}`, { method: 'POST', headers: { apikey: cloudConfig.anonKey, Authorization: `Bearer ${cloudConfig.anonKey}`, 'Content-Type': 'application/pdf', 'x-upsert': 'false' }, body: file });
  if (!response.ok) throw new Error('Gagal mengunggah PDF');
  return { file_path: path, file_name: file.name };
}

function publicPdfUrl(path) { return path ? `${cloudConfig.url}/storage/v1/object/public/surat-masuk/${encodeURIComponent(path).replace(/%2F/g, '/')}` : ''; }

async function saveLetter(data, file) {
  const uploaded = file ? await uploadPdf(file) : null;
  const payload = uploaded ? { ...data, ...uploaded } : data;
  if (!cloudEnabled) {
    if (editingLetterId) letters = letters.map((letter) => letter.id === editingLetterId ? { ...letter, ...payload } : letter);
    else letters.push({ id: crypto.randomUUID(), ...payload });
    localStorage.setItem('surat-masuk-records', JSON.stringify(letters));
    return;
  }
  const url = editingLetterId ? `${cloudConfig.url}/rest/v1/surat_masuk?id=eq.${editingLetterId}` : `${cloudConfig.url}/rest/v1/surat_masuk`;
  const response = await fetch(url, { method: editingLetterId ? 'PATCH' : 'POST', headers: { ...cloudHeaders(), Prefer: 'return=minimal' }, body: JSON.stringify(payload) });
  if (!response.ok) throw new Error('Gagal menyimpan surat masuk');
}

async function removeLetter(letter) {
  if (cloudEnabled && letter.file_path) await fetch(`${cloudConfig.url}/storage/v1/object/surat-masuk`, { method: 'DELETE', headers: cloudHeaders(), body: JSON.stringify([letter.file_path]) });
  if (!cloudEnabled) letters = letters.filter((item) => item.id !== letter.id);
  else {
    const response = await fetch(`${cloudConfig.url}/rest/v1/surat_masuk?id=eq.${letter.id}`, { method: 'DELETE', headers: cloudHeaders() });
    if (!response.ok) throw new Error('Gagal menghapus surat masuk');
  }
  localStorage.setItem('surat-masuk-records', JSON.stringify(letters));
}

function renderLetters() {
  const query = letterElements.search.value.trim().toLowerCase();
  const visibleLetters = letters.filter((letter) => `${letter.tanggal} ${letter.pengirim} ${letter.perihal}`.toLowerCase().includes(query));
  letterElements.body.innerHTML = visibleLetters.map((letter) => `<tr><td>${formatDate(letter.tanggal)}</td><td>${escapeHtml(letter.pengirim)}</td><td class="event-title">${escapeHtml(letter.perihal)}</td><td>${letter.file_path ? `<a class="file-link" href="${publicPdfUrl(letter.file_path)}" target="_blank" rel="noreferrer">PDF ↗</a>` : '<span class="date-week">Tanpa file</span>'}</td><td><div class="row-actions"><button class="icon-button" type="button" data-letter-action="edit" data-id="${letter.id}" aria-label="Edit ${escapeHtml(letter.perihal)}">✎</button><button class="icon-button delete" type="button" data-letter-action="delete" data-id="${letter.id}" aria-label="Hapus ${escapeHtml(letter.perihal)}">⌫</button></div></td></tr>`).join('');
  letterElements.empty.hidden = visibleLetters.length > 0;
}

function openLetterModal(letter) { editingLetterId = letter?.id ?? null; letterElements.title.textContent = editingLetterId ? 'Edit surat masuk' : 'Tambah surat masuk'; letterElements.kicker.textContent = editingLetterId ? 'Perbarui detail' : 'Surat baru'; letterElements.date.value = letter?.tanggal ?? todayString(); letterElements.sender.value = letter?.pengirim ?? ''; letterElements.subject.value = letter?.perihal ?? ''; letterElements.file.value = ''; letterElements.note.textContent = letter?.file_name ? `File saat ini: ${letter.file_name}. Pilih PDF baru untuk menggantinya.` : 'Maksimal 10 MB. File PDF wajib untuk surat baru.'; letterElements.modal.hidden = false; document.body.style.overflow = 'hidden'; window.setTimeout(() => letterElements.sender.focus(), 30); }
function closeLetterModal() { letterElements.modal.hidden = true; letterElements.form.reset(); editingLetterId = null; document.body.style.overflow = ''; }

document.querySelector('#addLetterButton').addEventListener('click', () => openLetterModal());
document.querySelector('#emptyLetterButton').addEventListener('click', () => openLetterModal());
document.querySelector('#letterCloseButton').addEventListener('click', closeLetterModal);
document.querySelector('#letterCancelButton').addEventListener('click', closeLetterModal);
letterElements.modal.addEventListener('click', (event) => { if (event.target === letterElements.modal) closeLetterModal(); });
letterElements.search.addEventListener('input', renderLetters);
letterElements.form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const wasEditing = Boolean(editingLetterId);
  try {
    if (!wasEditing && !letterElements.file.files[0]) throw new Error('File PDF wajib dipilih');
    await saveLetter({ tanggal: letterElements.date.value, pengirim: letterElements.sender.value.trim(), perihal: letterElements.subject.value.trim() }, letterElements.file.files[0]);
    letters = await loadLetters(); renderLetters(); closeLetterModal(); showToast(wasEditing ? 'Surat berhasil diperbarui' : 'Surat berhasil ditambahkan');
  } catch (error) { showToast(error.message); }
});
letterElements.body.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-letter-action]');
  if (!button) return;
  const letter = letters.find((item) => item.id === button.dataset.id);
  if (button.dataset.letterAction === 'edit') openLetterModal(letter);
  if (button.dataset.letterAction === 'delete' && letter && window.confirm(`Hapus surat "${letter.perihal}"?`)) { try { await removeLetter(letter); letters = await loadLetters(); renderLetters(); showToast('Surat berhasil dihapus'); } catch (error) { showToast(error.message); } }
});

async function initializeLetters() { try { letters = await loadLetters(); renderLetters(); } catch (error) { renderLetters(); showToast(error.message); } }
initializeLetters();

document.querySelectorAll('.dashboard-nav-item').forEach((button) => {
  button.addEventListener('click', () => {
    const showingLetters = button.dataset.view === 'letterView';
    document.querySelectorAll('.dashboard-nav-item').forEach((item) => item.classList.toggle('active', item === button));
    document.querySelectorAll('.dashboard-view').forEach((view) => { view.hidden = showingLetters ? view.id !== 'letterView' : view.id === 'letterView'; });
  });
});
