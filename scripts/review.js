// review.js

import { db } from "./firebase.js"; // Asegúrate de que la ruta sea correcta

import {
    collection,
    query,
    where,
    getDocs,
    updateDoc, // <<< NUEVO: Para actualizar el pedido
    doc,     // <<< NUEVO: Para referenciar un documento específico
    addDoc,  // <<< NUEVO: Para crear la nueva review
    serverTimestamp // <<< NUEVO: Para la fecha de creación de la review
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";


// ========================================
// CONFIGURACIÓN Y ELEMENTOS DOM
// ========================================

// Secciones
const codeValidationSection = document.getElementById("code-validation-section");
const reviewFormSection = document.getElementById("review-form-section");
const statusMessageSection = document.getElementById("status-message-section");

// Elementos de Validación de Código
const reviewCodeInput = document.getElementById("reviewCode");
const verifyButton = document.getElementById("verifyReviewButton");
const reviewError = document.getElementById("reviewError");

// Elementos del Formulario de Review
const productNameDisplay = document.getElementById("product-name");
const starsContainer = document.querySelector(".rating-stars .stars"); // Asumiendo que lo agregas en review.html
const reviewCommentTextarea = document.getElementById("reviewComment");
const submitReviewButton = document.getElementById("submit-review-button");
const reviewSubmissionError = document.getElementById("review-submission-error");
const ratingError = document.getElementById("rating-error");

// Mensaje de estado general
const statusMessage = document.getElementById("status-message");

// Variables para almacenar datos
let validatedOrderDoc = null; // <<< NUEVO: Almacenará el documento completo del pedido validado
let currentRating = 0; // Calificación seleccionada

// ========================================
// FUNCIONES UTILITARIAS
// ========================================

function showSection(sectionToShow) {
    document.querySelectorAll(".review-section").forEach(section => {
        section.classList.remove("active");
    });
    sectionToShow.classList.add("active");
}

function displayError(element, message) {
    element.textContent = message;
}

function clearFormErrors() {
    displayError(reviewError, "");
    displayError(ratingError, "");
    displayError(reviewSubmissionError, "");
    displayError(statusMessage, "");
}

function resetStars() {
    document.querySelectorAll(".star").forEach(star => {
        star.classList.remove("active");
    });
    currentRating = 0;
}

// ========================================
// LÓGICA DE VALIDACIÓN DE CÓDIGO (MODIFICADA)
// ========================================

verifyButton.addEventListener("click", async () => {
    clearFormErrors();
    const code = reviewCodeInput.value.trim().toUpperCase();

    if (code === "") {
        displayError(reviewError, "Introduce tu código de reseña.");
        return;
    }

    // Regex para tu formato actual de código: CR-XXXX-XXXX
    if (!/^CR-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code)) {
        displayError(reviewError, "El formato del código no es válido.");
        return;
    }

    verifyButton.disabled = true;
    verifyButton.textContent = "Verificando...";

    try {
        const pedidosRef = collection(db, "pedidos");
        const q = query(pedidosRef, where("codigoResena", "==", code));
        const resultado = await getDocs(q);

        if (resultado.empty) {
            displayError(reviewError, "❌ Código no encontrado.");
            return;
        }

        // <<< MODIFICADO: Guardamos el documento completo para usarlo después
        validatedOrderDoc = resultado.docs[0];
        const pedido = validatedOrderDoc.data();

        // Aquí puedes añadir la lógica de 'reseñaHabilitada' si esa es una bandera en tu DB
        // Si 'reseñaHabilitada' no es un campo, puedes omitir esa validación o ajustarla.
        // Por ahora, asumimos que si el pedido existe y tiene el código, está habilitado.

        if (pedido.estado !== "Entregado") {
            displayError(reviewError, "⏳ Tu pedido todavía no ha sido entregado.");
            return;
        }

        // *** NOTA: `reseñaHabilitada` es una validación que depende de tu lógica de negocio.
        // Si es un campo que tú pones `true` manualmente o automáticamente, mantenlo.
        // Si no, puedes quitar esta validación.
        // if (pedido.reseñaHabilitada !== true) {
        //     displayError(reviewError, "⚠️ Este código todavía no está habilitado.");
        //     return;
        // }

        if (pedido.resenaUsada === true) {
            displayError(reviewError, "❌ Este código ya fue utilizado.");
            return;
        }

        // --- VALIDACIÓN EXITOSA ---
        // Mostrar el producto y el formulario de review
        productNameDisplay.textContent = `${pedido.producto} (Pedido: ${pedido.pedidoId})`; // Muestra info útil
        showSection(reviewFormSection); // Muestra la sección del formulario

    } catch (error) {
        console.error("Error verificando código:", error);
        displayError(reviewError, "❌ Ocurrió un error. Inténtalo nuevamente.");
    } finally {
        // Restablecer estado del botón independientemente del resultado
        verifyButton.disabled = false;
        verifyButton.textContent = "Verificar código";
    }
});

// ========================================
// LÓGICA DE ESTRELLAS (Similar a la propuesta anterior)
// ========================================

document.querySelectorAll(".star").forEach(star => {
    star.addEventListener("click", () => {
        currentRating = parseInt(star.getAttribute("data-value"));
        document.querySelectorAll(".star").forEach((s, index) => {
            if (index < currentRating) {
                s.classList.add("active");
            } else {
                s.classList.remove("active");
            }
        });
    });
});


// ========================================
// LÓGICA DE ENVÍO DE REVIEW (NUEVO)
// ========================================

submitReviewButton.addEventListener("click", async () => {
    clearFormErrors();

    const comment = reviewCommentTextarea.value.trim();

    if (currentRating === 0) {
        displayError(ratingError, "Por favor, selecciona una calificación.");
        return;
    }

    if (comment === "") {
        displayError(reviewSubmissionError, "Por favor, deja un comentario.");
        return;
    }

    if (!validatedOrderDoc) {
        // Seguridad: Si no hay un pedido validado, no se puede proceder
        displayError(reviewSubmissionError, "Error interno: No se pudo encontrar el pedido asociado.");
        showSection(statusMessageSection);
        statusMessage.textContent = "Error interno. Por favor, regresa e inténtalo de nuevo.";
        return;
    }

    // Obtenemos los datos del pedido que validamos previamente
    const pedidoData = validatedOrderDoc.data();
    const orderDocId = validatedOrderDoc.id; // El ID del documento del pedido en Firestore

    submitReviewButton.disabled = true;
    submitReviewButton.textContent = "Enviando...";

    try {
        // --- 1. Crear la nueva review en la colección 'reviews' ---
        // (Asegúrate de tener una colección 'reviews' configurada en Firestore)
        await addDoc(collection(db, "reviews"), {
            productId: pedidoData.producto, // Usamos el nombre del producto de 'pedidos'
            userId: pedidoData.id || null, // ID del jugador del pedido
            purchaseCodeUsed: pedidoData.codigoResena, // El código de reseña
            rating: currentRating,
            comment: comment,
            createdAt: serverTimestamp(),
            // status: 'pending' // Opcional: puedes añadir un estado para moderación
        });

        // --- 2. Actualizar el pedido original para marcar la reseña como usada ---
        const orderDocRef = doc(db, "pedidos", orderDocId);
        await updateDoc(orderDocRef, {
            resenaUsada: true
        });

        // --- Éxito ---
        // Mostrar mensaje de éxito y ocultar el formulario
        statusMessage.textContent = "¡Gracias por tu reseña! Tu opinión ha sido enviada.";
        showSection(statusMessageSection);
        reviewFormSection.style.display = "none"; // Ocultar el formulario explícitamente

    } catch (error) {
        console.error("Error al enviar la review:", error);
        displayError(reviewSubmissionError, "❌ Hubo un error al enviar tu reseña. Inténtalo de nuevo.");
        showSection(statusMessageSection); // Mostrar el mensaje de error en la sección de estado
    } finally {
        // Restablecer botón de envío independientemente del resultado
        submitReviewButton.disabled = false;
        submitReviewButton.textContent = "Enviar Review";
    }
});

// ========================================
// INICIALIZACIÓN AL CARGAR LA PÁGINA
// ========================================

// Inicialmente, mostrar la sección de validación de código
showSection(codeValidationSection);

// Opcional: Si quieres que el input del código tenga foco al cargar la página
reviewCodeInput.focus();

// Si tuvieras un código pasado por URL (ej. review.html?code=CR-XXXX-XXXX),
// podrías intentar validar automáticamente aquí.
