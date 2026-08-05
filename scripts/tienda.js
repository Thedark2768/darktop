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

});
