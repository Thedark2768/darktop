import { db } from "./firebase.js";

import {
    collection,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";


const reviewCode =
    document.getElementById("reviewCode");

const verifyButton =
    document.getElementById("verifyReviewButton");

const reviewError =
    document.getElementById("reviewError");


verifyButton.addEventListener("click", async () => {

    const code =
        reviewCode.value.trim().toUpperCase();


    reviewError.textContent = "";


    if (code === "") {

        reviewError.textContent =
            "Introduce tu código de reseña.";

        return;

    }


    if (!/^CR-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code)) {

        reviewError.textContent =
            "El formato del código no es válido.";

        return;

    }


    verifyButton.disabled = true;

    verifyButton.textContent =
        "Verificando...";


    try {

        const referencia =
            collection(db, "pedidos");


        const consulta =
            query(
                referencia,
                where("codigoResena", "==", code)
            );


        const resultado =
            await getDocs(consulta);


        if (resultado.empty) {

            reviewError.textContent =
                "❌ Código no encontrado.";

            return;

        }


        const pedido =
            resultado.docs[0].data();


        if (pedido.estado !== "Entregado") {

            reviewError.textContent =
                "⏳ Tu pedido todavía no ha sido entregado.";

            return;

        }


        if (pedido.reseñaHabilitada !== true) {

            reviewError.textContent =
                "⚠️ Este código todavía no está habilitado.";

            return;

        }


        if (pedido.resenaUsada === true) {

            reviewError.textContent =
                "❌ Este código ya fue utilizado.";

            return;

        }


        alert(
            "✅ Código válido.\n\n" +
            "El sistema está listo para mostrar el formulario de reseña."
        );


    } catch (error) {

        console.error(
            "Error verificando código:",
            error
        );

        reviewError.textContent =
            "❌ Ocurrió un error. Inténtalo nuevamente.";

    } finally {

        verifyButton.disabled = false;

        verifyButton.textContent =
            "Verificar código";

    }

}); 
