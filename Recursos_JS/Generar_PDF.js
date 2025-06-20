// Preview de imágenes
function setupImagePreview(inputId, previewId, imgId) {
  const input = document.getElementById(inputId);
  const preview = document.getElementById(previewId);
  const img = document.getElementById(imgId);

  if (input && preview && img) {
    input.addEventListener("change", function (e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
          img.src = e.target.result;
          preview.style.display = "block";
        };
        reader.readAsDataURL(file);
      } else {
        img.src = "";
        preview.style.display = "none";
      }
    });
  } else {
    console.warn(
      `Alguno de los elementos para preview (input: ${inputId}, preview: ${previewId}, img: ${imgId}) no fue encontrado. La previsualización de imagen no funcionará.`
    );
  }
}

// Configurar previews (sin la imagen adicional ya que será por defecto)
setupImagePreview("fotoAlumno", "previewAlumno", "imgAlumno");
setupImagePreview("foto1", "preview1", "img1");
setupImagePreview("foto2", "preview2", "img2");
setupImagePreview("foto3", "preview3", "img3");

// Función para convertir archivo a base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve({ data: reader.result, type: file.type });
    reader.onerror = (error) => reject(error);
  });
}

// Para convertir una imagen desde una URL (como la del <img> del header) a Base64
async function urlToBase64(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () =>
        resolve({ data: reader.result, type: blob.type });
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error al convertir URL a Base64:", error);
    return null;
  }
}

// Función principal para generar PDF
async function generatePDF(formData) {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF("p", "mm", [71.76, 107.94]);
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Colores
  const primaryColor = [79, 70, 229];
  const secondaryColor = [124, 58, 237];
  const textColor = [55, 65, 81];

  // ==================== PÁGINA 1: DATOS DEL ALUMNO ====================

  // Fondo degradado
  pdf.setFillColor(240, 240, 255);
  pdf.rect(0, 0, pageWidth, pageHeight, "F");

  // === AGREGAR Y CENTRAR EL LOGO DEL HEADER ===
  let contentStartY = 5;
  const logoWidth = 40;
  const logoHeight = 15;

  const headerLogoElement = document.querySelector(".header-logo");
  if (headerLogoElement && headerLogoElement.src) {
    try {
      const logoData = await urlToBase64(headerLogoElement.src);
      if (logoData && logoData.data) {
        const logoX = (pageWidth - logoWidth) / 2;
        const logoY = 3;
        pdf.addImage(
          logoData.data,
          logoData.type,
          logoX,
          logoY,
          logoWidth,
          logoHeight
        );
        contentStartY = logoY + logoHeight + 2;
      } else {
        console.warn(
          "No se pudo obtener la imagen del logo del header o convertirla a Base64."
        );
        contentStartY = 10;
      }
    } catch (error) {
      console.error("Error al procesar el logo del header:", error);
      contentStartY = 10;
    }
  } else {
    console.warn("El elemento .header-logo no fue encontrado o no tiene src.");
    contentStartY = 10;
  }

  contentStartY += 5;

  // ===== SECCIÓN DE FOTOS MODIFICADA =====
  // Marco para foto del alumno (ajustado para hacer espacio a la imagen adicional)
  const photoX = 10; // Se mueve un poco a la izquierda
  const photoY = contentStartY;
  const photoWidth = 16; // Reducido ligeramente para hacer espacio
  const photoHeight = 18; // Reducido ligeramente

  // Fondo dorado para el marco del alumno
  pdf.setFillColor(164, 112, 36);
  pdf.roundedRect(
    photoX - 2,
    photoY - 2,
    photoWidth + 4,
    photoHeight + 4,
    2,
    2,
    "F"
  );

  // Marco rojo
  pdf.setFillColor(112, 29, 11);
  pdf.roundedRect(photoX, photoY, photoWidth, photoHeight, 1, 1, "F");

  // Insertar foto del alumno
  if (formData.fotoAlumno && formData.fotoAlumno.data) {
    try {
      pdf.addImage(
        formData.fotoAlumno.data,
        formData.fotoAlumno.type,
        photoX + 1,
        photoY + 1,
        photoWidth - 2,
        photoHeight - 2
      );
    } catch (error) {
      console.error(`Error al agregar foto del alumno:`, error);
    }
  }

  // ===== NUEVA IMAGEN ADICIONAL A LA DERECHA (POR DEFECTO) =====
  const additionalImageX = photoX + photoWidth + 20; // Posición a la derecha de la foto del alumno
  const additionalImageY = photoY;
  const additionalImageWidth = 20; // Tamaño de la imagen adicional (Ancho)
  const additionalImageHeight = 20; // Tamaño de la imagen adicional (Alto)
  // Insertar imagen adicional por defecto
  try {
    // CAMBIAR esta ruta por la imagen que tengas en tu proyecto
    const imagenPorDefectoUrl = "/imagenes/Aguila_Inverted.png"; // 👈 CAMBIA ESTA RUTA
    const imagenPorDefectoData = await urlToBase64(imagenPorDefectoUrl);

    if (imagenPorDefectoData && imagenPorDefectoData.data) {
      pdf.addImage(
        imagenPorDefectoData.data,
        imagenPorDefectoData.type,
        additionalImageX + 1,
        additionalImageY + 1,
        additionalImageWidth - 2,
        additionalImageHeight - 2
      );
    } else {
      console.warn("No se pudo cargar la imagen por defecto");
    }
  } catch (error) {
    console.error(`Error al agregar imagen por defecto:`, error);
  }

  // Actualizar contentStartY después de ambas imágenes
  contentStartY =
    Math.max(photoY + photoHeight, additionalImageY + additionalImageHeight) +
    5;

  // Campo NOMBRE (sin cambios)
  pdf.setFillColor(52, 152, 219);
  pdf.roundedRect(8, contentStartY, pageWidth - 16, 6, 1, 1, "F");
  pdf.setFontSize(6);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(255, 255, 255);
  pdf.text("NOMBRE:", 9, contentStartY + 4);

  pdf.setFontSize(7);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
  pdf.text(formData.nombre || "", 9, contentStartY + 11);

  contentStartY += 17;

  // Campo CATEGORÍA (sin cambios)
  pdf.setFillColor(52, 152, 219);
  pdf.roundedRect(8, contentStartY, pageWidth - 16, 6, 1, 1, "F");
  pdf.setFontSize(6);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(255, 255, 255);
  pdf.text("CATEGORÍA:", 9, contentStartY + 4);

  pdf.setFontSize(7);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
  pdf.text(formData.categoria || "", 9, contentStartY + 11);

  contentStartY += 17;

  // Campo FOLIO (sin cambios)
  pdf.setFillColor(52, 152, 219);
  pdf.roundedRect(8, contentStartY, pageWidth - 16, 6, 1, 1, "F");
  pdf.setFontSize(6);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(255, 255, 255);
  pdf.text("FOLIO:", 9, contentStartY + 4);

  pdf.setFontSize(6);
  pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
  pdf.text(formData.folio, 9, contentStartY + 11);

  // ==================== PÁGINA 2: PERSONAS AUTORIZADAS ====================
  // (Sin cambios en la página 2)

  pdf.addPage();
  pdf.setFillColor(240, 240, 255);
  pdf.rect(0, 0, pageWidth, pageHeight, "F");

  let currentY = 12;
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  pdf.text("PERSONAS AUTORIZADAS", 5, currentY);
  pdf.text("PARA RECOGER AL NIÑO", 5, currentY + 6);

  currentY += 15;

  const personasData = [
    { nombre: formData.autorizado1, foto: formData.foto1 },
    { nombre: formData.autorizado2, foto: formData.foto2 },
    { nombre: formData.autorizado3, foto: formData.foto3 },
  ];

  for (const [index, persona] of personasData.entries()) {
    const fotoX = 5;
    const fotoY = currentY;
    const fotoSize = 12;

    pdf.setFillColor(41, 128, 185);
    pdf.roundedRect(
      fotoX - 0.5,
      fotoY - 0.5,
      fotoSize + 1,
      fotoSize + 1,
      0.5,
      0.5,
      "F"
    );

    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(fotoX, fotoY, fotoSize, fotoSize, 0.5, 0.5, "F");

    if (persona.foto && persona.foto.data) {
      try {
        pdf.addImage(
          persona.foto.data,
          persona.foto.type,
          fotoX + 0.5,
          fotoY + 0.5,
          fotoSize - 1,
          fotoSize - 1
        );
      } catch (error) {
        console.error(`Error al agregar foto ${index + 1}:`, error);
      }
    }

    const fieldX = 20;
    const fieldWidth = pageWidth - 25;
    const fieldHeight = 4;
    const fieldY = currentY + 4;

    pdf.setFillColor(52, 152, 219);
    pdf.roundedRect(fieldX, fieldY, fieldWidth, fieldHeight, 0.5, 0.5, "F");

    if (persona.nombre) {
      pdf.setFontSize(5);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(255, 255, 255);
      pdf.text(persona.nombre, fieldX + 1, fieldY + 2.5);
    }

    currentY += 20;
  }

  pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  pdf.triangle(pageWidth - 8, 35, pageWidth - 5, 30, pageWidth - 2, 35, "F");
  pdf.triangle(pageWidth - 8, 55, pageWidth - 5, 50, pageWidth - 2, 55, "F");
  pdf.triangle(pageWidth - 8, 75, pageWidth - 5, 70, pageWidth - 2, 75, "F");

  const fileName = `Aventura_${
    formData.nombre ? formData.nombre.replace(/\s+/g, "_") : "Alumno"
  }_${formData.folio || "Sin_Folio"}.pdf`;
  pdf.save(fileName);
}

// Función para validar el campo nombre
function validarNombre(nombre) {
  const regex = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$/;
  return regex.test(nombre);
}

// Manejar envío del formulario
document
  .getElementById("formulario")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const campos = [
      { id: "nombre", label: "nombre" },
      { id: "autorizado1", label: "autorizado1" },
      { id: "autorizado2", label: "autorizado2" },
      { id: "autorizado3", label: "autorizado3" },
    ];

    const submitBtn = document.querySelector(".submit-btn");
    const originalText = submitBtn.textContent;

    for (const campo of campos) {
      const valor = document.getElementById(campo.id).value;
      if (valor.length > 0 && !validarNombre(valor)) {
        alert(
          `El campo "${campo.label}" solo puede contener letras y espacios.`
        );
        document.getElementById(campo.id).focus();
        return;
      }
    }

    try {
      submitBtn.textContent = "📄 Generando PDF...";
      submitBtn.disabled = true;

      const formData = {
        nombre: document.getElementById("nombre").value,
        categoria: document.getElementById("categoria").value,
        folio: document.getElementById("folio").value,
        autorizado1: document.getElementById("autorizado1").value,
        autorizado2: document.getElementById("autorizado2").value,
        autorizado3: document.getElementById("autorizado3").value,
      };

      // Procesamiento de archivos (sin la imagen adicional)
      const filesToProcess = ["fotoAlumno", "foto1", "foto2", "foto3"];
      for (const fileId of filesToProcess) {
        const fileInput = document.getElementById(fileId);
        if (fileInput && fileInput.files[0]) {
          formData[fileId] = await fileToBase64(fileInput.files[0]);
        }
      }

      await generatePDF(formData);
      alert("✅ PDF generado exitosamente!");
      document.getElementById("formulario").reset();

      // Limpiar previews de imágenes
      const previews = ["previewAlumno", "preview1", "preview2", "preview3"];
      const imgs = ["imgAlumno", "img1", "img2", "img3"];
      previews.forEach((id, idx) => {
        const preview = document.getElementById(id);
        const img = document.getElementById(imgs[idx]);
        if (preview) preview.style.display = "none";
        if (img) img.src = "";
      });
    } catch (error) {
      console.error("Error al generar PDF:", error);
      alert("❌ Error al generar el PDF. Por favor, intenta nuevamente.");
    } finally {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  });
