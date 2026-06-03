# 📖 Configuración de la Base de Datos

Este lector de Biblia está diseñado para ser modular y privado. Por razones de derechos de autor, **este repositorio no incluye los textos bíblicos**. Para usar la aplicación, debes proveer tu propio archivo de base de datos siguiendo la estructura detallada a continuación.

## 🛠 Estructura Requerida

El archivo debe llamarse **`bibles.db`** y estar ubicado en esta carpeta (`src/database/`). Debe ser una base de datos **SQLite 3** con la siguiente tabla:

### Tabla: `bible_verses`

| Columna | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | INTEGER | Clave primaria (Autoincrement) |
| `version` | TEXT | Siglas de la versión (Ej: RV1960, NVI, DHH) |
| `book_name` | TEXT | Nombre completo del libro (Ej: Génesis, Mateo) |
| `chapter` | INTEGER | Número del capítulo |
| `verse_number` | INTEGER | Número del versículo |
| `text` | TEXT | Contenido del versículo |

### ⚡ Optimización (Recomendado)
Para que las búsquedas y la navegación sean instantáneas, se recomienda crear el siguiente índice:

```sql
CREATE INDEX "idx_bible" ON "bible_verses" (
	"version",
	"book_name",
	"chapter"
);