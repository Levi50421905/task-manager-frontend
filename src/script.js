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
  
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
  
  // Global variable untuk menyimpan mode edit
  let isEditMode = false;
  let editingId = null;
  
  // CRUD Operations
  function fetchTasks() {
    fetch('http://localhost:3000/tasks')
        .then(response => response.json())
        .then(tasks => {
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
        })
        .catch(error => {
            console.error('Error fetching tasks:', error);
            showNotification('Gagal mengambil data tugas', 'error');
        });
  }
  
  function handleSave() {
    const subject = document.getElementById('subject').value;
    const deadline = document.getElementById('deadline').value;
    const status = document.getElementById('status').value;
  
    if (!subject || !deadline || !status) {
        showNotification('Mohon lengkapi semua data', 'error');
        return;
    }
  
    if (isEditMode && editingId) {
        // Update existing task
        const updatedTask = { subject, deadline, status };
  
        fetch(`http://localhost:3000/tasks/${editingId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedTask)
        })
        .then(response => response.json())
        .then(() => {
            fetchTasks();
            resetForm();
            showNotification('Tugas berhasil diperbarui');
            // Reset edit mode
            isEditMode = false;
            editingId = null;
            const saveButton = document.getElementById('saveButton');
            saveButton.innerHTML = '<i class="fas fa-save"></i> Simpan';
        })
        .catch(error => {
            console.error('Error updating task:', error);
            showNotification('Gagal memperbarui tugas', 'error');
        });
    } else {
        // Create new task
        const newTask = { subject, deadline, status };
  
        fetch('http://localhost:3000/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newTask)
        })
        .then(response => response.json())
        .then(() => {
            fetchTasks();
            resetForm();
            showNotification('Tugas berhasil ditambahkan');
        })
        .catch(error => {
            console.error('Error saving task:', error);
            showNotification('Gagal menambahkan tugas', 'error');
        });
    }
  }
  
  function handleEdit(taskId) {
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
  
  function confirmDelete(taskId, buttonElement) {
    const modal = buttonElement.closest('.modal');
    
    fetch(`http://localhost:3000/tasks/${taskId}`, {
        method: 'DELETE'
    })
    .then(() => {
        fetchTasks();
        modal.remove();
        showNotification('Tugas berhasil dihapus');
    })
    .catch(error => {
        console.error('Error deleting task:', error);
        showNotification('Gagal menghapus tugas', 'error');
        modal.remove();
    });
  }
  
  // Helper functions
  function resetForm() {
    document.getElementById('subject').value = '';
    document.getElementById('deadline').value = '';
    document.getElementById('status').value = 'Belum Mulai';
    
    // Reset edit mode
    isEditMode = false;
    editingId = null;
    const saveButton = document.getElementById('saveButton');
    saveButton.innerHTML = '<i class="fas fa-save"></i> Simpan';
  }
  
  function formatDateForInput(dateString) {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  }
  
  // Initialize
  window.onload = fetchTasks;