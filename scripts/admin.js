import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";

import {
    collection,
    getDocs,
    getDoc,
    doc,
    updateDoc,
    deleteDoc,
    query,
    where
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js"; 

onAuthStateChanged(auth, async (usuario) => {

    if (!usuario) {

        window.location.href = "login.html";
        return;

    }

    await cargarPedidos();
    await cargarReviews();

});

async function cambiarEstado(id, estado) {

    try {

        // Pedido
        const pedidoRef = doc(db, "pedidos", id);

        const pedidoSnap = await getDoc(pedidoRef);

        if (!pedidoSnap.exists()) {

            alert("El pedido no existe.");
            return;

        }

        const pedido = pedidoSnap.data();

        // Actualizar pedido
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

        await cargarPedidos();
        await cargarReviews();
    } catch (error) {

        console.error(error);

        alert("No se pudo actualizar el estado.");

    }

}

const lista = document.getElementById("listaPedidos");

const listaReviews =
document.getElementById("listaReviews");

const tabPedidos =
document.getElementById("tabPedidos");

const tabReviews =
document.getElementById("tabReviews");

const pedidosPanel =
document.getElementById("pedidosPanel");

const reviewsPanel =
document.getElementById("reviewsPanel");

tabPedidos.addEventListener("click", () => {

    pedidosPanel.hidden = false;

    reviewsPanel.hidden = true;

    tabPedidos.classList.add("active");

    tabReviews.classList.remove("active");

});

tabReviews.addEventListener("click", () => {

    pedidosPanel.hidden = true;

    reviewsPanel.hidden = false;

    tabReviews.classList.add("active");

    tabPedidos.classList.remove("active");

});


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

        // Obtener el pedido
        const pedidoRef = doc(db, "pedidos", id);

        const pedidoSnap = await getDoc(pedidoRef);

        if (!pedidoSnap.exists()) {

            alert("El pedido no existe.");

            return;

        }

        const pedido = pedidoSnap.data();

        // Eliminar el código de reseña
        if (pedido.codigoResena) {

            await deleteDoc(
                doc(db, "reviewCodes", pedido.codigoResena)
            );

        }

        // Eliminar el pedido
        await deleteDoc(pedidoRef);

        alert("Pedido eliminado correctamente");

        cargarPedidos();

    } catch (error) {

        console.error("Error al eliminar:", error);

        alert("No se pudo eliminar el pedido");

    }

}

function formatearFecha(fecha) {

    if (!fecha) return "Sin fecha";

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

async function cargarPedidos() {

    const consulta = await getDocs(collection(db, "pedidos"));

    console.log("Pedidos encontrados:", consulta.size);

    lista.innerHTML = "";

    consulta.forEach((docSnap) => {

        const pedido = docSnap.data();

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
onclick="cambiarEstado('${docSnap.id}', 'Procesando')">
🔵 Procesando
</button>

<button class="done"
onclick="cambiarEstado('${docSnap.id}', 'Entregado')">
🟢 Entregado
</button>

<button
class="delete"
onclick="eliminarPedido('${docSnap.id}')">
🗑️ Eliminar
</button>

</article>

`;

    });

}

async function cargarReviews() {

    const consulta = collection(db, "reviews");
const snapshot = await getDocs(consulta);

    const snapshot = await getDocs(consulta);

    listaReviews.innerHTML = "";

    if (snapshot.empty) {

        listaReviews.innerHTML =
            "<p>No hay reseñas pendientes.</p>";

        return;

    }

    snapshot.forEach((docSnap) => {

        const review = docSnap.data();

        let estrellas = "";

        for (let i = 0; i < review.estrellas; i++) {

            estrellas += "⭐";

        }

        listaReviews.innerHTML += `

<article>

<h3>${estrellas}</h3>

<p><strong>${review.producto}</strong></p>

<p>Jugador: ${review.jugador}</p>

<p>${review.comentario}</p>
<p><strong>Estado:</strong> ${review.estado}</p>

<button
class="done"
onclick="aprobarReview('${docSnap.id}')">

✅ Aprobar

</button>

<button
class="delete"
onclick="rechazarReview('${docSnap.id}')">

❌ Ocultar

</button>

<button
class="delete"
onclick="eliminarReview('${docSnap.id}')">
🗑️ Eliminar
</button>

</article>

`;

    });

}

async function aprobarReview(id) {

    try {

        await updateDoc(
            doc(db, "reviews", id),
            {
                estado: "Aprobada"
            }
        );

        await cargarReviews();

        alert("Reseña aprobada.");

    } catch (error) {

        console.error(error);

        alert("No se pudo aprobar la reseña.");

    }

}

async function rechazarReview(id) {

    try {

        await updateDoc(
            doc(db, "reviews", id),
            {
                estado: "Oculta"
            }
        );

        await cargarReviews();

        alert("Reseña ocultada.");

    } catch (error) {

        console.error(error);

        alert("No se pudo ocultar la reseña.");

    }

}

async function eliminarReview(id) {

    const confirmar = confirm(
        "¿Eliminar esta reseña definitivamente?"
    );

    if (!confirmar) return;

    try {

        await deleteDoc(
            doc(db, "reviews", id)
        );

        await cargarReviews();

        alert("Reseña eliminada.");

    } catch (error) {

        console.error(error);

        alert("No se pudo eliminar.");

    }

}

window.cambiarEstado = cambiarEstado;
window.eliminarPedido = eliminarPedido;
window.aprobarReview = aprobarReview;
window.rechazarReview = rechazarReview; 
window.eliminarReview = eliminarReview;
