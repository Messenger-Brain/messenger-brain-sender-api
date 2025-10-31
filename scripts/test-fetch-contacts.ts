import BrowserContextService from "../src/services/BrowserContextService";
import PuppeteerWhatsappContactsService from "../src/services/PuppeteerWhatsappContactsService";

/**
 * Script to manually test the WhatsApp Puppeteer contact extraction
 * without running the full Messenger Brain API application.
 *  =====  npx ts-node scripts/test-fetch-contacts.ts  =====
 */

(async () => {
  const browserService = BrowserContextService.getInstance();
  await browserService.initializeBrowser();

  // Crear un nuevo contexto (abrirá WhatsApp Web)
  const contextResponse = await browserService.createBrowserContext();
  if (!contextResponse.success || !contextResponse.data) {
    console.error("❌ Error al crear el contexto:", contextResponse.message);
    process.exit(1);
  }
  
  const browserContext = contextResponse.data;

  // Esperar unos segundos para escanear el código QR manualmente
  console.log("📱 Escaneá el código QR en la ventana de WhatsApp Web...");
  await new Promise((resolve) => setTimeout(resolve, 25000)); // 25s para escanear

  // Llamar al servicio Puppeteer para extraer contactos
  const puppeteerService = new PuppeteerWhatsappContactsService();
  // const result = await puppeteerService.fetchContacts(browserContext);
  const result = await puppeteerService.fetchContactByPhoneNumber(browserContext,85144346);


  console.log("\n✅ RESULTADO FINAL:");
  console.log(result);

  await browserService.shutdown();
  process.exit(0);
})();
