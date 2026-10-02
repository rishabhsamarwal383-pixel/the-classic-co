/**
 * ============================================================================
 * THE CLASSIC CO. — STUDIO EYEWEAR UDAIPUR
 * Google Apps Script Cloud Engine & CRM Backend
 * ============================================================================
 * 
 * Features:
 * 1. doPost(e): Webhook receiving orders from Vercel / GitHub frontend
 * 2. doGet(e): CORS-free GET fallback, order tracking, and live admin dashboard
 * 3. Auto-setup of "Orders" and "Summary" sheets with luxury styling
 * 4. Automated Luxury HTML Confirmation Email to CUSTOMER with itemized invoice
 * 5. Instant Alert Email to STORE OWNER (Rishabh) with 1-tap call/WhatsApp links
 * 6. Automated WhatsApp Message Generator with 1-click customer chat links
 * 7. Custom Google Sheets Menu for store management:
 *    - Send Tracking / Dispatch Email to Customer
 *    - Mark Order as Dispatched / Delivered
 *    - Open WhatsApp Chat with Customer
 *    - Refresh Dashboard Stats
 * 8. onEdit(e) trigger: Automatically notifies customer when status is marked "Dispatched"
 */

// ============================================================================
// CONFIGURATION
// ============================================================================
var STORE_CONFIG = {
  brandName: 'THE CLASSIC CO.',
  tagline: 'Architectural Eyewear Studio · Udaipur',
  ownerName: 'Rishabh Samarwal',
  ownerEmail: 'rishabhsamarwal383@gmail.com',
  whatsappNumber: '918619661325',
  merchantUpi: '8619661325@upi',
  currencySymbol: '₹',
  prepaidPrice: 799,
  codPrice: 899,
  storeWebsite: 'https://the-classic-co.vercel.app',
  spreadsheetId: '1G0tNE-qU13WOoX78EaEKq6BfXRaqjOuy0GF11QQ4L6c'
};

function getStoreSpreadsheet() {
  if (STORE_CONFIG.spreadsheetId) {
    try {
      return SpreadsheetApp.openById(STORE_CONFIG.spreadsheetId);
    } catch (e) {
      Logger.log('openById error: ' + e.message);
    }
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

// ============================================================================
// 1. WEBHOOK ENDPOINT: doPost (Handles Order Submissions from Website)
// ============================================================================
function doPost(e) {
  try {
    var rawData = e.postData ? e.postData.contents : '';
    var orderData = {};

    if (rawData) {
      try {
        orderData = JSON.parse(rawData);
      } catch (err) {
        orderData = parseFormUrlEncoded(rawData);
      }
    } else if (e.parameter) {
      orderData = e.parameter;
    }

    var result = processIncomingOrder(orderData);
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log('doPost Error: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================================================
// 2. WEB ENDPOINT: doGet (CORS-Free Fallback, Tracking & Live Admin Dashboard)
// ============================================================================
function doGet(e) {
  try {
    var params = e ? e.parameter : {};
    var action = params ? params.action : '';

    // A. CORS-Free Order Submission Fallback via GET
    if (action === 'order') {
      var result = processIncomingOrder(params);
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // B. Live Order Tracking Lookup for Customers
    if (action === 'track') {
      var orderId = (params.orderId || params.order_id || '').trim();
      var trackingResult = lookupOrderStatus(orderId);
      return ContentService.createTextOutput(JSON.stringify(trackingResult))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // C. Health check
    if (action === 'ping' || action === 'health') {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'ok',
        store: STORE_CONFIG.brandName,
        time: new Date().toISOString()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // D. Default: Render Storefront / Operations Web Dashboard
    return HtmlService.createHtmlOutput(renderAdminDashboardHtml())
      .setTitle(STORE_CONFIG.brandName + ' · Store Operations & CRM')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================================================
// 3. CORE ORDER INGESTION & SPREADSHEET LOGGING
// ============================================================================
function processIncomingOrder(data) {
  var ss = getStoreSpreadsheet();
  var sheet = getOrCreateOrdersSheet(ss);

  // Normalize order data
  var orderId = data.orderId || data.order_id || ('ORD-CC-' + Math.floor(10000 + Math.random() * 90000));
  var customerName = data.name || data.customer_name || 'Customer';
  var customerEmail = (data.email || data.customer_email || '').trim();
  var phone = String(data.phone || '').replace(/\D/g, '');
  var address = data.address || '';
  var landmark = data.landmark || '';
  var pincode = data.pincode || '313001';
  var title = data.title || data.product || 'Classic Eyewear Frame';
  var quantity = parseInt(data.quantity || data.qty || '1', 10);
  var paymentMode = data.paymentMode || data.payment_mode || 'Cash on Delivery';
  var amount = Number(data.amount || data.total || (paymentMode.toLowerCase().indexOf('upi') !== -1 ? 550 : 998));
  var gps = data.gps || '';
  var timeStamp = Utilities.formatDate(new Date(), 'Asia/Kolkata', 'dd MMM yyyy, hh:mm a');
  var isPrepaid = (paymentMode.toLowerCase().indexOf('upi') !== -1 || paymentMode.toLowerCase().indexOf('prepaid') !== -1);

  // Status defaults
  var orderStatus = isPrepaid ? '⚡ New Order (Prepaid UPI)' : '📦 New Order (COD Doorstep)';
  var emailStatus = 'Pending';

  // Construct clean WhatsApp quick-chat link formula for sheet
  var waMessage = encodeURIComponent(
    'Namaste ' + customerName + '!\n' +
    'Thank you for ordering with THE CLASSIC CO. Udaipur.\n' +
    '• Order ID: #' + orderId + '\n' +
    '• Frame: ' + title + ' (' + quantity + ' Pair)\n' +
    '• Total Payable: ₹' + amount + '\n' +
    '• Status: Packing & Dispatching in 45-60 mins across Udaipur.\n\n' +
    'Have any questions? Reply right here!'
  );
  var waFormula = '=HYPERLINK("https://wa.me/91' + phone + '?text=' + waMessage + '", "💬 WhatsApp Customer")';

  var row = [
    timeStamp,
    orderId,
    customerName,
    customerEmail,
    "'" + phone,
    address,
    landmark + ', ' + pincode,
    title,
    quantity,
    paymentMode,
    amount,
    orderStatus,
    emailStatus,
    waFormula,
    gps ? ('=HYPERLINK("' + gps + '", "📍 Open GPS Map")') : 'None',
    'Rider ETA: 45-60 Mins'
  ];

  sheet.appendRow(row);
  var lastRow = sheet.getLastRow();

  // Format the amount column as Indian Rupee
  sheet.getRange(lastRow, 11).setNumberFormat('₹#,##0');

  // Trigger Automated Email to Customer
  var emailSent = false;
  if (customerEmail && customerEmail.indexOf('@') !== -1) {
    try {
      sendCustomerConfirmationEmail({
        orderId: orderId,
        name: customerName,
        email: customerEmail,
        phone: phone,
        address: address,
        landmark: landmark,
        pincode: pincode,
        title: title,
        quantity: quantity,
        paymentMode: paymentMode,
        amount: amount,
        isPrepaid: isPrepaid,
        gps: gps,
        timestamp: timeStamp
      });
      sheet.getRange(lastRow, 13).setValue('✅ Sent to Customer');
      emailSent = true;
    } catch (mailErr) {
      Logger.log('Customer Email Error: ' + mailErr.toString());
      sheet.getRange(lastRow, 13).setValue('❌ Error: ' + mailErr.message);
    }
  } else {
    sheet.getRange(lastRow, 13).setValue('⚠️ No Email Provided');
  }

  // Trigger Automated Alert Email to Store Owner (Rishabh)
  try {
    sendOwnerAlertEmail({
      orderId: orderId,
      name: customerName,
      email: customerEmail,
      phone: phone,
      address: address,
      landmark: landmark,
      pincode: pincode,
      title: title,
      quantity: quantity,
      paymentMode: paymentMode,
      amount: amount,
      isPrepaid: isPrepaid,
      gps: gps,
      timestamp: timeStamp,
      sheetUrl: ss.getUrl()
    });
  } catch (ownerErr) {
    Logger.log('Owner Alert Error: ' + ownerErr.toString());
  }

  // Auto-update dashboard metrics
  updateSummaryMetrics(ss);

  return {
    success: true,
    orderId: orderId,
    customer: customerName,
    emailSent: emailSent,
    whatsappUrl: 'https://wa.me/91' + phone + '?text=' + waMessage,
    message: 'Order recorded to Google Sheet. Automated emails and messages initialized.'
  };
}

// ============================================================================
// 4. AUTOMATED EMAIL TO CUSTOMER (Luxury Branded HTML Receipt & ETA)
// ============================================================================
function sendCustomerConfirmationEmail(order) {
  var recipient = order.email;
  var subject = '🧾 Tax Invoice & Order Receipt #' + order.orderId + ' · THE CLASSIC CO. Udaipur';

  var paymentBadgeColor = order.isPrepaid ? '#059669' : '#D97706';
  var paymentBadgeText = order.isPrepaid ? '⚡ PREPAID (INSTANT UPI DEAL)' : '💵 CASH ON DELIVERY';
  var paymentNote = order.isPrepaid
    ? '<p style="margin: 0; font-size: 13px; color: #065F46; font-weight: 600;">✓ Flat ₹550 instant prepayment offer applied. Priority 45-min Udaipur dispatch has been locked.</p>'
    : '<p style="margin: 0; font-size: 13px; color: #92400E; font-weight: 600;">🪞 <strong>Doorstep Mirror Trial:</strong> Feel free to try on your sunglasses in front of a mirror before handing cash (₹' + order.amount + ') to the rider.</p>';

  var htmlBody = 
    '<!DOCTYPE html>' +
    '<html>' +
    '<head><meta charset="UTF-8"><title>Order Confirmed</title></head>' +
    '<body style="margin:0; padding:0; background-color:#faf9f6; font-family:-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif; color:#181716;">' +
      '<table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#faf9f6; padding:30px 10px;">' +
        '<tr><td align="center">' +
          '<table width="600" border="0" cellspacing="0" cellpadding="0" style="max-width:600px; width:100%; background-color:#ffffff; border:1px solid #e6e0d2; border-radius:16px; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,0.05);">' +
            
            // Header Banner
            '<tr><td style="background-color:#181716; padding:32px 28px; text-align:center;">' +
              '<div style="color:#b48448; font-size:11px; font-weight:800; letter-spacing:3px; text-transform:uppercase; margin-bottom:8px;">STUDIO EYEWEAR · UDAIPUR</div>' +
              '<h1 style="color:#ffffff; font-size:26px; font-weight:700; margin:0; letter-spacing:1px; font-family:Georgia, serif;">THE CLASSIC CO.</h1>' +
              '<div style="color:#a8a29e; font-size:12px; margin-top:8px;">Handcrafted Architectural Eyewear</div>' +
            '</td></tr>' +

            // Order Confirmation Heading
            '<tr><td style="padding:32px 32px 20px;">' +
              '<div style="display:inline-block; background-color:#ecfdf5; border:1px solid #a7f3d0; color:#065f46; font-size:11px; font-weight:700; padding:4px 10px; border-radius:20px; text-transform:uppercase; margin-bottom:12px;">' +
                '✓ Order Confirmed' +
              '</div>' +
              '<h2 style="font-size:22px; color:#181716; margin:0 0 8px; font-weight:700;">Namaste ' + order.name + '!</h2>' +
              '<p style="font-size:14.5px; color:#57534e; line-height:1.6; margin:0 0 20px;">' +
                'Your order for <strong>' + order.title + '</strong> is officially registered with our Udaipur studio! Our team has initiated quality inspection and standard packaging.' +
              '</p>' +
              
              // Invoice Summary Card
              '<table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f5f2eb; border:1px solid #e6e0d2; border-radius:12px; padding:16px; margin-bottom:24px;">' +
                '<tr>' +
                  '<td style="font-size:13px; color:#736e65; padding:6px 0;">Order Reference:</td>' +
                  '<td align="right" style="font-size:14px; font-weight:700; color:#181716; padding:6px 0;">#' + order.orderId + '</td>' +
                '</tr>' +
                '<tr>' +
                  '<td style="font-size:13px; color:#736e65; padding:6px 0;">Product Silhouette:</td>' +
                  '<td align="right" style="font-size:13px; font-weight:600; color:#181716; padding:6px 0;">' + order.title + '</td>' +
                '</tr>' +
                '<tr>' +
                  '<td style="font-size:13px; color:#736e65; padding:6px 0;">Quantity:</td>' +
                  '<td align="right" style="font-size:13px; font-weight:600; color:#181716; padding:6px 0;">' + order.quantity + ' Pair(s)</td>' +
                '</tr>' +
                '<tr>' +
                  '<td style="font-size:13px; color:#736e65; padding:6px 0;">Payment Method:</td>' +
                  '<td align="right" style="font-size:12px; font-weight:700; color:' + paymentBadgeColor + '; padding:6px 0;">' + paymentBadgeText + '</td>' +
                '</tr>' +
                '<tr>' +
                  '<td style="font-size:13px; color:#736e65; padding:6px 0;">Doorstep Delivery:</td>' +
                  '<td align="right" style="font-size:13px; font-weight:700; color:#059669; padding:6px 0;">FREE (45-Min Udaipur Express)</td>' +
                '</tr>' +
                '<tr>' +
                  '<td style="font-size:15px; font-weight:700; color:#181716; padding:12px 0 4px; border-top:1px dashed #ded7c7;">Total Payable:</td>' +
                  '<td align="right" style="font-size:18px; font-weight:800; color:#8c622a; padding:12px 0 4px; border-top:1px dashed #ded7c7;">₹' + order.amount + ' Only</td>' +
                '</tr>' +
              '</table>' +

              // Payment Notice Box
              '<div style="background-color:' + (order.isPrepaid ? '#ecfdf5' : '#fffbeb') + '; border:1px solid ' + (order.isPrepaid ? '#a7f3d0' : '#fde68a') + '; border-radius:10px; padding:14px; margin-bottom:24px;">' +
                paymentNote +
              '</div>' +

              // Delivery Address Card
              '<table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#ffffff; border:1px solid #e6e0d2; border-radius:12px; padding:16px; margin-bottom:24px;">' +
                '<tr><td style="font-size:13px; font-weight:700; color:#181716; padding-bottom:6px;">📍 Delivery Dispatch Details:</td></tr>' +
                '<tr><td style="font-size:13px; color:#57534e; line-height:1.5;">' +
                  '<strong>Address:</strong> ' + order.address + '<br>' +
                  '<strong>Landmark / Pincode:</strong> ' + order.landmark + ', ' + order.pincode + '<br>' +
                  '<strong>Contact Phone:</strong> +91 ' + order.phone + '<br>' +
                  '<strong>Dispatch ETA:</strong> Within 45-60 Minutes across Udaipur City' +
                '</td></tr>' +
              '</table>' +

              // Complimentary Box Perks
              '<div style="background-color:#faf9f6; border-left:3px solid #b48448; padding:12px 14px; margin-bottom:26px; font-size:12.5px; color:#6b6358;">' +
                '🛡️ <strong>Included in your parcel free:</strong> Luxury Leather Hard Case (₹250 value) + Microfiber Cleaning Cloth + UV400 TAC Polarized Test Card.' +
              '</div>' +

              // Direct WhatsApp CTA
              '<div style="text-align:center; margin-bottom:24px;">' +
                '<a href="https://wa.me/' + STORE_CONFIG.whatsappNumber + '?text=' + encodeURIComponent('Hi The Classic Co! I have an update regarding my Order #' + order.orderId) + '" ' +
                   'style="display:inline-block; background-color:#25d366; color:#ffffff; font-weight:700; font-size:14px; text-decoration:none; padding:13px 28px; border-radius:999px; box-shadow:0 4px 14px rgba(37,211,102,0.35);">' +
                  '💬 Chat with Udaipur Dispatch (+91 ' + STORE_CONFIG.whatsappNumber.slice(2) + ')' +
                '</a>' +
              '</div>' +

            '</td></tr>' +

            // Footer
            '<tr><td style="background-color:#f5f2eb; padding:20px 32px; border-top:1px solid #e6e0d2; text-align:center; font-size:12px; color:#8c827a;">' +
              'THE CLASSIC CO. · Architectural Eyewear Studio · Udaipur, Rajasthan<br>' +
              'Helpline: +91 8619661325 · Email: ' + STORE_CONFIG.ownerEmail + '<br>' +
              '<span style="font-size:11px; color:#a8a29e;">100% UV400 Protection · 7-Day Doorstep Replacement Guarantee</span>' +
            '</td></tr>' +

          '</table>' +
        '</td></tr>' +
      '</table>' +
    '</body>' +
    '</html>';

  MailApp.sendEmail({
    to: recipient,
    subject: subject,
    htmlBody: htmlBody,
    name: STORE_CONFIG.brandName
  });
}

// ============================================================================
// 5. AUTOMATED ALERT EMAIL TO STORE OWNER (Rishabh)
// ============================================================================
function sendOwnerAlertEmail(order) {
  var ownerRecipient = STORE_CONFIG.ownerEmail;
  var subject = '🚨 NEW ORDER #' + order.orderId + ' (₹' + order.amount + ') · ' + order.name;

  var body = 
    'Hey Rishabh,\n\n' +
    'A new order has just been submitted on THE CLASSIC CO.!\n\n' +
    '=================================================\n' +
    'ORDER DETAILS:\n' +
    '• Order ID: #' + order.orderId + '\n' +
    '• Customer Name: ' + order.name + '\n' +
    '• WhatsApp Mobile: ' + order.phone + '\n' +
    '• Customer Email: ' + (order.email || 'None') + '\n' +
    '• Frame Ordered: ' + order.title + ' (Qty: ' + order.quantity + ')\n' +
    '• Total Payable: ₹' + order.amount + ' (' + order.paymentMode + ')\n' +
    '• Delivery Address: ' + order.address + '\n' +
    '• Landmark & Pincode: ' + order.landmark + ', ' + order.pincode + '\n' +
    (order.gps ? ('• GPS Live Location: ' + order.gps + '\n') : '') +
    '• Time Placed: ' + order.timestamp + '\n' +
    '=================================================\n\n' +
    'QUICK ACTIONS:\n' +
    '1. WhatsApp Customer: https://wa.me/91' + order.phone + '\n' +
    '2. Call Customer: tel:+91' + order.phone + '\n' +
    '3. View Google Sheet: ' + (order.sheetUrl || 'Active Spreadsheet') + '\n\n' +
    'Dispatch ETA: 45-60 Mins across Udaipur.';

  MailApp.sendEmail(ownerRecipient, subject, body);
}

function safeAlert(msg) {
  try {
    SpreadsheetApp.getUi().alert(msg);
  } catch (e) {
    Logger.log('[ALERT]: ' + msg);
  }
}

// ============================================================================
// 6. CUSTOM GOOGLE SHEETS MENU & AUTOMATED DISPATCH EMAILS
// ============================================================================
function onOpen() {
  try {
    var ui = SpreadsheetApp.getUi();
    ui.createMenu('👓 THE CLASSIC CO Operations')
      .addItem('🚚 Mark Selected Row as Dispatched & Send Email', 'menuMarkDispatched')
      .addItem('✅ Mark Selected Row as Delivered & Send Email', 'menuMarkDelivered')
      .addItem('💬 Open WhatsApp Chat with Selected Customer', 'menuOpenWhatsApp')
      .addItem('📧 Resend Confirmation Email to Selected Row', 'menuResendConfirmation')
      .addSeparator()
      .addItem('📊 Refresh Sales & Revenue Dashboard', 'menuRefreshDashboard')
      .addItem('🧪 Send Test Order & Verify Setup', 'testOrderIngestion')
      .addToUi();
  } catch (err) {
    Logger.log('Headless mode - UI menu skipped: ' + err.message);
  }
}

/**
 * Triggered automatically when admin edits the sheet.
 * If column 12 (Order Status) is changed to 'Dispatched', it auto-emails the customer!
 */
function onEdit(e) {
  try {
    if (!e || !e.range) return;
    var sheet = e.range.getSheet();
    if (sheet.getName() !== 'Orders') return;

    var col = e.range.getColumn();
    var row = e.range.getRow();
    if (row === 1) return; // Header row

    // Column 12 is 'Order Status'
    if (col === 12) {
      var newStatus = String(e.value || '').toLowerCase();
      if (newStatus.indexOf('dispatch') !== -1 || newStatus.indexOf('out for delivery') !== -1) {
        sendCustomerDispatchUpdateEmail(sheet, row);
      } else if (newStatus.indexOf('delivered') !== -1) {
        sendCustomerDeliveredEmail(sheet, row);
      }
    }
  } catch (err) {
    Logger.log('onEdit error: ' + err.toString());
  }
}

function menuMarkDispatched() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var row = sheet.getActiveRange().getRow();
  if (row <= 1) {
    safeAlert('Please select a customer order row first.');
    return;
  }
  sheet.getRange(row, 12).setValue('🚚 Dispatched / Rider On The Way');
  sendCustomerDispatchUpdateEmail(sheet, row);
  safeAlert('Status updated to Dispatched and email sent to customer!');
}

function menuMarkDelivered() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var row = sheet.getActiveRange().getRow();
  if (row <= 1) {
    safeAlert('Please select a customer order row first.');
    return;
  }
  sheet.getRange(row, 12).setValue('✅ Delivered (Payment Completed)');
  sendCustomerDeliveredEmail(sheet, row);
  safeAlert('Status updated to Delivered and thank you email sent!');
}

function menuOpenWhatsApp() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var row = sheet.getActiveRange().getRow();
  if (row <= 1) {
    safeAlert('Please select an order row first.');
    return;
  }
  var phone = String(sheet.getRange(row, 5).getValue()).replace(/\D/g, '');
  var name = sheet.getRange(row, 3).getValue();
  var orderId = sheet.getRange(row, 2).getValue();
  var url = 'https://wa.me/91' + phone + '?text=' + encodeURIComponent('Namaste ' + name + '! Regarding your The Classic Co. Order #' + orderId + '...');
  
  var html = '<script>window.open("' + url + '", "_blank"); google.script.host.close();</script>';
  SpreadsheetApp.getUi().showModalDialog(HtmlService.createHtmlOutput(html).setWidth(50).setHeight(50), 'Opening WhatsApp...');
}

function menuResendConfirmation() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var row = sheet.getActiveRange().getRow();
  if (row <= 1) return;

  var order = {
    orderId: sheet.getRange(row, 2).getValue(),
    name: sheet.getRange(row, 3).getValue(),
    email: sheet.getRange(row, 4).getValue(),
    phone: sheet.getRange(row, 5).getValue(),
    address: sheet.getRange(row, 6).getValue(),
    landmark: sheet.getRange(row, 7).getValue(),
    title: sheet.getRange(row, 8).getValue(),
    quantity: sheet.getRange(row, 9).getValue(),
    paymentMode: sheet.getRange(row, 10).getValue(),
    amount: sheet.getRange(row, 11).getValue(),
    isPrepaid: String(sheet.getRange(row, 10).getValue()).toLowerCase().indexOf('upi') !== -1
  };

  if (!order.email || order.email.indexOf('@') === -1) {
    safeAlert('No valid email found in column 4 for this row.');
    return;
  }

  sendCustomerConfirmationEmail(order);
  sheet.getRange(row, 13).setValue('✅ Resent at ' + Utilities.formatDate(new Date(), 'Asia/Kolkata', 'hh:mm a'));
  safeAlert('Confirmation email resent to ' + order.email);
}

function sendCustomerDispatchUpdateEmail(sheet, row) {
  var email = sheet.getRange(row, 4).getValue();
  if (!email || email.indexOf('@') === -1) return;

  var orderId = sheet.getRange(row, 2).getValue();
  var name = sheet.getRange(row, 3).getValue();
  var title = sheet.getRange(row, 8).getValue();
  var address = sheet.getRange(row, 6).getValue();
  var amount = sheet.getRange(row, 11).getValue();

  var subject = '🚚 Rider On The Way! Order #' + orderId + ' Dispatched · THE CLASSIC CO.';
  var body = 
    'Namaste ' + name + ',\n\n' +
    'Great news! Your sunglasses (' + title + ') have been packaged and handed over to our express delivery rider.\n\n' +
    '• Order ID: #' + orderId + '\n' +
    '• Delivery Address: ' + address + '\n' +
    '• ETA: Arriving within 30-45 minutes across Udaipur\n' +
    '• Total Payable: ₹' + amount + '\n\n' +
    'Please keep your mirror ready to try them on at your doorstep!\n\n' +
    'Questions? Chat with our dispatch team on WhatsApp: +91 8619661325\n\n' +
    'Warm regards,\nTHE CLASSIC CO. Udaipur';

  try {
    MailApp.sendEmail(email, subject, body);
    sheet.getRange(row, 13).setValue('✅ Dispatch Email Sent');
  } catch (e) {
    Logger.log('Dispatch email error: ' + e.toString());
  }
}

function sendCustomerDeliveredEmail(sheet, row) {
  var email = sheet.getRange(row, 4).getValue();
  if (!email || email.indexOf('@') === -1) return;

  var orderId = sheet.getRange(row, 2).getValue();
  var name = sheet.getRange(row, 3).getValue();
  var title = sheet.getRange(row, 8).getValue();

  var subject = '✨ Order Delivered! Thank you for choosing THE CLASSIC CO. Udaipur';
  var body = 
    'Namaste ' + name + ',\n\n' +
    'Your order #' + orderId + ' for ' + title + ' has been marked as DELIVERED!\n\n' +
    'We hope you love your new architectural eyewear silhouette. Every pair is crafted with TAC 9-layer polarized glare protection.\n\n' +
    'Tag us on Instagram @theclassicco.in or share your photo with us on WhatsApp (+91 8619661325) to receive ₹100 OFF on your next order.\n\n' +
    'Thank you for supporting local handcrafted eyewear in Udaipur!\n\n' +
    'THE CLASSIC CO. Studio Team';

  try {
    MailApp.sendEmail(email, subject, body);
  } catch (e) {}
}

// ============================================================================
// 7. ORDER LOOKUP FOR LIVE STATUS TRACKER
// ============================================================================
function lookupOrderStatus(orderId) {
  if (!orderId) {
    return { success: false, error: 'Order ID is required' };
  }
  var ss = getStoreSpreadsheet();
  var sheet = ss.getSheetByName('Orders');
  if (!sheet) return { success: false, error: 'Orders sheet not found' };

  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    var rowId = String(data[i][1]).trim().toUpperCase();
    var searchId = orderId.trim().toUpperCase();
    if (rowId === searchId || rowId.indexOf(searchId) !== -1) {
      return {
        success: true,
        orderId: data[i][1],
        timestamp: data[i][0],
        customerName: data[i][2],
        phone: String(data[i][4]).replace(/\D/g, '').slice(-4), // mask phone
        product: data[i][7],
        quantity: data[i][8],
        paymentMode: data[i][9],
        total: data[i][10],
        status: data[i][11] || 'Processing',
        notes: data[i][15] || 'ETA: 45-60 Mins'
      };
    }
  }

  return { success: false, message: 'Order #' + orderId + ' not found in active records.' };
}

// ============================================================================
// 8. SPREADSHEET INITIALIZATION & LUXURY STYLING
// ============================================================================
function getOrCreateOrdersSheet(ss) {
  var sheet = ss.getSheetByName('Orders');
  if (!sheet) {
    sheet = ss.insertSheet('Orders');
    var headers = [
      'Timestamp (IST)',
      'Order ID',
      'Customer Name',
      'Customer Email',
      'WhatsApp Phone',
      'Delivery Address',
      'Landmark & Pincode',
      'Eyewear Silhouette',
      'Qty',
      'Payment Mode',
      'Total Payable (₹)',
      'Order Status',
      'Email Status',
      'WhatsApp Link',
      'GPS Location',
      'Dispatch Notes'
    ];
    sheet.appendRow(headers);

    // Header styling: Luxury charcoal with white bold font
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange
      .setBackground('#181716')
      .setFontColor('#ffffff')
      .setFontWeight('bold')
      .setFontSize(10)
      .setHorizontalAlignment('center');

    sheet.setFrozenRows(1);
    sheet.setRowHeight(1, 36);

    // Set column widths
    sheet.setColumnWidth(1, 140); // Time
    sheet.setColumnWidth(2, 110); // Order ID
    sheet.setColumnWidth(3, 140); // Name
    sheet.setColumnWidth(4, 180); // Email
    sheet.setColumnWidth(5, 120); // Phone
    sheet.setColumnWidth(6, 240); // Address
    sheet.setColumnWidth(7, 160); // Landmark
    sheet.setColumnWidth(8, 220); // Silhouette
    sheet.setColumnWidth(9, 60);  // Qty
    sheet.setColumnWidth(10, 130); // Mode
    sheet.setColumnWidth(11, 110); // Amount
    sheet.setColumnWidth(12, 160); // Status
    sheet.setColumnWidth(13, 130); // Email status
    sheet.setColumnWidth(14, 140); // WhatsApp
    sheet.setColumnWidth(15, 120); // GPS
    sheet.setColumnWidth(16, 160); // Notes
  }
  return sheet;
}

function updateSummaryMetrics(ss) {
  var summary = ss.getSheetByName('Summary');
  if (!summary) {
    summary = ss.insertSheet('Summary');
    summary.appendRow(['Metric', 'Value']);
    summary.getRange('A1:B1').setBackground('#b48448').setFontColor('#ffffff').setFontWeight('bold');
    summary.setColumnWidth(1, 180);
    summary.setColumnWidth(2, 140);
  }

  summary.getRange('A2').setValue('Total Orders');
  summary.getRange('B2').setFormula('=COUNTA(Orders!B2:B)');

  summary.getRange('A3').setValue('Total Revenue (₹)');
  summary.getRange('B3').setFormula('=SUM(Orders!K2:K)');

  summary.getRange('A4').setValue('Prepaid UPI Orders');
  summary.getRange('B4').setFormula('=COUNTIF(Orders!J2:J, "*UPI*")');

  summary.getRange('A5').setValue('Cash on Delivery Orders');
  summary.getRange('B5').setFormula('=COUNTIF(Orders!J2:J, "*Cash*")');

  summary.getRange('B3').setNumberFormat('₹#,##0');
}

function menuRefreshDashboard() {
  var ss = getStoreSpreadsheet();
  updateSummaryMetrics(ss);
  safeAlert('Dashboard metrics refreshed!');
}

function testOrderIngestion() {
  var testData = {
    orderId: 'ORD-CC-' + Math.floor(10000 + Math.random() * 90000),
    name: 'Rahul Sharma (Test)',
    email: STORE_CONFIG.ownerEmail,
    phone: '9829012345',
    address: 'Plot 42, Saheli Marg, Near Sukhadia Circle',
    landmark: 'Opp Big Bazaar',
    pincode: '313001',
    title: 'Aero Crystal Matte Frames blue cut lenses',
    quantity: 1,
    paymentMode: 'Instant UPI',
    amount: 550,
    gps: 'https://maps.google.com/?q=24.5854,73.7125'
  };

  var res = processIncomingOrder(testData);
  safeAlert('Test Order Processed!\n\nOrder ID: ' + res.orderId + '\nEmail Sent: ' + res.emailSent + '\nCheck row in "Orders" tab!');
}

function parseFormUrlEncoded(text) {
  var obj = {};
  var pairs = text.split('&');
  for (var i = 0; i < pairs.length; i++) {
    var parts = pairs[i].split('=');
    if (parts.length >= 2) {
      var key = decodeURIComponent(parts[0].replace(/\+/g, ' '));
      var val = decodeURIComponent(parts.slice(1).join('=').replace(/\+/g, ' '));
      obj[key] = val;
    }
  }
  return obj;
}

// ============================================================================
// 9. LIVE WEB DASHBOARD HTML (Served if Web App URL is opened in browser)
// ============================================================================
function renderAdminDashboardHtml() {
  var ss = getStoreSpreadsheet();
  var sheet = ss.getSheetByName('Orders');
  var totalOrders = 0;
  var totalRevenue = 0;

  if (sheet && sheet.getLastRow() > 1) {
    totalOrders = sheet.getLastRow() - 1;
    var amounts = sheet.getRange(2, 11, totalOrders, 1).getValues();
    for (var i = 0; i < amounts.length; i++) {
      var num = Number(amounts[i][0]);
      if (!isNaN(num)) totalRevenue += num;
    }
  }

  return '<!DOCTYPE html>' +
    '<html>' +
    '<head>' +
      '<meta charset="UTF-8">' +
      '<title>THE CLASSIC CO. · Store Operations</title>' +
      '<style>' +
        'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #faf9f6; color: #181716; padding: 24px; margin: 0; }' +
        '.card { background: #ffffff; border: 1px solid #e6e0d2; border-radius: 14px; max-width: 600px; margin: 20px auto; padding: 24px; box-shadow: 0 4px 16px rgba(0,0,0,0.04); }' +
        '.badge { background: #ecfdf5; color: #065f46; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 20px; display: inline-block; margin-bottom: 12px; }' +
        '.metric-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin: 20px 0; }' +
        '.metric-box { background: #f5f2eb; padding: 14px; border-radius: 10px; border: 1px solid #ded7c7; }' +
        '.metric-num { font-size: 26px; font-weight: 800; color: #8c622a; margin-top: 4px; }' +
        '.btn { display: inline-block; background: #181716; color: #ffffff; text-decoration: none; padding: 10px 18px; border-radius: 8px; font-weight: 700; font-size: 13px; }' +
      '</style>' +
    '</head>' +
    '<body>' +
      '<div class="card">' +
        '<span class="badge">● CLOUD ENGINE ONLINE 24/7</span>' +
        '<h1 style="font-size:22px; margin:0 0 4px;">THE CLASSIC CO.</h1>' +
        '<p style="font-size:13px; color:#736e65; margin:0 0 16px;">Architectural Eyewear Studio · Udaipur Operations Backend</p>' +
        '<div class="metric-grid">' +
          '<div class="metric-box"><div>Total Orders Captured</div><div class="metric-num">' + totalOrders + '</div></div>' +
          '<div class="metric-box"><div>Total Revenue</div><div class="metric-num">₹' + totalRevenue.toLocaleString('en-IN') + '</div></div>' +
        '</div>' +
        '<p style="font-size:12.5px; color:#555048; line-height:1.5;">' +
          'This Google Apps Script Web App receives orders from your GitHub & Vercel website, logs them to Google Sheets, sends automated HTML emails to customers, and alerts the Udaipur dispatch team instantly.' +
        '</p>' +
        '<div style="margin-top:20px; display:flex; gap:10px;">' +
          '<a href="' + ss.getUrl() + '" target="_blank" class="btn">📊 Open Orders Google Sheet</a>' +
        '</div>' +
      '</div>' +
    '</body>' +
    '</html>';
}
