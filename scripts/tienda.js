import { db } from "./firebase.js";
import {
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";

// Categories
const buttons = document.querySelectorAll(".category-button");
const categories = document.querySelectorAll(".category");

//number
const whatsapp_number = "50237386967"

// Change category
buttons.forEach(button => {

    button.addEventListener("click", () => {

        // Remove active states
        buttons.forEach(btn => btn.classList.remove("active"));
        categories.forEach(category => category.classList.remove("visible"));

        // Activate selected button
        button.classList.add("active");

        // Show selected category
        const id = button.dataset.category;
        document.getElementById(id).classList.add("visible");

    });

});

const selectedProduct = document.getElementById("selected-product");
const modal = document.getElementById("purchase-modal");
const buyButtons = document.querySelectorAll(".buy-button");
const closeButton = document.querySelector(".close-button");
const idInput = document.getElementById("id");
const nicknameInput = document.getElementById("nickname");
const idError = document.getElementById("id-error");
const continueButton = document.getElementById("continue-button");

let currentProduct = "";
let currentPrice = "";

buyButtons.forEach(button =>{
    button.addEventListener("click", () => {
        currentProduct = button.dataset.product;
        currentPrice = button.dataset.price;

        selectedProduct.textContent = `${currentProduct} a Q${currentPrice}`;
        modal.classList.add("show");
    });
});

closeButton.addEventListener("click", () =>{
    modal.classList.remove("show");
});

modal.addEventListener("click", (event) => {
    if(event.target === modal){
        modal.classList.remove("show");
    }
});

function generarCodigo(longitud) {
    const caracteres = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let codigo = "";

    for (let i = 0; i < longitud; i++) {
        codigo += caracteres.charAt(
            Math.floor(Math.random() * caracteres.length)
        );
    }

    return codigo;
}

let enviandoPedido = false;

continueButton.addEventListener("click", async () => {

    if (enviandoPedido) return;

    enviandoPedido = true;

    continueButton.disabled = true;
    continueButton.textContent = "Registrando pedido...";

    const id = idInput.value.trim();

    idError.textContent = "";

    if (id === "") {
        idError.textContent = "Por favor introduce tu ID.";
        enviandoPedido = false;
        continueButton.disabled = false;
        continueButton.textContent = "Continuar";
        return;
    }

    if (!/^\d+$/.test(id)) {
        idError.textContent = "Solo numeros.";
        enviandoPedido = false;
        continueButton.disabled = false;
        continueButton.textContent = "Continuar";
        return;
    }

    if (id.length < 8 || id.length > 11) {
        idError.textContent = "ID no apto.";
        enviandoPedido = false;
        continueButton.disabled = false;
        continueButton.textContent = "Continuar";
        return;
    }

    const payment = document.getElementById("payment-method").value;

    const nickname = nicknameInput.value.trim();

    if (nickname === "") {
        alert("Por favor introduce el nombre de jugador.");

        enviandoPedido = false;
        continueButton.disabled = false;
        continueButton.textContent = "Continuar";

        return;
    }

    const message = `
🛒 *Nueva Orden - DarkTop*

🎮 Producto: ${currentProduct}
💰 Precio: ${currentPrice}

🆔 ID: ${id}

👤 Nombre de jugador: ${nickname}

💳 Metodo de Pago: ${payment}
`;

    const pedidoId = "DT-" + generarCodigo(6);
    const codigoResena = "CR-" + generarCodigo(4) + "-" + generarCodigo(4);

    try {

        await addDoc(collection(db, "pedidos"), {

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
        });

        alert(
            `✅ Pedido registrado\n\n` +
            `📦 Pedido: ${pedidoId}\n` +
            `⭐ Código de reseña: ${codigoResena}`
        );

    } catch (error) {

        console.error("Error al crear pedido:", error);

        alert("❌ No se pudo registrar el pedido. Inténtalo nuevamente.");

        // Solo permitimos volver a intentarlo si realmente falló
        enviandoPedido = false;
        continueButton.disabled = false;
        continueButton.textContent = "Continuar";
    }

});==============
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
