import { db } from "./firebase.js";

import {
    collection,
    getDocs,
    query,
    where,
    orderBy,
    limit
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";

const guideButton = document.getElementById("guide-button");
const guideModal = document.getElementById("guide-modal");
const closeGuide = document.querySelector(".close-guide");
const closeGuideButton = document.querySelector(".close-guide-button");
const reviewsContainer = document.getElementById("reviewsContainer");

const abrirModal = () => {
    guideModal.classList.add("show");
};

const cerrarModal = () => {
    guideModal.classList.remove("show");
};

guideButton?.addEventListener("click", abrirModal);

closeGuide?.addEventListener("click", cerrarModal);

closeGuideButton?.addEventListener("click", cerrarModal);

guideModal?.addEventListener("click", ({ target }) => {
    if (target === guideModal) {
        cerrarModal();
    }
});

async function cargarReviews() {
    if (!reviewsContainer) return;

    try {
        const consulta = query(
            collection(db, "reviews"),
            where("estado", "==", "Aprobada"),
            orderBy("fecha", "desc"),
            limit(6)
        );

        const snapshot = await getDocs(consulta);

        if (snapshot.empty) {
            reviewsContainer.innerHTML = "<p>Aún no hay reseñas.</p>";
            return;
        }

        let html = "";

        snapshot.forEach((doc) => {
            const review = doc.data();

            html += `
                <article class="review-card">
                    <div class="review-stars">
                        ${"⭐".repeat(review.estrellas)}
                    </div>

                    <p class="review-comment">
                        "${review.comentario}"
                    </p>

                    <div class="review-footer">
                        <div>
                            <strong class="review-player">
                                ${review.jugador}
                            </strong>

                            <span class="review-product">
                                ${review.producto}
                            </span>
                        </div>
                    </div>
                </article>
            `;
        });

        reviewsContainer.innerHTML = html;

    } catch (error) {
        console.error("Error al cargar reseñas:", error);

        reviewsContainer.innerHTML = `
            <p>No fue posible cargar las reseñas. Inténtalo más tarde.</p>
        `;
    }
}

document.addEventListener("DOMContentLoaded", cargarReviews);
