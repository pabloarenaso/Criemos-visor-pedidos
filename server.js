import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();

const {
  SHOPIFY_API_KEY,
  SHOPIFY_API_SECRET,
  SHOPIFY_SCOPES,
  SHOPIFY_SHOP,
  SHOPIFY_REDIRECT_URI,
  PORT = 3000,
} = process.env;

if (!SHOPIFY_API_KEY || !SHOPIFY_API_SECRET || !SHOPIFY_SHOP || !SHOPIFY_REDIRECT_URI) {
  console.error("❌ Faltan variables de entorno requeridas en .env");
  process.exit(1);
}

// Endpoint para iniciar el flujo OAuth
app.get("/auth", (req, res) => {
  const state = "dummy_csrf_token";

  const redirectUrl = new URL(`https://${SHOPIFY_SHOP}/admin/oauth/authorize`);
  redirectUrl.searchParams.set("client_id", SHOPIFY_API_KEY);
  redirectUrl.searchParams.set("scope", SHOPIFY_SCOPES);
  redirectUrl.searchParams.set("redirect_uri", SHOPIFY_REDIRECT_URI);
  redirectUrl.searchParams.set("state", state);

  console.log("➡️  Redirigiendo a Shopify para instalar/autorizar la app:");
  console.log(redirectUrl.toString());

  res.redirect(redirectUrl.toString());
});

// Endpoint callback que recibe el code y lo intercambia por access_token
app.get("/auth/callback", async (req, res) => {
  const { shop, code, state } = req.query;

  if (!code) {
    return res.status(400).send("❌ No se recibió el code de Shopify");
  }

  console.log("✅ Code recibido de Shopify, intercambiando por access token...");

  try {
    const tokenUrl = `https://${shop}/admin/oauth/access_token`;
    
    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: SHOPIFY_API_KEY,
        client_secret: SHOPIFY_API_SECRET,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error(`Error ${tokenResponse.status}: ${await tokenResponse.text()}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    console.log("\n" + "=".repeat(60));
    console.log("✅ ¡ACCESS TOKEN OBTENIDO EXITOSAMENTE!");
    console.log("=".repeat(60));
    console.log("\nAccess Token:");
    console.log(accessToken);
    console.log("\nScopes autorizados:");
    console.log(tokenData.scope);
    console.log("\n" + "=".repeat(60));
    console.log("📋 COPIA EL TOKEN DE ARRIBA Y GUÁRDALO EN TU .env");
    console.log("=".repeat(60) + "\n");

    res.send(`
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              max-width: 800px;
              margin: 50px auto;
              padding: 20px;
              background: #f5f5f5;
            }
            .success {
              background: white;
              padding: 30px;
              border-radius: 10px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .token {
              background: #f0f0f0;
              padding: 15px;
              border-radius: 5px;
              font-family: monospace;
              word-break: break-all;
              margin: 20px 0;
            }
            .success-icon {
              font-size: 48px;
              color: #4CAF50;
            }
          </style>
        </head>
        <body>
          <div class="success">
            <div class="success-icon">✅</div>
            <h1>¡Token obtenido exitosamente!</h1>
            <p>Tu Access Token ha sido generado. <strong>Mira la consola del servidor</strong> para copiarlo.</p>
            <div class="token">${accessToken}</div>
            <p><strong>Importante:</strong> Guarda este token en tu archivo .env de tu backend. No lo compartas ni lo pongas en tu frontend React.</p>
            <p>Puedes cerrar esta ventana y detener el servidor (Ctrl+C).</p>
          </div>
        </body>
      </html>
    `);

  } catch (error) {
    console.error("❌ Error al obtener access token:", error);
    res.status(500).send(`Error: ${error.message}`);
  }
});

app.listen(PORT, () => {
  console.log("\n" + "=".repeat(60));
  console.log("🚀 Servidor OAuth escuchando en http://localhost:" + PORT);
  console.log("=".repeat(60));
  console.log("\n📍 PASOS SIGUIENTES:");
  console.log("1. Abre tu navegador");
  console.log("2. Ve a: http://localhost:3000/auth");
  console.log("3. Acepta instalar la app en Shopify");
  console.log("4. Copia el token que aparecerá en esta consola");
  console.log("\n" + "=".repeat(60) + "\n");
});
