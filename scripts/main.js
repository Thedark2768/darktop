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