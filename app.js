const API_URL = 'http://localhost:8080/api/torneos';

// DOM Elements
const form = document.getElementById('torneo-form');
const torneoIdInput = document.getElementById('torneo-id');
const nombreInput = document.getElementById('nombre');
const deporteInput = document.getElementById('deporte');
const fechaInicioInput = document.getElementById('fechaInicio');
const ciudadInput = document.getElementById('ciudad');
const tbody = document.getElementById('torneos-tbody');
const formTitle = document.getElementById('form-title');
const btnSubmit = document.getElementById('btn-submit');
const btnCancel = document.getElementById('btn-cancel');

let torneosCache = [];

// Load tournaments on startup
document.addEventListener('DOMContentLoaded', fetchTorneos);

// Form submit event
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const torneo = {
        nombre: nombreInput.value.trim(),
        deporte: deporteInput.value.trim(),
        fechaInicio: fechaInicioInput.value,
        ciudad: ciudadInput.value.trim()
    };

    const id = torneoIdInput.value;
    
    if (id) {
        await updateTorneo(id, torneo);
    } else {
        await createTorneo(torneo);
    }
});

// Cancel edit
btnCancel.addEventListener('click', resetForm);

// API Functions
async function fetchTorneos() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Error al cargar los torneos');
        torneosCache = await response.json();
        renderTable(torneosCache);
    } catch (error) {
        console.error('Fetch error:', error);
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--danger-color); padding: 2rem;">Error al cargar datos del servidor. Asegúrese de que el backend esté ejecutándose en localhost:8080</td></tr>`;
    }
}

async function createTorneo(torneo) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(torneo)
        });
        
        if (response.ok) {
            resetForm();
            await fetchTorneos();
            alert('Torneo creado exitosamente');
        } else {
            console.error('Error al crear torneo');
            alert('No se pudo crear el torneo.');
        }
    } catch (error) {
        console.error('Create error:', error);
        alert('Error de conexión con el servidor.');
    }
}

async function updateTorneo(id, torneo) {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(torneo)
        });
        
        if (response.ok) {
            resetForm();
            await fetchTorneos();
            alert('Torneo actualizado exitosamente');
        } else {
            console.error('Error al actualizar torneo');
            alert('No se pudo actualizar el torneo.');
        }
    } catch (error) {
        console.error('Update error:', error);
        alert('Error de conexión con el servidor.');
    }
}

async function deleteTorneo(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar este torneo?')) return;
    
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            await fetchTorneos();
            alert('Torneo eliminado exitosamente');
        } else {
            console.error('Error al eliminar torneo');
            alert('No se pudo eliminar el torneo.');
        }
    } catch (error) {
        console.error('Delete error:', error);
        alert('Error de conexión con el servidor.');
    }
}

// UI Functions
function renderTable(torneos) {
    tbody.innerHTML = '';
    
    if (!torneos || torneos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 2rem; color: #6b7280;">No hay torneos registrados.</td></tr>`;
        return;
    }
    
    torneos.forEach((torneo, index) => {
        const tr = document.createElement('tr');
        tr.style.animationDelay = `${index * 0.05}s`;
        
        tr.innerHTML = `
            <td>${torneo.id}</td>
            <td style="font-weight: 500;">${torneo.nombre}</td>
            <td>${torneo.deporte}</td>
            <td>${formatDate(torneo.fechaInicio)}</td>
            <td>${torneo.ciudad}</td>
            <td class="action-buttons">
                <button type="button" class="btn btn-sm btn-edit" data-id="${torneo.id}">Editar</button>
                <button type="button" class="btn btn-sm btn-delete" data-id="${torneo.id}">Eliminar</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Attach event listeners to dynamically created buttons
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.getAttribute('data-id');
            editTorneo(id);
        });
    });

    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.getAttribute('data-id');
            deleteTorneo(id);
        });
    });
}

function editTorneo(id) {
    const torneo = torneosCache.find(t => t.id == id);
    if (!torneo) return;

    torneoIdInput.value = torneo.id;
    nombreInput.value = torneo.nombre;
    deporteInput.value = torneo.deporte;
    
    let dateStr = torneo.fechaInicio;
    // The backend returns string format, if it returns it in any other format it needs adapting
    if (dateStr && dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
            dateStr = `${parts[2]}-${parts[1]}-${parts[0]}`; // Convert dd/mm/yyyy to yyyy-mm-dd
        }
    }
    
    // date input needs YYYY-MM-DD
    fechaInicioInput.value = dateStr; 
    ciudadInput.value = torneo.ciudad;
    
    formTitle.textContent = 'Editar Torneo';
    btnSubmit.textContent = 'Actualizar Torneo';
    btnCancel.classList.remove('hidden');
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetForm() {
    form.reset();
    torneoIdInput.value = '';
    formTitle.textContent = 'Registrar Nuevo Torneo';
    btnSubmit.textContent = 'Guardar Torneo';
    btnCancel.classList.add('hidden');
}

function formatDate(dateString) {
    if (!dateString) return '';
    if (dateString.includes('-') && dateString.length === 10) {
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    }
    return dateString;
}
