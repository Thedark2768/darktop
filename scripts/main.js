// Mostrar Diamantes al cargar la página
document.getElementById("diamonds").classList.add("show");

function showCategory(id, boton){

    // Oculta todas las categorías
    document.querySelectorAll(".category").forEach(categoria=>{
        categoria.classList.remove("show");
    });

    // Muestra la categoría elegida
    document.getElementById(id).classList.add("show");

    // Quita el estilo activo de todos los botones
    document.querySelectorAll(".categorias button").forEach(btn=>{
        btn.classList.remove("activo");
    });

    // Activa el botón seleccionado
    boton.classList.add("activo");
}