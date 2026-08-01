import { auth } from "./firebase.js";

import {
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";


const formulario = document.getElementById("loginForm");
const error = document.getElementById("loginError");


formulario.addEventListener("submit", async (e) => {

    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {

        await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

        window.location.href = "admin.html";

    } catch (e) {

        console.error(e);

        error.textContent = "Correo o contraseña incorrectos.";

    }

});
