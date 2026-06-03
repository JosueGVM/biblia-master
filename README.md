# 📖 Biblia Master

**Biblia Master** es un lector de la Biblia personalizado, minimalista y multiplataforma, construido con tecnologías web modernas y enfocado en la experiencia de estudio profundo. Permite la comparación dinámica de versiones, navegación contextual inteligente y una personalización completa de la interfaz.

Este proyecto nació como un ejercicio de aprendizaje en programación, buscando crear una herramienta que sea tan funcional como estéticamente agradable.

---

## ✨ Características Principales

-   **🚀 Comparación Multiversión:** Añade tantas columnas como necesites para comparar diferentes versiones de la Biblia cara a cara.
-   **🔗 Scroll Sincronizado:** Todas las columnas se desplazan en perfecta sincronía mediante un sistema de porcentaje de lectura.
-   **🧭 Navegación Inteligente:** Barras laterales dinámicas que agrupan los libros y abren automáticamente las secciones más cercanas al texto actual.
-   **🔍 Buscador Global:** Encuentra palabras o frases en toda la Biblia de forma instantánea.
-   **🎨 Personalización Total:**
    -   Modos de color: Oscuro, Claro y **Sepia** (descanso visual).
    -   Ajuste dinámico del tamaño de la fuente.
    -   Cambio de tipografía (Serif para lectura clásica o Sans para modernidad).
-   **🔒 Privacidad y Control:** El software es un lector de archivos SQLite locales. El usuario tiene control total sobre sus bases de datos.

---

## 🛠️ Tecnologías Utilizadas

-   **Electron:** Para crear la aplicación de escritorio.
-   **JavaScript (Vanilla):** Lógica modular y dinámica.
-   **CSS3:** Diseño responsivo basado en variables personalizables.
-   **SQLite 3:** Motor de base de datos rápido y ligero.
-   **Better-SQLite3 / SQLite3:** Gestión eficiente de consultas asíncronas.

---

## 🚀 Instalación y Uso

### Requisitos Previos
Debes tener instalado [Node.js](https://nodejs.org/) en tu equipo.

### Pasos
1. Clona este repositorio:
   ```bash
   git clone https://github.com/JosueGVM/biblia-master.git
   
2. Entra en la carpeta del proyecto:
    cd biblia-master
    
3. Instala las dependencias:
    npm install


📁 Configuración de la Base de Datos
- Por razones de derechos de autor, este repositorio no incluye los textos bíblicos.
- Para que la aplicación funcione, debes colocar tu archivo bibles.db en la carpeta src/database/.

👉 Consulta la Guía de Configuración de Base de Datos para conocer la estructura de tablas requerida y cómo importar tus versiones.

📜 Licencia:
- Este proyecto está bajo la Licencia MIT. Siéntete libre de usar el código, aprender de él y mejorarlo.

👨‍💻 Créditos:
Proyecto desarrollado por JosueGVM como parte de un proceso de aprendizaje autodidacta en desarrollo de software, 
con asistencia de IA para la optimización y estructuración del código.