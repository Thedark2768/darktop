import { db } from "./firebase.js";

import {
    collection,
    addDoc,
    serverTimestamp,
    query, // <<< NUEVO: Para buscar en Firebase
    where,
    getDocs,
    updateDoc, // <<< NUEVO: Para actualizar documentos
    doc // <<< NUEVO: Para referenciar documentos
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

const selectedProductDisplay = document.getElementById("selected-product"); // Renombrado para claridad
const modal = document.getElementById("purchase-modal");

const buyButtons = document.querySelectorAll(".buy-button");

const closePurchaseModalButton = modal.querySelector(".close-button"); // Más específico

const idInput = document.getElementById("id");
const nicknameInput = document.getElementById("nickname");

const idError = document.getElementById("id-error");

const continueButton = document.getElementById("continue-button");

const paymentMethodSelect = document.getElementById("payment-method"); // Renombrado para claridad


// ========================================
// PRODUCTO ACTUAL
// ========================================

let currentProduct = "";
let currentPrice = "";
let currentProductId = ""; // <<< NUEVO: Para almacenar el ID del producto (si lo tienes)


// ========================================
// DATOS DEL ÚLTIMO PEDIDO
// ========================================

let lastOrderDetails = null; // Renombrado para claridad


// ========================================
// BOTONES DE COMPRA
// ========================================

buyButtons.forEach(button => {

    button.addEventListener("click", () => {

        currentProduct = button.dataset.product;
        currentPrice = button.dataset.price;
        // <<< MODIFICADO: Si tus productos tienen un ID único, captura aquí.
        // Si no, puedes usar el nombre del producto como identificador principal.
        // Por ahora, usaremos el nombre del producto como ID si no hay otro.
        currentProductId = button.dataset.product; // O un atributo data-product-id si lo defines

        selectedProductDisplay.textContent =
            `${currentProduct} a Q${currentPrice}`;

        modal.classList.add("show");

    });

});


// ========================================
// CERRAR MODAL DE COMPRA
// ========================================

closePurchaseModalButton.addEventListener("click", () => {

    modal.classList.remove("show");

});


// Cerrar tocando fuera del modal

modal.addEventListener("click", (event) => {

    if (event.target === modal) {

        modal.classList.remove("show");

    }

});


// ========================================
// GENERAR CÓDIGOS (MODIFICADO PARA UN CÓDIGO MÁS ROBUSTO DE REVIEW)
// ========================================

// Genera un código único para el purchase code
function generateReviewPurchaseCode() { // <<< MODIFICADO
    const timestamp = Date.now().toString();
    const randomChars = Math.random().toString(36).substring(2, 8); // 6 caracteres aleatorios
    return `DRKREV-${timestamp}-${randomChars.toUpperCase()}`;
}

// Tu función original de generar código para el pedido (la mantendremos si la usas para el pedidoId)
function generateOrderCode(length) {
    const characters =
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < length; i++) {
        code += characters.charAt(
            Math.floor(Math.random() * characters.length)
        );
    }
    return code;
}


// ========================================
// EVITAR SPAM DE PEDIDOS
// ========================================

let isSubmittingOrder = false; // Renombrado para claridad


// ========================================
// ENVIAR PEDIDO
// ========================================

continueButton.addEventListener("click", async () => {

    // Evitar doble clic
    if (isSubmittingOrder) return;


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
            "Solo números.";

        return;

    }

    if (id.length < 8 || id.length > 11) {

        idError.textContent =
            "ID no válido.";

        return;

    }


    // ====================================
    // OBTENER MÉTODO DE PAGO
    // ====================================

    const payment = paymentMethodSelect.value;


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
    // BLOQUEAR BOTÓN Y MOSTRAR ESTADO
    // ====================================

    isSubmittingOrder = true;
    continueButton.disabled = true;
    continueButton.textContent = "Registrando pedido...";


    // ====================================
    // GENERAR CÓDIGOS Y DETALLES
    // ====================================

    const orderId = "DT-" + generateOrderCode(6); // Tu ID de pedido original
    const reviewCode = generateReviewPurchaseCode(); // <<< NUEVO: Código robusto para el purchase code


    // ====================================
    // GUARDAR EN FIREBASE
    // ====================================

    try {

        // --- 1. GUARDAR EL CÓDIGO DE REVIEW EN LA COLECCIÓN 'purchaseCodes' --- <<< NUEVO
        await addDoc(collection(db, "purchaseCodes"), {
            code: reviewCode,
            productId: currentProductId, // Usamos el ID capturado
            userId: null, // Si no tienes login, puedes dejarlo null o usar un identificador temporal
            // Guardamos detalles relevantes de la compra para referencia
            purchaseDetails: {
                playerName: nickname,
                playerId: id,
                paymentMethod: payment
            },
            createdAt: serverTimestamp(),
            used: false // Inicialmente, el código no se ha usado para una review
        });
        console.log("Purchase code generado y guardado en Firebase:", reviewCode);

        // --- 2. GUARDAR EL PEDIDO EN LA COLECCIÓN 'pedidos' --- <<< MODIFICADO
        // Ahora guardamos el ID del pedido que generamos y referenciaremos el purchaseCode (opcionalmente)
        await addDoc(collection(db, "pedidos"), {
            producto: currentProduct,
            precio: currentPrice,
            id: id, // ID del jugador
            jugador: nickname,
            metodoPago: payment,
            estado: "Pendiente", // Estado inicial del pedido
            pedidoId: orderId, // El ID de pedido que generamos
            // <<< MODIFICADO: Ya no guardamos el código de reseña directamente aquí.
            // Si quieres relacionar, podrías añadir un campo como 'reviewCodeId'
            // que sea el ID del documento en 'purchaseCodes', o simplemente el código.
            // Por simplicidad, por ahora no lo enlazamos directamente aquí,
            // pero el código existe en la otra colección.
            fecha: serverTimestamp()
        });
        console.log("Pedido registrado en Firebase con ID:", orderId);

        // ====================================
        // GUARDAR INFORMACIÓN DEL ÚLTIMO PEDIDO (PARA WHATSAPP Y COPIAR)
        // ====================================
        lastOrderDetails = {
            pedidoId: orderId,
            codigoResena: reviewCode, // <<< MODIFICADO: Guardamos el código que generamos para el review
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
        document.getElementById("successOrderId").textContent = orderId;
        document.getElementById("successReviewCode").textContent = reviewCode; // <<< MODIFICADO: Muestra el código recién generado
        document.getElementById("orderSuccessModal").classList.add("active");

    } catch (error) {
        console.error("Error al procesar el pedido o guardar el código de review:", error);
        alert("❌ Hubo un error al procesar tu pedido y generar tu código de reseña. Por favor, inténtalo nuevamente.");

        // Permitir volver a intentar si hubo un error
        isSubmittingOrder = false;
        continueButton.disabled = false;
        continueButton.textContent = "Continuar";
    }
});


// ========================================
// BOTÓN WHATSAPP (MANTENEMOS LA LÓGICA, USA EL CÓDIGO DE RESEÑA DEL ÚLTIMO PEDIDO)
// ========================================

const whatsappButton = document.getElementById("whatsappButton");

whatsappButton.addEventListener("click", () => {
    if (!lastOrderDetails) return;

    // Construye el mensaje, asegurándote de incluir el código de reseña correcto
    const message = `
🛒 *Nueva Orden - DarkTop*

📦 Pedido: ${lastOrderDetails.pedidoId}

🔗 Código de Reseña: ${lastOrderDetails.codigoResena} (Úsalo en darktop.store/validar-review)

🎮 Producto: ${lastOrderDetails.producto}
💰 Precio: Q${lastOrderDetails.precio}
🆔 ID: ${lastOrderDetails.id}
👤 Nombre de jugador: ${lastOrderDetails.jugador}
💳 Método de Pago: ${lastOrderDetails.metodoPago}
`;

    window.open(
        `https://wa.me/${whatsapp_number}?text=${encodeURIComponent(message)}`,
        "_blank"
    );
});


// ========================================
// COPIAR CÓDIGO DE RESEÑA (MANTENEMOS LÓGICA)
// ========================================

const copyReviewCodeButton = document.getElementById("copyReviewCode");

copyReviewCodeButton.addEventListener("click", async () => {
    if (!lastOrderDetails) return;

    try {
        await navigator.clipboard.writeText(lastOrderDetails.codigoResena);
        copyReviewCodeButton.textContent = "✅ Copiado";
        setTimeout(() => {
            copyReviewCodeButton.textContent = "📋 Copiar";
        }, 2000);
    } catch (error) {
        console.error("No se pudo copiar:", error);
        alert('No se pudo copiar el código.');
    }
});


// ========================================
// CERRAR MODAL DE ÉXITO (MANTENEMOS LÓGICA)
// ========================================

const closeSuccessModalButton = document.getElementById("closeSuccessModal");

closeSuccessModalButton.addEventListener("click", () => {
    document.getElementById("orderSuccessModal").classList.remove("active");

    // Limpiar formulario y restaurar estado del botón
    idInput.value = "";
    nicknameInput.value = "";
    idError.textContent = "";
    isSubmittingOrder = false;
    continueButton.disabled = false;
    continueButton.textContent = "Continuar";
});

// --- Pendiente: Implementar la lógica para la página de VALIDACIÓN de código ---
// Esto implicaría una nueva página HTML y su correspondiente archivo JS.
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
