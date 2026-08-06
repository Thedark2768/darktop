import { auth, db } from "./firebase.js";

import {
    collection,
    getDocs,
    getDoc,
    doc,
    updateDoc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";

onAuthStateChanged(auth, (usuario) => {

    if (!usuario) {

        window.location.href = "login.html";

        return;
    }

    cargarPedidos();

});

async function cambiarEstado(id, estado) {

    // Referencia al pedido
    const pedidoRef = doc(db, "pedidos", id);

    // Obtener los datos del pedido
    const pedidoSnap = await getDoc(pedidoRef);

    if (!pedidoSnap.exists()) {

        alert("El pedido no existe.");

        return;

    }

    const pedido = pedidoSnap.data();

    // Actualizar el pedido
    await updateDoc(pedidoRef, {

        estado: estado,

        reseñaHabilitada: estado === "Entregado"

    });

    // Actualizar reviewCodes
    const reviewCodeRef = doc(
        db,
        "reviewCodes",
        pedido.codigoResena
    );

    await updateDoc(reviewCodeRef, {

        estado: estado,

        habilitada: estado === "Entregado"

    });

    cargarPedidos();

}

const lista = document.getElementById("listaPedidos");

document.getElementById("logoutBtn").addEventListener("click", async () => {

    await signOut(auth);

    window.location.href = "login.html";

});

async function eliminarPedido(id) {

    const confirmar = confirm(
        "¿Seguro que quieres eliminar este pedido?"
    );

    if (!confirmar) return;

    try {

        await deleteDoc(doc(db, "pedidos", id));

        alert("Pedido eliminado correctamente");

        cargarPedidos();

    } catch (error) {

        console.error("Error al eliminar:", error);

        alert("No se pudo eliminar el pedido");

    }
}

function formatearFecha(fecha) {

    if (!fecha) return "Sin fecha";

    // Firebase Timestamp
    if (typeof fecha.toDate === "function") {
        fecha = fecha.toDate();
    }

    return fecha.toLocaleString("es-GT", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

async function cargarPedidos(){

    const consulta = await getDocs(collection(db,"pedidos"));

console.log("Pedidos encontrados:", consulta.size);

    lista.innerHTML = "";

    consulta.forEach((doc)=>{

        const pedido = doc.data();

        lista.innerHTML += `

<article>

<h3>📦 ${pedido.pedidoId || "Sin número"}</h3>

<p><strong>${pedido.producto}</strong></p>

<p>ID: ${pedido.id}</p>

<p>Jugador: ${pedido.jugador}</p>

<p>Precio: Q${pedido.precio}</p>

<p>Pago: ${pedido.metodoPago}</p>

<p>Estado: ${pedido.estado}</p>

<p>⭐ Código de reseña: 
<strong>${pedido.codigoResena || "Sin código"}</strong>
</p>

<p>📝 Reseña utilizada:
<strong>${pedido.resenaUsada ? "✅ Sí" : "❌ No"}</strong>
</p>

<p>📅 Fecha: ${formatearFecha(pedido.fecha)}</p>


<button class="processing"
onclick="cambiarEstado('${doc.id}', 'Procesando')">
🔵 Procesando
</button>


<button class="done"
onclick="cambiarEstado('${doc.id}', 'Entregado')">
🟢 Entregado
</button>


<button
    class="delete"
    onclick="eliminarPedido('${doc.id}')">
    🗑️ Eliminar
</button>

</article>
`;

    });

}

window.cambiarEstado = cambiarEstado;
window.eliminarPedido = eliminarPedido;
