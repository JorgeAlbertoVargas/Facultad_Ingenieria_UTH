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
    } else if (action === 'sendReportEmails') {
      return sendReportEmails(data);
    } else {
      return output.setContent(JSON.stringify({ success: false, error: 'Acción no válida' }));
    }
  } catch (error) {
    return output.setContent(JSON.stringify({ success: false, error: error.toString() }));
  }
}

// ------------------------------------
// Función para autorizar envíos de correo
// ------------------------------------
function authorizeEmail() {
  // Ejecuta esta función UNA SOLA VEZ desde el editor de Apps Script 
  // dándole al botón "Ejecutar" para que Google te pida los permisos de Gmail.
  var correo = Session.getActiveUser().getEmail();
  if (!correo) correo = "jorge.vargas@uth.hn";
  GmailApp.sendEmail(correo, "Prueba de Autorización", "Si recibes esto, los permisos de correo están configurados correctamente.");
  Logger.log("Permisos autorizados y correo de prueba enviado a: " + correo);
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
    } else if (action === 'ubicarProyectos') {
      return ejecutarUbicarProyectos();
    } else if (action === 'getRankings') {
      return getRankings(e.parameter.categoria);
    } else if (action === 'getReportData') {
      return getReportData();
    } else {
      return output.setContent(JSON.stringify({ success: false, error: 'Acción GET no válida' }));
    }
  } catch (error) {
    return output.setContent(JSON.stringify({ success: false, error: error.toString() }));
  }
}

function ejecutarUbicarProyectos() {
  try {
    ubicarProyectos();
    return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'Proyectos ubicados correctamente' })).setMimeType(ContentService.MimeType.JSON);
  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: e.toString() })).setMimeType(ContentService.MimeType.JSON);
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
  // Seguridad: Si el usuario no tiene terna asignada, no se envían proyectos
  if (!terna || String(terna).trim() === "" || String(terna).trim() === "null") {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: "No estás asignado a ninguna Terna. Contacta al administrador para que asigne tu correo a una Terna." })).setMimeType(ContentService.MimeType.JSON);
  }

  var spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheetProyectos = spreadsheet.getSheetByName('Proyectos');
  var sheetEvaluaciones = spreadsheet.getSheetByName('Evaluaciones');

  if (!sheetProyectos) return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Pestaña 'Proyectos' no encontrada" })).setMimeType(ContentService.MimeType.JSON);

  // Obtener todos los códigos de proyectos ya evaluados por ESTE juez y conteo total
  var evaluados_por_mi = {};
  var conteo_evaluaciones = {};
  
  if (sheetEvaluaciones) {
    var evalValues = sheetEvaluaciones.getDataRange().getValues();
    for (var j = 1; j < evalValues.length; j++) {
      var codEval = evalValues[j][1]; // Col B (1) es Código Proyecto
      var juezEval = evalValues[j][2]; // Col C (2) es Juez (Email)
      var notaEval = evalValues[j][4]; // Col E (4) es Nota Total
      
      if (codEval) {
        var cod = String(codEval).trim();
        if (!conteo_evaluaciones[cod]) conteo_evaluaciones[cod] = 0;
        conteo_evaluaciones[cod]++;
        
        if (String(juezEval).indexOf(String(email).trim()) !== -1) {
          evaluados_por_mi[cod] = { evaluado: true, nota: notaEval };
        }
      }
    }
  }

  var values = sheetProyectos.getDataRange().getValues();
  var projects = [];

  // 1. Obtener ubicaciones desde el mapa ("Distribucion_Proyectos")
  var ubicaciones = {};
  var sheetMapa = spreadsheet.getSheetByName("Distribucion_Proyectos");
  if (sheetMapa) {
    var mapValues = sheetMapa.getDataRange().getValues();
    var idsValidos = [];
    for (var i = 1; i < values.length; i++) {
      if (values[i][2]) idsValidos.push(String(values[i][2]).trim());
    }

    for (var r = 1; r < mapValues.length; r++) { // Empezamos en 1 porque miramos r-1
      for (var c = 0; c < mapValues[r].length; c++) {
        var cellContent = String(mapValues[r][c]);
        if (cellContent) {
          for (var k = 0; k < idsValidos.length; k++) {
            var idBuscado = idsValidos[k];
            if (cellContent.indexOf(idBuscado) !== -1) {
              var standRaw = String(mapValues[r-1][c]).trim();
              var matchNum = standRaw.match(/\d+/);
              if (matchNum) {
                ubicaciones[idBuscado] = "Stand " + matchNum[0];
              }
              break; // Si ya lo encontró, no seguir buscando otros IDs en esta celda
            }
          }
        }
      }
    }
  }

  for (var i = 1; i < values.length; i++) {
    if (values[i][2]) { // Col C (Index 2) es ID_Proyecto
      // Filtrar por terna si se solicita (asumiendo Col S / Index 18 para "Terna_Asignada")
      var asignada = values[i][18] ? String(values[i][18]).trim() : '';
      if (terna && asignada.indexOf(terna) === -1) {
        continue;
      }

      var codigo = values[i][2];
      var codStr = String(codigo).trim();
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
        'Ubicacion': ubicaciones[codStr] || '',
        'evaluado': evaluados_por_mi[codStr] ? true : false,
        'nota_obtenida': evaluados_por_mi[codStr] ? evaluados_por_mi[codStr].nota : null,
        'num_evaluaciones': conteo_evaluaciones[codStr] || 0
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
  
  // Encontrar índices de columnas dinámicamente por si se movieron
  var emailIdx = 3, passIdx = 4, roleIdx = 5, senderIdx = 6, nameIdx = 2;
  if (values.length > 0) {
    for (var c = 0; c < values[0].length; c++) {
      var header = String(values[0][c]).toLowerCase();
      if (header === 'usuario' || header === 'email') emailIdx = c;
      if (header.indexOf('password') !== -1) passIdx = c;
      if (header === 'rol') roleIdx = c;
      if (header.indexOf('sender') !== -1) senderIdx = c;
      if (header === 'nombre') nameIdx = c;
    }
  }

  for (var i = 1; i < values.length; i++) {
    if (String(values[i][emailIdx]).trim() === String(data.email).trim() && String(values[i][passIdx]) === String(data.password)) {
      var roleValue = values[i][roleIdx] ? String(values[i][roleIdx]).trim().toLowerCase() : '';
      var userRole = (roleValue === 'admin') ? 'Administrador' : 'Evaluador';
      
      var isSender = false;
      if (values[i][senderIdx]) {
        var s = String(values[i][senderIdx]).trim().toUpperCase();
        isSender = (s === 'TRUE' || s === 'VERDADERO');
      }
      
      return ContentService.createTextOutput(JSON.stringify({ 
        success: true, 
        user: { name: values[i][nameIdx], email: values[i][emailIdx], role: userRole, correoSender: isSender } 
      })).setMimeType(ContentService.MimeType.JSON);
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

  // Buscar el nombre del juez
  var nombreJuez = correoJuez;
  var sheetUsuarios = spreadsheet.getSheetByName('Usuarios');
  if (sheetUsuarios) {
    var usuarios = sheetUsuarios.getDataRange().getValues();
    for (var u = 1; u < usuarios.length; u++) {
      if (String(usuarios[u][3]).trim() === String(correoJuez).trim()) {
        nombreJuez = String(usuarios[u][2]).trim();
        break;
      }
    }
  }

  // Buscar info del proyecto
  var pNombre = "", pAsignatura = "", pCarrera = "", pCatedratico = "";
  var sheetProyectos = spreadsheet.getSheetByName('Proyectos');
  if (sheetProyectos) {
    var proy = sheetProyectos.getDataRange().getValues();
    for (var p = 1; p < proy.length; p++) {
      if (String(proy[p][2]).trim() === String(codigoProyecto).trim()) { // Col C (2)
        pNombre = String(proy[p][4]).trim(); // Col E (4) Nombre_Corto
        pAsignatura = String(proy[p][10]).trim(); // Col K (10) Asignatura
        pCarrera = String(proy[p][11]).trim(); // Col L (11) Carrera
        pCatedratico = String(proy[p][14]).trim(); // Col O (14) Catedratico
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
    var headers = ["Fecha", "ID_Proyecto", "Nombre_Corto", "Asignatura", "Carrera", "Catedratico", "Evaluador_1", "Evaluador_2", "Evaluador_3", "Nota_1", "Nota_2", "Nota_3", "Promedio", "Tecnico_1", "Tecnico_2", "Tecnico_3", "Suma_Tecnico"];
    sheet.appendRow(headers);
    sheet.getRange("A1:Q1").setFontWeight("bold").setBackground("#f3f4f6");
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
    // Como añadimos 4 columnas, los jueces ahora están en las columnas 7, 8 y 9 (índices 6, 7 y 8)
    var j1 = rowData[6]; // Evaluador_1
    var j2 = rowData[7]; // Evaluador_2
    var j3 = rowData[8]; // Evaluador_3

    var currentDate = new Date();
    sheet.getRange(rowIndex, 1).setValue(currentDate); // Actualizar Fecha

    // Verificamos si este juez ya evaluó (buscando su correo dentro de la celda) y actualizamos su nota
    if (String(j1).indexOf(String(correoJuez).trim()) !== -1) {
      sheet.getRange(rowIndex, 10).setValue(notaTotal); // Nota 1
      sheet.getRange(rowIndex, 14).setValue(notaTecnico); // Tecnico 1
    } else if (String(j2).indexOf(String(correoJuez).trim()) !== -1) {
      sheet.getRange(rowIndex, 11).setValue(notaTotal); // Nota 2
      sheet.getRange(rowIndex, 15).setValue(notaTecnico); // Tecnico 2
    } else if (String(j3).indexOf(String(correoJuez).trim()) !== -1) {
      sheet.getRange(rowIndex, 12).setValue(notaTotal); // Nota 3
      sheet.getRange(rowIndex, 16).setValue(notaTecnico); // Tecnico 3
    } else {
      // Es un juez nuevo, buscar la primera columna vacía
      if (!j1 || String(j1).trim() === "") {
        sheet.getRange(rowIndex, 7).setValue(nombreJuez);
        sheet.getRange(rowIndex, 10).setValue(notaTotal);
        sheet.getRange(rowIndex, 14).setValue(notaTecnico);
      } else if (!j2 || String(j2).trim() === "") {
        sheet.getRange(rowIndex, 8).setValue(nombreJuez);
        sheet.getRange(rowIndex, 11).setValue(notaTotal);
        sheet.getRange(rowIndex, 15).setValue(notaTecnico);
      } else if (!j3 || String(j3).trim() === "") {
        sheet.getRange(rowIndex, 9).setValue(nombreJuez);
        sheet.getRange(rowIndex, 12).setValue(notaTotal);
        sheet.getRange(rowIndex, 16).setValue(notaTecnico);
      }
    }

    // Recalcular promedio (Columna 13)
    var cell = sheet.getRange(rowIndex, 13);
    cell.setFormula('=AVERAGE(J' + rowIndex + ':L' + rowIndex + ')');
    cell.setNumberFormat('0.000');
    
    // Sumar el bloque Técnico (Columna 17)
    sheet.getRange(rowIndex, 17).setFormula('=SUM(N' + rowIndex + ':P' + rowIndex + ')');
    
  } else {
    // El proyecto no existe, insertar nueva fila con los datos extra
    // [Fecha, ID, Nombre, Asignatura, Carrera, Catedratico, J1, J2, J3, N1, N2, N3, Prom, T1, T2, T3, SumaT]
    var newRow = [new Date(), codigoProyecto, pNombre, pAsignatura, pCarrera, pCatedratico, nombreJuez, "", "", notaTotal, "", "", "", notaTecnico, "", "", ""];
    sheet.appendRow(newRow);
    var newRowIndex = sheet.getLastRow();
    var cell = sheet.getRange(newRowIndex, 13);
    cell.setFormula('=AVERAGE(J' + newRowIndex + ':L' + newRowIndex + ')');
    cell.setNumberFormat('0.000');
    sheet.getRange(newRowIndex, 17).setFormula('=SUM(N' + newRowIndex + ':P' + newRowIndex + ')');
  }
  
  // Ordenar la hoja automáticamente por la columna Promedio (13) primero y Suma_Tecnico (17) después
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, 17).sort([
      {column: 13, ascending: false}, // 1ra prioridad: Promedio más alto
      {column: 17, ascending: false} // 2da prioridad: Suma técnico más alto
    ]);
  }
}

// ------------------------------------
// Funciones de Mapa y Stands
// ------------------------------------
function getMapUrl() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName("Distribucion_Proyectos");
  var gid = sheet ? sheet.getSheetId() : "0";
  var url = "https://docs.google.com/spreadsheets/d/" + SPREADSHEET_ID + "/htmlembed?gid=" + gid + "&widget=false&headers=false&chrome=false";
  return ContentService.createTextOutput(JSON.stringify({ success: true, url: url })).setMimeType(ContentService.MimeType.JSON);
}

// ==========================================
// HERRAMIENTAS IA
// ==========================================

function ubicarProyectos() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  // 1. Buscar la pestaña de base de datos dinámicamente
  var sheets = ss.getSheets();
  var sheetBD = null;
  var allNames = [];
  for (var k = 0; k < sheets.length; k++) {
    var name = sheets[k].getName();
    allNames.push(name);
    var lowerName = name.toLowerCase();
    // Priorizamos la hoja "Proyectos" explícitamente
    if (lowerName === "proyectos" || (lowerName.indexOf("proyectos") !== -1 && lowerName.indexOf("distribucion") === -1)) {
      sheetBD = sheets[k];
      break;
    }
  }
  
  if (!sheetBD) {
    console.log("Error: No se encontró la pestaña 'Proyectos'. Las pestañas que SÍ existen en este archivo son: " + allNames.join(" | "));
    return;
  }
  
  var dataBD = sheetBD.getDataRange().getValues();
  var proyectos = {}; 
  
  // Encontrar dinámicamente qué columna tiene el ID y el Nombre Corto en la fila 1 (índice 0)
  var idIndex = 2; // Por defecto Col C
  var nombreCortoIndex = 4; // Por defecto Col E
  var nombreLargoIndex = 3; // Por defecto Col D
  
  if (dataBD.length > 0) {
    for (var c = 0; c < dataBD[0].length; c++) {
      var header = String(dataBD[0][c]).toLowerCase();
      if (header.indexOf("id_proyecto") !== -1 || header === "id") idIndex = c;
      if (header.indexOf("nombre_corto") !== -1) nombreCortoIndex = c;
      if (header.indexOf("nombre_largo") !== -1) nombreLargoIndex = c;
    }
  }
  
  // Empezamos desde la fila 1 (ignorando encabezados)
  for (var i = 1; i < dataBD.length; i++) {
    var id = String(dataBD[i][idIndex]).trim();
    var nombreCorto = String(dataBD[i][nombreCortoIndex]).trim();
    var nombreLargo = String(dataBD[i][nombreLargoIndex]).trim();
    
    if (id && id !== "undefined" && id !== "") {
      // Extraemos todos los grupos de números del ID
      var numbers = id.match(/\d+/g);
      if (numbers) {
        var numStr = numbers[numbers.length - 1]; // Tomar el último número (ej: 001 de FI-5UTACIFA-001)
        var num = parseInt(numStr, 10);
        
        // Si no hay nombre corto, usar el largo
        var nombreAMostrar = nombreCorto;
        if (!nombreAMostrar || nombreAMostrar === "undefined" || nombreAMostrar === "") {
            nombreAMostrar = nombreLargo;
        }
        
        proyectos[num] = id + "\n" + nombreAMostrar;
      }
    }
  }
  
  // 2. Ubicar en el mapa (Buscamos la pestaña "Distribucion_Proyectos")
  var sheetMapa = ss.getSheetByName("Distribucion_Proyectos");
  
  if (!sheetMapa) {
    console.log("Error: No se encontró la pestaña original del mapa.");
    return;
  }
  
  var rangeMapa = sheetMapa.getDataRange();
  var valuesMapa = rangeMapa.getValues();
  var countUbicados = 0;
  
  // 3. Recorrer el mapa buscando "Stand", "Stant", "Stabd" seguido de un número
  for (var r = 0; r < valuesMapa.length; r++) {
    for (var c = 0; c < valuesMapa[r].length; c++) {
      var cellVal = String(valuesMapa[r][c]).trim().toLowerCase();
      
      // Chequeo más flexible de que contenga "stan" o "stab"
      if (cellVal.indexOf("stan") !== -1 || cellVal.indexOf("stab") !== -1) {
        var numStand = null;
        var targetRow = null;
        
        // Formato antiguo: "Stand 61" en la misma celda
        if (/\d+/.test(cellVal)) {
          var matchStand = cellVal.match(/\d+/);
          numStand = parseInt(matchStand[0], 10);
          targetRow = r + 1; // El proyecto va 1 celda abajo
        } 
        // Formato nuevo: "Stand #" arriba y el número en la celda de abajo
        else if (r + 1 < valuesMapa.length && /\d+/.test(String(valuesMapa[r+1][c]))) {
          var matchStand = String(valuesMapa[r+1][c]).match(/\d+/);
          numStand = parseInt(matchStand[0], 10);
          targetRow = r + 2; // El proyecto va 2 celdas abajo (debajo del número)
        }
        
        if (numStand !== null && targetRow !== null && targetRow < valuesMapa.length) {
          if (proyectos[numStand]) {
            valuesMapa[targetRow][c] = proyectos[numStand];
            countUbicados++;
          } else {
            valuesMapa[targetRow][c] = "Libre / Sin Asignar";
          }
        }
      }
    }
  }
  
  // Guardamos los cambios
  rangeMapa.setValues(valuesMapa);
  console.log("¡Éxito! Se ubicaron " + countUbicados + " proyectos en el mapa.");
}

// ------------------------------------
// Obtener Ranking (para Diplomas)
// ------------------------------------
function getRankings(categoria) {
  var spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  if (categoria === 'all' || !categoria) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Debes especificar una categoría' })).setMimeType(ContentService.MimeType.JSON);
  }

  var cleanCat = String(categoria).replace(/[:*?\[\]\\/]/g, '').trim().substring(0, 22);
  var sheetName = "Ranking_" + cleanCat;
  var sheet = spreadsheet.getSheetByName(sheetName);

  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'No hay ranking generado aún para esta categoría' })).setMimeType(ContentService.MimeType.JSON);
  }

  var data = sheet.getDataRange().getValues();
  var ranking = [];

  // Fila 0 es encabezados
  for (var i = 1; i < data.length; i++) {
    var id = String(data[i][1]).trim();
    if (id) {
      // Las columnas ahora son:
      // 0:Fecha, 1:ID_Proyecto, 2:Nombre_Corto, 3:Asignatura, 4:Carrera, 5:Catedratico
      // 6-8: Jueces, 9-11: Notas, 12: Promedio, 13-15: Tecnico, 16: Suma_Tecnico
      var promedio = parseFloat(data[i][12]);
      if (isNaN(promedio)) promedio = 0;
      
      ranking.push({
        id: id,
        nombre: String(data[i][2]).trim() || id, // Usar Nombre_Corto si existe
        asignatura: String(data[i][3]).trim(),
        carrera: String(data[i][4]).trim(),
        catedratico: String(data[i][5]).trim(),
        promedio: promedio,
        sumaTecnico: parseFloat(data[i][16]) || 0
      });
    }
  }

  // Ordenar descendentemente por promedio (luego suma tecnico)
  ranking.sort(function(a, b) {
    if (b.promedio !== a.promedio) return b.promedio - a.promedio;
    return b.sumaTecnico - a.sumaTecnico;
  });

  return ContentService.createTextOutput(JSON.stringify({ success: true, ranking: ranking, categoria: categoria })).setMimeType(ContentService.MimeType.JSON);
}

// ------------------------------------
// Funciones de Reporte y Correos
// ------------------------------------
function getReportData() {
  var spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  // 1. Obtener información de Proyectos
  var sheetProyectos = spreadsheet.getSheetByName('Proyectos');
  if (!sheetProyectos) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Pestaña Proyectos no encontrada' })).setMimeType(ContentService.MimeType.JSON);
  }
  
  var proyectosData = sheetProyectos.getDataRange().getValues();
  var proyectosDict = {};
  
  // Fila 0 son encabezados
  for (var i = 1; i < proyectosData.length; i++) {
    var idProyecto = String(proyectosData[i][2]).trim();
    if (idProyecto) {
      proyectosDict[idProyecto] = {
        idProyecto: idProyecto,
        nombreLargo: String(proyectosData[i][3]).trim(),
        nombreCorto: String(proyectosData[i][4]).trim(),
        asignatura: String(proyectosData[i][10]).trim(),
        catedratico: String(proyectosData[i][14]).trim(),
        calificacion: 0 // Por defecto
      };
    }
  }
  
  // 2. Obtener las calificaciones de todos los Ranking_*
  var sheets = spreadsheet.getSheets();
  for (var s = 0; s < sheets.length; s++) {
    var sheetName = sheets[s].getName();
    if (sheetName.substring(0, 8) === 'Ranking_') {
      var rankingData = sheets[s].getDataRange().getValues();
      for (var r = 1; r < rankingData.length; r++) {
        var idProyecto = String(rankingData[r][1]).trim(); // Col B (1)
        var promedio = parseFloat(rankingData[r][12]); // Col M (12)
        
        if (idProyecto && proyectosDict[idProyecto] && !isNaN(promedio)) {
          proyectosDict[idProyecto].calificacion = promedio;
        }
      }
    }
  }
  
  // Convertir diccionario a array
  var result = [];
  for (var key in proyectosDict) {
    result.push(proyectosDict[key]);
  }
  
  return ContentService.createTextOutput(JSON.stringify({ success: true, report: result })).setMimeType(ContentService.MimeType.JSON);
}

function sendReportEmails(data) {
  var spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  var reportData = data.reportData;
  
  var sheetTernas = spreadsheet.getSheetByName('Ternas');
  var ternasData = sheetTernas ? sheetTernas.getDataRange().getValues() : [];
  
  var catedraticoEmails = {};
  
  // 1. Llenar diccionario con correos de Ternas
  for (var i = 1; i < ternasData.length; i++) {
    var nombre = String(ternasData[i][1]).trim().toLowerCase(); // Nombre_Evaluador
    var email = String(ternasData[i][2]).trim(); // Email_Evaluador
    if (nombre && email) {
      catedraticoEmails[nombre] = email;
    }
  }

  // 2. Llenar/completar diccionario con correos de Usuarios (por si no están en Ternas)
  var sheetUsuarios = spreadsheet.getSheetByName('Usuarios');
  var usuariosData = sheetUsuarios ? sheetUsuarios.getDataRange().getValues() : [];
  for (var u = 1; u < usuariosData.length; u++) {
    var nombreUsr = String(usuariosData[u][2]).trim().toLowerCase(); // Columna C: Nombre
    var emailUsr = String(usuariosData[u][3]).trim(); // Columna D: Email
    if (nombreUsr && emailUsr && !catedraticoEmails[nombreUsr]) {
      catedraticoEmails[nombreUsr] = emailUsr;
    }
  }
  
  // Agrupar proyectos por Catedratico
  var proyectosPorCatedratico = {};
  
  for (var i = 0; i < reportData.length; i++) {
    var p = reportData[i];
    var cat = p.catedratico;
    if (!cat || cat === "") {
      cat = "Sin Catedrático";
    }
    if (!proyectosPorCatedratico[cat]) {
      proyectosPorCatedratico[cat] = [];
    }
    proyectosPorCatedratico[cat].push(p);
  }
  
  var emailsEnviados = 0;
  var log = [];
  
  for (var catedratico in proyectosPorCatedratico) {
    if (catedratico === "Sin Catedrático") continue;
    
    var emailDestino = catedraticoEmails[catedratico.toLowerCase()];
    if (!emailDestino) {
      log.push("No se encontró email para: " + catedratico);
      continue; // Skip if no email found
    }
    
    var proyectos = proyectosPorCatedratico[catedratico];
    
    var htmlBody = "<h2>Reporte de Calificaciones de Proyectos</h2>";
    htmlBody += "<p>Estimado(a) " + catedratico + ",</p>";
    htmlBody += "<p>A continuación se detallan las calificaciones finales de los proyectos evaluados en la Feria de Ingeniería:</p>";
    
    htmlBody += "<table border='1' cellpadding='8' cellspacing='0' style='border-collapse: collapse; width: 100%; font-family: sans-serif;'>";
    htmlBody += "<tr style='background-color: #007A33; color: white; text-align: left;'>";
    htmlBody += "<th>ID Proyecto</th><th>Asignatura</th><th>Nombre Corto</th><th>Nombre Largo</th><th>Calificación Final</th>";
    htmlBody += "</tr>";
    
    for (var j = 0; j < proyectos.length; j++) {
      var proy = proyectos[j];
      htmlBody += "<tr>";
      htmlBody += "<td>" + proy.idProyecto + "</td>";
      htmlBody += "<td>" + proy.asignatura + "</td>";
      htmlBody += "<td>" + proy.nombreCorto + "</td>";
      htmlBody += "<td>" + proy.nombreLargo + "</td>";
      htmlBody += "<td><strong>" + proy.calificacion.toFixed(2) + " / 100</strong></td>";
      htmlBody += "</tr>";
    }
    
    htmlBody += "</table>";
    htmlBody += "<br><p>Saludos cordiales,<br>Comité Organizador UTH</p>";
    
    try {
      GmailApp.sendEmail(emailDestino, "Calificaciones Feria de Ingeniería - " + catedratico, "", {
        htmlBody: htmlBody
      });
      emailsEnviados++;
      log.push("Enviado para: " + catedratico + " a " + emailDestino);
    } catch (e) {
      log.push("Error enviando a " + catedratico + ": " + e.toString());
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({ 
    success: true, 
    message: 'Se enviaron ' + emailsEnviados + ' correos a los catedráticos.',
    log: log
  })).setMimeType(ContentService.MimeType.JSON);
}
