// Categories
const buttons = document.querySelectorAll(".category-button");
const categories = document.querySelectorAll(".category");

//Save products
let currentProduct = "";
let currentPrice = "";

// Change category
buttons.forEach(button => {

    button.addEventListener("click", () => {

        // Remove active states
        buttons.forEach(btn => btn.classList.remove("active"));
        categories.forEach(category => category.classList.remove("visible"));

        // Activate selected button
        button.classList.add("active");

        // Show selected category
        const id = button.dataset.category;
        document.getElementById(id).classList.add("visible");

    });

});

const selectedProduct = document.getElementById("selected-product");
const modal = document.getElementById("purchase-modal");
const buyButtons = document.querySelectorAll(".buy-button");
const closeButton = document.querySelector(".close-button");
const idInput = document.getElementById("id");
const idError = document.getElementById("id-error");
const continueButton = document.getElementById("continue-button");


buyButtons.forEach(button =>{
    button.addEventListener("click", () => {
        currentProduct = button.dataset.product;
        currentPrice = button.dataset.price;

        selectedProduct.textContent = `${currentProduct} a Q${currentPrice}`;
        modal.classList.add("show");
    });
});

closeButton.addEventListener("click", () =>{
    modal.classList.remove("show");
});

modal.addEventListener("click", (event) => {
    if(event.target === modal){
        modal.classList.remove("show");
    }
});

continueButton.addEventListener("click", () => {
    const id = idInput.value.trim();

    idError.textContent = "";

    if (id === ""){
        idError.textContent = "Por favor introduce tu ID.";
        
        return;
    }

    if(!/^\d+$/.test(id)){
        idError.textContent = "Solo numeros.";

        return;
    }

    if (id.length < 8 || id.length > 11){
        idError.textContent = "ID no apto.";

        console.log("sss")

        return;
    }
    const payment = document.getElementById("payment-method").value;

    const message = `*Nueva Orden - DarkTop*
    Producto: ${currentProduct}
    Precio: Q${currentPrice}
    
    ID: ${id}
    
    Metodo de Pago: ${payment}`;

    const phone = "50237386967";

    window.open(
        `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
        "_blank"
    );
});