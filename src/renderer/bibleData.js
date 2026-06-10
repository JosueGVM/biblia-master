// Este archivo es el "diccionario" que organiza tu base de datos
const bibleStructure = [
    // Pentateuco (Antiguo Testamento)
    { name: "Génesis", group: "Pentateuco", testament: "Antiguo" },
    { name: "Éxodo", group: "Pentateuco", testament: "Antiguo" },
    { name: "Levítico", group: "Pentateuco", testament: "Antiguo" },
    { name: "Números", group: "Pentateuco", testament: "Antiguo" },
    { name: "Deuteronomio", group: "Pentateuco", testament: "Antiguo" },
      // Históricos (Antiguo Testamento)
    { name: "Josué", group: "Históricos", testament: "Antiguo" },
    { name: "Jueces", group: "Históricos", testament: "Antiguo" },
    { name: "Rut", group: "Históricos", testament: "Antiguo" },
    { name: "1 Samuel", group: "Históricos", testament: "Antiguo" },
    { name: "2 Samuel", group: "Históricos", testament: "Antiguo" },
    { name: "1 Reyes", group: "Históricos", testament: "Antiguo" },
    { name: "2 Reyes", group: "Históricos", testament: "Antiguo" },
    { name: "1 Crónicas", group: "Históricos", testament: "Antiguo" },
    { name: "2 Crónicas", group: "Históricos", testament: "Antiguo" },
    { name: "Esdras", group: "Históricos", testament: "Antiguo" },
    { name: "Nehemías", group: "Históricos", testament: "Antiguo" },
    { name: "Ester", group: "Históricos", testament: "Antiguo" },
      // Poéticos (Antiguo Testamento)
    { name: "Job", group: "Poéticos", testament: "Antiguo" },
    { name: "Salmos", group: "Poéticos", testament: "Antiguo" },
    { name: "Proverbios", group: "Poéticos", testament: "Antiguo" },
    { name: "Eclesiastés", group: "Poéticos", testament: "Antiguo" },
    { name: "Cantares", group: "Poéticos", testament: "Antiguo" },
      // Profetas Mayores (Antiguo Testamento)
    { name: "Isaías", group: "Profetas Mayores", testament: "Antiguo" },
    { name: "Jeremías", group: "Profetas Mayores", testament: "Antiguo" },
    { name: "Lamentaciones", group: "Profetas Mayores", testament: "Antiguo" },
    { name: "Ezequiel", group: "Profetas Mayores", testament: "Antiguo" },
    { name: "Daniel", group: "Profetas Mayores", testament: "Antiguo" },
      // Profetas Menores (Antiguo Testamento)
    { name: "Oseas", group: "Profetas Menores", testament: "Antiguo" },
    { name: "Joel", group: "Profetas Menores", testament: "Antiguo" },
    { name: "Amós", group: "Profetas Menores", testament: "Antiguo" },
    { name: "Abdías", group: "Profetas Menores", testament: "Antiguo" },
    { name: "Jonás", group: "Profetas Menores", testament: "Antiguo" },
    { name: "Miqueas", group: "Profetas Menores", testament: "Antiguo" },
    { name: "Nahúm", group: "Profetas Menores", testament: "Antiguo" },
    { name: "Habacuc", group: "Profetas Menores", testament: "Antiguo" },
    { name: "Sofonías", group: "Profetas Menores", testament: "Antiguo" },
    { name: "Hageo", group: "Profetas Menores", testament: "Antiguo" },
    { name: "Zacarías", group: "Profetas Menores", testament: "Antiguo" },
    { name: "Malaquías", group: "Profetas Menores", testament: "Antiguo" },
      // Evangelios (Nuevo Testamento)
    { name: "Mateo", group: "Evangelios", testament: "Nuevo" },
    { name: "Marcos", group: "Evangelios", testament: "Nuevo" },
    { name: "Lucas", group: "Evangelios", testament: "Nuevo" },
    { name: "Juan", group: "Evangelios", testament: "Nuevo" },
      // Historia (Nuevo Testamento)
    { name: "Hechos", group: "Historia", testament: "Nuevo" },
      // Cartas Paulinas (Nuevo Testamento)
    { name: "Romanos", group: "Cartas Paulinas", testament: "Nuevo" },
    { name: "1 Corintios", group: "Cartas Paulinas", testament: "Nuevo" },
    { name: "2 Corintios", group: "Cartas Paulinas", testament: "Nuevo" },
    { name: "Gálatas", group: "Cartas Paulinas", testament: "Nuevo" },
    { name: "Efesios", group: "Cartas Paulinas", testament: "Nuevo" },
    { name: "Filipenses", group: "Cartas Paulinas", testament: "Nuevo" },
    { name: "Colosenses", group: "Cartas Paulinas", testament: "Nuevo" },
    { name: "1 Tesalonicenses", group: "Cartas Paulinas", testament: "Nuevo" },
    { name: "2 Tesalonicenses", group: "Cartas Paulinas", testament: "Nuevo" },
    { name: "1 Timoteo", group: "Cartas Paulinas", testament: "Nuevo" },
    { name: "2 Timoteo", group: "Cartas Paulinas", testament: "Nuevo" },
    { name: "Tito", group: "Cartas Paulinas", testament: "Nuevo" },
    { name: "Filemón", group: "Cartas Paulinas", testament: "Nuevo" },
      // Cartas Generales (Nuevo Testamento)
    { name: "Hebreos", group: "Cartas Generales", testament: "Nuevo" },
    { name: "Santiago", group: "Cartas Generales", testament: "Nuevo" },
    { name: "1 Pedro", group: "Cartas Generales", testament: "Nuevo" },
    { name: "2 Pedro", group: "Cartas Generales", testament: "Nuevo" },
    { name: "1 Juan", group: "Cartas Generales", testament: "Nuevo" },
    { name: "2 Juan", group: "Cartas Generales", testament: "Nuevo" },
    { name: "3 Juan", group: "Cartas Generales", testament: "Nuevo" },
    { name: "Judas", group: "Cartas Generales", testament: "Nuevo" },
      // Profético (Nuevo Testamento)
    { name: "Apocalipsis", group: "Profético", testament: "Nuevo" }
    
];

// Grupos para la navegación
const bibleGroups = {
    "Antiguo Testamento": ["Pentateuco", "Históricos", "Poéticos", "Profetas Mayores", "Profetas Menores"],
    "Nuevo Testamento": ["Evangelios", "Historia", "Cartas Paulinas", "Cartas Pastorales", "Cartas Generales", "Profético"]
};