const API_URL = 'http://localhost:8080/api/torneos';

// Elementos del DOM
const torneoForm = document.getElementById('torneo-form');
const torneosTbody = document.getElementById('torneos-tbody');
const inputId = document.getElementById('torneo-id');
const inputNombre = document.getElementById('nombre');
const inputDeporte = document.getElementById('deporte');
const inputFechaInicio = document.getElementById('fechaInicio');
const inputCiudad = document.getElementById('ciudad');
const btnCancelar = document.getElementById('btn-cancelar');
const formTitle = document.getElementById('form-title');
const btnSubmit = document.getElementById('btn-submit');

// Variables globales
let torneosData = []; // Para almacenar los torneos y evitar hacer GET al editar

// Event Listeners
document.addEventListener('DOMContentLoaded', cargarTorneos);
torneoForm.addEventListener('submit', guardarTorneo);
btnCancelar.addEventListener('click', resetForm);

// Función para obtener y mostrar todos los torneos
async function cargarTorneos() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Error al obtener los torneos');
        
        torneosData = await response.json();
        renderizarTabla();
    } catch (error) {
        console.error('Error:', error);
        torneosTbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    <i class="fas fa-exclamation-triangle" style="color: #ef4444;"></i>
                    <p>Error de conexión con el servidor backend.</p>
                </td>
            </tr>
        `;
        Swal.fire('Error', 'No se pudieron cargar los torneos. Asegúrate de que el backend esté en ejecución.', 'error');
    }
}

// Función para renderizar la tabla con los datos actuales
function renderizarTabla() {
    torneosTbody.innerHTML = '';

    if (torneosData.length === 0) {
        torneosTbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    <i class="fas fa-folder-open"></i>
                    <p>No hay torneos registrados aún.</p>
                </td>
            </tr>
        `;
        return;
    }

    torneosData.forEach(torneo => {
        const tr = document.createElement('tr');
        
        // Extraemos solo la parte de la fecha si viene con hora
        const fecha = torneo.fechaInicio ? torneo.fechaInicio.split('T')[0] : '';
        
        tr.innerHTML = `
            <td>${torneo.id}</td>
            <td><strong>${torneo.nombre}</strong></td>
            <td>${torneo.deporte}</td>
            <td>${fecha}</td>
            <td>${torneo.ciudad}</td>
            <td class="action-buttons">
                <button class="btn-icon btn-edit" onclick="cargarDatosEdicion(${torneo.id})" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon btn-delete" onclick="eliminarTorneo(${torneo.id})" title="Eliminar">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        `;
        torneosTbody.appendChild(tr);
    });
}

// Función para crear o actualizar un torneo
async function guardarTorneo(e) {
    e.preventDefault();

    const id = inputId.value;
    const torneo = {
        nombre: inputNombre.value.trim(),
        deporte: inputDeporte.value.trim(),
        fechaInicio: inputFechaInicio.value,
        ciudad: inputCiudad.value.trim()
    };

    const isEdit = id !== '';
    const url = isEdit ? `${API_URL}/${id}` : API_URL;
    const method = isEdit ? 'PUT' : 'POST';

    try {
        // Mostrar estado de carga en el botón
        const btnOriginalText = btnSubmit.innerHTML;
        btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
        btnSubmit.disabled = true;

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(torneo)
        });

        if (!response.ok) throw new Error('Error al guardar el torneo');

        // Resetear y recargar
        resetForm();
        await cargarTorneos();

        Swal.fire({
            icon: 'success',
            title: isEdit ? 'Actualizado!' : 'Guardado!',
            text: isEdit ? 'El torneo se actualizó correctamente.' : 'El torneo fue registrado con éxito.',
            timer: 2000,
            showConfirmButton: false
        });

    } catch (error) {
        console.error('Error:', error);
        Swal.fire('Error', 'No se pudo guardar el torneo.', 'error');
    } finally {
        // Restaurar botón
        btnSubmit.innerHTML = isEdit ? '<i class="fas fa-save"></i> Actualizar Torneo' : '<i class="fas fa-save"></i> Guardar Torneo';
        btnSubmit.disabled = false;
    }
}

// Función para cargar los datos en el formulario para editar
function cargarDatosEdicion(id) {
    const torneo = torneosData.find(t => t.id === id);
    if (!torneo) return;

    inputId.value = torneo.id;
    inputNombre.value = torneo.nombre;
    inputDeporte.value = torneo.deporte;
    inputCiudad.value = torneo.ciudad;
    
    // Formatear fecha para el input date (YYYY-MM-DD)
    if (torneo.fechaInicio) {
        inputFechaInicio.value = torneo.fechaInicio.split('T')[0];
    } else {
        inputFechaInicio.value = '';
    }

    // Cambiar UI del formulario
    formTitle.textContent = `Editar Torneo #${id}`;
    btnSubmit.innerHTML = '<i class="fas fa-save"></i> Actualizar Torneo';
    btnCancelar.style.display = 'block';

    // Hacer scroll hacia el formulario suavemente
    document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
}

// Función para eliminar un torneo
function eliminarTorneo(id) {
    Swal.fire({
        title: '¿Estás seguro?',
        text: "Esta acción no se puede deshacer.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#475569',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const response = await fetch(`${API_URL}/${id}`, {
                    method: 'DELETE'
                });

                if (!response.ok) throw new Error('Error al eliminar');

                await cargarTorneos();

                Swal.fire({
                    icon: 'success',
                    title: '¡Eliminado!',
                    text: 'El torneo ha sido eliminado.',
                    timer: 2000,
                    showConfirmButton: false
                });
            } catch (error) {
                console.error('Error:', error);
                Swal.fire('Error', 'No se pudo eliminar el torneo.', 'error');
            }
        }
    });
}

// Función para limpiar el formulario y resetear estados
function resetForm() {
    torneoForm.reset();
    inputId.value = '';
    formTitle.textContent = 'Registrar Nuevo Torneo';
    btnSubmit.innerHTML = '<i class="fas fa-save"></i> Guardar Torneo';
    btnCancelar.style.display = 'none';
}
