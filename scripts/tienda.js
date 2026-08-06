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

const whatsapp_number = "50237386967";


// ========================================
// CATEGORÍAS
// ========================================

const buttons = document.querySelectorAll(".category-button");
const categories = document.querySelectorAll(".category");

buttons.forEach(button => {

    button.addEventListener("click", () => {

        buttons.forEach(btn => btn.classList.remove("active"));
        categories.forEach(category => category.classList.remove("visible"));

        button.classList.add("active");

        const id = button.dataset.category;

        document.getElementById(id).classList.add("visible");

    });

});


// ========================================
// MODAL DE COMPRA
// ========================================

const selectedProduct = document.getElementById("selected-product");
const modal = document.getElementById("purchase-modal");

const buyButtons = document.querySelectorAll(".buy-button");

const closeButton = document.querySelector(".close-button");

const idInput = document.getElementById("id");
const nicknameInput = document.getElementById("nickname");

const idError = document.getElementById("id-error");

const continueButton = document.getElementById("continue-button");

const paymentMethod = document.getElementById("payment-method");


// ========================================
// PRODUCTO ACTUAL
// ========================================

let currentProduct = "";
let currentPrice = "";


// ========================================
// DATOS DEL ÚLTIMO PEDIDO
// ========================================

let ultimoPedido = null;


// ========================================
// BOTONES DE COMPRA
// ========================================

buyButtons.forEach(button => {

    button.addEventListener("click", () => {

        currentProduct = button.dataset.product;
        currentPrice = button.dataset.price;

        selectedProduct.textContent =
            `${currentProduct} a Q${currentPrice}`;

        modal.classList.add("show");

    });

});


// ========================================
// CERRAR MODAL DE COMPRA
// ========================================

closeButton.addEventListener("click", () => {

    modal.classList.remove("show");

});


// Cerrar tocando fuera del modal

modal.addEventListener("click", (event) => {

    if (event.target === modal) {

        modal.classList.remove("show");

    }

});


// ========================================
// GENERAR CÓDIGOS
// ========================================

function generarCodigo(longitud) {

    const caracteres =
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let codigo = "";

    for (let i = 0; i < longitud; i++) {

        codigo += caracteres.charAt(
            Math.floor(Math.random() * caracteres.length)
        );

    }

    return codigo;

}


// ========================================
// EVITAR SPAM DE PEDIDOS
// ========================================

let enviandoPedido = false;


// ========================================
// ENVIAR PEDIDO
// ========================================

continueButton.addEventListener("click", async () => {

    // Evitar doble clic
    if (enviandoPedido) return;


    // ====================================
    // VALIDAR ID
    // ====================================

    const id = idInput.value.trim();

    idError.textContent = "";


    if (id === "") {

        idError.textContent =
            "Por favor introduce tu ID.";

        return;

    }


    if (!/^\d+$/.test(id)) {

        idError.textContent =
            "Solo numeros.";

        return;

    }


    if (id.length < 8 || id.length > 11) {

        idError.textContent =
            "ID no apto.";

        return;

    }


    // ====================================
    // OBTENER MÉTODO DE PAGO
    // ====================================

    const payment = paymentMethod.value;


    // ====================================
    // OBTENER NOMBRE
    // ====================================

    const nickname = nicknameInput.value.trim();


    if (nickname === "") {

        alert(
            "Por favor introduce el nombre de jugador."
        );

        return;

    }


    // ====================================
    // AHORA SÍ BLOQUEAMOS EL BOTÓN
    // ====================================

    enviandoPedido = true;

    continueButton.disabled = true;

    continueButton.textContent =
        "Registrando pedido...";


    // ====================================
    // GENERAR CÓDIGOS
    // ====================================

    const pedidoId =
        "DT-" + generarCodigo(6);

    const codigoResena =
        "CR-" +
        generarCodigo(4) +
        "-" +
        generarCodigo(4);


    // ====================================
    // GUARDAR EN FIREBASE
    // ====================================

    try {

        await addDoc(
            collection(db, "pedidos"),
            {

                producto: currentProduct,

                precio: currentPrice,

                id: id,

                jugador: nickname,

                metodoPago: payment,

                estado: "Pendiente",

                pedidoId: pedidoId,

                codigoResena: codigoResena,

                resenaUsada: false,

                fecha: serverTimestamp()

            }
        );
        
await setDoc(
    doc(db, "reviewCodes", codigoResena),
    {
        codigoResena: codigoResena,
        pedidoId: pedidoId,
        producto: currentProduct,
        jugador: nickname,
        habilitada: false,
        usada: false,
        fecha: serverTimestamp()
    }
);

        // ====================================
        // GUARDAR INFORMACIÓN DEL PEDIDO
        // ====================================

        ultimoPedido = {

            pedidoId: pedidoId,

            codigoResena: codigoResena,

            producto: currentProduct,

            precio: currentPrice,

            id: id,

            jugador: nickname,

            metodoPago: payment

        };


        // ====================================
        // CERRAR MODAL DE COMPRA
        // ====================================

        modal.classList.remove("show");


        // ====================================
        // MOSTRAR DATOS EN MODAL DE ÉXITO
        // ====================================

        document.getElementById(
            "successOrderId"
        ).textContent = pedidoId;


        document.getElementById(
            "successReviewCode"
        ).textContent = codigoResena;


        document.getElementById(
            "orderSuccessModal"
        ).classList.add("active");


    } catch (error) {

        console.error(
            "Error al crear pedido:",
            error
        );


        alert(
            "❌ No se pudo registrar el pedido. " +
            "Inténtalo nuevamente."
        );


        // Permitir volver a intentar

        enviandoPedido = false;

        continueButton.disabled = false;

        continueButton.textContent =
            "Continuar";

    }

});


// ========================================
// BOTÓN WHATSAPP
// ========================================

const whatsappButton =
    document.getElementById("whatsappButton");


whatsappButton.addEventListener("click", () => {

    // Seguridad por si no existe pedido
    if (!ultimoPedido) return;


    const message = `
🛒 *Nueva Orden - DarkTop*

📦 Pedido: ${ultimoPedido.pedidoId}

🎮 Producto: ${ultimoPedido.producto}

💰 Precio: Q${ultimoPedido.precio}

🆔 ID: ${ultimoPedido.id}

👤 Nombre de jugador: ${ultimoPedido.jugador}

💳 Método de Pago: ${ultimoPedido.metodoPago}
`;


    window.open(

        `https://wa.me/${whatsapp_number}?text=${encodeURIComponent(message)}`,

        "_blank"

    );

});


// ========================================
// COPIAR CÓDIGO DE RESEÑA
// ========================================

const copyReviewCode =
    document.getElementById("copyReviewCode");


copyReviewCode.addEventListener("click", async () => {

    if (!ultimoPedido) return;


    try {

        await navigator.clipboard.writeText(
            ultimoPedido.codigoResena
        );


        copyReviewCode.textContent =
            "✅ Copiado";


        setTimeout(() => {

            copyReviewCode.textContent =
                "📋 Copiar";

        }, 2000);


    } catch (error) {

        console.error(
            "No se pudo copiar:",
            error
        );

    }

});


// ========================================
// CERRAR MODAL DE ÉXITO
// ========================================

const closeSuccessModal =
    document.getElementById("closeSuccessModal");


closeSuccessModal.addEventListener("click", () => {

    document
        .getElementById("orderSuccessModal")
        .classList.remove("active");


    // Limpiar formulario

    idInput.value = "";

    nicknameInput.value = "";

    idError.textContent = "";


    // Restaurar botón

    enviandoPedido = false;

    continueButton.disabled = false;

    continueButton.textContent =
        "Continuar";

});
