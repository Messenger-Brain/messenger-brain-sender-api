import { Page } from "puppeteer";
import Logger from "../utils/logger";
import { BrowserContextWithInstance } from "./BrowserContextService";
import { METHODS } from "http";

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

  /**
   * Extrae el contacto asociado al número de teléfono recibido
   * @param browserContext Contexto del navegador con la sesión activa
   * @param contact_phone_number Número de télefono del contacto a buscar
   */
  public async fetchContactByPhoneNumber(
    browserContext: BrowserContextWithInstance,
    contact_phone_number: number
  ): Promise<{
    success: boolean;
    message: string;
    error_type?: string;
    contactInformation: {
      jid: string;
      name: string;
      notify: string;
      verifiedName: string;
      imgUrl: string;
      status: string;
    }[];
    fetched_at: string;
  }> {
    this.logger.info("🔍 Iniciando búsqueda de contacto por número...", {
      browser_context_id: browserContext.id,
      phone_number: contact_phone_number,
    });

    try {
      const page = browserContext.page;
      if (!page) throw new Error("No active page found in browser context");

      // === Buscar el input de búsqueda === //
      try {
        await page.waitForSelector(
          "div[aria-label='Search input textbox'][role='textbox']",
          { timeout: 5000 }
        );
      } catch {
        this.logger.error(
          "❌ No se encontró el input de búsqueda en WhatsApp Web"
        );
        throw {
          type: "SEARCH_BOX_NOT_FOUND",
          message: "No se encontró el campo de búsqueda en WhatsApp Web.",
        };
      }

      // === Limpiar y escribir número === //
      try {
        const searchBox = await page.$(
          "div[aria-label='Search input textbox'][role='textbox']"
        );
        if (!searchBox) throw new Error("No se encontró el input de búsqueda");

        await searchBox.click();
        await searchBox.focus();
        await page.keyboard.down("Control");
        await page.keyboard.press("A");
        await page.keyboard.up("Control");
        await page.keyboard.press("Backspace");
        await new Promise((resolve) => setTimeout(resolve, 500));
        await page.keyboard.type(contact_phone_number.toString(), {
          delay: 80,
        });

        this.logger.info("✅ Número escrito en el buscador correctamente");
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (err: any) {
        this.logger.error("Error al escribir el número en el buscador", {
          error: err.message,
        });
        throw {
          type: "SEARCH_INPUT_ERROR",
          message: "No se pudo escribir el número en el buscador.",
          details: err.message,
        };
      }

      // === Esperar y abrir primer resultado === //
      try {
        const resultSelector =
          "div[aria-label='Search results.'][role='grid'] div[role='gridcell']";
        await page.waitForSelector(resultSelector, { timeout: 5000 });

        const firstChat = await page.$(resultSelector);
        if (firstChat) {
          await firstChat.click();
          this.logger.info("💬 Primer resultado seleccionado correctamente");
        } else {
          this.logger.warn(
            "⚠️ No se encontró ningún resultado para ese número"
          );
          return {
            success: false,
            message: "No hay resultados para ese numero",
            contactInformation: [],
            fetched_at: new Date().toISOString(),
          };
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (err: any) {
        this.logger.warn("⚠️ No se pudieron obtener resultados de búsqueda", {
          error: err.message,
        });
        if (err?.type) throw err;
        throw {
          type: "CONTACT_SEARCH_ERROR",
          message: "Error al buscar el contacto en WhatsApp Web, no se obtuvieron resultados.",
          details: err.message,
        };
      }

      // === Intentar abrir detalles del perfil === //
      try {
        const profileButtonSelector =
          "div[title='Profile details'][role='button']";
        await page.waitForSelector(profileButtonSelector, { timeout: 5000 });
        const profileButton = await page.$(profileButtonSelector);
        if (profileButton) {
          await profileButton.click();
          this.logger.info(
            "👤 Panel de detalles del contacto abierto correctamente"
          );
        } else {
          throw {
            type: "PROFILE_BUTTON_NOT_FOUND",
            message: "No se pudo abrir el panel del perfil del contacto.",
          };
        }
      } catch (err: any) {
        this.logger.warn(
          "⚠️ No se encontró el botón de perfil o tardó demasiado"
        );
        if (err?.type) throw err;
        throw {
          type: "PROFILE_PANEL_ERROR",
          message: "Error al abrir el perfil del contacto.",
          details: err.message,
        };
      }

      await new Promise((resolve) => setTimeout(resolve, 1500));

      // === Extraer información del contacto === //
      let contactData: {
        jid: string;
        name: string;
        notify: string;
        verifiedName: string;
        imgUrl: string;
        status: string;
      } = {
        jid: contact_phone_number.toString(),
        name: "Sin nombre",
        notify: "Sin nombre",
        verifiedName: "Sin nombre",
        imgUrl: "",
        status: "Sin estado",
      };

      try {
        contactData = await page.evaluate(() => {
          const phoneRegex = /\+?\d[\d\s().-]{5,}(?:\s?(?:ext\.?|x)\s?\d+)?/i;
          const spans = Array.from(
            // @ts-ignore: accessing DOM inside page.evaluate (runs in browser)
            document.querySelectorAll(
              "span[dir='auto'].selectable-text.copyable-text"
            )
          );

          const getName = () => {
            for (const s of spans) {
              // @ts-ignore: accessing DOM inside page.evaluate (runs in browser)
              const text = s.textContent?.trim() || "";
              if (text && !phoneRegex.test(text)) return text;
            }
            return "Sin nombre";
          };

          const getPhone = () => {
            for (const s of spans) {
              // @ts-ignore: accessing DOM inside page.evaluate (runs in browser)
              const text = s.textContent?.trim() || "";
              if (phoneRegex.test(text)) {
                const cleaned = text.replace(/[\s\-().]/g, "");
                return cleaned.trim();
              }
            }
            return "Desconocido";
          };

          const getAbout = () => {
            for (const s of spans) {
              // @ts-ignore: accessing DOM inside page.evaluate (runs in browser)
              const text = s.textContent?.trim() || "";
              if (text && text !== name && !phoneRegex.test(text)) {
                return text;
              }
            }
            return "Sin estado";
          };

          const phone = getPhone();
          const name = getName();
          const about = getAbout();

          return {
            jid: phone, // El número se usa como identificador único
            name: name,
            notify: name,
            verifiedName: name,
            imgUrl: "", // vacío según contrato
            status: about, // "about" del perfil
          };
        });
      } catch (err: any) {
        this.logger.error(
          "❌ Error durante la evaluación del DOM para obtener datos",
          {
            error: err.message,
          }
        );
        throw {
          type: "EVALUATE_ERROR",
          message: "Error al extraer los datos del contacto desde el DOM.",
          details: err.message,
        };
      }

      this.logger.info("📋 Contacto extraído correctamente", contactData);

      // === Cerrar panel de perfil === //
      try {
        const closeButtonSelector =
          "div[role='button'] span[data-icon='back-refreshed']";
        const backButton = await page.$(closeButtonSelector);
        if (backButton) {
          await backButton.click();
          this.logger.info("⬅️ Panel de contacto cerrado correctamente");
        }
      } catch (err: any) {
        this.logger.warn("⚠️ No se pudo cerrar el panel de contacto", {
          error: err.message,
        });
        throw {
          type: "CLOSE_PANEL_ERROR",
          message: "Error al cerrar el panel de contacto.",
          details: err.message,
        };
      }

      // === Resultado final === //
      return {
        success: true,
        message: "Contact Found Succesfully",
        contactInformation: [contactData],
        fetched_at: new Date().toISOString(),
      };
    } catch (error: any) {
      this.logger.error("❌ Error crítico en fetchContactByPhoneNumber", {
        browser_context_id: browserContext.id,
        error: error.message || error,
        type: error.type || "UNKNOWN",
      });

      return {
        success: false,
        message: error.message || "Error desconocido durante el proceso.",
        error_type: error.type || "UNKNOWN",
        contactInformation: [],
        fetched_at: new Date().toISOString(),
      };
    }
  }
}

export default PuppeteerWhatsappContactsService;
