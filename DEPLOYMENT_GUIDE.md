# 📊 THE CLASSIC CO. — Google Sheet & Apps Script 2-Minute Setup Guide

Connect your luxury sunglasses store to Google Sheets so every order is automatically recorded and automated emails & WhatsApp messages are sent to your customers!

---

### Step 1: Create Your Orders Google Sheet
1. Open Google Chrome and go to: **[https://sheets.new](https://sheets.new)**
2. Name the sheet (top-left): **THE CLASSIC CO — Orders CRM**

---

### Step 2: Open Google Apps Script Editor
1. In the Google Sheets top menu, click: **Extensions ➔ Apps Script**
2. An Apps Script code editor will open in a new tab.

---

### Step 3: Paste Backend Code
1. In the file **`Code.gs`** (which is open by default):
   - Press **Ctrl + A** to select all default sample code.
   - Press **Delete**.
   - Copy the entire code from **`Code.gs`** (located in `d:\freelance automation\Google_Apps_Script_Store\Code.gs`) and paste it in.
2. Click the **💾 Save** icon (or press **Ctrl + S**).

---

### Step 4: Deploy as Live Web App (Get Your Webhook URL)
1. In the top-right corner, click the blue **Deploy** button ➔ select **New deployment**.
2. Click the ⚙️ gear icon next to *Select type* ➔ select **Web app**.
3. Configure these exact settings:
   - **Description:** `The Classic Co Order & Email Webhook`
   - **Execute as:** `Me (your email)`
   - **Who has access:** `Anyone` *(Crucial: allows customers anywhere in Udaipur/India to submit orders from Vercel without login)*
4. Click **Deploy**.
5. **Authorization prompt**:
   - Google will show an authorization prompt: click **Review permissions**.
   - Select your Google account (`rishabhsamarwal383@gmail.com`).
   - Click **Advanced** (at the bottom-left).
   - Click **Go to Untitled project (unsafe)**.
   - Click **Allow**.
6. Google will give you a **Web App URL** that looks like:
   `https://script.google.com/macros/s/AKfycb.../exec`
7. Copy this URL!

---

### Step 5: Connect URL to Your Website
In `Sunglasses_Website/index.html` and `The_Classic_Co_Vercel/index.html`, locate line ~2160:
```javascript
const GOOGLE_APPS_SCRIPT_URL = "PASTE_YOUR_COPIED_URL_HERE";
```
Paste your Web App URL inside the quotation marks! That's it!

---

### 🌟 What Happens Automatically When a Customer Orders:
1. **Google Sheets Log:** A new row is instantly added to your "Orders" tab with Order ID, Customer Name, Email, WhatsApp Phone, Address, Frame ordered, Payment mode, and Total.
2. **Automated Customer Email:** Customer receives a luxury branded HTML confirmation email with complete order breakdown, Udaipur dispatch ETA (45-60 min), and a direct WhatsApp chat button!
3. **Automated Owner Alert:** Rishabh receives an immediate email alert with customer details and 1-tap call/WhatsApp buttons.
4. **Interactive Sheet Menu:** In Google Sheets, a new menu **👓 THE CLASSIC CO Operations** appears:
   - 🚚 **Mark as Dispatched**: Automatically sends a "Rider on the way!" email to the customer.
   - ✅ **Mark as Delivered**: Automatically sends a "Thank you" email to the customer.
   - 💬 **WhatsApp Customer**: Opens WhatsApp Web pre-loaded with customer's order message!
