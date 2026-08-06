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
    } else if (action === 'getMapUrl') {
      return getMapUrl();
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
      if (codEval && String(juezEval).indexOf(String(email).trim()) !== -1) {
        evaluados[String(codEval).trim()] = { evaluado: true, nota: notaEval };
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
        'evaluado': evaluados[String(codigo).trim()] ? true : false,
        'nota_obtenida': evaluados[String(codigo).trim()] ? evaluados[String(codigo).trim()].nota : null
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
  var spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = spreadsheet.getSheetByName('Evaluaciones');
  if (!sheet) return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Pestaña 'Evaluaciones' no encontrada" })).setMimeType(ContentService.MimeType.JSON);

  // Buscar el nombre del juez en la pestaña Usuarios
  var nombreJuez = data.correoJuez;
  var sheetUsuarios = spreadsheet.getSheetByName('Usuarios');
  if (sheetUsuarios) {
    var usuarios = sheetUsuarios.getDataRange().getValues();
    for (var u = 1; u < usuarios.length; u++) {
      if (String(usuarios[u][3]).trim() === String(data.correoJuez).trim()) {
        nombreJuez = String(usuarios[u][2]).trim() + " | " + data.correoJuez;
        break;
      }
    }
  }

  // Guardar evaluación con el nuevo formato detallado
  var notaRedondeada = Math.round(parseFloat(data.notaTotal)) || 0;
  
  var newRow = [
    new Date(),
    data.codigoProyecto,
    nombreJuez, // Col C
    data.categoria, // Col D
    notaRedondeada // Col E (Total)
  ];

  // Extraer los puntos de cada respuesta en orden secuencial
  var numRespuestas = 0;
  if (data.respuestas && Array.isArray(data.respuestas)) {
    data.respuestas.forEach(function(r) {
      newRow.push(r.puntos);
      numRespuestas++;
    });
  }

  // Añadir observaciones y JSON al final de la fila
  newRow.push(data.observaciones);
  newRow.push(JSON.stringify(data.respuestas));

  sheet.appendRow(newRow);

  // Actualizar los encabezados en la fila 1 para reflejar los cambios
  try {
    sheet.getRange("C1").setValue("Evaluador");
    sheet.getRange("D1").setValue("Categoria");
    sheet.getRange("E1").setValue("Total");
    
    if (numRespuestas > 0) {
      var headers = [];
      for (var k = 1; k <= numRespuestas; k++) {
        headers.push("Pregunta_" + k);
      }
      headers.push("Observaciones");
      headers.push("JSON_Data");
      sheet.getRange(1, 6, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 6, 1, headers.length).setFontWeight("bold");
    }
  } catch (e) {
    // Ignorar si hay problemas escribiendo encabezados
  }

  // Calcular sumatoria del bloque Técnico
  var notaTecnico = 0;
  if (data.respuestas && Array.isArray(data.respuestas)) {
    data.respuestas.forEach(function(r) {
      var b = String(r.bloque).toUpperCase();
      if (b.indexOf('TÉCNICO') !== -1 || b.indexOf('TECNICO') !== -1) {
        notaTecnico += parseFloat(r.puntos) || 0;
      }
    });
  }

  // Consolidar notas en la pestaña de la categoría
  try {
    updateConsolidatedRanking(data.codigoProyecto, data.correoJuez, notaRedondeada, data.categoria, notaTecnico);
  } catch (e) {
    // Ignoramos el error para no bloquear la respuesta principal al usuario
  }


  return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'Evaluación guardada con éxito', nota: notaRedondeada })).setMimeType(ContentService.MimeType.JSON);
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

// ------------------------------------
// Funciones de Consolidación y Ranking
// ------------------------------------
function updateConsolidatedRanking(codigoProyecto, correoJuez, notaTotal, categoria, notaTecnico) {
  var spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  // Por seguridad si notaTecnico no viene, lo hacemos 0
  notaTecnico = notaTecnico || 0;

  // Buscar el nombre del juez en la pestaña Usuarios
  var nombreJuez = correoJuez;
  var sheetUsuarios = spreadsheet.getSheetByName('Usuarios');
  if (sheetUsuarios) {
    var usuarios = sheetUsuarios.getDataRange().getValues();
    for (var u = 1; u < usuarios.length; u++) {
      if (String(usuarios[u][3]).trim() === String(correoJuez).trim()) {
        nombreJuez = String(usuarios[u][2]).trim() + " | " + correoJuez;
        break;
      }
    }
  }

  // Limpiar el nombre de la categoría para que sea válido como pestaña (máx 31 caracteres)
  var cleanCat = String(categoria).replace(/[:*?\[\]\\/]/g, '').trim().substring(0, 22);
  var sheetName = "Ranking_" + cleanCat;

  var sheet = spreadsheet.getSheetByName(sheetName);

  // Si la pestaña no existe, la creamos y le ponemos encabezados
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
    var headers = ["Fecha", "ID_Proyecto", "Evaluador_1", "Evaluador_2", "Evaluador_3", "Nota_Evaluador_1", "Nota_Evaluador_2", "Nota_Evaluador_3", "Promedio", "Tecnico_1", "Tecnico_2", "Tecnico_3", "Suma_Tecnico"];
    sheet.appendRow(headers);
    sheet.getRange("A1:M1").setFontWeight("bold").setBackground("#f3f4f6");
  }

  var data = sheet.getDataRange().getValues();
  var rowIndex = -1;

  // Buscar si el proyecto ya existe en la fila (empezamos de 1 para saltar encabezados)
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][1]).trim() === String(codigoProyecto).trim()) { // Índice 1 es ID_Proyecto
      rowIndex = i + 1; // Las filas en Sheet son base 1
      break;
    }
  }

  if (rowIndex !== -1) {
    // El proyecto ya existe, buscar espacio para el juez o actualizar si ya existe
    var rowData = data[rowIndex - 1]; // Índice base 0
    var j1 = rowData[2]; // Evaluador_1
    var j2 = rowData[3]; // Evaluador_2
    var j3 = rowData[4]; // Evaluador_3

    var currentDate = new Date();
    sheet.getRange(rowIndex, 1).setValue(currentDate); // Actualizar Fecha

    // Verificamos si este juez ya evaluó (buscando su correo dentro de la celda) y actualizamos su nota
    if (String(j1).indexOf(String(correoJuez).trim()) !== -1) {
      sheet.getRange(rowIndex, 6).setValue(notaTotal); // Nota 1
      sheet.getRange(rowIndex, 10).setValue(notaTecnico); // Tecnico 1
    } else if (String(j2).indexOf(String(correoJuez).trim()) !== -1) {
      sheet.getRange(rowIndex, 7).setValue(notaTotal); // Nota 2
      sheet.getRange(rowIndex, 11).setValue(notaTecnico); // Tecnico 2
    } else if (String(j3).indexOf(String(correoJuez).trim()) !== -1) {
      sheet.getRange(rowIndex, 8).setValue(notaTotal); // Nota 3
      sheet.getRange(rowIndex, 12).setValue(notaTecnico); // Tecnico 3
    } else {
      // Es un juez nuevo, buscar la primera columna vacía
      if (!j1 || String(j1).trim() === "") {
        sheet.getRange(rowIndex, 3).setValue(nombreJuez);
        sheet.getRange(rowIndex, 6).setValue(notaTotal);
        sheet.getRange(rowIndex, 10).setValue(notaTecnico);
      } else if (!j2 || String(j2).trim() === "") {
        sheet.getRange(rowIndex, 4).setValue(nombreJuez);
        sheet.getRange(rowIndex, 7).setValue(notaTotal);
        sheet.getRange(rowIndex, 11).setValue(notaTecnico);
      } else if (!j3 || String(j3).trim() === "") {
        sheet.getRange(rowIndex, 5).setValue(nombreJuez);
        sheet.getRange(rowIndex, 8).setValue(notaTotal);
        sheet.getRange(rowIndex, 12).setValue(notaTecnico);
      }
    }

    // Recalcular promedio y aplicar formato de 3 decimales
    var cell = sheet.getRange(rowIndex, 9);
    cell.setFormula('=AVERAGE(F' + rowIndex + ':H' + rowIndex + ')');
    cell.setNumberFormat('0.000');
    
    // Sumar el bloque Técnico
    sheet.getRange(rowIndex, 13).setFormula('=SUM(J' + rowIndex + ':L' + rowIndex + ')');
    
  } else {
    // El proyecto no existe, insertar nueva fila
    var newRow = [new Date(), codigoProyecto, nombreJuez, "", "", notaTotal, "", "", "", notaTecnico, "", "", ""];
    sheet.appendRow(newRow);
    var newRowIndex = sheet.getLastRow();
    var cell = sheet.getRange(newRowIndex, 9);
    cell.setFormula('=AVERAGE(F' + newRowIndex + ':H' + newRowIndex + ')');
    cell.setNumberFormat('0.000');
    sheet.getRange(newRowIndex, 13).setFormula('=SUM(J' + newRowIndex + ':L' + newRowIndex + ')');
  }
  
  // Ordenar la hoja automáticamente por la columna Promedio (9) primero y Suma_Tecnico (13) después
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, 13).sort([
      {column: 9, ascending: false}, // 1ra prioridad: Promedio más alto
      {column: 13, ascending: false} // 2da prioridad: Suma técnico más alto
    ]);
  }
}

// ------------------------------------
// Funciones de Mapa y Stands
// ------------------------------------
function getMapUrl() {
  var spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = spreadsheet.getSheetByName("Layout_Ubicaciones");
  
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Pestaña 'Layout_Ubicaciones' no encontrada. Por favor, genérala desde el menú 'Herramientas IA'." })).setMimeType(ContentService.MimeType.JSON);
  }
  
  var gid = sheet.getSheetId();
  var url = "https://docs.google.com/spreadsheets/d/" + SPREADSHEET_ID + "/htmlembed?gid=" + gid + "&widget=false&headers=false&chrome=false";
  return ContentService.createTextOutput(JSON.stringify({ success: true, url: url })).setMimeType(ContentService.MimeType.JSON);
}

// ==========================================
// HERRAMIENTAS IA (MENÚ PERSONALIZADO)
// ==========================================

function onOpen() {
  SpreadsheetApp.getUi()
      .createMenu('🤖 Herramientas IA')
      .addItem('¡Crear Mapa Automático (Layout_Ubicaciones)!', 'generarLayoutUbicaciones')
      .addToUi();
}

function generarLayoutUbicaciones() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetName = "Layout_Ubicaciones";
  var sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  } else {
    sheet.clear(); // Limpiar si ya existe para rehacerlo
  }
  
  // Configurar anchos de columna para que parezca un mapa
  for (var c = 1; c <= 25; c++) {
    sheet.setColumnWidth(c, 50);
  }
  sheet.setColumnWidth(1, 20); // Margen Izquierdo (A)
  sheet.setColumnWidth(5, 30); // Espacio entre bloque izq y centro (E)
  sheet.setColumnWidth(20, 30); // Espacio entre centro y derecha (T)
  
  // Título
  sheet.getRange("F2:S2").merge().setValue("Esquemático De Distribución De Proyectos")
       .setFontWeight("bold").setHorizontalAlignment("center").setFontSize(14);
  
  var currentStand = 1;
  
  // Helper para dibujar un stand
  function drawStand(r, c, num, color) {
    var headerRange = sheet.getRange(r, c, 1, 2);
    headerRange.merge().setValue("Stand_" + num)
               .setBackground(color)
               .setHorizontalAlignment("center")
               .setFontWeight("bold")
               .setBorder(true, true, true, true, true, true);
               
    var dataRange = sheet.getRange(r + 1, c, 2, 2);
    dataRange.merge().setValue("Tu Fórmula Aquí")
             .setBackground("#d9eaf7") // Azul clarito
             .setFontColor("#888888")
             .setHorizontalAlignment("center")
             .setVerticalAlignment("middle")
             .setBorder(true, true, true, true, true, true);
  }
  
  var leftColor = "#4a86e8"; // Azul
  var centerColor = "#d9ead3"; // Verde clarito
  var rightColor = "#00ff00"; // Verde fuerte
  
  // Bloque Izquierdo (Stands 1 al 6) -> Columnas C y D (índice 3 y 4)
  for (var i = 0; i < 6; i++) {
    drawStand(4 + (i * 4), 3, currentStand++, leftColor);
  }
  
  // Bloque Central (8 filas, 7 columnas) -> Columnas F, H, J, L, N, P, R (inicia en índice 6)
  for (var rowIdx = 0; rowIdx < 8; rowIdx++) {
    for (var colIdx = 0; colIdx < 7; colIdx++) {
      drawStand(4 + (rowIdx * 4), 6 + (colIdx * 2), currentStand++, centerColor);
    }
  }
  
  // Bloque Derecho (Stands 63 al 68) -> Columnas U y V (índices 21 y 22)
  for (var i = 0; i < 6; i++) {
    drawStand(4 + (i * 4), 21, currentStand++, rightColor);
  }
  
  SpreadsheetApp.getUi().alert("¡Magia completada! Mapa 'Layout_Ubicaciones' generado exitosamente con 68 stands en perfecto orden.");
}
