import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";
onAuthStateChanged(auth, (usuario) => {

    if (!usuario) {

        window.location.href = "login.html";

        return;
    }

    cargarPedidos();

});

import { 
    collection,
    getDocs,
    doc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";

async function cambiarEstado(id, estado){

    const referencia = doc(db, "pedidos", id);

    await updateDoc(referencia, {
        estado: estado
    });

    cargarPedidos();
}
const lista = document.getElementById("listaPedidos");

document.getElementById("logoutBtn").addEventListener("click", async () => {

    await signOut(auth);

    window.location.href = "login.html";

});


async function cargarPedidos(){

    const consulta = await getDocs(collection(db,"pedidos"));

console.log("Pedidos encontrados:", consulta.size);

    lista.innerHTML = "";

    consulta.forEach((doc)=>{

        const pedido = doc.data();

        lista.innerHTML += `

<article>

<h3>${pedido.producto}</h3>

<p>ID: ${pedido.id}</p>

<p>Jugador: ${pedido.jugador}</p>

<p>Precio: Q${pedido.precio}</p>

<p>Pago: ${pedido.metodoPago}</p>

<p>Estado: ${pedido.estado}</p>


<button onclick="cambiarEstado('${doc.id}', 'Procesando')">
🔵 Procesando
</button>


<button onclick="cambiarEstado('${doc.id}', 'Entregado')">
🟢 Entregado
</button>


</article>

`;

    });

}

window.cambiarEstado = cambiarEstado;
