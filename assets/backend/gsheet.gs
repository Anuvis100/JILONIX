// backend/gsheet.gs
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    // === CONFIGURACIÓN DE LA HOJA ===
    const SPREADSHEET_ID = 'TU_ID_DE_LA_HOJA';  // ← CAMBIAR
    const SHEET_NAME = 'Pedidos';               // ← Nombre de la pestaña
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    
    // Si la hoja no existe, la creamos con cabeceras
    if (!sheet) {
      const newSheet = SpreadsheetApp.openById(SPREADSHEET_ID).insertSheet(SHEET_NAME);
      const headers = [
        "pedido_id", "timestamp", "nombre", "empresa", "correo", "telefono",
        "ciudad", "pais", "pais_nombre", "id_dispositivo", "sistema_operativo",
        "notas", "items", "subtotal", "descuento", "cupon", "total",
        "metodo_pago", "metodo_pago_formateado", "ref_transaccion",
        "monto_depositado", "titular_origen", "banco_origen",
        "fecha_deposito", "hora_deposito", "comprobante_nombre", "estado"
      ];
      newSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      // No podemos retornar newSheet directamente, obtenemos la referencia de nuevo
      const finalSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
      finalSheet.appendRow(headers.map(h => data[h] || ''));
    } else {
      // Añadir fila con datos
      const row = [
        data.pedido_id, data.timestamp, data.nombre, data.empresa, data.correo,
        data.telefono, data.ciudad, data.pais, data.pais_nombre, data.id_dispositivo,
        data.sistema_operativo, data.notas, data.items, data.subtotal, data.descuento,
        data.cupon, data.total, data.metodo_pago, data.metodo_pago_formateado,
        data.ref_transaccion, data.monto_depositado, data.titular_origen,
        data.banco_origen, data.fecha_deposito, data.hora_deposito,
        data.comprobante_nombre, data.estado
      ];
      sheet.appendRow(row);
    }
    
    // Responder con éxito
    return ContentService
      .createTextOutput(JSON.stringify({ success: true, message: "Pedido guardado" }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader("Access-Control-Allow-Origin", "*"); // Para CORS
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader("Access-Control-Allow-Origin", "*");
  }
}

// Función para probar manualmente (opcional)  https://script.google.com/macros/s/AKfycbyCnek0emZRT-bVr4tUnhLcQVBi1A9-NIpJ3Iudvzd4refG2W6S_Q_oVdj6y8FAsz2V/exec
function doGet() {
  return ContentService.createTextOutput("El servicio está activo. Usa POST para enviar pedidos.");
}