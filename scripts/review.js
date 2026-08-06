import { db } from "./firebase.js";

import {
    collection,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";

const validateButton = document.getElementById("validateButton");

const reviewCode = document.getElementById("reviewCode");

const message = document.getElementById("message");

validateButton.addEventListener("click", async () => {

    const codigo = reviewCode.value.trim();

    message.textContent = "";

    if (codigo === "") {

        message.textContent = "Introduce un código.";

        return;

    }

    const consulta = query(
        collection(db, "pedidos"),
        where("codigoResena", "==", codigo)
    );

    const resultado = await getDocs(consulta);

    if (resultado.empty) {

        message.textContent = "❌ Código inválido.";

        return;

    }

    message.textContent = "✅ Código encontrado.";

});
