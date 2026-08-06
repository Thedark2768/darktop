// scripts/tienda.js

import { db } from "./firebase.js"; // Asegúrate de que la ruta sea correcta

import {
    collection,
    addDoc,
    serverTimestamp,
    query, // <<< Necesario para buscar en Firebase
    where,
    getDocs,
    updateDoc, // <<< Necesario para actualizar documentos
    doc // <<< Necesario para referenciar documentos
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";


// ========================================
// CONFIGURACIÓN GLOBAL
// ========================================

const whatsapp_number = "50237386967";


// ========================================
// CONTROL DE CATEGORÍAS EN LA TIENDA
// ========================================

const categoryButtons = document.querySelectorAll(".category-button");
const productCategories = document.querySelectorAll(".category");

categoryButtons.forEach(button => {
    button.addEventListener("click", () => {
        categoryButtons.forEach(btn => btn.classList.remove("active"));
        productCategories.forEach(category => category.classList.remove("visible"));

        button.classList.add("active");
        const categoryId = button.dataset.category;
        document.getElementById(categoryId).classList.add("visible");
    });
});


// ========================================
// LÓGICA DEL MODAL DE COMPRA
// ========================================

const selectedProductDisplay = document.getElementById("selected-product");
const purchaseModal = document.getElementById("purchase-modal");
const buyButtons = document.querySelectorAll(".buy-button");
const closePurchaseModalButton = purchaseModal.querySelector(".close-button");

const playerIdInput = document.getElementById("id");
const playerNameInput = document.getElementById("nickname");
const playerIdError = document.getElementById("id-error");
const continuePurchaseButton = document.getElementById("continue-button");
const paymentMethodSelect = document.getElementById("payment-method");


// ========================================
// ESTADO DEL PRODUCTO SELECCIONADO
// ========================================

let currentProduct = "";
let currentPrice = "";
let currentProductId = ""; // ID único del producto, si lo tienes


// ========================================
// DETALLES DEL ÚLTIMO PEDIDO REGISTRADO
// ========================================

let lastOrderDetails = null;


// ========================================
// BOTONES DE COMPRA (ABRIR MODAL)
// ========================================

buyButtons.forEach(button => {
    button.addEventListener("click", () => {
        currentProduct = button.dataset.product;
        currentPrice = button.dataset.price;
        // Asigna el ID del producto. Si no tienes un data-product-id, usa el nombre.
        currentProductId = button.dataset.productId || currentProduct;

        selectedProductDisplay.textContent = `${currentProduct} a Q${currentPrice}`;
        purchaseModal.classList.add("show");
    });
});


// ========================================
// CERRAR MODAL DE COMPRA
// ========================================

closePurchaseModalButton.addEventListener("click", () => {
    purchaseModal.classList.remove("show");
});

// Cerrar tocando fuera del modal
purchaseModal.addEventListener("click", (event) => {
    if (event.target === purchaseModal) {
        purchaseModal.classList.remove("show");
    }
});


// ========================================
// GENERACIÓN DE CÓDIGOS
// ========================================

// Genera un código único para el 'purchase code' de la review
function generateReviewPurchaseCode() {
    const timestamp = Date.now().toString();
    const randomChars = Math.random().toString(36).substring(2, 8); // 6 caracteres aleatorios
    return `DRKREV-${timestamp}-${randomChars.toUpperCase()}`;
}

// Tu función original para generar el código del pedido
function generateOrderCode(length) {
    const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < length; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
}


// ========================================
// CONTROL DE ENVÍO DE PEDIDO (ANTI-SPAM)
// ========================================

let isSubmittingOrder = false;


// ========================================
// MANEJO DEL BOTÓN "CONTINUAR COMPRA"
// ========================================

continuePurchaseButton.addEventListener("click", async () => {
    // Evitar doble clic
    if (isSubmittingOrder) return;

    // --- VALIDACIÓN DE DATOS ---
    const playerId = playerIdInput.value.trim();
    playerIdError.textContent = "";

    if (playerId === "") {
        playerIdError.textContent = "Por favor introduce tu ID.";
        return;
    }
    if (!/^\d+$/.test(playerId)) {
        playerIdError.textContent = "Solo números.";
        return;
    }
    if (playerId.length < 8 || playerId.length > 11) {
        playerIdError.textContent = "ID no válido.";
        return;
    }

    const paymentMethod = paymentMethodSelect.value;
    const playerName = playerNameInput.value.trim();

    if (playerName === "") {
        alert("Por favor introduce el nombre de jugador.");
        return;
    }

    // --- BLOQUEAR BOTÓN Y MOSTRAR ESTADO ---
    isSubmittingOrder = true;
    continuePurchaseButton.disabled = true;
    continuePurchaseButton.textContent = "Registrando pedido...";

    // --- GENERAR CÓDIGOS Y DETALLES ---
    const orderId = "DT-" + generateOrderCode(6); // Tu ID de pedido original
    const reviewCode = generateReviewPurchaseCode(); // Nuevo código robusto para el purchase code de review

    try {
        // --- 1. GUARDAR EL CÓDIGO DE REVIEW EN LA COLECCIÓN 'purchaseCodes' ---
        await addDoc(collection(db, "purchaseCodes"), {
            code: reviewCode,
            productId: currentProductId,
            userId: null, // Si tienes sistema de login, pon el ID del usuario aquí
            purchaseDetails: { // Detalles relevantes de la compra para referencia
                playerName: playerName,
                playerId: playerId,
                paymentMethod: paymentMethod
            },
            createdAt: serverTimestamp(),
            used: false // Inicialmente, el código no se ha usado para una review
        });
        console.log("Purchase code generado y guardado en Firebase:", reviewCode);

        // --- 2. GUARDAR EL PEDIDO EN LA COLECCIÓN 'pedidos' ---
        await addDoc(collection(db, "pedidos"), {
            producto: currentProduct,
            precio: currentPrice,
            id: playerId, // ID del jugador
            jugador: playerName,
            metodoPago: paymentMethod,
            estado: "Pendiente", // Estado inicial del pedido
            pedidoId: orderId, // El ID de pedido que generamos
            // En este punto, no necesitas guardar el reviewCode aquí si usas 'purchaseCodes'
            // Si tuvieras un campo 'reseñaHabilitada' podrías setearlo aquí.
            fecha: serverTimestamp()
        });
        console.log("Pedido registrado en Firebase con ID:", orderId);

        // --- GUARDAR INFORMACIÓN DEL ÚLTIMO PEDIDO (PARA WHATSAPP Y COPIAR) ---
        lastOrderDetails = {
            pedidoId: orderId,
            codigoResena: reviewCode, // Guardamos el código de review generado
            producto: currentProduct,
            precio: currentPrice,
            id: playerId,
            jugador: playerName,
            metodoPago: paymentMethod
        };

        // --- CERRAR MODAL DE COMPRA ---
        purchaseModal.classList.remove("show");

        // --- MOSTRAR DATOS EN MODAL DE ÉXITO ---
        document.getElementById("successOrderId").textContent = orderId;
        document.getElementById("successReviewCode").textContent = reviewCode;
        document.getElementById("orderSuccessModal").classList.add("active");

    } catch (error) {
        console.error("Error al procesar el pedido o guardar el código de review:", error);
        alert("❌ Hubo un error al procesar tu pedido y generar tu código de reseña. Por favor, inténtalo nuevamente.");

        // Permitir volver a intentar si hubo un error
        isSubmittingOrder = false;
        continuePurchaseButton.disabled = false;
        continuePurchaseButton.textContent = "Continuar";
    }
});


// ========================================
// MANEJO DEL BOTÓN DE WHATSAPP
// ========================================

const whatsappButton = document.getElementById("whatsappButton");

whatsappButton.addEventListener("click", () => {
    if (!lastOrderDetails) return;

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

    window.open(`https://wa.me/${whatsapp_number}?text=${encodeURIComponent(message)}`, "_blank");
});


// ========================================
// MANEJO DEL BOTÓN PARA COPIAR CÓDIGO DE RESEÑA
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
// MANEJO DEL CIERRE DEL MODAL DE ÉXITO
// ========================================

// ... código anterior ...

// ========================================
// MANEJO DEL CIERRE DEL MODAL DE ÉXITO
// ========================================

const closeSuccessModalButton = document.getElementById("closeSuccessModal");

closeSuccessModalButton.addEventListener("click", () => {
    document.getElementById("orderSuccessModal").classList.remove("active");

    // Limpiar formulario de compra y restaurar estado del botón
    playerIdInput.value = "";
    playerNameInput.value = "";
    playerIdError.textContent = "";
    isSubmittingOrder = false;
    continuePurchaseButton.disabled = false;
    continuePurchaseButton.textContent = "Continuar";
}); // <<< ESTA ES LA LLAVE Y PUNTO Y COMA CORRECTOS PARA CERRAR ESTE LISTENER

// --- Recordatorio: La validación de código y envío de reviews se maneja en review.js ---

// ========================================
// MANEJO DEL BOTÓN DE WHATSAPP
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
}); // <<< LLAVE Y PUNTO Y COMA CORRECTOS PARA CERRAR EL LISTENER DE WHATSAPP

// ... (Aquí continuaría el resto de tu script, como el listener para copyReviewCodeButton) ...



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
