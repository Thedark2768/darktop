const form = document.getElementById("contactForm");

form.addEventListener("submit", function(e){

    e.preventDefault();

    const name = document.getElementById("name").value.trim();

    const email = document.getElementById("email").value.trim();

    const deal = document.getElementById("deal").value.trim();

    const message = document.getElementById("message").value.trim();

    const text =

`Hola DarkTop.

Quiero comunicarme con ustedes.

👤 Nombre: ${name}

📧 Correo: ${email}

📌 Asunto: ${deal}

📝 Mensaje:
${message}`;

    const whatsapp =
`https://wa.me/50237386967?text=${encodeURIComponent(text)}`;

    window.open(whatsapp,"_blank");

});