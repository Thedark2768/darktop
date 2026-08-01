import { db } from "./firebase.js";
console.log(db);

import { 
    collection,
    getDocs,
    doc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";

const lista = document.getElementById("listaPedidos");


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

        </article>

        `;

    });

}


cargarPedidos();
