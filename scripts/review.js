import { db } from "./firebase.js";

import {
    doc,
    getDoc,
    collection,
    addDoc,
    updateDoc,
    serverTimestamp,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";

const codigoInput = document.getElementById("codigo");

const validarButton = document.getElementById("validar");

const mensaje = document.getElementById("mensaje");

const formulario = document.getElementById("formulario");

const producto = document.getElementById("producto");

const jugador = document.getElementById("jugador");

const estrellas = document.getElementById("estrellas");

const comentario = document.getElementById("comentario");

const enviarResena = document.getElementById("enviarResena");

let reviewActual = null;

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

        reviewActual = datos;

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

enviarResena.addEventListener("click", async () => {

    if (!reviewActual) return;

    const comentarioTexto = comentario.value.trim();

    if (comentarioTexto === "") {

        alert("Escribe un comentario.");

        return;

    }

    try {

        // Guardar la reseña
        await addDoc(collection(db, "reviews"), {

            codigoResena: reviewActual.codigoResena,

            pedidoId: reviewActual.pedidoId,

            producto: reviewActual.producto,

            jugador: reviewActual.jugador,

            estrellas: Number(estrellas.value),

            comentario: comentarioTexto,

            estado: "Pendiente",

            fecha: serverTimestamp()

        });

        // Marcar el código como usado
        await updateDoc(
            doc(db, "reviewCodes", reviewActual.codigoResena),
            {
                usada: true
            }
        );

        // Buscar el pedido y marcar la reseña como usada
        const consulta = query(
            collection(db, "pedidos"),
            where(
                "codigoResena",
                "==",
                reviewActual.codigoResena
            )
        );

        const resultados = await getDocs(consulta);

        resultados.forEach(async (pedido) => {

            await updateDoc(
                doc(db, "pedidos", pedido.id),
                {
                    resenaUsada: true
                }
            );

        });

        alert("¡Gracias por tu reseña!");

        location.reload();

    } catch (error) {

        console.error(error);

        alert("No se pudo enviar la reseña.");

    }

});
