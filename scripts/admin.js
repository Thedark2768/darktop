import { db } from "./firebase.js";

import { 
    collection, 
    getDocs 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


const lista = document.getElementById("listaPedidos");


async function cargarPedidos(){

    const consulta = await getDocs(collection(db,"pedidos"));

    lista.innerHTML = "";

    consulta.forEach((doc)=>{

        const pedido = doc.data();

        lista.innerHTML += `

        <article>

            <h3>${pedido.producto}</h3>

            <p>ID: ${pedido.id}</p>

            <p>Jugador: ${pedido.nombre}</p>

            <p>Precio: Q${pedido.precio}</p>

            <p>Pago: ${pedido.metodoPago}</p>

            <p>Estado: ${pedido.estado}</p>

        </article>

        `;

    });

}


cargarPedidos();
