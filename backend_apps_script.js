const SPREADSHEET_ID = '1gJjPjGDhjcfP_wMxQHYCEXkNHLD-lAewLhGeb-UMtBw';

function doPost(e) {
  var output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);
  
  try {
    var data = JSON.parse(e.postData.contents);
    var action = data.action;
    
    if (action === 'register') {
      return registerUser(data);
    } else if (action === 'login') {
      return loginUser(data);
    } else if (action === 'saveEvaluation') {
      return saveEvaluation(data);
    } else {
       return output.setContent(JSON.stringify({ success: false, error: 'Acción no válida' }));
    }
  } catch (error) {
    return output.setContent(JSON.stringify({ success: false, error: error.toString() }));
  }
}

function doGet(e) {
  var output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);

  try {
    var action = e.parameter.action;
    
    if (action === 'getProjects') {
      return getProjects(e.parameter.terna, e.parameter.email);
    } else if (action === 'getStats') {
      return getStats();
    } else if (action === 'getTerna') {
      return getTerna(e.parameter.email);
    } else if (action === 'getQuestions') {
      return getQuestions(e.parameter.categoria);
    } else {
      return output.setContent(JSON.stringify({ success: false, error: 'Acción GET no válida' }));
    }
  } catch (error) {
    return output.setContent(JSON.stringify({ success: false, error: error.toString() }));
  }
}

function getTerna(email) {
  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Ternas');
  if (!sheet) return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Pestaña 'Ternas' no encontrada" })).setMimeType(ContentService.MimeType.JSON);
  
  var values = sheet.getDataRange().getValues();
  var myTerna = null;
  
  // Buscar a qué terna pertenece el email
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][2]).trim() === String(email).trim()) { // Col C: Email_Evaluador
      myTerna = values[i][0]; // Col A: Nombre_Terna
      break;
    }
  }
  
  if (!myTerna) return ContentService.createTextOutput(JSON.stringify({ success: true, terna: null, companeros: [] })).setMimeType(ContentService.MimeType.JSON);
  
  // Buscar integrantes de la misma terna
  var companeros = [];
  for (var j = 1; j < values.length; j++) {
    if (values[j][0] === myTerna) {
      companeros.push(values[j][1]); // Añadir Nombre_Evaluador del integrante (Col B)
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({ success: true, terna: myTerna, companeros: companeros })).setMimeType(ContentService.MimeType.JSON);
}

function getProjects(terna, email) {
  var spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheetProyectos = spreadsheet.getSheetByName('Proyectos');
  var sheetEvaluaciones = spreadsheet.getSheetByName('Evaluaciones');
  
  if (!sheetProyectos) return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Pestaña 'Proyectos' no encontrada" })).setMimeType(ContentService.MimeType.JSON);
  
  // Obtener todos los códigos de proyectos ya evaluados por ESTE juez
  var evaluados = {};
  if (sheetEvaluaciones) {
    var evalValues = sheetEvaluaciones.getDataRange().getValues();
    for (var j = 1; j < evalValues.length; j++) {
      var codEval = evalValues[j][1]; // Col B (1) es Código Proyecto
      var juezEval = evalValues[j][2]; // Col C (2) es Juez (Email)
      var notaEval = evalValues[j][4]; // Col E (4) es Nota Total
      if (codEval && String(juezEval).trim() === String(email).trim()) {
        evaluados[codEval] = { evaluado: true, nota: notaEval };
      }
    }
  }
  
  var values = sheetProyectos.getDataRange().getValues();
  var projects = [];
  
  for (var i = 1; i < values.length; i++) {
    if (values[i][2]) { // Col C (Index 2) es ID_Proyecto
      // Filtrar por terna si se solicita (asumiendo Col S / Index 18 para "Terna_Asignada")
      var asignada = values[i][18] ? String(values[i][18]).trim() : '';
      if (terna && asignada.indexOf(terna) === -1) {
        continue;
      }

      var codigo = values[i][2];
      projects.push({
        'Fecha': values[i][0],
        'E_mail_Grupo': values[i][1],
        'ID_Proyecto': values[i][2],
        'Nombre_Largo_Proyecto': values[i][3],
        'Nombre_Corto_Proyecto': values[i][4],
        'No_Factura': values[i][5],
        'Funcionalidad_Proyecto': values[i][6],
        'Campus': values[i][7],
        'Alimentacion_Electrica': values[i][8],
        'Dimensiones_Stand': values[i][9],
        'Asignatura': values[i][10],
        'Carrera': values[i][11],
        'Periodo': values[i][12],
        'Categoria_Ingresada': values[i][13],
        'Catedratico': values[i][14],
        'Comprobante_Pago': values[i][15],
        'Fotografia_Grupal': values[i][16],
        'Articulo_Cientifico': values[i][17],
        'evaluado': evaluados[codigo] ? true : false,
        'nota_obtenida': evaluados[codigo] ? evaluados[codigo].nota : null
      });
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({ success: true, projects: projects })).setMimeType(ContentService.MimeType.JSON);
}

function getQuestions(categoria) {
  var sheetName = "Preguntas_" + categoria;
  var spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = spreadsheet.getSheetByName(sheetName);
  
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Pestaña '" + sheetName + "' no encontrada. Créala en tu Google Sheets." })).setMimeType(ContentService.MimeType.JSON);
  }
  
  var values = sheet.getDataRange().getValues();
  var questions = [];
  
  // Asumimos que la fila 0 son encabezados
  for (var i = 1; i < values.length; i++) {
    if (values[i][0]) { // Si hay bloque
      questions.push({
        bloque: values[i][0],
        numero: values[i][1],
        titulo: values[i][2],
        porcentaje: parseFloat(values[i][3]) || 0,
        puntos_A: parseFloat(values[i][4]) || 5, // Col E
        criterio_A: values[i][5] || "",          // Col F
        puntos_B: parseFloat(values[i][6]) || 3, // Col G
        criterio_B: values[i][7] || "",          // Col H
        puntos_C: parseFloat(values[i][8]) || 1, // Col I
        criterio_C: values[i][9] || ""           // Col J
      });
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({ success: true, questions: questions })).setMimeType(ContentService.MimeType.JSON);
}

function saveEvaluation(data) {
  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Evaluaciones');
  if (!sheet) return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Pestaña 'Evaluaciones' no encontrada" })).setMimeType(ContentService.MimeType.JSON);
  
  // Guardar evaluación con el nuevo formato detallado
  var newRow = [
    new Date(),
    data.codigoProyecto,
    data.correoJuez,
    data.categoria, // Col D
    data.notaTotal, // Col E
    JSON.stringify(data.respuestas), // Col F
    data.observaciones // Col G
  ];
  sheet.appendRow(newRow);
  
  return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'Evaluación guardada con éxito', nota: data.notaTotal })).setMimeType(ContentService.MimeType.JSON);
}

function getStats() {
  var spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  var sheetProyectos = spreadsheet.getSheetByName('Proyectos');
  var totalProjects = sheetProyectos ? Math.max(0, sheetProyectos.getLastRow() - 1) : 0;
  
  var sheetEvaluaciones = spreadsheet.getSheetByName('Evaluaciones');
  var totalEvaluations = sheetEvaluaciones ? Math.max(0, sheetEvaluaciones.getLastRow() - 1) : 0;
  
  var stats = {
    totalProjects: totalProjects,
    totalEvaluations: totalEvaluations,
    categories: 4
  };
  
  return ContentService.createTextOutput(JSON.stringify({ success: true, stats: stats })).setMimeType(ContentService.MimeType.JSON);
}

// ------------------------------------
// Funciones de Usuarios (Ya funcionales)
// ------------------------------------
function registerUser(data) {
  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Usuarios');
  if (!sheet) return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Pestaña 'Usuarios' no encontrada" })).setMimeType(ContentService.MimeType.JSON);
  var values = sheet.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][3]).trim() === String(data.email).trim()) { 
      return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'El correo ya está registrado' })).setMimeType(ContentService.MimeType.JSON);
    }
  }
  var idUsuario = Utilities.getUuid().split('-')[0].toUpperCase();
  var newRow = [new Date(), idUsuario, data.name, data.email, data.password];
  sheet.appendRow(newRow);
  return ContentService.createTextOutput(JSON.stringify({ success: true, user: { name: data.name, email: data.email, role: 'Evaluador' } })).setMimeType(ContentService.MimeType.JSON);
}

function loginUser(data) {
  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Usuarios');
  if (!sheet) return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Pestaña 'Usuarios' no encontrada" })).setMimeType(ContentService.MimeType.JSON);
  var values = sheet.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][3]).trim() === String(data.email).trim() && String(values[i][4]) === String(data.password)) {
      return ContentService.createTextOutput(JSON.stringify({ success: true, user: { name: values[i][2], email: values[i][3], role: 'Evaluador' } })).setMimeType(ContentService.MimeType.JSON);
    }
  }
  return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Credenciales inválidas' })).setMimeType(ContentService.MimeType.JSON);
}
