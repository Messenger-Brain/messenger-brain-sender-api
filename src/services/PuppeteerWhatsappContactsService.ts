import { Page } from "puppeteer";
import Logger from "../utils/logger";
import { BrowserContextWithInstance } from "./BrowserContextService";

export class PuppeteerWhatsappContactsService {
  private logger: typeof Logger;

  constructor() {
    this.logger = Logger;
  }

  /**
   * Extrae todos los contactos visibles desde el panel "New Chat" en WhatsApp Web.
   * @param browserContext Contexto del navegador con la sesión activa
   */

  public async fetchContacts(
    browserContext: BrowserContextWithInstance
  ): Promise<{
    success: boolean;
    total_contacts: number;
    contacts: { name: string }[];
    fetched_at: string;
  }> {
    this.logger.info("Iniciando extracción de contactos (New Chat)...", {
      browser_context_id: browserContext.id,
    });

    try {
      const page = browserContext.page;
      if (!page) throw new Error("No active page found in browser context");

      // Buscar y abrir el botón "New Chat"
      try {
        await page.waitForSelector(
          "div[aria-label='New chat'][role='button']",
          { timeout: 15000 }
        );
        const newChat = await page.$(
          "div[aria-label='New chat'][role='button']"
        );
        if (newChat) {
          this.logger.info(
            "Botón 'New chat' encontrado. Abriendo lista de contactos..."
          );
          await newChat.click();
          // ===== Div que contiene scroll en el apartado de new chat ===== //
          await page.waitForSelector(
            'div[class="x1n2onr6 x1n2onr6 xupqr0c x78zum5 x1r8uery x1iyjqo2 xdt5ytf x6ikm8r x1odjw0f x1hc1fzr x1anedsm x1280gxy"]',
            { timeout: 10000 }
          );
          await new Promise((resolve) => setTimeout(resolve, 3000));
        } else {
          this.logger.warn("❌ No se encontró el botón 'New chat'.");
        }
      } catch (err: any) {
        this.logger.warn("No se pudo abrir el panel de 'New Chat':", {
          error: err.message,
        });
      }

      let contacts: {
        jid: string;
        name: string;
        notify: string;
        verifiedName: string;
        imgUrl: string;
        status: string;
      }[] = [];
      try {
        contacts = await page.evaluate(async () => {
          
          // @ts-ignore: accessing DOM inside page.evaluate (runs in browser)
          // ===== Clase que contiene scroll en el apartado de new chat ===== //
          const scrollContainer = document.querySelector(
            'div[class="x1n2onr6 x1n2onr6 xupqr0c x78zum5 x1r8uery x1iyjqo2 xdt5ytf x6ikm8r x1odjw0f x1hc1fzr x1anedsm x1280gxy"]'
          );
          if (!scrollContainer) {
            console.warn(
              "❌ No se encontró el contenedor de contactos (New Chat)."
            );
            return [];
          }

          console.log(
            "📜 Iniciando scroll automático para obtener contactos..."
          );

          const result: {
            jid: string;
            name: string;
            notify: string;
            verifiedName: string;
            imgUrl: string;
            status: string;
          }[] = [];
          let lastScrollTop = 0;
          let sameCount = 0;
          const maxSameCount = 3;
          const maxIterations = 200;
          let iterations = 0;

          const extractContacts = () => {
            const chatItems =
              scrollContainer.querySelectorAll('div[role="button"]');

            chatItems.forEach((chat: any) => {
              const nameSpan = chat.querySelector("span[title]");
              const statusSpan = chat.querySelector(
                'span[class*="selectable-text"][title]'
              );

              if (nameSpan) {
                const name = nameSpan.getAttribute("title")?.trim() || "";
                const status = statusSpan?.getAttribute("title")?.trim() || "";

                if (name && !result.find((c) => c.name === name)) {
                  const jid = `${name.replace(/\s+/g, "")}${Math.floor(
                    Math.random() * 1000
                  )}`; // genera algo tipo "Adrian123"

                  result.push({
                    jid,
                    name,
                    notify: name,
                    verifiedName: name,
                    imgUrl: "",
                    status,
                  });

                  console.log("🆕 Contacto detectado:", { jid, name, status });
                }
              }
            });
          };

          while (sameCount < maxSameCount && iterations < maxIterations) {
            extractContacts();
            scrollContainer.scrollBy(0, 1000);
            await new Promise((r) => setTimeout(r, 1500));
            const currentScrollTop = scrollContainer.scrollTop;
            if (currentScrollTop === lastScrollTop) {
              sameCount++;
            } else {
              sameCount = 0;
              lastScrollTop = currentScrollTop;
              iterations++;
            }
          }

          extractContacts();
          console.log(
            `✅ Scroll completado. Total: ${result.length} contactos.`
          );
          return result;
        });
      } catch (err: any) {
        this.logger.error(
          "Error en page.evaluate durante la extracción de contactos",
          {
            error: err.message,
          }
        );
        return {
          success: false,
          total_contacts: 0,
          contacts: [],
          fetched_at: new Date().toISOString(),
        };
      }

      //Cerrar el panel de new chat
      try {
        await page.waitForSelector(
          "div[role='button'] span[data-icon=back-refreshed]",
          { timeout: 5000 }
        );
        const backRefreshedIcon = await page.$(
          "div[role='button'] span[data-icon=back-refreshed]"
        );
        if (backRefreshedIcon) {
          this.logger.info(
            "✅ Botón 'Back Refreshed' encontrado. Cerrando panel..."
          );
          await backRefreshedIcon.click();
        } else {
          this.logger.warn("❌ No se encontró el botón 'Back Refreshed'.");
        }
      } catch (err: any) {
        this.logger.warn("No se pudo cerrar el panel 'New Chat':", {
          error: err.message,
        });
      }

      // Resultado final
      const result = {
        success: true,
        total_contacts: contacts.length,
        contacts,
        fetched_at: new Date().toISOString(),
      };

      this.logger.info("✅ Contactos extraídos correctamente (New Chat)", {
        total_contacts: contacts.length,
        browser_context_id: browserContext.id,
      });

      return result;
    } catch (error: any) {
      this.logger.error("Error crítico al extraer contactos con Puppeteer", {
        browser_context_id: browserContext.id,
        error: error.message,
      });

      return {
        success: false,
        total_contacts: 0,
        contacts: [],
        fetched_at: new Date().toISOString(),
      };
    }
  }
}

export default PuppeteerWhatsappContactsService;
