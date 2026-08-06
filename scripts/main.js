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

guideButton.addEventListener("click", () => {
    guideModal.classList.add("show");
});

closeGuide.addEventListener("click", () => {
    guideModal.classList.remove("show");
});

closeGuideButton.addEventListener("click", () => {
    guideModal.classList.remove("show");
})

guideModal.addEventListener("click", (event) => {
    if (event.target === guideModal){
        guideModal.classList.remove("show");
    }
})

async function cargarReviews() {

    const reviewsContainer =
        document.getElementById("reviewsContainer");

    const consulta = query(

        collection(db, "reviews"),

        where("estado", "==", "Aprobada"),

        orderBy("fecha", "desc"),

        limit(6)

    );

    const snapshot = await getDocs(consulta);

    reviewsContainer.innerHTML = "";

    if (snapshot.empty) {

        reviewsContainer.innerHTML =
            "<p>Aún no hay reseñas.</p>";

        return;

    }

    snapshot.forEach((doc) => {

        const review = doc.data();

        let estrellas = "";

        for (let i = 0; i < review.estrellas; i++) {

            estrellas += "⭐";

        }

        reviewsContainer.innerHTML += `

<article class="review-card">

<h3>${estrellas}</h3>

<p>"${review.comentario}"</p>

<strong>${review.jugador}</strong>

<small>${review.producto}</small>

</article>

`;

    });

}

cargarReviews();
