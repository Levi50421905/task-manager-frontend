// Konfigurasi API URL berdasarkan environment
const API_URL = process.env.NODE_ENV === 'production'
    ? 'https://nama-app-backend.vercel.app/api'  // Ganti dengan URL backend Vercel Anda
    : 'http://localhost:3000';

// Utility functions
function getStatusBadgeClass(status) {
    switch(status) {
        case 'Belum Mulai':
            return 'status-badge status-pending';
        case 'Sedang Dikerjai':
            return 'status-badge status-progress';
        case 'Selesai':
            return 'status-badge status-completed';
        default:
            return 'status-badge';
    }
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Global variables
let isEditMode = false;
let editingId = null;

// CRUD Operations dengan error handling yang lebih baik
async function fetchTasks() {
    try {
        const response = await fetch(`${API_URL}/tasks`);
        if (!response.ok) throw new Error('Gagal mengambil data');
        
        const tasks = await response.json();
        const taskList = document.getElementById('taskList');
        taskList.innerHTML = '';
        
        tasks.forEach(task => {
            const newRow = taskList.insertRow();
            newRow.setAttribute('id', task._id);

            newRow.innerHTML = `
                <td>${task.subject}</td>
                <td>${formatDate(task.deadline)}</td>
                <td><span class="${getStatusBadgeClass(task.status)}">${task.status}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon btn-edit" onclick="handleEdit('${task._id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon btn-delete" onclick="handleDelete('${task._id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
        });
    } catch (error) {
        console.error('Error:', error);
        showNotification('Gagal mengambil data tugas', 'error');
    }
}

async function handleSave() {
    try {
        const subject = document.getElementById('subject').value;
        const deadline = document.getElementById('deadline').value;
        const status = document.getElementById('status').value;

        if (!subject || !deadline || !status) {
            showNotification('Mohon lengkapi semua data', 'error');
            return;
        }

        const taskData = { subject, deadline, status };
        let response;

        if (isEditMode && editingId) {
            // Update existing task
            response = await fetch(`${API_URL}/tasks/${editingId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taskData)
            });
        } else {
            // Create new task
            response = await fetch(`${API_URL}/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taskData)
            });
        }

        if (!response.ok) throw new Error('Gagal menyimpan data');

        await fetchTasks();
        resetForm();
        showNotification(isEditMode ? 'Tugas berhasil diperbarui' : 'Tugas berhasil ditambahkan');
        
        isEditMode = false;
        editingId = null;
        const saveButton = document.getElementById('saveButton');
        saveButton.innerHTML = '<i class="fas fa-save"></i> Simpan';
    } catch (error) {
        console.error('Error:', error);
        showNotification(`Gagal ${isEditMode ? 'memperbarui' : 'menambahkan'} tugas`, 'error');
    }
}

function handleEdit(taskId) {
    try {
        isEditMode = true;
        editingId = taskId;

        const row = document.getElementById(taskId);
        const subject = row.cells[0].innerHTML;
        const deadline = row.cells[1].innerHTML;
        const status = row.cells[2].querySelector('span').innerHTML;

        document.getElementById('subject').value = subject;
        document.getElementById('deadline').value = formatDateForInput(deadline);
        document.getElementById('status').value = status;

        const saveButton = document.getElementById('saveButton');
        saveButton.innerHTML = '<i class="fas fa-check"></i> Update';

        // Scroll ke form
        document.querySelector('.task-form').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error('Error:', error);
        showNotification('Gagal memuat data untuk edit', 'error');
    }
}

function handleDelete(taskId) {
    const deleteModal = document.createElement('div');
    deleteModal.className = 'modal';
    deleteModal.innerHTML = `
        <div class="modal-content">
            <h2>Konfirmasi Hapus</h2>
            <p>Apakah Anda yakin ingin menghapus tugas ini?</p>
            <div class="modal-actions">
                <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Batal</button>
                <button class="btn btn-danger" onclick="confirmDelete('${taskId}', this)">Hapus</button>
            </div>
        </div>
    `;
    document.body.appendChild(deleteModal);
}

async function confirmDelete(taskId, buttonElement) {
    const modal = buttonElement.closest('.modal');
    
    try {
        const response = await fetch(`${API_URL}/tasks/${taskId}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Gagal menghapus data');

        await fetchTasks();
        modal.remove();
        showNotification('Tugas berhasil dihapus');
    } catch (error) {
        console.error('Error:', error);
        showNotification('Gagal menghapus tugas', 'error');
        modal.remove();
    }
}

function resetForm() {
    document.getElementById('subject').value = '';
    document.getElementById('deadline').value = '';
    document.getElementById('status').value = 'Belum Mulai';
    
    isEditMode = false;
    editingId = null;
    const saveButton = document.getElementById('saveButton');
    saveButton.innerHTML = '<i class="fas fa-save"></i> Simpan';
}

function formatDateForInput(dateString) {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
}

// Inisialisasi dan event listeners
document.addEventListener('DOMContentLoaded', () => {
    fetchTasks();

    // Event listener untuk form submit
    document.querySelector('form').addEventListener('submit', (e) => {
        e.preventDefault();
        handleSave();
    });

    // Event listener untuk tombol reset
    document.querySelector('button[type="reset"]')?.addEventListener('click', resetForm);
});

// Fungsi untuk menangani offline/online status
window.addEventListener('online', () => {
    showNotification('Koneksi terhubung kembali', 'success');
    fetchTasks(); // Refresh data ketika online kembali
});

window.addEventListener('offline', () => {
    showNotification('Tidak ada koneksi internet', 'error');
});
