import { db } from "./firebase.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";

const codigoInput = document.getElementById("codigo");

const validarButton = document.getElementById("validar");

const mensaje = document.getElementById("mensaje");

const formulario = document.getElementById("formulario");

const producto = document.getElementById("producto");

const jugador = document.getElementById("jugador");

validarButton.addEventListener("click", async () => {

    const codigo = codigoInput.value.trim().toUpperCase();

    mensaje.textContent = "";

    formulario.hidden = true;

    if (codigo === "") {

        mensaje.textContent =
            "Introduce tu código de reseña.";

        return;

    }

    try {

        const reviewRef = doc(db, "reviewCodes", codigo);

        const reviewSnap = await getDoc(reviewRef);

        if (!reviewSnap.exists()) {

            mensaje.textContent =
                "Código inválido.";

            return;

        }

        const datos = reviewSnap.data();

        if (!datos.habilitada) {

            mensaje.textContent =
                "Tu pedido todavía no ha sido entregado.";

            return;

        }

        if (datos.usada) {

            mensaje.textContent =
                "Este código ya fue utilizado.";

            return;

        }

        producto.textContent =
            "Producto: " + datos.producto;

        jugador.textContent =
            "Jugador: " + datos.jugador;

        formulario.hidden = false;

    } catch (error) {

        console.error(error);

        mensaje.textContent =
            "Ocurrió un error.";

    }

});
