import { db } from "./firebase.js";

import {
    collection,
    addDoc,
    doc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";

// ========================================
// CONFIGURACIÓN
// ========================================

const WHATSAPP_NUMBER = "50237386967";

// ========================================
// ELEMENTOS DEL DOM
// ========================================

const buttons = document.querySelectorAll(".category-button");
const categories = document.querySelectorAll(".category");
const buyButtons = document.querySelectorAll(".buy-button");

const modal = document.getElementById("purchase-modal");
const selectedProduct = document.getElementById("selected-product");
const closeButton = document.querySelector(".close-button");

const idInput = document.getElementById("id");
const nicknameInput = document.getElementById("nickname");
const paymentMethod = document.getElementById("payment-method");
const continueButton = document.getElementById("continue-button");
const idError = document.getElementById("id-error");

const successModal = document.getElementById("orderSuccessModal");
const successOrderId = document.getElementById("successOrderId");
const successReviewCode = document.getElementById("successReviewCode");

const whatsappButton = document.getElementById("whatsappButton");
const copyReviewCode = document.getElementById("copyReviewCode");
const closeSuccessModal = document.getElementById("closeSuccessModal");

// ========================================
// VARIABLES
// ========================================

let currentProduct = "";
let currentPrice = "";
let ultimoPedido = null;
let enviandoPedido = false;

// ========================================
// FUNCIONES AUXILIARES
// ========================================

const abrirModal = () => modal.classList.add("show");

const cerrarModal = () => modal.classList.remove("show");

const limpiarFormulario = () => {
    idInput.value = "";
    nicknameInput.value = "";
    idError.textContent = "";
};

const restaurarBoton = () => {
    enviandoPedido = false;
    continueButton.disabled = false;
    continueButton.textContent = "Enviar por WhatsApp";
};

function generarCodigo(longitud) {

    const caracteres =
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    return Array.from(
        { length: longitud },
        () =>
            caracteres[
                Math.floor(Math.random() * caracteres.length)
            ]
    ).join("");
}

// ========================================
// CAMBIO DE CATEGORÍAS
// ========================================

buttons.forEach(button => {

    button.addEventListener("click", () => {

        buttons.forEach(btn =>
            btn.classList.remove("active")
        );

        categories.forEach(category =>
            category.classList.remove("visible")
        );

        button.classList.add("active");

        document
            .getElementById(button.dataset.category)
            ?.classList.add("visible");

    });

});

// ========================================
// BOTONES DE COMPRA
// ========================================

buyButtons.forEach(button => {

    button.addEventListener("click", () => {

        currentProduct = button.dataset.product;
        currentPrice = button.dataset.price;

        selectedProduct.textContent =
            `${currentProduct} · Q${currentPrice}`;

        abrirModal();

    });

});

// ========================================
// CERRAR MODAL
// ========================================

closeButton?.addEventListener("click", cerrarModal);

modal?.addEventListener("click", ({ target }) => {

    if (target === modal) {

        cerrarModal();

    }

});

// ========================================
// VALIDAR ID
// ========================================

function validarID(id) {

    if (!id) {

        return "Por favor introduce tu ID.";

    }

    if (!/^\d+$/.test(id)) {

        return "Solo se permiten números.";

    }

    if (id.length < 8 || id.length > 11) {

        return "El ID debe tener entre 8 y 11 dígitos.";

    }

    return "";

}

// ========================================
// REGISTRAR PEDIDO
// ========================================

continueButton.addEventListener("click", async () => {

    if (enviandoPedido) return;

    const id = idInput.value.trim();
    const nickname = nicknameInput.value.trim();
    const payment = paymentMethod.value;

    idError.textContent = "";

    const errorID = validarID(id);

    if (errorID) {

        idError.textContent = errorID;
        return;

    }

    if (!nickname) {

        alert("Por favor introduce el nombre del jugador.");
        return;

    }

    enviandoPedido = true;

    continueButton.disabled = true;
    continueButton.textContent = "Registrando pedido...";

    const pedidoId = `DT-${generarCodigo(6)}`;
    const codigoResena =
        `CR-${generarCodigo(4)}-${generarCodigo(4)}`;

    try {

        await addDoc(
            collection(db, "pedidos"),
            {
                producto: currentProduct,
                precio: currentPrice,
                id,
                jugador: nickname,
                metodoPago: payment,
                estado: "Pendiente",
                pedidoId,
                codigoResena,
                resenaUsada: false,
                fecha: serverTimestamp()
            }
        );

        await setDoc(
            doc(db, "reviewCodes", codigoResena),
            {
                codigoResena,
                pedidoId,
                producto: currentProduct,
                jugador: nickname,
                habilitada: false,
                usada: false,
                fecha: serverTimestamp()
            }
        );

        ultimoPedido = {
            pedidoId,
            codigoResena,
            producto: currentProduct,
            precio: currentPrice,
            id,
            jugador: nickname,
            metodoPago: payment
        };

        cerrarModal();

        successOrderId.textContent = pedidoId;
        successReviewCode.textContent = codigoResena;

        successModal.classList.add("active");

        } catch (error) {

        console.error("Error al registrar el pedido:", error);

        alert(
            "❌ No se pudo registrar el pedido. Inténtalo nuevamente."
        );

        restaurarBoton();

    }

});

// ========================================
// WHATSAPP
// ========================================

whatsappButton?.addEventListener("click", () => {

    if (!ultimoPedido) return;

    const mensaje = `
🛒 *Nueva Orden - DarkTop*

📦 Pedido: ${ultimoPedido.pedidoId}

🎮 Producto: ${ultimoPedido.producto}

💰 Precio: Q${ultimoPedido.precio}

🆔 ID: ${ultimoPedido.id}

👤 Nombre: ${ultimoPedido.jugador}

💳 Método de pago: ${ultimoPedido.metodoPago}
`.trim();

    window.open(
        `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensaje)}`,
        "_blank"
    );

});

// ========================================
// COPIAR CÓDIGO DE RESEÑA
// ========================================

copyReviewCode?.addEventListener("click", async () => {

    if (!ultimoPedido) return;

    try {

        await navigator.clipboard.writeText(
            ultimoPedido.codigoResena
        );

        copyReviewCode.textContent = "✅ Copiado";

        setTimeout(() => {

            copyReviewCode.textContent = "📋 Copiar";

        }, 2000);

    } catch (error) {

        console.error(
            "Error al copiar el código:",
            error
        );

        alert(
            "No fue posible copiar el código."
        );

    }

});

// ========================================
// CERRAR MODAL DE ÉXITO
// ========================================

closeSuccessModal?.addEventListener("click", () => {

    successModal.classList.remove("active");

    limpiarFormulario();

    restaurarBoton();

});

// ========================================
// CERRAR MODAL CON ESC
// ========================================

document.addEventListener("keydown", ({ key }) => {

    if (key !== "Escape") return;

    if (modal.classList.contains("show")) {

        cerrarModal();

    }

    if (successModal.classList.contains("active")) {

        successModal.classList.remove("active");

        limpiarFormulario();

        restaurarBoton();

    }

}); 
